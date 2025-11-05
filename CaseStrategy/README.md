# RAG-Enhanced Course Designer

This project enhances the original Course Designer with Retrieval Augmented Generation (RAG) capabilities, allowing it to reference your existing teaching materials when creating new courses.

## What is RAG?

Retrieval Augmented Generation (RAG) is a technique that improves large language model (LLM) outputs by retrieving specific information from external knowledge sources. In this application, RAG allows the AI to reference your existing teaching materials when designing courses, ensuring greater relevance and continuity with your previous content.

## Files in this Project

- `course_designer.py` - The main application file, enhanced with RAG capabilities
- `simplified_gui.py` - The GUI interface, updated with a Materials tab
- `setup.py` - A setup script to prepare your environment
- `debug.py` - check the integrity of the code
- `README.md` - This documentation file

## How to Set Up

1. Run the setup script to start the program or follow the steps from (2) onwards:

```
python setup.py 
```

2. Add your teaching materials to the `teaching_materials` directory:
   - PDFs
   - Word documents (.docx)
   - PowerPoint presentations (.pptx)
   - HTML files
   - Text files

3. Install the required dependencies if you haven't already:

```
pip install langchain-community langchain-openai langchain-text-splitters faiss-cpu  gradio openai langgraph python-dotenv unstructured pypdf docx2txt tiktoken pandas
```

## How to Use

1. Start the application:

```
python course_designer.py
```

2. Enter your course name in the "Course Name" field

3. Click "Generate Course Content" to begin the process

4. The system will:
   - Search through your teaching materials
   - Find content relevant to your course topic
   - Reference this content during the planning stage
   - Show you which materials were used in the "Materials" tab

5. Navigate through the tabs to view and modify the generated content:
   - Agent Tab: Control panel for the design process
   - Plan Tab: View and modify the course outline
   - Design Tab: View and modify the course content
   - Critique Tab: View and modify the critique
   - Materials Tab: View retrieved teaching materials used for reference
   - StateSnapShots Tab: View the history of changes

## How RAG Works in this Application

1. **Document Loading**: When the application starts, it loads all documents from the `teaching_materials` directory.

2. **Document Processing**: Each document is split into smaller chunks to make retrieval more efficient.

3. **Embedding Creation**: The content is converted into numerical representations (embeddings) that capture the meaning of the text.

4. **Similarity Search**: When you enter a course topic, the system searches for chunks from your materials that are semantically similar to the topic.

5. **Planning with Context**: The most relevant chunks are provided to the AI as context during the planning stage, allowing it to reference your existing materials.

6. **References in Output**: The AI will reference your materials in the generated plan, mentioning the source documents when appropriate.

## Tips for Best Results

- Include a variety of teaching materials related to your domain
- Use descriptive filenames as they will be referenced in the output
- Organize materials in subdirectories for better management
- Focus on materials related to the themes mentioned in the course designer:
  * Sustainable Development Goals
  * AI in business
  * Self-management learning
  * Business service innovation
  * Environmental and social governance

## Technical Details

This implementation uses:
- LangChain for document processing and retrieval
- FAISS for efficient similarity search
- OpenAI's embeddings to convert text into vector representations
- ParentDocumentRetriever to maintain context between chunks
- Various document loaders to handle different file formats

## Customization

You can modify the following to customize the RAG behavior:
- In `course_designer.py`, adjust the chunk sizes in the `_initialize_retrieval_system` method
- Change the number of documents retrieved by modifying the `k` parameter in `retrieve_relevant_documents`
- Update the system prompts to modify how retrieved content is used

## Troubleshooting

If you encounter issues:
1. Check that your teaching materials are in supported formats
2. Verify that the `teaching_materials` directory exists
3. Ensure all dependencies are installed correctly
4. Look for error messages in the console output

For further assistance, please refer to the error messages in the application logs.
