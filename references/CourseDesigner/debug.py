#!/usr/bin/env python
"""
Enhanced RAG Course Designer - Debug Utility
============================================

This script helps debug issues with the RAG-enhanced Course Designer,
including materials retrieval system and course export functionality.
"""

import os
import sys
import json
import re
import shutil
import pandas as pd
from pathlib import Path

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_materials_directory():
    """Check if the materials directory exists and has content."""
    materials_dir = Path("teaching_materials")
    
    if not materials_dir.exists():
        print("❌ Error: The 'teaching_materials' directory does not exist.")
        return False
    
    # Check for files in the directory
    pdf_files = list(materials_dir.glob("**/*.pdf"))
    docx_files = list(materials_dir.glob("**/*.docx"))
    pptx_files = list(materials_dir.glob("**/*.pptx"))
    html_files = list(materials_dir.glob("**/*.html"))
    txt_files = list(materials_dir.glob("**/*.txt"))
    md_files = list(materials_dir.glob("**/*.md"))
    
    total_files = len(pdf_files) + len(docx_files) + len(pptx_files) + len(html_files) + len(txt_files) + len(md_files)
    
    print(f"Found {total_files} files in the teaching_materials directory:")
    print(f"  - PDFs: {len(pdf_files)}")
    print(f"  - DOCXs: {len(docx_files)}")
    print(f"  - PPTXs: {len(pptx_files)}")
    print(f"  - HTMLs: {len(html_files)}")
    print(f"  - TXTs: {len(txt_files)}")
    print(f"  - MDs: {len(md_files)}")
    
    if total_files == 0:
        print("❌ No files found in the teaching_materials directory.")
        return False
    
    return True

def check_parameters_directory():
    """Check if the course parameters directory exists and has content."""
    params_dir = Path("course_parameters")
    
    if not params_dir.exists():
        print("❌ Error: The 'course_parameters' directory does not exist.")
        return False
    
    # Check for JSON files in the directory
    json_files = list(params_dir.glob("**/*.json"))
    
    print(f"Found {len(json_files)} parameter files in the course_parameters directory.")
    
    if len(json_files) == 0:
        print("❌ No parameter files found in the course_parameters directory.")
        return False
    
    # Try to load one of the JSON files to validate format
    if json_files:
        try:
            with open(json_files[0], 'r', encoding='utf-8') as f:
                params = json.load(f)
                
            # Check if file has required fields
            required_fields = ['course_title', 'target_audience', 'teaching_style', 'teaching_objective', 'compulsory_areas']
            missing_fields = [field for field in required_fields if field not in params]
            
            if missing_fields:
                print(f"⚠️ Parameter file {json_files[0].name} is missing fields: {', '.join(missing_fields)}")
                return False
                
            print(f"✓ Successfully loaded parameter file: {json_files[0].name}")
            print(f"  Course title: {params.get('course_title', 'N/A')}")
            print(f"  Target audience: {params.get('target_audience', 'N/A')}")
            compulsory_areas = params.get('compulsory_areas', [])
            if compulsory_areas:
                print(f"  Number of compulsory areas: {len(compulsory_areas)}")
        except Exception as e:
            print(f"❌ Error loading parameter file {json_files[0].name}: {e}")
            return False
    
    return True

def check_exports_directory():
    """Check if the course exports directory exists and has content."""
    exports_dir = Path("course_exports")
    
    if not exports_dir.exists():
        print("⚠️ Warning: The 'course_exports' directory does not exist yet.")
        try:
            exports_dir.mkdir(parents=True, exist_ok=True)
            print(f"✓ Created 'course_exports' directory.")
        except Exception as e:
            print(f"❌ Error creating directory: {e}")
            return False
    
    # Check for CSV and Excel files in the directory
    csv_files = list(exports_dir.glob("**/*.csv"))
    xlsx_files = list(exports_dir.glob("**/*.xlsx"))
    
    total_files = len(csv_files) + len(xlsx_files)
    
    print(f"Found {total_files} export files in the course_exports directory:")
    print(f"  - CSVs: {len(csv_files)}")
    print(f"  - Excel files: {len(xlsx_files)}")
    
    return True

