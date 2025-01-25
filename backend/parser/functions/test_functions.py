import pytest
from unittest.mock import Mock, patch
import firebase_admin
from firebase_admin import auth, credentials
from firebase_functions import https_fn

@pytest.fixture(autouse=True)
def mock_firebase():
    with patch('firebase_admin.initialize_app') as mock_init:
        with patch('firebase_admin.auth') as mock_auth:
            with patch('firebase_admin.credentials.Certificate') as mock_cred:
                mock_auth.create_user.return_value = Mock(uid='test_user_id')
                mock_auth.create_custom_token.return_value = b'mock_custom_token'
                yield mock_init, mock_auth, mock_cred

def test_user_creation(mock_firebase):
    _, mock_auth, _ = mock_firebase
    
    # Test user creation
    user = mock_auth.create_user(
        email='test@example.com',
        password='testpassword123'
    )
    assert user.uid == 'test_user_id'
    mock_auth.create_user.assert_called_once_with(
        email='test@example.com',
        password='testpassword123'
    )

def test_token_creation(mock_firebase):
    _, mock_auth, _ = mock_firebase
    
    # Test custom token creation
    custom_token = mock_auth.create_custom_token('test_user_id')
    assert custom_token == b'mock_custom_token'
    mock_auth.create_custom_token.assert_called_once_with('test_user_id')

def test_user_verification(mock_firebase):
    _, mock_auth, _ = mock_firebase
    
    # Mock the verify_id_token function
    mock_auth.verify_id_token.return_value = {
        'uid': 'test_user_id',
        'email': 'test@example.com'
    }
    
    # Test token verification
    decoded_token = mock_auth.verify_id_token('mock_id_token')
    assert decoded_token['uid'] == 'test_user_id'
    assert decoded_token['email'] == 'test@example.com'
    mock_auth.verify_id_token.assert_called_once_with('mock_id_token')

if __name__ == '__main__':
    pytest.main([__file__])
