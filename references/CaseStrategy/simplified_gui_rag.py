import gradio as gr
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
        """Upload files to the materials directory"""
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
        
        return "\n".join(result)
    
    # Other methods and implementation...
    # (The rest of the enhanced GUI implementation would go here)

    def launch(self, share=None):
        """
        Launch the Gradio interface.
        """
        print("\n" + "="*80)
        print("COURSE DESIGN ASSISTANT WITH MATERIAL UPLOAD")
        print("="*80)
        print("\nWelcome to the Enhanced Course Design Assistant!")
        print("\nThis application helps you create educational course content using AI and your own teaching materials.")
        print("\nBasic Usage:")
        print("1. First, upload your teaching materials in the Material Upload tab")
        print("2. Enter a course name in the Agent tab")
        print("3. Click 'Generate Course Content' to start")
        print("4. Navigate through the tabs to view and modify content")
        print("5. Use 'Continue Design Process' to progress through the workflow")
        print("6. Check the 'Materials' tab to see which documents were referenced")
        print("\nThe application has opened in your web browser.")
        print("If not, please manually open the URL shown below.")
        print("="*80 + "\n")
        
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
    app.launch()