def test_document_loading():
    """Test loading documents from the materials directory."""
    try:
        from langchain_community.document_loaders import (
            PyPDFLoader, 
            Docx2txtLoader, 
            UnstructuredPowerPointLoader,
            UnstructuredHTMLLoader,
            TextLoader
        )
        print("✓ Successfully imported document loaders")
    except ImportError as e:
        print(f"❌ Error importing document loaders: {e}")
        print("  Try running: pip install langchain-community unstructured pypdf python-docx2txt")
        return False
    
    # Check for the teaching materials directory
    materials_dir = Path("teaching_materials")
    if not materials_dir.exists():
        print("❌ The teaching_materials directory does not exist.")
        return False
    
    # Try loading a text file as a test
    test_files = list(materials_dir.glob("**/*.txt")) + list(materials_dir.glob("**/*.md"))
    if not test_files:
        print("ℹ️ No text files found for testing. Trying to create one...")
        test_file = materials_dir / "test_file.txt"
        try:
            with open(test_file, "w") as f:
                f.write("This is a test file for document loading.")
            test_files = [test_file]
            print(f"✓ Created test file: {test_file}")
        except Exception as e:
            print(f"❌ Failed to create test file: {e}")
            return False
    
    # Try loading the test file
    try:
        loader = TextLoader(str(test_files[0]))
        documents = loader.load()
        print(f"✓ Successfully loaded {len(documents)} documents from {test_files[0]}")
        if documents:
            print(f"  Sample content: {documents[0].page_content[:50]}...")
        return True
    except Exception as e:
        print(f"❌ Error loading test file: {e}")
        return False

def test_vectorstore():
    """Test creating a vector store with embeddings."""
    try:
        from langchain_openai import OpenAIEmbeddings
        from langchain_community.vectorstores import FAISS
        print("✓ Successfully imported vector store modules")
    except ImportError as e:
        print(f"❌ Error importing vector store modules: {e}")
        print("  Try running: pip install langchain-openai faiss-cpu")
        return False
    
    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OpenAI API key not found in environment variables.")
        print("  Make sure you have set the OPENAI_API_KEY in your .env file.")
        return False
    
    # Create a simple document for testing
    try:
        from langchain_core.documents import Document
        test_docs = [
            Document(page_content="This is a test document about sustainable development goals.", metadata={"source": "test.txt"}),
            Document(page_content="AI can help achieve sustainable development through automation.", metadata={"source": "test.txt"})
        ]
        
        # Create embeddings and vector store
        embeddings = OpenAIEmbeddings()
        vectorstore = FAISS.from_documents(test_docs, embeddings)
        
        # Test retrieval
        results = vectorstore.similarity_search("sustainable development", k=1)
        print(f"✓ Successfully created vector store and retrieved results:")
        print(f"  Retrieved: {results[0].page_content}")
        return True
    except Exception as e:
        print(f"❌ Error testing vector store: {e}")
        return False

