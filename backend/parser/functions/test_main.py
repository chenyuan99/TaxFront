import pytest
from firebase_functions import https_fn
from unittest.mock import Mock, patch, MagicMock
import json
import sys
import os
from datetime import datetime

# Import functions to test
from main import create_user_profile, get_tax_documents, get_tax_summary

@pytest.fixture(autouse=True)
def mock_firebase():
    """Mock Firebase admin initialization and services"""
    # Create mock objects
    mock_db = MagicMock()
    mock_bucket = MagicMock()
    
    # Create patches
    patches = [
        patch('firebase_admin.credentials.ApplicationDefault', return_value=MagicMock()),
        patch('firebase_admin.initialize_app'),
        patch('firebase_admin.firestore.client', return_value=mock_db),
        patch('firebase_admin.storage.bucket', return_value=mock_bucket),
        patch('firebase_admin.auth.verify_id_token', return_value={'uid': 'test_user_id', 'email': 'test@example.com'}),
        # Patch module-level variables
        patch('main.db', mock_db),
        patch('main.bucket', mock_bucket)
    ]
    
    # Start all patches
    for p in patches:
        p.start()
    
    try:
        yield mock_db, mock_bucket
    finally:
        # Stop all patches
        for p in patches:
            p.stop()

@pytest.fixture
def mock_request():
    """Create a mock HTTP request"""
    request = MagicMock(spec=https_fn.Request)
    request.headers = {
        'Authorization': 'Bearer test_token',
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
    }
    request.method = 'GET'  # Default method
    return request

def test_create_user_profile(mock_request, mock_firebase):
    """Test creating a user profile"""
    # Get the mocked services
    mock_db, _ = mock_firebase
    
    # Mock collection and document references
    mock_collection = MagicMock()
    mock_doc = MagicMock()
    mock_db.collection.return_value = mock_collection
    mock_collection.document.return_value = mock_doc
    
    # Test data
    test_data = {
        'name': 'Test User',
        'taxId': '123-45-6789',
        'businessType': 'LLC'
    }
    mock_request.method = 'POST'
    mock_request.get_json.return_value = test_data
    
    # Execute
    response = create_user_profile(mock_request)
    
    # Assert
    assert response.status_code == 200
    mock_db.collection.assert_called_once_with('users')
    mock_collection.document.assert_called_once_with('test_user_id')
    
    # Verify the data being set includes timestamp
    call_args = mock_doc.set.call_args[0][0]
    assert call_args['name'] == test_data['name']
    assert call_args['taxId'] == test_data['taxId']
    assert call_args['businessType'] == test_data['businessType']
    assert 'updatedAt' in call_args

def test_get_tax_documents(mock_request, mock_firebase):
    """Test retrieving tax documents"""
    # Get the mocked services
    mock_db, _ = mock_firebase
    
    # Mock collection and query
    mock_collection = MagicMock()
    mock_query = MagicMock()
    mock_docs = [
        Mock(to_dict=lambda: {'type': 'W2', 'year': '2024'}, id='doc1'),
        Mock(to_dict=lambda: {'type': '1099', 'year': '2024'}, id='doc2')
    ]
    mock_db.collection.return_value = mock_collection
    mock_collection.where.return_value = mock_query
    mock_query.get.return_value = mock_docs
    
    # Execute
    response = get_tax_documents(mock_request)
    
    # Assert
    assert response.status_code == 200
    response_data = json.loads(response.data.decode())
    assert 'documents' in response_data
    assert len(response_data['documents']) == 2
    
    # Verify document structure
    documents = response_data['documents']
    assert documents[0]['type'] == 'W2'
    assert documents[0]['id'] == 'doc1'
    assert documents[1]['type'] == '1099'
    assert documents[1]['id'] == 'doc2'

def test_get_tax_summary(mock_request, mock_firebase):
    """Test getting tax summary"""
    # Get the mocked services
    mock_db, _ = mock_firebase
    
    # Mock collection and query
    mock_collection = MagicMock()
    mock_query = MagicMock()
    mock_docs = [
        Mock(to_dict=lambda: {
            'type': 'W2',
            'updatedAt': '2024-01-01'
        }),
        Mock(to_dict=lambda: {
            'type': '1099',
            'updatedAt': '2024-01-02'
        })
    ]
    mock_db.collection.return_value = mock_collection
    mock_collection.where.return_value = mock_query
    mock_query.get.return_value = mock_docs
    
    # Execute
    response = get_tax_summary(mock_request)
    
    # Assert
    assert response.status_code == 200
    response_data = json.loads(response.data.decode())
    assert 'totalDocuments' in response_data
    assert 'documentTypes' in response_data
    assert response_data['totalDocuments'] == 2
    assert len(response_data['documentTypes']) == 2
    assert 'W2' in response_data['documentTypes']
    assert '1099' in response_data['documentTypes']
