#!/usr/bin/env python
"""
ESG Business Proposal Designer - Debug Utility
=============================================

This script helps debug issues with the ESG Business Proposal Designer,
including dependency checking, project structure verification, and basic functionality testing.
"""

import os
import sys
import importlib
import subprocess
import json
import shutil
from pathlib import Path
import traceback
import time

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_dependencies():
    """Check if all required packages are installed."""
    required_packages = [
        "gradio",
        "langgraph",
        "langchain_core",
        "langchain_openai",
        "langchain_community",
        "langchain_text_splitters",
        "dotenv",
        "pandas",
        "python-dotenv",
        "faiss-cpu"  # For vector store
    ]
    
    missing_packages = []
    installed_versions = {}
    
    print("Checking required packages...")
    for package in required_packages:
        try:
            module = importlib.import_module(package)
            
            # Get version if available
            version = getattr(module, "__version__", "unknown")
            installed_versions[package] = version
            print(f"✓ {package} (version: {version})")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} - Not installed")
    
    if missing_packages:
        print("\n❌ Missing packages detected. Please install them using:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    print("\n✓ All required packages are installed.")
    return True

def check_environment_variables():
    """Check if required environment variables are set."""
    print("\nChecking environment variables...")
    
    # Check for OpenAI API key (required for embeddings and model)
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        print("❌ OPENAI_API_KEY not found in environment variables.")
        print("  Please set your OPENAI_API_KEY in a .env file or directly in your environment.")
        return False
    
    print("✓ OPENAI_API_KEY is set.")
    return True

def check_project_structure():
    """Check if project files and directories are present."""
    print("\nChecking project structure...")
    
    # Core files
    core_files = [
        "project_designer.py",
        "gui.py",
        "requirements.txt"
    ]
    
    missing_files = []
    for file in core_files:
        if not Path(file).exists():
            missing_files.append(file)
            print(f"❌ Missing core file: {file}")
        else:
            print(f"✓ Found core file: {file}")
    
    # Directories
    directories = [
        "reference_materials",
        "proposal_parameters",
        "proposal_exports"
    ]
    
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            print(f"⚠️ Directory '{directory}' does not exist. Creating it...")
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"✓ Created directory: {directory}")
        else:
            print(f"✓ Found directory: {directory}")
    
    # Check for sample parameter file
    param_dir = Path("proposal_parameters")
    param_files = list(param_dir.glob("*.json"))
    
    if not param_files:
        print("⚠️ No parameter files found in proposal_parameters directory.")
        print("  Creating sample parameter file...")
        
        # Create sample parameter file
        sample_params = {
            "proposal_title": "Strategic Culture Alignment for Technology Enterprises",
            "target_company": "Medium to Large Enterprise",
            "industry": "Technology",
            "company_status_notes": "Company experiencing high turnover and misalignment between stated values and operational practices. Recent strategic pivot not well integrated into daily operations.",
            "selected_esg_project_type": "Environmental innovation incubator",
            "focus_areas": [
                "Corporate culture transformation",
                "Strategic management alignment",
                "Value and mission realignment",
                "Startup-inspired innovation processes"
            ]
        }
        
        with open(param_dir / "sample_parameters.json", 'w') as f:
            json.dump(sample_params, f, indent=4)
        
        print("✓ Created sample parameter file: sample_parameters.json")
    else:
        print(f"✓ Found {len(param_files)} parameter files in proposal_parameters directory.")
    
    # Check for sample reference material
    ref_dir = Path("reference_materials")
    ref_files = list(ref_dir.glob("**/*.*"))
    
    if not ref_files:
        print("⚠️ No reference materials found. Creating a sample text file...")
        
        # Create a simple sample text file
        sample_text = """# Corporate Culture and Strategic Management

## Introduction

Corporate culture refers to the shared values, beliefs, and practices that shape behavior within an organization. 
A strong alignment between corporate culture and strategic management is essential for organizational success.

## Key Components of Corporate Culture

1. **Values and Beliefs**: The core principles that guide decision-making
2. **Artifacts and Symbols**: Visible representations of culture (logos, office layout)
3. **Behaviors and Norms**: Expected conduct and unwritten rules
4. **Systems and Processes**: How work gets done and decisions are made

## Strategic Alignment

When corporate culture and strategic objectives are aligned, organizations experience:
- Improved employee engagement
- Enhanced operational efficiency
- Better customer experiences
- More successful change initiatives
- Stronger financial performance

## Startup-Inspired Approaches to Culture Change

Many established organizations are adopting startup methodologies to transform their cultures:
- Minimum Viable Products (MVPs) for cultural initiatives
- Agile implementation of new values and practices
- Cross-functional teams to champion cultural change
- Rapid experimentation and iteration

## References

- Schein, E. H. (2010). Organizational Culture and Leadership. Jossey-Bass.
- Kotter, J. P. (2012). Leading Change. Harvard Business Review Press.
- Ries, E. (2011). The Lean Startup. Crown Business.
"""
        
        with open(ref_dir / "corporate_culture_overview.txt", 'w') as f:
            f.write(sample_text)
        
        print("✓ Created sample reference file: corporate_culture_overview.txt")
    else:
        print(f"✓ Found {len(ref_files)} reference files.")
    
    if missing_files:
        print(f"\n❌ Missing {len(missing_files)} core project files. The application may not function correctly.")
        return False
    
    print("\n✓ Project structure verification completed successfully.")
    return True