def simulate_retrieval():
    """Simulate the document retrieval process."""
    try:
        from langchain_community.document_loaders import TextLoader
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from langchain_openai import OpenAIEmbeddings
        from langchain_community.vectorstores import FAISS
        from langchain.retrievers import ParentDocumentRetriever
        from langchain.storage import InMemoryStore
        
        print("✓ Successfully imported all required modules")
    except ImportError as e:
        print(f"❌ Error importing required modules: {e}")
        return False
    
    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OpenAI API key not found in environment variables.")
        print("  Make sure you have set the OPENAI_API_KEY in your .env file.")
        return False
    
    # Create a test file
    materials_dir = Path("teaching_materials")
    if not materials_dir.exists():
        materials_dir.mkdir(parents=True, exist_ok=True)
    
    test_file = materials_dir / "rag_test.txt"
    try:
        with open(test_file, "w") as f:
            f.write("""# Sustainable Development and AI
            
Sustainable Development Goals (SDGs) provide a framework for global development.
Artificial Intelligence can help accelerate progress towards these goals through:
1. Data analysis for better decision making
2. Automation of routine tasks
3. Personalized education and healthcare
4. Efficient resource management

## Business Applications
Businesses can leverage AI to achieve sustainability targets while improving profitability.
""")
        print(f"✓ Created test file: {test_file}")
    except Exception as e:
        print(f"❌ Failed to create test file: {e}")
        return False
    
    try:
        # Load the document
        loader = TextLoader(str(test_file))
        documents = loader.load()
        print(f"✓ Loaded {len(documents)} documents")
        
        # Set up text splitter for chunking
        parent_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        child_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=20)
        
        # Set up vector store
        embeddings = OpenAIEmbeddings()
        
        # Set up parent document retriever with in-memory store
        parent_store = InMemoryStore()
        retriever = ParentDocumentRetriever(
            vectorstore=FAISS.from_documents(documents, embeddings),
            docstore=parent_store,
            parent_splitter=parent_splitter,
            child_splitter=child_splitter
        )
        
        # Test retrieval
        query = "sustainable development and artificial intelligence in business"
        retrieved_docs = retriever.get_relevant_documents(query, k=2)
        
        print(f"✓ Retrieved {len(retrieved_docs)} documents for query: '{query}'")
        for i, doc in enumerate(retrieved_docs):
            print(f"\nDocument {i+1}:")
            print(f"  Source: {doc.metadata.get('source', 'Unknown')}")
            print(f"  Content: {doc.page_content[:100]}...")
        
        # Format documents as in the course designer
        formatted_docs = []
        for doc in retrieved_docs:
            source = doc.metadata.get("source", "Unknown source")
            formatted_docs.append({
                "content": doc.page_content,
                "source": Path(source).name if isinstance(source, str) else "Unknown",
                "metadata": doc.metadata
            })
        
        print("\nFormatted documents (as in course designer):")
        for i, doc in enumerate(formatted_docs):
            print(f"\nDocument {i+1} - Source: {doc['source']}")
            print(f"{doc['content'][:100]}...")
        
        return True
    except Exception as e:
        print(f"❌ Error simulating retrieval: {e}")
        return False

def test_gui_integration():
    """Test if the GUI can properly display retrieved documents."""
    try:
        import gradio as gr
        print("✓ Successfully imported Gradio")
    except ImportError:
        print("❌ Error importing Gradio. Try running: pip install gradio")
        return False
    
    try:
        # Create a sample document list
        sample_docs = [
            {
                "content": "This is a sample document about sustainable development goals.",
                "source": "sample1.txt",
                "metadata": {"source": "sample1.txt"}
            },
            {
                "content": "AI integration can help businesses achieve sustainability targets.",
                "source": "sample2.txt",
                "metadata": {"source": "sample2.txt"}
            }
        ]
        
        # Format documents as would be done in get_state method
        formatted_docs = ""
        for i, doc in enumerate(sample_docs):
            formatted_docs += f"Document {i+1} - Source: {doc['source']}\n"
            formatted_docs += f"{doc['content']}\n\n"
        
        print("✓ Formatted document display:")
        print(formatted_docs)
        
        return True
    except Exception as e:
        print(f"❌ Error testing GUI integration: {e}")
        return False

