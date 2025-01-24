import jsonschema
from jsonschema import validate

schema = {
    "type": "object",
    "properties": {
        "document_id": {"type": "string"},
        "title": {"type": "string"},
        "author": {"type": "string"},
        "date_created": {"type": "string", "format": "date-time"},
        "date_modified": {"type": "string", "format": "date-time"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "version": {"type": "string"},
        "language": {"type": "string"},
        "summary": {"type": "string"},
        "keywords": {"type": "array", "items": {"type": "string"}},
        "source": {"type": "string"},
        "related_documents": {"type": "array", "items": {"type": "string"}},
        "status": {"type": "string"},
        "access_level": {"type": "string"},
        "category": {"type": "string"},
        "content_type": {"type": "string"},
        "checksum": {"type": "string"}
    },
    "required": ["document_id", "title", "author", "date_created", "date_modified"]
}

def test_metadata_schema():
    document = {
        "document_id": "12345",
        "title": "Tax Document",
        "author": "John Doe",
        "date_created": "2023-10-01T12:00:00Z",
        "date_modified": "2023-10-01T12:00:00Z",
        "tags": ["tax", "document"],
        "version": "1.0",
        "language": "en",
        "summary": "This is a tax document.",
        "keywords": ["tax", "finance"],
        "source": "http://example.com",
        "related_documents": ["67890"],
        "status": "final",
        "access_level": "public",
        "category": "tax form",
        "content_type": "text",
        "checksum": "abc123"
    }

    validate(instance=document, schema=schema)