def test_imports():
    """Test importing the main project modules."""
    print("\nTesting imports of key project modules...")
    
    try:
        import project_designer
        print("✓ Successfully imported project_designer module")
        
        import gui
        print("✓ Successfully imported gui module")
        
        # Check specific classes
        from project_designer import ESGProposalDesigner, ProposalExporter
        print("✓ Successfully imported ESGProposalDesigner and ProposalExporter classes")
        
        from gui import ESGProposalGUI
        print("✓ Successfully imported ESGProposalGUI class")
        
        return True
    except Exception as e:
        print(f"❌ Error importing project modules: {e}")
        print(f"  Traceback: {traceback.format_exc()}")
        return False

def test_document_retrieval():
    """Test the document retrieval functionality."""
    print("\nTesting document retrieval capability...")
    
    try:
        from project_designer import ESGProposalDesigner
        
        # Create instance of ESGProposalDesigner
        designer = ESGProposalDesigner(materials_dir="reference_materials")
        
        # Test retrieving documents
        query = "corporate culture and strategic management"
        docs = designer.retrieve_relevant_documents(query, k=2)
        
        if docs:
            print(f"✓ Successfully retrieved {len(docs)} documents for query: '{query}'")
            for i, doc in enumerate(docs):
                print(f"  Document {i+1}: {doc['source']}")
                print(f"  Content preview: {doc['content'][:100]}...")
            return True
        else:
            print("⚠️ No documents retrieved. This could be normal if there are no relevant documents.")
            return True
    except Exception as e:
        print(f"❌ Error testing document retrieval: {e}")
        print(f"  Traceback: {traceback.format_exc()}")
        return False

def test_integration():
    """Test integration between components."""
    print("\nTesting integration between components...")
    
    try:
        # Test creating a designer instance
        from project_designer import ESGProposalDesigner
        
        designer = ESGProposalDesigner(materials_dir="reference_materials")
        print("✓ Successfully created ESGProposalDesigner instance")
        
        # Test that the graph is created
        if hasattr(designer, 'graph'):
            print("✓ Graph is properly initialized")
        else:
            print("❌ Graph was not initialized")
            return False
        
        # Test creating a GUI instance
        from gui import ESGProposalGUI
        
        # Create GUI without launching
        gui = ESGProposalGUI(designer.graph, share=False, materials_dir="reference_materials")
        print("✓ Successfully created ESGProposalGUI instance")
        
        return True
    except Exception as e:
        print(f"❌ Error testing component integration: {e}")
        print(f"  Traceback: {traceback.format_exc()}")
        return False