def test_export_functionality():
    """Test the course export functionality."""
    print("Testing course export functionality...")
    
    # Create exports directory if it doesn't exist
    export_dir = Path("course_exports")
    export_dir.mkdir(exist_ok=True, parents=True)
    
    # First check if pandas is available
    try:
        import pandas as pd
        print("✓ Successfully imported pandas")
    except ImportError:
        print("❌ Error importing pandas. Try running: pip install pandas")
        return False
    
    # Try to create a sample course data
    try:
        course_data = {
            "title": "Test Course: Sustainable Business Management",
            "teaching_goal": "To understand the principles of sustainable business management",
            "teaching_method": "Interactive and case-based learning",
            "topics": [
                "Introduction to Sustainable Development",
                "Business Service Management Innovations",
                "AI in Sustainable Business Practices",
                "Environmental Social Governance (ESG)"
            ],
            "references": [
                "Porter, M. E., & Kramer, M. R. (2011). Creating Shared Value. Harvard Business Review, 89(1/2), 62-77.",
                "United Nations. (2015). Transforming our world: The 2030 Agenda for Sustainable Development."
            ]
        }
        print("✓ Created sample course data structure")
    except Exception as e:
        print(f"❌ Error creating sample course data: {e}")
        return False
    
    # Test CSV export
    try:
        csv_path = export_dir / "test_export.csv"
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            import csv
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
        
        print(f"✓ Successfully created CSV export at {csv_path}")
        
        # Try reading it back to validate
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            rows = list(reader)
            print(f"  Read back {len(rows)} rows from CSV file")
        
    except Exception as e:
        print(f"❌ Error testing CSV export: {e}")
        return False
    
    # Test Excel export
    try:
        xlsx_path = export_dir / "test_export.xlsx"
        
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
        data.append(["References", ""])
        for i, ref in enumerate(course_data["references"], 1):
            data.append([f"Reference {i}", ref])
        
        # Create DataFrame and save to Excel
        df = pd.DataFrame(data)
        df.to_excel(xlsx_path, header=False, index=False)
        
        print(f"✓ Successfully created Excel export at {xlsx_path}")
        
        # Try reading it back to validate
        df_read = pd.read_excel(xlsx_path, header=None)
        print(f"  Read back {len(df_read)} rows from Excel file")
        
    except Exception as e:
        print(f"❌ Error testing Excel export: {e}")
        return False
    
    # Test HTML generation
    try:
        # Generate sample HTML table
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
        </table>
        """.format(
            title=course_data["title"],
            goal=course_data["teaching_goal"]
        )
        
        html_path = export_dir / "test_export.html"
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
            
        print(f"✓ Successfully created HTML preview at {html_path}")
    except Exception as e:
        print(f"❌ Error testing HTML generation: {e}")
        return False
    
    # Cleanup test files
    try:
        for file in [csv_path, xlsx_path, html_path]:
            if file.exists():
                file.unlink()
        print("✓ Cleaned up test export files")
    except Exception as e:
        print(f"⚠️ Warning: Could not clean up all test files: {e}")
    
    return True

def test_course_extraction():
    """Test the course content extraction logic."""
    print("Testing course content extraction logic...")
    
    # Sample course draft content
    sample_draft = """
# Business Innovation and Sustainability

## Course Overview

This course aims to develop skills in sustainable business management through a 
combination of theoretical frameworks and practical case studies.

## Teaching Methodology

The course will be taught using interactive and case-based learning approaches,
with an emphasis on group discussions and real-world problem solving.

## Module 1: Introduction to Sustainable Development

This module introduces the Sustainable Development Goals (SDGs) and their relevance to business.

## Module 2: Business Service Management Innovations

This module explores innovative approaches to business service management that promote sustainability.

## Module 3: AI in Sustainable Business

This module examines how artificial intelligence can be leveraged for sustainable business practices.

## References

