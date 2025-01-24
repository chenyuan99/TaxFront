# TaxFront Backend

## Overview
The backend system for TaxFront, a tax assistant built using a Retrieval-Augmented Generation (RAG) pipeline. It provides tax-related information processing, document parsing, and intelligent query handling through a combination of LangChain, Firebase, and machine learning technologies.

## Project Structure
```
backend/
├── app.py              # Main Flask application
├── parser/            # Tax document parsing utilities
├── embedding/         # Vector embeddings and models
├── faiss_index/       # FAISS vector database
├── prompts/          # LLM prompt templates
├── src/              # Core source code
├── test/             # Unit and integration tests
└── docs/             # Documentation
```

## Installation

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file with the following:
```
FIREBASE_CREDENTIALS_PATH=path/to/credentials.json
OPENAI_API_KEY=your_api_key
```

## Key Components

### Parser Module
- Handles tax document parsing and data extraction
- Supports various document formats (PDF, images via OCR)
- Located in `parser/` directory

### Embedding System
- Manages document vectorization and semantic search
- Uses FAISS for efficient vector storage and retrieval
- Located in `embedding/` directory

### Firebase Integration
- Handles data persistence and user authentication
- Manages real-time updates and data synchronization
- Configuration in `.firebaserc` and `firebase.json`

## Dependencies
- LangChain ecosystem (langchain, langchain-openai, langchain-ollama)
- Firebase Admin SDK
- FAISS for vector search
- Flask for API endpoints
- PyPDF2 and Tesseract for document processing
- Pandas for data manipulation

## Testing
Run tests using pytest:
```bash
pytest
```

For coverage report:
```bash
coverage run -m pytest
coverage report
```

## Contributing
Please refer to CONTRIBUTING.md for guidelines on contributing to this project.

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxRAG.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxRAG?ref=badge_large)