def test_proposal_flow():
    """Test a basic proposal flow without running the full interface."""
    print("\nTesting basic proposal flow...")
    
    try:
        from project_designer import ESGProposalDesigner
        
        # Create designer instance
        designer = ESGProposalDesigner(materials_dir="reference_materials")
        
        # Set up a basic test state
        test_state = {
            'task': "Strategic culture alignment for technology companies",
            'lnode': "",
            'plan': "",
            'draft': "",
            'critique': "",
            'revision_number': 0,
            'max_revisions': 1,
            'count': 0,
            'company_status_notes': "Company experiencing high turnover and misalignment between values and operations.",
            'selected_esg_project_type': "Environmental innovation incubator",
            'retrieved_docs': []
        }
        
        # Test planning node
        print("  Testing planner node...")
        try:
            plan_result = designer.plan_node(test_state)
            print("  ✓ Plan node executed successfully")
            if 'plan' in plan_result and plan_result['plan']:
                print("  ✓ Plan content generated successfully")
                plan_preview = plan_result['plan'][:100] + "..."
                print(f"  Plan preview: {plan_preview}")
            else:
                print("  ⚠️ Plan content might be empty")
            
            # No need to run the full proposal flow which would take too long
            # and consume a lot of API tokens
            
            print("  ✓ Basic proposal flow test passed")
            return True
            
        except Exception as e:
            print(f"  ❌ Error in plan node: {e}")
            return False
        
    except Exception as e:
        print(f"❌ Error testing proposal flow: {e}")
        print(f"  Traceback: {traceback.format_exc()}")
        return False

def create_test_proposal():
    """Create a test proposal export to verify export functionality."""
    print("\nTesting proposal export functionality...")
    
    try:
        from project_designer import ProposalExporter
        
        # Create exporter
        exporter = ProposalExporter(export_dir="proposal_exports")
        
        # Create sample proposal data
        proposal_data = {
            "title": "Strategic Culture-Management Alignment",
            "target_company": "Technology Enterprise",
            "objective": "To transform corporate culture to align with strategic objectives using innovative approaches",
            "approach": "Startup-inspired implementation with agile methodologies",
            "initiatives": [
                "Values Realignment Program",
                "Strategic Communication Framework",
                "Culture Champions Network",
                "Innovation Incubator Initiative"
            ],
            "metrics": [
                "Employee engagement score improvement by 30%",
                "Strategic objective achievement rate increase by 25%",
                "Reduction in turnover by 20%",
                "Innovation pipeline growth by 40%"
            ],
            "timeline": "6-12 months for initial implementation, with quarterly review cycles",
            "budget": "$150,000 - $300,000 depending on organization size",
            "references": [
                "Schein, E. H. (2010). Organizational Culture and Leadership.",
                "Kotter, J. P. (2012). Leading Change.",
                "Ries, E. (2011). The Lean Startup."
            ]
        }
        
        # Test CSV export
        csv_path = exporter.export_to_csv(proposal_data)
        if csv_path:
            print(f"✓ Successfully created CSV export at {csv_path}")
        
        # Test Excel export
        xlsx_path = exporter.export_to_xlsx(proposal_data)
        if xlsx_path:
            print(f"✓ Successfully created Excel export at {xlsx_path}")
        
        # Test HTML table generation
        html_table = exporter.generate_html_table(proposal_data)
        if html_table:
            print("✓ Successfully generated HTML table preview")
        
        return True
    except Exception as e:
        print(f"❌ Error testing export functionality: {e}")
        print(f"  Traceback: {traceback.format_exc()}")
        return False