1. Porter, M. E., & Kramer, M. R. (2011). Creating Shared Value. Harvard Business Review.
2. United Nations. (2015). Transforming our world: The 2030 Agenda for Sustainable Development.
"""

    try:
        # Test extracting title
        title_pattern = re.compile(r'#+\s*(.+?)\s*(?:\n|$)')
        title_match = title_pattern.search(sample_draft)
        if title_match:
            title = title_match.group(1).strip()
            print(f"✓ Successfully extracted title: {title}")
        else:
            print("❌ Failed to extract title")
            return False
        
        # Test extracting teaching goal
        goal_patterns = [
            r'(?:teaching|learning|course)\s+(?:goal|objective|aim)s?[:\s]+([^\n]+)',
            r'(?:goal|objective|aim)s?(?:\s+of\s+the\s+course)?[:\s]+([^\n]+)',
            r'(?:by\s+the\s+end\s+of\s+this\s+course[,\s]+students\s+will\s+)([^\n]+)',
            r'This course aims to ([^\n]+)'
        ]
        
        goal_found = False
        for pattern in goal_patterns:
            goal_match = re.search(pattern, sample_draft, re.IGNORECASE)
            if goal_match:
                goal = goal_match.group(1).strip()
                print(f"✓ Successfully extracted teaching goal: {goal}")
                goal_found = True
                break
        
        if not goal_found:
            print("⚠️ Warning: Could not extract teaching goal using patterns")
        
        # Test extracting teaching method
        method_patterns = [
            r'(?:teaching|learning|instructional)\s+(?:method|approach|strategy|style)[s:\s]+([^\n]+)',
            r'(?:course|class)\s+(?:will\s+be|is)\s+(?:taught|delivered)\s+(?:using|through|by|via)\s+([^\n]+)',
            r'(?:methodology|format)[:\s]+([^\n]+)'
        ]
        
        method_found = False
        for pattern in method_patterns:
            method_match = re.search(pattern, sample_draft, re.IGNORECASE)
            if method_match:
                method = method_match.group(1).strip()
                print(f"✓ Successfully extracted teaching method: {method}")
                method_found = True
                break
        
        if not method_found:
            print("⚠️ Warning: Could not extract teaching method using patterns")
        
        # Test extracting course topics (sections with ## or ### headers)
        topic_pattern = re.compile(r'#{2,3}\s+(.+?)\s*(?:\n|$)')
        topics = topic_pattern.findall(sample_draft)
        
        # Filter out common non-topic headers
        non_topic_headers = [
            'introduction', 'overview', 'summary', 'conclusion', 
            'background', 'reference', 'bibliography', 'assessment',
            'evaluation', 'grading', 'objectives', 'goals', 'methodology'
        ]
        
        filtered_topics = [
            topic for topic in topics 
            if not any(non.lower() in topic.lower() for non in non_topic_headers)
        ]
        
        if filtered_topics:
            print(f"✓ Successfully extracted {len(filtered_topics)} topics:")
            for i, topic in enumerate(filtered_topics, 1):
                print(f"  {i}. {topic}")
        else:
            print("⚠️ Warning: Could not extract course topics after filtering")
        
        # Test extracting references
        ref_patterns = [
            r'(?:references|bibliography|further reading|recommended texts|required texts|textbooks)[:\s]+((?:.+\n)+)',
            r'#+\s+(?:references|bibliography|further reading|recommended texts)[^\n]*\n+((?:.+\n)+)'
        ]
        
        ref_section = ""
        for pattern in ref_patterns:
            ref_match = re.search(pattern, sample_draft, re.IGNORECASE)
            if ref_match:
                ref_section = ref_match.group(1).strip()
                break
        
        if ref_section:
            # Try to extract structured references
            ref_items = re.findall(r'(?:^|\n)[-•*]\s+([^\n]+)', ref_section)
            if not ref_items:
                # If no bullet points, try numbered list
                ref_items = re.findall(r'(?:^|\n)\d+\.\s+([^\n]+)', ref_section)
            if not ref_items:
                # If no structured list, just split by lines
                ref_items = [line.strip() for line in ref_section.split('\n') if line.strip()]
            
            if ref_items:
                print(f"✓ Successfully extracted {len(ref_items)} references:")
                for i, ref in enumerate(ref_items, 1):
                    print(f"  {i}. {ref}")
            else:
                print("⚠️ Warning: Found reference section but could not extract items")
        else:
            print("⚠️ Warning: Could not extract reference section")
        
        return True
    except Exception as e:
        print(f"❌ Error testing course extraction: {e}")
        return False

def main():
    """Run the debugging tests."""
    print("\n" + "="*80)
    print("ENHANCED RAG COURSE DESIGNER - DEBUGGING TOOL")
    print("="*80 + "\n")
    
    print("STEP 1: Checking materials directory...")
    materials_ok = check_materials_directory()
    print("")
    
    print("STEP 2: Checking parameters directory...")
    params_ok = check_parameters_directory()
    print("")
    
    print("STEP 3: Checking exports directory...")
    exports_ok = check_exports_directory()
    print("")
    
    print("STEP 4: Testing document loading...")
    loading_ok = test_document_loading()
    print("")
    
    print("STEP 5: Testing vector store...")
    vectorstore_ok = test_vectorstore()
    print("")
    
    print("STEP 6: Simulating document retrieval...")
    retrieval_ok = simulate_retrieval()
    print("")
    
    print("STEP 7: Testing GUI integration...")
    gui_ok = test_gui_integration()
    print("")
    
    print("STEP 8: Testing export functionality...")
    export_ok = test_export_functionality()
    print("")
    
    print("STEP 9: Testing course content extraction...")
    extraction_ok = test_course_extraction()
    print("")
    
    # Summary
    print("="*80)
    print("DIAGNOSIS RESULTS")
    print("="*80)
    print(f"Materials Directory:      {'✓ OK' if materials_ok else '❌ ISSUE'}")
    print(f"Parameters Directory:     {'✓ OK' if params_ok else '❌ ISSUE'}")
    print(f"Exports Directory:        {'✓ OK' if exports_ok else '❌ ISSUE'}")
    print(f"Document Loading:         {'✓ OK' if loading_ok else '❌ ISSUE'}")
    print(f"Vector Store:             {'✓ OK' if vectorstore_ok else '❌ ISSUE'}")
    print(f"Document Retrieval:       {'✓ OK' if retrieval_ok else '❌ ISSUE'}")
    print(f"GUI Integration:          {'✓ OK' if gui_ok else '❌ ISSUE'}")
    print(f"Export Functionality:     {'✓ OK' if export_ok else '❌ ISSUE'}")
    print(f"Course Content Extraction: {'✓ OK' if extraction_ok else '❌ ISSUE'}")
    print("="*80)
    
    if all([materials_ok, params_ok, exports_ok, loading_ok, vectorstore_ok, retrieval_ok, gui_ok, export_ok, extraction_ok]):
        print("\n✅ All components appear to be functioning correctly!")
        print("If you're still having issues, check the following:")
        print("1. Make sure you've generated a course before trying to view materials or export")
        print("2. Check that the course topic relates to content in your teaching materials")
        print("3. Verify that the refresh and export buttons are properly connected")
    else:
        print("\n⚠️ Some issues were detected. Please review the details above.")
        print("You may need to fix the following:")
        if not materials_ok:
            print("- Add documents to your teaching_materials directory")
        if not params_ok:
            print("- Add parameter files to your course_parameters directory")
        if not exports_ok:
            print("- Check the course_exports directory for write permissions")
        if not loading_ok:
            print("- Install required document loader packages")
        if not vectorstore_ok:
            print("- Configure your OpenAI API key in the .env file")
        if not retrieval_ok:
            print("- Check for errors in the retrieval process in course_designer_rag.py")
        if not gui_ok:
            print("- Verify the GUI implementation in simplified_gui_rag.py")
        if not export_ok:
            print("- Install pandas for Excel export capability")
        if not extraction_ok:
            print("- Check the course content extraction logic in course_exporter.py")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
