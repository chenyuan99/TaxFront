"""
Tests for document_tools.py — Firestore-backed document retrieval.

Firestore is mocked so these tests run without Firebase credentials.
We verify that the tools correctly query the right collection, apply filters,
and handle missing/empty results gracefully.
"""

import json
import sys
import os
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from agents.tools.document_tools import create_document_tools


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def make_firestore_doc(doc_id: str, data: dict):
    """Create a mock Firestore DocumentSnapshot."""
    doc = MagicMock()
    doc.id = doc_id
    doc.exists = True
    doc.to_dict.return_value = data
    return doc


@pytest.fixture
def mock_db():
    """Mock Firestore client with a pre-populated taxDocuments collection."""
    db = MagicMock()

    sample_docs = [
        make_firestore_doc("doc_w2_2024", {
            "userId": "user_123",
            "name": "W2_2024.pdf",
            "type": "W-2",
            "taxYear": 2024,
            "status": "processed",
            "uploadDate": "2025-02-01",
            "url": "gs://bucket/user_123/W2_2024.pdf",
            "extractedData": {
                "wages": 75_000,
                "federal_tax_withheld": 12_000,
                "state_tax_withheld": 4_500,
                "social_security_tax_withheld": 4_650,
                "medicare_tax_withheld": 1_087.50,
                "employer_ein": "12-3456789",
            },
        }),
        make_firestore_doc("doc_1099_2024", {
            "userId": "user_123",
            "name": "1099NEC_2024.pdf",
            "type": "1099-NEC",
            "taxYear": 2024,
            "status": "processed",
            "uploadDate": "2025-02-10",
            "url": "gs://bucket/user_123/1099NEC.pdf",
            "extractedData": {
                "nonemployee_compensation": 15_000,
                "payer_ein": "98-7654321",
            },
        }),
        make_firestore_doc("doc_w2_2023", {
            "userId": "user_123",
            "name": "W2_2023.pdf",
            "type": "W-2",
            "taxYear": 2023,
            "status": "processed",
            "uploadDate": "2024-02-01",
            "extractedData": {"wages": 70_000},
        }),
    ]

    # .collection().where().stream() returns sample docs
    mock_collection = MagicMock()
    mock_where = MagicMock()
    mock_where.stream.return_value = iter(sample_docs)
    mock_collection.where.return_value = mock_where
    db.collection.return_value = mock_collection

    # .collection().document().get() returns single doc by ID
    def document_side_effect(doc_id):
        doc_mock = MagicMock()
        match = next((d for d in sample_docs if d.id == doc_id), None)
        if match:
            doc_mock.exists = True
            doc_mock.to_dict.return_value = match.to_dict()
        else:
            doc_mock.exists = False
        doc_mock.get.return_value = doc_mock
        return doc_mock

    mock_collection.document.side_effect = document_side_effect
    return db


@pytest.fixture
def tools(mock_db):
    return create_document_tools(mock_db)


def get_tool(tools, name):
    return next(t for t in tools if t.name == name)


# ---------------------------------------------------------------------------
# fetch_user_documents
# ---------------------------------------------------------------------------

class TestFetchUserDocuments:

    def test_returns_documents_for_user(self, tools, mock_db):
        tool = get_tool(tools, "fetch_user_documents")
        raw = tool.invoke({"user_id": "user_123"})
        result = json.loads(raw)

        assert result["status"] == "ok"
        assert result["count"] == 3
        assert len(result["documents"]) == 3

    def test_queries_correct_collection(self, tools, mock_db):
        tool = get_tool(tools, "fetch_user_documents")
        tool.invoke({"user_id": "user_123"})

        mock_db.collection.assert_called_with("taxDocuments")
        mock_db.collection.return_value.where.assert_called_with("userId", "==", "user_123")

    def test_storage_url_stripped_from_response(self, tools):
        tool = get_tool(tools, "fetch_user_documents")
        raw = tool.invoke({"user_id": "user_123"})
        result = json.loads(raw)

        for doc in result["documents"]:
            assert "url" not in doc

    def test_tax_year_filter_applied(self, tools):
        tool = get_tool(tools, "fetch_user_documents")
        raw = tool.invoke({"user_id": "user_123", "tax_year": 2024})
        result = json.loads(raw)

        assert result["status"] == "ok"
        # Only 2024 docs (doc_w2_2024 and doc_1099_2024) should pass the filter
        assert result["count"] == 2
        for doc in result["documents"]:
            assert doc["taxYear"] == 2024

    def test_no_documents_returns_graceful_response(self, mock_db):
        # Return empty stream
        mock_db.collection.return_value.where.return_value.stream.return_value = iter([])
        tools = create_document_tools(mock_db)
        tool = get_tool(tools, "fetch_user_documents")
        raw = tool.invoke({"user_id": "unknown_user"})
        result = json.loads(raw)

        assert result["status"] == "no_documents"
        assert result["documents"] == []

    def test_firestore_error_returns_error_status(self, mock_db):
        mock_db.collection.return_value.where.return_value.stream.side_effect = Exception("Firestore unavailable")
        tools = create_document_tools(mock_db)
        tool = get_tool(tools, "fetch_user_documents")
        raw = tool.invoke({"user_id": "user_123"})
        result = json.loads(raw)

        assert result["status"] == "error"
        assert "Firestore unavailable" in result["message"]


# ---------------------------------------------------------------------------
# fetch_document_details
# ---------------------------------------------------------------------------

class TestFetchDocumentDetails:

    def test_returns_full_document_data(self, tools):
        tool = get_tool(tools, "fetch_document_details")
        raw = tool.invoke({"document_id": "doc_w2_2024"})
        result = json.loads(raw)

        assert result["status"] == "ok"
        doc = result["document"]
        assert doc["id"] == "doc_w2_2024"
        assert doc["extractedData"]["wages"] == 75_000

    def test_url_stripped_from_details(self, tools):
        tool = get_tool(tools, "fetch_document_details")
        raw = tool.invoke({"document_id": "doc_w2_2024"})
        result = json.loads(raw)

        assert "url" not in result["document"]

    def test_not_found_returns_graceful_response(self, tools):
        tool = get_tool(tools, "fetch_document_details")
        raw = tool.invoke({"document_id": "nonexistent_doc"})
        result = json.loads(raw)

        assert result["status"] == "not_found"