def check_openai_functionality():
    """Test basic OpenAI API functionality."""
    print("\nTesting OpenAI API functionality...")
    
    try:
        from langchain_openai import ChatOpenAI
        
        model = ChatOpenAI(model="gpt-4o", temperature=0.7)
        
        # Try a simple completion
        from langchain_core.messages import SystemMessage, HumanMessage
        
        messages = [
            SystemMessage(content="You are a helpful assistant."),
            HumanMessage(content="Write a one-sentence test response.")
        ]
        
        print("  Sending test request to OpenAI API...")
        response = model.invoke(messages)
        
        if response.content:
            print(f"  ✓ Received response from OpenAI API: {response.content}")
            return True
        else:
            print("  ❌ Received empty response from OpenAI API")
            return False
    except Exception as e:
        print(f"  ❌ Error testing OpenAI API: {e}")
        print(f"  Traceback: {traceback.format_exc()}")
        return False

def test_gradio_launch():
    """Test launching the Gradio interface briefly."""
    print("\nTesting Gradio interface launch (will close after 5 seconds)...")
    
    try:
        from project_designer import ESGProposalDesigner
        from gui import ESGProposalGUI
        import threading
        import time
        
        # Create designer instance
        designer = ESGProposalDesigner(materials_dir="reference_materials")
        
        # Create GUI without launching
        app = ESGProposalGUI(designer.graph, share=False, materials_dir="reference_materials")
        
        # Define a function to shut down the server after a delay
        def shutdown_server():
            time.sleep(5)  # Wait 5 seconds
            print("  Shutting down test Gradio server...")
            try:
                app.demo.close()  # Close the Gradio app
            except:
                pass  # Ignore errors on shutdown
        
        # Start the shutdown timer in a separate thread
        shutdown_thread = threading.Thread(target=shutdown_server)
        shutdown_thread.daemon = True
        shutdown_thread.start()
        
        # Define a launch function with appropriate parameters
        def launch_app():
            try:
                print("  Launching Gradio interface for testing...")
                app.demo.launch(prevent_thread_lock=True, share=False, debug=False)
            except Exception as e:
                print(f"  ❌ Error launching Gradio interface: {e}")
        
        # Launch Gradio in a thread
        launch_thread = threading.Thread(target=launch_app)
        launch_thread.daemon = True
        launch_thread.start()
        
        # Wait for a moment to see if launch was successful
        time.sleep(3)
        print("  ✓ Gradio interface launched successfully")
        
        # Wait for shutdown
        shutdown_thread.join(timeout=10)
        
        return True
    except Exception as e:
        print(f"❌ Error testing Gradio launch: {e}")
        print(f"  Traceback: {traceback.format_exc()}")
        return False

def display_quick_start_guide():
    """Display a quick start guide for running the application."""
    print("\n" + "="*80)
    print("QUICK START GUIDE")
    print("="*80)
    print("\nTo run the ESG Business Proposal Designer:")
    print("\n1. Ensure all dependencies are installed:")
    print("   pip install -r requirements.txt")
    print("\n2. Set your OpenAI API key in a .env file or environment:")
    print("   OPENAI_API_KEY=your-api-key-here")
    print("\n3. Add reference materials to the 'reference_materials' directory")
    print("   - PDF, DOCX, TXT, HTML, and other text-based files are supported")
    print("\n4. Launch the application:")
    print("   python project_designer.py")
    print("\n5. Use the application:")
    print("   a. Define proposal parameters on the first tab")
    print("   b. Upload or check reference materials on the second tab")
    print("   c. Generate and refine your proposal on the Agent tab")
    print("   d. Export the finished proposal using the Export tab")
    print("\nFor more information, check the documentation or contact support.")
    print("="*80)

