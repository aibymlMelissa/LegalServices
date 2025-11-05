#!/usr/bin/env python
"""
RAG Course Designer - Setup Utility
============================================

This script provides a comprehensive setup for the Enhanced RAG Course Designer:
1. Checks for and installs required dependencies
2. Sets up the environment configuration
3. Creates the teaching materials directory and example files
4. Launches the application with the Material Upload tab when ready

Usage: python setup_cd.py [--install-only] [--setup-only] [--run]
"""

import subprocess
import sys
import os
import argparse
import shutil
from pathlib import Path

# Required packages
REQUIRED_PACKAGES = [
    "langchain-community",
    "langchain-openai",
    "langchain-text-splitters",
    "faiss-cpu",
    "gradio",
    "openai",
    "langgraph",
    "python-dotenv",
    "unstructured",
    "pypdf",
    "docx2txt",
    "tiktoken",
    "pandas",
    "openpyxl"
]

def check_pip():
    """Check if pip is installed and accessible."""
    try:
        subprocess.run([sys.executable, "-m", "pip", "--version"], 
                       check=True, capture_output=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        print("❌ Error: pip is not available or not functioning correctly.")
        return False

def install_package(package):
    """Install a single package using pip."""
    print(f"📦 Installing {package}...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", package],
            check=True,
            capture_output=True
        )
        return True
    except subprocess.SubprocessError as e:
        print(f"❌ Failed to install {package}: {e}")
        return False

def create_env_file():
    """Create a .env file if it doesn't exist."""
    env_path = Path(".env")
    
    if env_path.exists():
        print("✓ .env file already exists.")
        return
    
    try:
        with open(env_path, "w") as f:
            f.write("# OpenAI API Key\n")
            f.write("OPENAI_API_KEY=\n\n")
            f.write("# Optional: Port for Gradio (if running on a server)\n")
            f.write("# PORT1=7860\n")
        
        print("✓ Created .env file for API keys.")
        print("  Please edit this file to add your OpenAI API key.")
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")

def install_dependencies():
    """Install all required dependencies."""
    print("\n=== INSTALLING DEPENDENCIES ===")
    
    # Check for pip
    if not check_pip():
        print("Unable to proceed with installation. Please ensure pip is installed and functioning.")
        return False
    
    # Install required packages
    print("\nInstalling required packages...")
    success = True
    for package in REQUIRED_PACKAGES:
        if not install_package(package):
            success = False
    
    if not success:
        print("\n⚠️ Some packages failed to install. Please review the errors above.")
        return False
    
    # Create .env file
    print("\nSetting up environment...")
    create_env_file()
    
    # Success message
    if success:
        print("\n✅ Dependencies installation complete!")
        print("All required packages have been installed.")
    
    return success

def ensure_materials_dir():
    """Create the teaching materials directory if it doesn't exist."""
    print("\n=== SETTING UP TEACHING MATERIALS ===")
    
    materials_dir = Path("teaching_materials")
    
    if materials_dir.exists():
        print(f"✓ The '{materials_dir}' directory exists.")
    else:
        materials_dir.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created '{materials_dir}' directory for teaching materials.")
    
    # Create an example file
    example_file = materials_dir / "example_material.md"
    if not example_file.exists():
        try:
            # Check if we have the example file in the current directory
            if Path("example_material.md").exists():
                shutil.copy("example_material.md", example_file)
            else:
                # Create a minimal example file
                with open(example_file, "w") as f:
                    f.write("""# Sustainable Development Through AI Integration

## Introduction to Sustainable Development Goals

The 17 Sustainable Development Goals (SDGs) were adopted by all United Nations Member States in 2015 as a universal call to action to end poverty, protect the planet, and ensure that all people enjoy peace and prosperity by 2030.

## AI Integration in Business Services

Artificial Intelligence is transforming business services through several key mechanisms:

1. **Automation of Routine Tasks**
   - Implementing AI-powered chatbots for customer service
   - Automating repetitive administrative processes
   - Using machine learning for data entry and processing

2. **Personalized Customer Experiences**
   - Analyzing customer behavior to predict preferences
   - Creating customized product recommendations
   - Delivering tailored marketing messages based on user profiles

## Self-Management Learning Techniques

Self-management learning emphasizes personal responsibility for learning outcomes through structured approaches.

## Environmental, Social, and Governance (ESG) Criteria

ESG criteria are increasingly important standards for a company's operations that socially conscious investors use to screen potential investments.

This example demonstrates how the RAG system references existing materials when designing courses.
""")
            print(f"✓ Created example teaching material: {example_file}")
        except Exception as e:
            print(f"! Warning: Could not create example file: {e}")
            return False
    
    return True

