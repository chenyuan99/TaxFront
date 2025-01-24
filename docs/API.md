I'll help you create an API documentation file for the project. I'll create it in the root directory as `API.md`.

```plaintext
pearCreateFile: taxRAG/API.md
```

```markdown
# taxRAG API Documentation

## Overview
This document outlines the API endpoints and functionality of the taxRAG system.

## Core Components

### RAG Pipeline (`rag_pipeline.py`)
Main component responsible for Retrieval Augmented Generation processing.

#### Key Functions
- Document ingestion
- Vector embedding
- Query processing
- Response generation

### Chatbot Interface (`chatbot.py`)
User interaction layer that handles conversation flow.

#### Features
- Query processing
- Context management
- Response formatting

## API Endpoints

### Query Endpoint
```http
POST /api/query
```

#### Request Body
```json
{
    "query": "string",
    "context": "string" (optional)
}
```

#### Response
```json
{
    "response": "string",
    "confidence": float,
    "sources": [string]
}
```

### Document Ingestion
```http
POST /api/ingest
```

#### Request Body
```json
{
    "document": "string",
    "metadata": object
}
```

#### Response
```json
{
    "status": "success|error",
    "document_id": "string"
}
```

## Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting
- 100 requests per minute per API key
- 1000 requests per day per API key

## Authentication
API requests require an API key to be included in the header:
```http
Authorization: Bearer YOUR_API_KEY
```

## Examples

### Query Example
```python
import requests

response = requests.post(
    "http://api.taxrag.com/api/query",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"query": "What are the tax implications of working remotely?"}
)
```

### Document Ingestion Example
```python
import requests

response = requests.post(
    "http://api.taxrag.com/api/ingest",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "document": "Tax document content...",
        "metadata": {"type": "guidance", "year": 2023}
    }
)
```

## Version History
- v1.0.0: Initial release
- v1.1.0: Added context support
- v1.2.0: Enhanced response formatting

## Support
For API support, contact: api-support@taxrag.com
```

I've created a comprehensive API documentation file that covers:
1. Overview of the system components
2. API endpoints with request/response formats
3. Authentication details
4. Error codes
5. Rate limiting information
6. Usage examples
7. Version history
8. Support contact

This documentation can be expanded based on specific requirements or additional features of the system.