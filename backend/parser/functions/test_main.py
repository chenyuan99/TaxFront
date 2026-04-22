import pytest
from firebase_functions import https_fn
from unittest.mock import Mock, patch
import json
import sys
import os

# Import main (Firebase is mocked via conftest.py)
from main import create_user_profile, get_tax_documents, get_tax_summary

@pytest.fixture
def mock_request():
    request = Mock(spec=https_fn.Request)
    request.headers = {
        'Authorization': 'Bearer fake_token',
        'Origin': 'http://localhost:5173'
    }
    return request

def test_create_user_profile(mock_request):
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
    assert 'Profile updated successfully' in response.data.decode()

def test_get_tax_documents(mock_request):
    # Mock data
    mock_request.method = 'GET'
    mock_docs = [
        Mock(to_dict=lambda: {'type': 'W2', 'year': '2024'}, id='doc1'),
        Mock(to_dict=lambda: {'type': '1099', 'year': '2024'}, id='doc2')
    ]

    # Execute
    response = get_tax_documents(mock_request)

    # Assert
    assert response.status_code == 200
    response_data = json.loads(response.data.decode())
    assert 'documents' in response_data

def test_get_tax_summary(mock_request):
    # Mock data
    mock_request.method = 'GET'
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

    # Execute
    response = get_tax_summary(mock_request)

    # Assert
    assert response.status_code == 200
    response_data = json.loads(response.data.decode())
    assert 'totalDocuments' in response_data
    assert 'documentTypes' in response_data