def create_enhanced_gui_file():
    """Create the simplified_gui_rag.py file if it doesn't exist."""
    print("\n=== CHECKING/CREATING SIMPLIED GUI FILE ===")
    
    enhanced_gui_path = Path("simplified_gui_rag.py")
    
    if enhanced_gui_path.exists():
        print("✓ simplified_gui_rag.py file already exists.")
        return True
    
    try:
        # Code content for enhanced_gui_rag.py goes here
        # This is a simplified version for demonstration
        with open(enhanced_gui_path, "w") as f:
            f.write("""import gradio as gr
import os
import shutil
from pathlib import Path

class EnhancedCSGUI:
    def __init__(self, graph, share=False, materials_dir="teaching_materials"):
        self.graph = graph
        self.share = share
        self.partial_message = ""
        self.response = {}
        self.max_iterations = 10
        self.iterations = []
        self.threads = []
        self.thread_id = -1
        self.thread = {"configurable": {"thread_id": str(self.thread_id)}}
        
        # Material uploader configuration
        self.materials_dir = Path(materials_dir)
        # Create materials directory if it doesn't exist
        self.materials_dir.mkdir(exist_ok=True, parents=True)
        
        self.demo = self.create_interface()

    # Material uploader methods
    def upload_file(self, files):
        \"\"\"Upload files to the materials directory\"\"\"
        # Implementation details...
        result = []
        for file in files:
            try:
                # Get the destination path
                dest_path = self.materials_dir / Path(file.name).name
                
                # Copy the file to the materials directory
                shutil.copy2(file.name, dest_path)
                
                result.append(f"Successfully uploaded: {file.name}")
            except Exception as e:
                result.append(f"Error uploading {file.name}: {e}")
        
        return "\\n".join(result)
    
    # Other methods and implementation...
    # (The rest of the enhanced GUI implementation would go here)

    def launch(self, share=None):
        \"\"\"
        Launch the Gradio interface.
        \"\"\"
        print("\\n" + "="*80)
        print("COURSE DESIGN ASSISTANT WITH MATERIAL UPLOAD")
        print("="*80)
        print("\\nWelcome to the Enhanced Course Design Assistant!")
        print("\\nThis application helps you create educational course content using AI and your own teaching materials.")
        print("\\nBasic Usage:")
        print("1. First, upload your teaching materials in the Material Upload tab")
        print("2. Enter a course name in the Agent tab")
        print("3. Click 'Generate Course Content' to start")
        print("4. Navigate through the tabs to view and modify content")
        print("5. Use 'Continue Design Process' to progress through the workflow")
        print("6. Check the 'Materials' tab to see which documents were referenced")
        print("\\nThe application has opened in your web browser.")
        print("If not, please manually open the URL shown below.")
        print("="*80 + "\\n")
        
        if port := os.getenv("PORT1"):
            self.demo.launch(share=True, server_port=int(port), server_name="0.0.0.0")
        else:
            self.demo.launch(share=self.share)


# Update the launcher code to use the enhanced GUI
if __name__ == "__main__":
    from course_designer_rag import SimplifiedCourseWriter
    
    # Initialize the course writer with the materials directory
    essay_writer = SimplifiedCourseWriter(materials_dir="teaching_materials")
    
    # Initialize and launch the enhanced GUI with material upload functionality
    app = EnhancedCSGUI(essay_writer.graph, materials_dir="teaching_materials")
    app.launch()""")
        
        print("✓ Created simplified_gui_rag.py file.")
        print("  Note: This is just a placeholder. Please replace with the actual implementation.")
        return True
    except Exception as e:
        print(f"❌ Failed to create enhanced_gui_rag.py file: {e}")
        return False

