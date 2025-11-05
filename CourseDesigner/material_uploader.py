import gradio as gr
import os
import shutil
from pathlib import Path

class MaterialUploadManager:
    def __init__(self, materials_dir="./teaching_materials"):
        self.materials_dir = Path(materials_dir)
        # Create materials directory if it doesn't exist
        self.materials_dir.mkdir(exist_ok=True, parents=True)
        self.demo = self.create_interface()
        
    def upload_file(self, files):
        """Upload files to the materials directory"""
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
    
    def list_files(self):
        """List all files in the materials directory"""
        files = []
        for file_path in self.materials_dir.glob("**/*"):
            if file_path.is_file():
                # Get the relative path to the materials directory
                rel_path = file_path.relative_to(self.materials_dir)
                files.append(str(rel_path))
        
        if not files:
            return "No files in the materials directory."
        
        return "\n".join(files)
    
    def delete_file(self, file_name):
        """Delete a file from the materials directory"""
        try:
            file_path = self.materials_dir / file_name
            
            if not file_path.exists():
                return f"File not found: {file_name}"
            
            # Delete the file
            file_path.unlink()
            
            return f"Successfully deleted: {file_name}"
        except Exception as e:
            return f"Error deleting {file_name}: {e}"
    
    def create_interface(self):
        """Create the Gradio interface"""
        with gr.Blocks(theme=gr.themes.Default(spacing_size='sm', text_size="sm")) as demo:
            gr.Markdown("# Teaching Materials Manager")
            
            gr.Markdown("""
            ## Upload Teaching Materials
            
            This interface allows you to upload, view, and manage your teaching materials.
            These materials will be used by the Course Design Assistant to create more relevant course content.
            
            **Supported file types:**
            - Text files (.txt)
            - PDF files (.pdf)
            - Word documents (.doc, .docx)
            - HTML files (.html, .htm)
            
            After uploading your materials, they will be automatically indexed and made available for the RAG system.
            """)
            
            with gr.Tab("Upload Materials"):
                file_upload = gr.File(file_count="multiple", label="Upload Files")
                upload_btn = gr.Button("Upload", variant="primary")
                upload_result = gr.Textbox(label="Upload Result", lines=5)
                
                upload_btn.click(fn=self.upload_file, inputs=[file_upload], outputs=[upload_result])
            
            with gr.Tab("Manage Materials"):
                refresh_btn = gr.Button("Refresh File List")
                file_list = gr.Textbox(label="Available Files", lines=10)
                
                with gr.Row():
                    file_to_delete = gr.Textbox(label="File to Delete")
                    delete_btn = gr.Button("Delete", variant="stop")
                
                delete_result = gr.Textbox(label="Delete Result")
                
                refresh_btn.click(fn=self.list_files, inputs=[], outputs=[file_list])
                delete_btn.click(fn=self.delete_file, inputs=[file_to_delete], outputs=[delete_result]).then(
                              fn=self.list_files, inputs=[], outputs=[file_list])
        
        return demo
    
    def launch(self, share=None):
        """Launch the Gradio interface"""
        print("\n" + "="*80)
        print("TEACHING MATERIALS MANAGER")
        print("="*80)
        print("\nWelcome to the Teaching Materials Manager!")
        print("\nThis application helps you upload and manage teaching materials.")
        print("\nBasic Usage:")
        print("1. Upload your teaching materials (PDFs, DOCs, TXTs, HTMLs)")
        print("2. Manage your uploaded files")
        print("3. These materials will be used by the Course Designer for relevant content")
        print("\nThe application has opened in your web browser.")
        print("If not, please manually open the URL shown below.")
        print("="*80 + "\n")
        
        if port := os.getenv("PORT2"):
            self.demo.launch(share=True, server_port=int(port), server_name="0.0.0.0")
        else:
            self.demo.launch(share=share)

# Example usage
if __name__ == "__main__":
    uploader = MaterialUploadManager()
    uploader.launch()