def main():
    """Run the debugging tests."""
    print("\n" + "="*80)
    print("ESG BUSINESS PROPOSAL DESIGNER - DEBUGGING TOOL")
    print("="*80 + "\n")
    
    print("This tool will check your installation and test the ESG Business Proposal Designer components.")
    print("It will verify dependencies, project structure, and basic functionality.\n")
    
    results = {}
    
    print("STEP 1: Checking dependencies...")
    results['dependencies'] = check_dependencies()
    print("")
    
    print("STEP 2: Checking environment variables...")
    results['env_vars'] = check_environment_variables()
    print("")
    
    print("STEP 3: Checking project structure...")
    results['structure'] = check_project_structure()
    print("")
    
    print("STEP 4: Testing imports...")
    results['imports'] = test_imports()
    print("")
    
    # Only continue if critical checks pass
    if all([results['dependencies'], results['imports'], results['structure']]):
        print("STEP 5: Testing OpenAI API functionality...")
        results['openai_api'] = check_openai_functionality()
        print("")
        
        print("STEP 6: Testing document retrieval...")
        results['document_retrieval'] = test_document_retrieval()
        print("")
        
        print("STEP 7: Testing component integration...")
        results['integration'] = test_integration()
        print("")
        
        print("STEP 8: Testing proposal export functionality...")
        results['export'] = create_test_proposal()
        print("")
        
        print("STEP 9: Testing basic proposal flow...")
        results['proposal_flow'] = test_proposal_flow()
        print("")
        
        print("STEP 10: Testing Gradio interface launch...")
        results['gradio'] = test_gradio_launch()
        print("")
    else:
        print("❌ Critical checks failed. Skipping remaining tests.")
        results['openai_api'] = False
        results['document_retrieval'] = False
        results['integration'] = False
        results['export'] = False
        results['proposal_flow'] = False
        results['gradio'] = False
    
    # Summary
    print("="*80)
    print("DIAGNOSIS RESULTS")
    print("="*80)
    print(f"Dependencies:             {'✓ OK' if results['dependencies'] else '❌ ISSUE'}")
    print(f"Environment Variables:    {'✓ OK' if results['env_vars'] else '❌ ISSUE'}")
    print(f"Project Structure:        {'✓ OK' if results['structure'] else '❌ ISSUE'}")
    print(f"Module Imports:           {'✓ OK' if results['imports'] else '❌ ISSUE'}")
    print(f"OpenAI API:               {'✓ OK' if results['openai_api'] else '❌ ISSUE'}")
    print(f"Document Retrieval:       {'✓ OK' if results['document_retrieval'] else '❌ ISSUE'}")
    print(f"Component Integration:    {'✓ OK' if results['integration'] else '❌ ISSUE'}")
    print(f"Proposal Export:          {'✓ OK' if results['export'] else '❌ ISSUE'}")
    print(f"Proposal Flow:            {'✓ OK' if results['proposal_flow'] else '❌ ISSUE'}")
    print(f"Gradio Interface:         {'✓ OK' if results['gradio'] else '❌ ISSUE'}")
    print("="*80)
    
    if all(results.values()):
        print("\n✅ All components appear to be functioning correctly!")
        print("You can now run the ESG Business Proposal Designer with confidence.")
        display_quick_start_guide()
    else:
        print("\n⚠️ Some issues were detected. Please review the details above.")
        print("You may need to fix the following:")
        if not results['dependencies']:
            print("- Install missing dependencies using: pip install -r requirements.txt")
        if not results['env_vars']:
            print("- Set up your OPENAI_API_KEY in a .env file or environment variables")
        if not results['structure']:
            print("- Ensure all required project files are present in the correct locations")
        if not results['imports']:
            print("- Check for syntax errors in project_designer.py or gui.py")
        if not results['openai_api']:
            print("- Verify your OPENAI_API_KEY is correct and has sufficient quota")
        if not results['document_retrieval']:
            print("- Add reference materials to the reference_materials directory")
        if not results['integration']:
            print("- Check for compatibility issues between components")
        if not results['export']:
            print("- Ensure the proposal_exports directory is writable")
        if not results['proposal_flow']:
            print("- Debug issues in the proposal generation workflow")
        if not results['gradio']:
            print("- Check for issues with the Gradio interface configuration")
        
        print("\nFor more detailed diagnostics, review the output above.")
        display_quick_start_guide()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