def check_files():
    """Check if required files exist."""
    print("\n=== CHECKING REQUIRED FILES ===")
    
    required_files = [
        "course_designer_rag.py",  # Still needed as a dependency
        "simplified_gui_rag.py"      # New main file
    ]
    
    missing = [f for f in required_files if not Path(f).exists()]
    
    if missing:
        print(f"\n! Error: Missing required files: {', '.join(missing)}")
        print("  Please make sure all necessary files are in the current directory.")
        return False
    
    print("✓ All required files are present.")
    return True

def run_application():
    """Run the enhanced course designer application."""
    print("\n=== LAUNCHING APPLICATION ===")
    
    try:
        print("\n⚙️ Starting Enhanced Course Designer with Material Upload...\n")
        subprocess.run([sys.executable, "simplified_gui_rag.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"\n! Error running the application: {e}")
        return False
    except Exception as e:
        print(f"\n! Unexpected error: {e}")
        return False
    
    return True

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="RAG Course Designer Setup Utility")
    parser.add_argument("--install-only", action="store_true", help="Only install dependencies without setup or running")
    parser.add_argument("--setup-only", action="store_true", help="Only setup directories without installing or running")
    parser.add_argument("--run", action="store_true", help="Run the application after setup (default)")
    
    return parser.parse_args()

def main():
    """Main function to orchestrate the setup process."""
    args = parse_arguments()
    
    print("\n" + "="*80)
    print("RAG COURSE DESIGNER SETUP UTILITY")
    print("="*80)
    
    success = True
    
    # Install dependencies (unless --setup-only is specified)
    if not args.setup_only:
        success = install_dependencies()
        if not success and not args.install_only:
            print("\nCannot proceed with setup due to installation failures.")
            return 1
    
    # Setup directories and files (unless --install-only is specified)
    if not args.install_only and success:
        success = ensure_materials_dir()
        if not success:
            print("\nWarning: Issues occurred during materials setup.")
        
        success = create_enhanced_gui_file() and success
        if not success:
            print("\nWarning: Issues occurred during Simplified GUI file creation.")
        
        success = check_files() and success
        if not success:
            print("\nCannot proceed with launching the application due to missing files.")
            return 1
    
    # Run the application (if --run is specified or no flags are given)
    if success and (args.run or (not args.install_only and not args.setup_only)):
        success = run_application()
        if not success:
            print("\nError occurred while running the application.")
            return 1
    
    # Print final message
    if success:
        print("\n" + "="*80)
        print("✅ SETUP COMPLETED SUCCESSFULLY")
        print("="*80)
        
        if args.install_only:
            print("\nDependencies have been installed. To complete setup and run the application:")
            print("1. Run: python setup_cd.py --setup-only")
            print("2. Edit the .env file and add your OpenAI API key")
            print("3. Run: python setup_cd.py --run")
        elif args.setup_only:
            print("\nSetup is complete. To run the application:")
            print("1. Edit the .env file and add your OpenAI API key")
            print("2. Run: python setup_cd.py --run")
        else:
            print("\nSetup complete! The Enhanced Course Designer includes a Material Upload tab.")
            print("You can add more teaching materials directly through the application interface.")
            print("Alternatively, place files in the 'teaching_materials' directory manually.")
            
        print("="*80 + "\n")
    else:
        print("\nSetup did not complete successfully. Please review the errors above.")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
