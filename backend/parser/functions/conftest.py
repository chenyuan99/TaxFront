import pytest
from unittest.mock import Mock, MagicMock


@pytest.fixture(autouse=True)
def mock_firebase_clients(monkeypatch):
    """Mock Firebase clients"""
    # Create a chained mock for database collections
    mock_db = MagicMock()
    mock_bucket = MagicMock()

    # Setup mock_db to handle collection chains
    mock_collection = MagicMock()
    mock_document = MagicMock()
    mock_doc_snapshot = MagicMock()

    # Configure the chain: db.collection(...).document(...).get()...
    mock_doc_snapshot.to_dict.return_value = {
        'documentCount': 0,
        'lastUploadAt': None,
        'documentTypes': {},
    }
    mock_document.get.return_value = mock_doc_snapshot
    mock_collection.document.return_value = mock_document
    mock_collection.where.return_value = mock_collection
    mock_collection.order_by.return_value = mock_collection
    mock_collection.limit.return_value = mock_collection
    mock_collection.stream.return_value = []

    mock_db.collection.return_value = mock_collection

    # Mock the get_db and get_bucket functions
    monkeypatch.setattr('main.get_db', lambda: mock_db)
    monkeypatch.setattr('main.get_bucket', lambda: mock_bucket)
    monkeypatch.setattr('main.auth.verify_id_token', Mock(return_value={
        'uid': 'test_user_id',
        'email': 'test@example.com'
    }))

    yield {
        'db': mock_db,
        'bucket': mock_bucket,
        'collection': mock_collection,
        'document': mock_document,
    }
