import warnings
warnings.filterwarnings("ignore", message=".*TqdmWarning.*")
from dotenv import load_dotenv
import os
import json
import re
import pandas as pd
import glob
from pathlib import Path
import csv
import openpyxl

_ = load_dotenv()

from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List, Dict, Any, Optional
import operator
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
import sqlite3

# Added imports for document handling
from langchain_community.document_loaders import (
    PyPDFLoader, 
    Docx2txtLoader, 
    UnstructuredPowerPointLoader,
    UnstructuredHTMLLoader,
    TextLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA

class TeachingMaterialsRAGTool:
    def __init__(self, materials_dir="teaching_materials"):
        self.materials_dir = Path(materials_dir)
        self.vectorstore = None
        self.initialize_vectorstore()
    
    def initialize_vectorstore(self):
        """Load and index all teaching materials."""
        documents = []
        
        # Load all supported files from materials directory
        for file_path in self.materials_dir.glob("**/*"):
            if file_path.is_file() and file_path.suffix.lower() in ['.txt', '.md', '.pdf', '.docx']:
                try:
                    # Load content (simplified - would need proper loaders per file type)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Add to documents with metadata
                    documents.append({
                        'content': content,
                        'source': str(file_path.name)
                    })
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        
        # Process chunks
        if documents:
            texts = []
            metadatas = []
            for doc in documents:
                chunks = text_splitter.split_text(doc['content'])
                texts.extend(chunks)
                metadatas.extend([{'source': doc['source']}] * len(chunks))
            
            # Create vector store
            embeddings = OpenAIEmbeddings()
            self.vectorstore = FAISS.from_texts(texts, embeddings, metadatas=metadatas)
    
    def search_materials(self, query):
        """Search teaching materials for relevant content."""
        if not self.vectorstore:
            return "No teaching materials found."
        
        # Perform search
        results = self.vectorstore.similarity_search(query, k=3)
        
        # Format results
        formatted_results = []
        for doc in results:
            formatted_results.append({
                'content': doc.page_content,
                'source': doc.metadata.get('source', 'Unknown')
            })
        
        return formatted_results

# Create the tool
def setup_rag_tool(materials_dir):
    rag_tool = TeachingMaterialsRAGTool(materials_dir)
    
    return Tool(
        name="search_teaching_materials",
        description="Search teaching materials for relevant content to include in the course",
        func=rag_tool.search_materials
    )
target="master student"
style="friendly"
learning_objective="to be a good management in 21st century"
compulsory_areas=["Business Service Management with innovations", "Business marketing is transforming the way businesses connect with customers", "Achieving Sustainable Development Goals", "Knowledge of environment social goverance in decision making"]

class AgentState(TypedDict):
    task: str
    lnode: str
    plan: str
    draft: str
    critique: str
    revision_number: int
    max_revisions: int
    count: Annotated[int, operator.add]
    retrieved_docs: Optional[List[Dict[str, Any]]]  # Added to store retrieved documents


class SimplifiedCourseWriter:
    def __init__(self, materials_dir: str = "teaching_materials"):
        """
        Initialize the course writer with RAG capabilities.
        
        Args:
            materials_dir (str): Directory containing teaching materials
        """
        self.model = ChatOpenAI(model="gpt-4o", temperature=0.8)
        self.materials_dir = materials_dir
        self.vector_store = None
        
        # Initialize the document retrieval system
        self._initialize_retrieval_system()
        
        # System prompts for each node
        self.PLAN_PROMPT = (
            "You are a course planning expert tasked with creating a detailed outline for a new course. "
            "Your mission is to create a comprehensive and engaging course outline on the provided topic. "
            
            "IMPORTANT: I have retrieved specific teaching materials relevant to this course. "
            "You MUST analyze these materials carefully and DIRECTLY INCORPORATE their content into your plan. "
            "When you use information from these materials, EXPLICITLY CITE the source like this: [Source: filename]. "
            
            "For each retrieved document, extract the following: "
            "1. Key concepts that should be included in the course "
            "2. Specific examples, case studies, or methodologies mentioned "
            "3. Any learning objectives or assessment approaches suggested "
            
            "Your outline should include: "
            "- A compelling introduction to the course (2 paragraphs) "
            "- 5-7 main topic areas with 2-3 subtopics each "
            "- Clear learning objectives for each main topic "
            "- Specific references to information from the retrieved documents "
            
            f"The target audience for this course is: {target}"
        )
        
        self.WRITER_PROMPT = (
            "You are an expert course content developer specializing in creating engaging educational materials. "
            
            "Your task is to transform the given course plan into comprehensive course content. "
            "The content MUST incorporate specific details from the retrieved teaching materials "
            "that were used in creating the plan. "
            
            "IMPORTANT REQUIREMENTS: "
            "1. DIRECTLY REFERENCE the teaching materials by explicitly mentioning the source documents. "
            "   For example: 'According to [document name], the key principle of...' "
            
            "2. INTEGRATE examples, methodologies, and terminology from the teaching materials "
            "   to ensure consistency with existing educational content. "
            
            "3. The course should include the following compulsory knowledge areas: {compulsory_areas} "
            
            "4. The course should encourage embracing transformative mindsets and adopting cutting-edge technologies, "
            "   particularly AI in service re-design with self-management learning techniques for business activities. "
            
            "5. Structure the content with clear headings, subheadings, learning objectives for each section, "
            "   and activities or assessments that align with the teaching materials. "
            
            "6. Format your response as a complete course guide with proper markdown formatting. "
            
            f"7. Use a {style} teaching style throughout the content. "
            
            "Remember: If you've been provided with critique, use it to improve your previous draft "
            "while still maintaining strong connections to the retrieved teaching materials."
        )

        
        self.REFLECTION_PROMPT = (
            "You are an experienced educational consultant specializing in course evaluation and improvement. "
            
            "CRITICAL TASK: Evaluate the provided course content by considering how effectively it: "
            "1. INCORPORATES information from the teaching materials that were retrieved during planning "
            "2. REFERENCES these materials appropriately throughout the content "
            "3. BUILDS upon concepts, examples, and methodologies from these materials "
            
            "Provide specific critique on: "
            "- Whether the course adequately develops techniques of self-learning and self-management "
            "  for sustainable business with AI as mentioned in the teaching materials "
            "- How well the course content nurtures business partnerships and models to serve and make responsible business "
            "- The alignment between the course content and the retrieved teaching materials "
            "- Any key concepts from the teaching materials that were overlooked "
            
            "For each critique point: "
            "1. Identify the specific issue "
            "2. Explain why it's problematic "
            "3. Suggest a CONCRETE improvement that better incorporates the teaching materials "
            
            "Also recommend: "
            "- Specific learning methods that align with the teaching materials "
            "- Evaluation criteria that reflect the concepts in the materials "
            "- Ways to strengthen references to the teaching materials "
            
            f"Ensure your feedback supports the learning objective: {learning_objective} "
            "and maintains a constructive, actionable tone."
        )   
        
        # Build the graph
        builder = StateGraph(AgentState)
        
        # Add nodes
        builder.add_node("planner", self.plan_node)
        builder.add_node("course designer", self.writer_node)
        builder.add_node("reflect", self.reflection_node)
        
        # Set entry point
        builder.set_entry_point("planner")
        
        # Add edges
        builder.add_conditional_edges(
            "course designer", 
            self.should_continue, 
            {END: END, "reflect": "reflect"}
        )
        
        builder.add_edge("planner", "course designer")
        builder.add_edge("reflect", "course designer")
        
        # Set up memory
        memory = SqliteSaver(conn=sqlite3.connect(":memory:", check_same_thread=False))
        
        # Compile graph
        self.graph = builder.compile(
            checkpointer=memory,
            interrupt_after=['planner', 'course designer', 'reflect']
        )

    def _initialize_retrieval_system(self):
        """Initialize the document retrieval system with teaching materials."""
        # Create the materials directory if it doesn't exist
        if not os.path.exists(self.materials_dir):
            os.makedirs(self.materials_dir)
            print(f"Created directory for teaching materials: {self.materials_dir}")
            print(f"Please add your teaching materials (PDFs, DOCXs, PPTs, HTMLs) to this directory")
            return

        # Get all documents from the materials directory
        documents = []
        
        # Load different file types
        pdf_files = glob.glob(os.path.join(self.materials_dir, "**/*.pdf"), recursive=True)
        docx_files = glob.glob(os.path.join(self.materials_dir, "**/*.docx"), recursive=True)
        pptx_files = glob.glob(os.path.join(self.materials_dir, "**/*.pptx"), recursive=True)
        html_files = glob.glob(os.path.join(self.materials_dir, "**/*.html"), recursive=True)
        txt_files = glob.glob(os.path.join(self.materials_dir, "**/*.txt"), recursive=True)
        
        print(f"Found {len(pdf_files)} PDFs, {len(docx_files)} DOCXs, {len(pptx_files)} PPTs, {len(html_files)} HTMLs, {len(txt_files)} TXTs")
        
        # Process each file type
        for pdf in pdf_files:
            try:
                loader = PyPDFLoader(pdf)
                documents.extend(loader.load())
            except Exception as e:
                print(f"Error loading PDF {pdf}: {e}")
        
        for docx in docx_files:
            try:
                loader = Docx2txtLoader(docx)
                documents.extend(loader.load())
            except Exception as e:
                print(f"Error loading DOCX {docx}: {e}")
        
        for pptx in pptx_files:
            try:
                loader = UnstructuredPowerPointLoader(pptx)
                documents.extend(loader.load())
            except Exception as e:
                print(f"Error loading PPTX {pptx}: {e}")
        
        for html in html_files:
            try:
                loader = UnstructuredHTMLLoader(html)
                documents.extend(loader.load())
            except Exception as e:
                print(f"Error loading HTML {html}: {e}")
                
        for txt in txt_files:
            try:
                loader = TextLoader(txt)
                documents.extend(loader.load())
            except Exception as e:
                print(f"Error loading TXT {txt}: {e}")
        
        if not documents:
            print("No documents found in the materials directory. Vector store not initialized.")
            return
        
        # Set up text splitter for chunking
        parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
        child_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        
        # Set up vector store
        embeddings = OpenAIEmbeddings()
        
        # Set up parent document retriever with in-memory store
        parent_store = InMemoryStore()
        self.retriever = ParentDocumentRetriever(
            vectorstore=FAISS.from_documents(documents, embeddings),
            docstore=parent_store,
            parent_splitter=parent_splitter,
            child_splitter=child_splitter
        )
        
        print(f"Successfully initialized retrieval system with {len(documents)} documents")

    def retrieve_relevant_documents(self, task: str, k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents based on the task.
        
        Args:
            task: The course topic to search for
            k: Number of documents to retrieve
            
        Returns:
            List of retrieved documents
        """
        if not self.retriever:
            print("Retriever not initialized. No documents will be retrieved.")
            return []
        
        try:
            # Retrieve relevant documents
            docs = self.retriever.get_relevant_documents(task, k=k)
            
            # Format the documents as a list of dictionaries
            formatted_docs = []
            for doc in docs:
                source = doc.metadata.get("source", "Unknown source")
                formatted_docs.append({
                    "content": doc.page_content,
                    "source": Path(source).name if isinstance(source, str) else "Unknown",
                    "metadata": doc.metadata
                })
            
            return formatted_docs
        except Exception as e:
            print(f"Error retrieving documents: {e}")
            return []

    def plan_node(self, state: AgentState):
        # Retrieve relevant documents for the task
        task = state.get('task', "")
        retrieved_docs = self.retrieve_relevant_documents(task)
        
        # Construct a context message from the retrieved documents
        context = ""
        if retrieved_docs:
            context = "Here are some relevant materials from your previous teaching resources:\n\n"
            for i, doc in enumerate(retrieved_docs):
                context += f"Document {i+1} - Source: {doc['source']}\n"
                context += f"{doc['content']}\n\n"
        
        # Combine the task and context for the planner
        prompt = f"{task}\n\n{context}" if context else task
        
        messages = [
            SystemMessage(content=self.PLAN_PROMPT), 
            HumanMessage(content=prompt)
        ]
        
        response = self.model.invoke(messages)
        
        # Return a complete state with all required keys and default values
        return {
            "plan": response.content,
            "lnode": "planner",
            "draft": state.get('draft', "no draft yet"),
            "critique": state.get('critique', "no critique yet"),
            "revision_number": state.get('revision_number', 0),
            "max_revisions": state.get('max_revisions', 2),
            "count": 1,
            "task": state.get('task', ""),
            "retrieved_docs": retrieved_docs  # Store the retrieved documents in the state
        }
    
    def writer_node(self, state: AgentState):
        try:
            # Safely access state with defaults
            task = state.get('task', "")
            plan = state.get('plan', "No plan available")
            
            user_message = HumanMessage(
                content=f"{task}\n\nHere is my plan:\n\n{plan}")
            
            messages = [
                SystemMessage(content=self.WRITER_PROMPT),
                user_message
            ]
            
            # If there's critique, add it to the context
            if state.get('critique'):
                messages.append(HumanMessage(content=f"Here is feedback on my previous draft:\n\n{state['critique']}"))
            
            response = self.model.invoke(messages)
            
            # Return complete state with all required keys
            return {
                "draft": response.content,
                "plan": state.get('plan', ""),
                "critique": state.get('critique', "no critique yet"),
                "task": state.get('task', ""),
                "revision_number": state.get("revision_number", 0) + 1,
                "max_revisions": state.get("max_revisions", 2),
                "lnode": "course designer",
                "count": state.get("count", 0) + 1,
                "retrieved_docs": state.get("retrieved_docs", [])  # Preserve retrieved docs
            }
        except Exception as e:
            print(f"Error in writer_node: {e}")
            # Return a minimal valid state in case of error
            return {
                "draft": "Error occurred during content generation.",
                "plan": state.get('plan', ""),
                "critique": state.get('critique', ""),
                "task": state.get('task', ""),
                "revision_number": state.get("revision_number", 0) + 1,
                "max_revisions": state.get("max_revisions", 2),
                "lnode": "course designer",
                "count": state.get("count", 0) + 1,
                "retrieved_docs": state.get("retrieved_docs", [])  # Preserve retrieved docs
            }
    
    def reflection_node(self, state: AgentState):
        try:
            # Safely access state with default
            draft = state.get('draft', "No content available")
            
            messages = [
                SystemMessage(content=self.REFLECTION_PROMPT), 
                HumanMessage(content=draft)
            ]
            
            response = self.model.invoke(messages)
            
            # Return complete state with all required keys
            return {
                "critique": response.content,
                "draft": state.get('draft', ""),
                "plan": state.get('plan', ""),
                "task": state.get('task', ""),
                "revision_number": state.get("revision_number", 0),
                "max_revisions": state.get("max_revisions", 2),
                "lnode": "reflect",
                "count": state.get("count", 0) + 1,
                "retrieved_docs": state.get("retrieved_docs", [])  # Preserve retrieved docs
            }
        except Exception as e:
            print(f"Error in reflection_node: {e}")
            # Return a minimal valid state in case of error
            return {
                "critique": "Error occurred during reflection.",
                "draft": state.get('draft', ""),
                "plan": state.get('plan', ""),
                "task": state.get('task', ""),
                "revision_number": state.get("revision_number", 0),
                "max_revisions": state.get("max_revisions", 2),
                "lnode": "reflect",
                "count": state.get("count", 0) + 1,
                "retrieved_docs": state.get("retrieved_docs", [])  # Preserve retrieved docs
            }
    
    def should_continue(self, state):
        try:
            revision_number = state.get("revision_number", 0)
            max_revisions = state.get("max_revisions", 2)
            
            if revision_number > max_revisions:
                print(f"Reached maximum revisions ({max_revisions}). Ending process.")
                return END
            
            print(f"Continuing to reflection. Revision {revision_number} of {max_revisions}")
            return "reflect"
        except Exception as e:
            print(f"Error in should_continue: {e}")
            # If there's an error, default to ending the process
            return END

class CourseExporter:
    """
    Class to handle exporting course content to a structured table format.
    """
    
    def __init__(self, export_dir="course_exports"):
        """
        Initialize the course exporter.
        
        Args:
            export_dir (str): Directory to save exported course tables
        """
        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(exist_ok=True, parents=True)
    
    def extract_course_data(self, draft_content, plan_content, parameters=None):
        """
        Extract structured data from course content.
        
        Args:
            draft_content (str): The draft content from the course designer
            plan_content (str): The plan content from the course planner
            parameters (dict, optional): Course parameters if available
            
        Returns:
            dict: Structured course data
        """
        # Initialize course data with default values
        course_data = {
            "title": "Course Title",
            "teaching_goal": "Not specified",
            "teaching_method": "Not specified",
            "topics": [],
            "references": []
        }
        
        # Extract course title
        title_pattern = re.compile(r'#+\s*(.+?)\s*(?:\n|$)')
        title_match = title_pattern.search(draft_content)
        if title_match:
            course_data["title"] = title_match.group(1).strip()
        
        # Use parameters if available
        if parameters and isinstance(parameters, dict):
            if "course_title" in parameters and parameters["course_title"]:
                course_data["title"] = parameters["course_title"]
            
            if "teaching_objective" in parameters and parameters["teaching_objective"]:
                course_data["teaching_goal"] = parameters["teaching_objective"]
            
            if "teaching_style" in parameters and parameters["teaching_style"]:
                course_data["teaching_method"] = parameters["teaching_style"]
        
        # Extract teaching goal if not from parameters
        if course_data["teaching_goal"] == "Not specified":
            goal_patterns = [
                r'(?:teaching|learning|course)\s+(?:goal|objective|aim)s?[:\s]+([^\n]+)',
                r'(?:goal|objective|aim)s?(?:\s+of\s+the\s+course)?[:\s]+([^\n]+)',
                r'(?:by\s+the\s+end\s+of\s+this\s+course[,\s]+students\s+will\s+)([^\n]+)'
            ]
            
            for pattern in goal_patterns:
                goal_match = re.search(pattern, draft_content, re.IGNORECASE)
                if goal_match:
                    course_data["teaching_goal"] = goal_match.group(1).strip()
                    break
        
        # Extract teaching method if not from parameters
        if course_data["teaching_method"] == "Not specified":
            method_patterns = [
                r'(?:teaching|learning|instructional)\s+(?:method|approach|strategy|style)[s:\s]+([^\n]+)',
                r'(?:course|class)\s+(?:will\s+be|is)\s+(?:taught|delivered)\s+(?:using|through|by|via)\s+([^\n]+)',
                r'(?:methodology|format)[:\s]+([^\n]+)'
            ]
            
            for pattern in method_patterns:
                method_match = re.search(pattern, draft_content, re.IGNORECASE)
                if method_match:
                    course_data["teaching_method"] = method_match.group(1).strip()
                    break
        
        # Extract course topics (sections with ## or ### headers)
        topic_pattern = re.compile(r'#{2,3}\s+(.+?)\s*(?:\n|$)')
        topics = topic_pattern.findall(draft_content)
        
        # Filter out common non-topic headers
        non_topic_headers = [
            'introduction', 'overview', 'summary', 'conclusion', 
            'background', 'reference', 'bibliography', 'assessment',
            'evaluation', 'grading', 'objectives', 'goals'
        ]
        
        filtered_topics = [
            topic for topic in topics 
            if not any(non.lower() in topic.lower() for non in non_topic_headers)
        ]
        
        # Use the filtered topics if we found some, otherwise try to extract from plan
        if filtered_topics:
            course_data["topics"] = filtered_topics
        else:
            # Try to extract topics from the plan if they weren't in the draft
            plan_topic_pattern = re.compile(r'(?:topic|section|module|unit)[s\s]*[:\d.]+\s*([^\n]+)', re.IGNORECASE)
            plan_topics = plan_topic_pattern.findall(plan_content)
            if plan_topics:
                course_data["topics"] = plan_topics
        
        # Extract references
        ref_section = ""
        ref_patterns = [
            r'(?:references|bibliography|further reading|recommended texts|required texts|textbooks)[:\s]+((?:.+\n)+)',
            r'#+\s+(?:references|bibliography|further reading|recommended texts)[^\n]*\n+((?:.+\n)+)'
        ]
        
        for pattern in ref_patterns:
            ref_match = re.search(pattern, draft_content, re.IGNORECASE)
            if ref_match:
                ref_section = ref_match.group(1).strip()
                break
        
        # Process reference section if found
        if ref_section:
            # Try to extract structured references
            ref_items = re.findall(r'(?:^|\n)[-•*]\s+([^\n]+)', ref_section)
            if not ref_items:
                # If no bullet points, try numbered list
                ref_items = re.findall(r'(?:^|\n)\d+\.\s+([^\n]+)', ref_section)
            if not ref_items:
                # If no structured list, just split by lines
                ref_items = [line.strip() for line in ref_section.split('\n') if line.strip()]
            
            course_data["references"] = ref_items
        
        return course_data
    
    def export_to_csv(self, course_data, filename=None):
        """
        Export course data to a CSV file.
        
        Args:
            course_data (dict): Structured course data
            filename (str, optional): Custom filename
            
        Returns:
            str: Path to the exported file
        """
        if not filename:
            safe_title = "".join(c if c.isalnum() or c in [' ', '-', '_'] else '_' for c in course_data["title"])
            safe_title = safe_title.replace(' ', '_').lower()
            filename = f"{safe_title}_table.csv"
        
        file_path = self.export_dir / filename
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(["Course Design Table"])
            writer.writerow(["Title", course_data["title"]])
            writer.writerow(["Teaching Goal", course_data["teaching_goal"]])
            writer.writerow(["Teaching Method", course_data["teaching_method"]])
            
            writer.writerow(["Course Content"])
            for i, topic in enumerate(course_data["topics"], 1):
                writer.writerow([f"Topic {i}", topic])
                
            writer.writerow(["References"])
            for i, ref in enumerate(course_data["references"], 1):
                writer.writerow([f"Ref {i}", ref])
        
        return str(file_path)
    
    def export_to_xlsx(self, course_data, filename=None):
        """
        Export course data to an Excel file.
        
        Args:
            course_data (dict): Structured course data
            filename (str, optional): Custom filename
            
        Returns:
            str: Path to the exported file
        """
        if not filename:
            safe_title = "".join(c if c.isalnum() or c in [' ', '-', '_'] else '_' for c in course_data["title"])
            safe_title = safe_title.replace(' ', '_').lower()
            filename = f"{safe_title}_table.xlsx"
        
        file_path = self.export_dir / filename
        
        # Create a DataFrame for the course structure
        data = [
            ["Title", course_data["title"]],
            ["Teaching Goal", course_data["teaching_goal"]],
            ["Teaching Method", course_data["teaching_method"]]
        ]
        
        # Add topics
        data.append(["Course Content", ""])
        for i, topic in enumerate(course_data["topics"], 1):
            data.append([f"Topic {i}", topic])
        
        # Add references
        if course_data["references"]:
            data.append(["References", ""])
            for i, ref in enumerate(course_data["references"], 1):
                data.append([f"Reference {i}", ref])
        
        # Create DataFrame and save to Excel
        df = pd.DataFrame(data)
        df.to_excel(file_path, header=False, index=False)
        
        return str(file_path)
    
    def generate_html_table(self, course_data):
        """
        Generate HTML for the course table.
        
        Args:
            course_data (dict): Structured course data
            
        Returns:
            str: HTML representation of the course table
        """
        html = """
        <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif;">
            <tr>
                <th colspan="2" style="padding: 8px; text-align: center; background-color: #4CAF50; color: white; font-size: 16px;">
                    Course Design Table
                </th>
            </tr>
            <tr>
                <th style="width: 20%; padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Title</th>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{title}</td>
            </tr>
            <tr>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Teaching Goal</th>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{goal}</td>
            </tr>
            <tr>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Teaching Method</th>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{method}</td>
            </tr>
        """.format(
            title=course_data["title"],
            goal=course_data["teaching_goal"],
            method=course_data["teaching_method"]
        )
        
        # Add topics section
        html += """
            <tr>
                <th colspan="2" style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Course Content</th>
            </tr>
        """
        
        for i, topic in enumerate(course_data["topics"], 1):
            html += """
            <tr>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f9f9f9;">Topic {i}</th>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{topic}</td>
            </tr>
            """.format(i=i, topic=topic)
        
        # Add references section if available
        if course_data["references"]:
            html += """
                <tr>
                    <th colspan="2" style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">References</th>
                </tr>
            """
            
            for i, ref in enumerate(course_data["references"], 1):
                html += """
                <tr>
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f9f9f9;">Reference {i}</th>
                    <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{ref}</td>
                </tr>
                """.format(i=i, ref=ref)
        
        html += "</table>"
        return html
    
    def load_parameters(self, param_file):
        """
        Load parameters from a JSON file.
        
        Args:
            param_file (str): Path to the JSON parameters file
            
        Returns:
            dict: The parameters as a dictionary, or None if loading failed
        """
        try:
            param_path = Path(param_file)
            if param_path.exists():
                with open(param_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading parameters: {e}")
        return None
# Remove circular import
# from simplified_gui import SimplifiedCSGUI

# Usage example
if __name__ == "__main__":
    essay_writer = SimplifiedCourseWriter(materials_dir="teaching_materials")
    # Import here to avoid circular import
    from simplified_gui_rag import EnhancedCSGUI
    app = EnhancedCSGUI(essay_writer.graph)
    app.launch()
