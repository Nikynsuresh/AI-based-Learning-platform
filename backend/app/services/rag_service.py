import os
from pypdf import PdfReader

# Simulated global storage. In a production app, persist this directly to MongoDB or a Vector DB to tie to specific users
document_contexts = []

async def parse_pdf(file_path: str, original_name: str):
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text
                
        new_context = {
            "filename": original_name,
            "context": text
        }
        document_contexts.append(new_context)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return new_context
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        raise e

def get_contexts():
    return document_contexts
