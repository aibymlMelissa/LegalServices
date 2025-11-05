import warnings
warnings.filterwarnings("ignore", message=".*TqdmWarning.*")
from dotenv import load_dotenv
import os
import json
import re
import pandas as pd
import glob
from pathlib import Path

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

# Default parameters - can be overridden
target_industry = "general business"
proposal_style = "professional"
esg_goals = "to improve sustainability metrics and reporting"
focus_areas = [
    "Emissions reduction strategies",
    "Supply chain sustainability",
    "ESG reporting frameworks",
    "Stakeholder engagement"
]

class AgentState(TypedDict):
    task: str
    lnode: str
    plan: str
    draft: str
    critique: str
    revision_number: int
    max_revisions: int
    count: Annotated[int, operator.add]
    retrieved_docs: Optional[List[Dict[str, Any]]]  # Store retrieved documents


class ESGProposalDesigner:
    def __init__(self, materials_dir: str = "reference_materials"):
        """
        Initialize the ESG proposal designer with RAG capabilities.
        
        Args:
            materials_dir (str): Directory containing reference materials
        """
        self.model = ChatOpenAI(model="gpt-4o", temperature=0.7)
        self.materials_dir = materials_dir
        self.vector_store = None
        
        # Initialize the document retrieval system
        self._initialize_retrieval_system()

        # Updated PLAN_PROMPT
        # System prompts for each node
        self.PLAN_PROMPT = (
            "You are an ESG (Environmental, Social, and Governance) consultant tasked with planning a "
            "business proposal that addresses corporate culture alignment with strategic management. "
            "Create a structured outline for an ESG initiative that maps to the client's company strategic management, "
            "identifies problems, and provides direction on how corporate culture could be built to address value and "
            "mission realignment. "
            "Begin with an executive summary (two paragraphs) that highlights the key value proposition "
            "and benefits of implementing this cultural transformation initiative. "
            "Include sections for company background, current status assessment, strategic management mapping, "
            "cultural transformation methodology, implementation timeline, resource requirements, "
            "expected outcomes, and measurement criteria. "
            "IMPORTANT: I will provide you with relevant information from existing reference materials. "
            "Please incorporate these materials when creating your outline and introduction. "
            "When referencing these materials, mention the source name (e.g., 'According to [filename]...'). "
            f"This proposal is designed for {target_industry} organizations seeking to align corporate culture with ESG objectives."
        )

        # Updated DRAFT_PROMPT
        self.DRAFT_PROMPT = (
            f"This ESG proposal should address the following key areas: {', '.join(focus_areas)}. "
            "The proposal must directly address mapping to the client's company strategic management "
            "that identifies problems and direction of how corporate culture could be built to address "
            "value and mission realignment. "
            "The proposal should demonstrate how corporate culture transformation can drive business value through "
            "enhanced mission alignment, operational efficiency, employee engagement, and strengthened stakeholder relationships. "
            "Address how the organization can implement practical cultural change measures, integrate ESG values into "
            "daily operations, and strengthen governance structures with quantifiable metrics and reporting frameworks. "
            "You are an ESG consultant tasked with developing a comprehensive business proposal based on the provided plan. "
            "Generate the most compelling and actionable proposal possible, backed by data and best practices. "
            "If critique is provided, respond with a revised version addressing the feedback. "
            f"Use a {proposal_style} tone throughout the document."
        )

        # Updated FINALIZE_PROMPT
        self.FINALIZE_PROMPT = (
            "You are a senior ESG advisor and cultural transformation expert reviewing this proposal. "
            "Evaluate whether the proposal effectively addresses the alignment between corporate culture and strategic management. "
            "Check if the proposal properly identifies problems in the current organizational culture "
            "and provides clear direction for how corporate culture could be built to address value and mission realignment. "
            "Verify that implementation steps are practical and include clear metrics for measuring cultural change. "
            "Check that financial considerations are addressed, including required investment and expected ROI. "
            "Ensure that industry-specific cultural challenges and compliance requirements are adequately covered. "
            "Consider potential stakeholder concerns about cultural transformation and how they are addressed. "
            "Provide detailed recommendations for improvement, including specific edits, additional content needs, "
            "and alignment with current best practices for corporate culture transformation."
            f"The proposal should achieve {esg_goals} effectively."
        )

        # Build the graph
        builder = StateGraph(AgentState)
        
        # Add nodes
        builder.add_node("planner", self.plan_node)
        builder.add_node("drafter", self.draft_node)
        builder.add_node("finalizer", self.finalize_node)
        
        # Set entry point
        builder.set_entry_point("planner")
        
        # Add edges
        builder.add_conditional_edges(
            "drafter", 
            self.should_continue, 
            {END: END, "finalizer": "finalizer"}
        )
        
        builder.add_edge("planner", "drafter")
        builder.add_edge("finalizer", "drafter")
        
        # Set up memory
        memory = SqliteSaver(conn=sqlite3.connect(":memory:", check_same_thread=False))
        
        # Compile graph
        self.graph = builder.compile(
            checkpointer=memory,
            interrupt_after=['planner', 'drafter', 'finalizer']
        )

    def _initialize_retrieval_system(self):
        """Initialize the document retrieval system with reference materials."""
        # Create the materials directory if it doesn't exist
        if not os.path.exists(self.materials_dir):
            os.makedirs(self.materials_dir)
            print(f"Created directory for reference materials: {self.materials_dir}")
            print(f"Please add your reference materials (PDFs, DOCXs, PPTs, HTMLs) to this directory")
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
            print("No documents found in the reference directory. Vector store not initialized.")
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
            task: The proposal topic to search for
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
            context = "Here are some relevant reference materials that may help with this ESG proposal:\n\n"
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
    
    def draft_node(self, state: AgentState):
        try:
            # Safely access state with defaults
            task = state.get('task', "")
            plan = state.get('plan', "No plan available")
            
            user_message = HumanMessage(
                content=f"{task}\n\nHere is my ESG proposal plan:\n\n{plan}")
            
            messages = [
                SystemMessage(content=self.DRAFT_PROMPT),
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
                "lnode": "drafter",
                "count": state.get("count", 0) + 1,
                "retrieved_docs": state.get("retrieved_docs", [])  # Preserve retrieved docs
            }
        except Exception as e:
            print(f"Error in draft_node: {e}")
            # Return a minimal valid state in case of error
            return {
                "draft": "Error occurred during content generation.",
                "plan": state.get('plan', ""),
                "critique": state.get('critique', ""),
                "task": state.get('task', ""),
                "revision_number": state.get("revision_number", 0) + 1,
                "max_revisions": state.get("max_revisions", 2),
                "lnode": "drafter",
                "count": state.get("count", 0) + 1,
                "retrieved_docs": state.get("retrieved_docs", [])  # Preserve retrieved docs
            }
    
    def finalize_node(self, state: AgentState):
        try:
            # Safely access state with default
            draft = state.get('draft', "No content available")
            
            messages = [
                SystemMessage(content=self.FINALIZE_PROMPT), 
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
                "lnode": "finalizer",
                "count": state.get("count", 0) + 1,
                "retrieved_docs": state.get("retrieved_docs", [])  # Preserve retrieved docs
            }
        except Exception as e:
            print(f"Error in finalize_node: {e}")
            # Return a minimal valid state in case of error
            return {
                "critique": "Error occurred during finalization.",
                "draft": state.get('draft', ""),
                "plan": state.get('plan', ""),
                "task": state.get('task', ""),
                "revision_number": state.get("revision_number", 0),
                "max_revisions": state.get("max_revisions", 2),
                "lnode": "finalizer",
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
            
            print(f"Continuing to finalization. Revision {revision_number} of {max_revisions}")
            return "finalizer"
        except Exception as e:
            print(f"Error in should_continue: {e}")
            # If there's an error, default to ending the process
            return END

class ProposalExporter:
    """
    Class to handle exporting ESG proposal content to various formats.
    """
    
    def __init__(self, export_dir="proposal_exports"):
        """
        Initialize the proposal exporter.
        
        Args:
            export_dir (str): Directory to save exported proposals
        """
        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(exist_ok=True, parents=True)
    
    def extract_proposal_data(self, draft_content, plan_content, parameters=None):
        """
        Extract structured data from proposal content.
        
        Args:
            draft_content (str): The draft content from the proposal drafter
            plan_content (str): The plan content from the proposal planner
            parameters (dict, optional): Proposal parameters if available
            
        Returns:
            dict: Structured proposal data
        """
        # Initialize proposal data with default values
        proposal_data = {
            "title": "ESG Proposal",
            "target_company": "Company",
            "objective": "Not specified",
            "approach": "Not specified",
            "initiatives": [],
            "metrics": [],
            "timeline": "Not specified",
            "budget": "Not specified",
            "references": []
        }
        
        # Extract proposal title
        title_pattern = re.compile(r'#+\s*(.+?)\s*(?:\n|$)')
        title_match = title_pattern.search(draft_content)
        if title_match:
            proposal_data["title"] = title_match.group(1).strip()
        
        # Use parameters if available
        if parameters and isinstance(parameters, dict):
            if "proposal_title" in parameters and parameters["proposal_title"]:
                proposal_data["title"] = parameters["proposal_title"]
            
            if "target_company" in parameters and parameters["target_company"]:
                proposal_data["target_company"] = parameters["target_company"]
            
            if "objective" in parameters and parameters["objective"]:
                proposal_data["objective"] = parameters["objective"]
        
        # Extract objective if not from parameters
        if proposal_data["objective"] == "Not specified":
            obj_patterns = [
                r'(?:objective|goal|purpose)[s\s]*[:\s]+([^\n]+)',
                r'(?:aim|mission|intent)s?(?:\s+of\s+(?:this|the)\s+proposal)?[:\s]+([^\n]+)'
            ]
            
            for pattern in obj_patterns:
                obj_match = re.search(pattern, draft_content, re.IGNORECASE)
                if obj_match:
                    proposal_data["objective"] = obj_match.group(1).strip()
                    break
        
        # Extract approach if not from parameters
        if proposal_data["approach"] == "Not specified":
            approach_patterns = [
                r'(?:approach|methodology|strategy)[:\s]+([^\n]+)',
                r'(?:implementation|execution)\s+(?:approach|strategy|plan)[:\s]+([^\n]+)'
            ]
            
            for pattern in approach_patterns:
                approach_match = re.search(pattern, draft_content, re.IGNORECASE)
                if approach_match:
                    proposal_data["approach"] = approach_match.group(1).strip()
                    break
        
        # Extract key initiatives (sections with ## or ### headers)
        initiative_pattern = re.compile(r'#{2,3}\s+(.+?)\s*(?:\n|$)')
        initiatives = initiative_pattern.findall(draft_content)
        
        # Filter out common non-initiative headers
        non_initiative_headers = [
            'introduction', 'overview', 'summary', 'conclusion', 
            'background', 'reference', 'appendix', 'assessment',
            'evaluation', 'timeline', 'budget', 'objectives'
        ]
        
        filtered_initiatives = [
            initiative for initiative in initiatives 
            if not any(non.lower() in initiative.lower() for non in non_initiative_headers)
        ]
        
        # Use the filtered initiatives if we found some
        if filtered_initiatives:
            proposal_data["initiatives"] = filtered_initiatives
        
        # Extract metrics
        metrics_section = ""
        metrics_patterns = [
            r'(?:metrics|kpis|measurements|success\s+criteria)[:\s]+((?:.+\n)+)',
            r'#+\s+(?:metrics|kpis|performance\s+indicators)[^\n]*\n+((?:.+\n)+)'
        ]
        
        for pattern in metrics_patterns:
            metrics_match = re.search(pattern, draft_content, re.IGNORECASE)
            if metrics_match:
                metrics_section = metrics_match.group(1).strip()
                break
        
        # Process metrics section if found
        if metrics_section:
            # Try to extract structured metrics
            metric_items = re.findall(r'(?:^|\n)[-•*]\s+([^\n]+)', metrics_section)
            if not metric_items:
                # If no bullet points, try numbered list
                metric_items = re.findall(r'(?:^|\n)\d+\.\s+([^\n]+)', metrics_section)
            if not metric_items:
                # If no structured list, just split by lines
                metric_items = [line.strip() for line in metrics_section.split('\n') if line.strip()]
            
            proposal_data["metrics"] = metric_items
        
        # Extract timeline
        timeline_patterns = [
            r'(?:timeline|schedule|timeframe)[:\s]+([^\n]+)',
            r'#+\s+(?:timeline|implementation\s+schedule)[^\n]*\n+([^\n]+)'
        ]
        
        for pattern in timeline_patterns:
            timeline_match = re.search(pattern, draft_content, re.IGNORECASE)
            if timeline_match:
                proposal_data["timeline"] = timeline_match.group(1).strip()
                break
        
        # Extract budget
        budget_patterns = [
            r'(?:budget|cost|investment)[:\s]+([^\n]+)',
            r'#+\s+(?:budget|financial\s+requirements)[^\n]*\n+([^\n]+)'
        ]
        
        for pattern in budget_patterns:
            budget_match = re.search(pattern, draft_content, re.IGNORECASE)
            if budget_match:
                proposal_data["budget"] = budget_match.group(1).strip()
                break
        
        # Extract references
        ref_section = ""
        ref_patterns = [
            r'(?:references|sources|bibliography)[:\s]+((?:.+\n)+)',
            r'#+\s+(?:references|sources|bibliography)[^\n]*\n+((?:.+\n)+)'
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
            
            proposal_data["references"] = ref_items
        
        return proposal_data
    
    def export_to_csv(self, proposal_data, filename=None):
        """
        Export proposal data to a CSV file.
        
        Args:
            proposal_data (dict): Structured proposal data
            filename (str, optional): Custom filename
            
        Returns:
            str: Path to the exported file
        """
        import csv
        
        if not filename:
            safe_title = "".join(c if c.isalnum() or c in [' ', '-', '_'] else '_' for c in proposal_data["title"])
            safe_title = safe_title.replace(' ', '_').lower()
            filename = f"{safe_title}_summary.csv"
        
        file_path = self.export_dir / filename
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(["ESG Proposal Summary"])
            writer.writerow(["Title", proposal_data["title"]])
            writer.writerow(["Target Company", proposal_data["target_company"]])
            writer.writerow(["Objective", proposal_data["objective"]])
            writer.writerow(["Approach", proposal_data["approach"]])
            writer.writerow(["Timeline", proposal_data["timeline"]])
            writer.writerow(["Budget", proposal_data["budget"]])
            
            writer.writerow(["Key Initiatives"])
            for i, initiative in enumerate(proposal_data["initiatives"], 1):
                writer.writerow([f"Initiative {i}", initiative])
                
            writer.writerow(["Success Metrics"])
            for i, metric in enumerate(proposal_data["metrics"], 1):
                writer.writerow([f"Metric {i}", metric])
                
            writer.writerow(["References"])
            for i, ref in enumerate(proposal_data["references"], 1):
                writer.writerow([f"Ref {i}", ref])
        
        return str(file_path)
    
    def export_to_xlsx(self, proposal_data, filename=None):
        """
        Export proposal data to an Excel file.
        
        Args:
            proposal_data (dict): Structured proposal data
            filename (str, optional): Custom filename
            
        Returns:
            str: Path to the exported file
        """
        if not filename:
            safe_title = "".join(c if c.isalnum() or c in [' ', '-', '_'] else '_' for c in proposal_data["title"])
            safe_title = safe_title.replace(' ', '_').lower()
            filename = f"{safe_title}_summary.xlsx"
        
        file_path = self.export_dir / filename
        
        # Create a DataFrame for the proposal structure
        data = [
            ["Title", proposal_data["title"]],
            ["Target Company", proposal_data["target_company"]],
            ["Objective", proposal_data["objective"]],
            ["Approach", proposal_data["approach"]],
            ["Timeline", proposal_data["timeline"]],
            ["Budget", proposal_data["budget"]]
        ]
        
        # Add initiatives
        data.append(["Key Initiatives", ""])
        for i, initiative in enumerate(proposal_data["initiatives"], 1):
            data.append([f"Initiative {i}", initiative])
        
        # Add metrics
        if proposal_data["metrics"]:
            data.append(["Success Metrics", ""])
            for i, metric in enumerate(proposal_data["metrics"], 1):
                data.append([f"Metric {i}", metric])
        
        # Add references
        if proposal_data["references"]:
            data.append(["References", ""])
            for i, ref in enumerate(proposal_data["references"], 1):
                data.append([f"Reference {i}", ref])
        
        # Create DataFrame and save to Excel
        df = pd.DataFrame(data)
        df.to_excel(file_path, header=False, index=False)
        
        return str(file_path)
    
    def generate_html_table(self, proposal_data):
        """
        Generate HTML for the proposal summary table.
        
        Args:
            proposal_data (dict): Structured proposal data
            
        Returns:
            str: HTML representation of the proposal table
        """
        html = """
        <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif;">
            <tr>
                <th colspan="2" style="padding: 8px; text-align: center; background-color: #1E5631; color: white; font-size: 16px;">
                    ESG Proposal Summary
                </th>
            </tr>
            <tr>
                <th style="width: 20%; padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Title</th>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{title}</td>
            </tr>
            <tr>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f9f9f9;">Initiative {i}</th>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{initiative}</td>
            </tr>
            """.format(i=i, initiative=initiative)
        
        # Add metrics section if available
        if proposal_data["metrics"]:
            html += """
                <tr>
                    <th colspan="2" style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #1E5631; color: white;">Success Metrics</th>
                </tr>
            """
            
            for i, metric in enumerate(proposal_data["metrics"], 1):
                html += """
                <tr>
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f9f9f9;">Metric {i}</th>
                    <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{metric}</td>
                </tr>
                """.format(i=i, metric=metric)
        
        # Add references section if available
        if proposal_data["references"]:
            html += """
                <tr>
                    <th colspan="2" style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #1E5631; color: white;">References</th>
                </tr>
            """
            
            for i, ref in enumerate(proposal_data["references"], 1):
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

# Usage example
if __name__ == "__main__":
    proposal_designer = ESGProposalDesigner(materials_dir="reference_materials")
    # Import here to avoid circular import
    from gui import ESGProposalGUI
    app = ESGProposalGUI(proposal_designer.graph)
    app.launch()
