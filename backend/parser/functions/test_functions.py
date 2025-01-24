import firebase_admin
from firebase_admin import auth, credentials
import requests
import json
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Initialize Firebase Admin with service account
cred = credentials.Certificate('firebase-adminsdk.json')
app = firebase_admin.initialize_app(cred, {
    'projectId': 'taxfront-1e142',
})

def test_functions():
    # Create a test user
    try:
        user = auth.create_user(
            email='test@example.com',
            password='testpassword123'
        )
        print(f"Created test user: {user.uid}")
    except Exception as e:
        print(f"Error creating user: {e}")
        return

    # Create a custom token and exchange it for an ID token
    custom_token = auth.create_custom_token(user.uid).decode('utf-8')
    print(f"Created custom token: {custom_token}")

    # Get an ID token using the custom token
    auth_url = f"https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=AIzaSyB6gJ0vRwC0QBvuCjU5Fb0AFQmIpruPpRk"
    response = requests.post(auth_url, json={
        'token': custom_token,
        'returnSecureToken': True
    })
    
    if not response.ok:
        print(f"Error getting ID token: {response.text}")
        return

    id_token = response.json()['idToken']
    print(f"Got ID token")

    # Test create_user_profile
    profile_data = {
        'name': 'Test User',
        'taxId': '123-45-6789',
        'businessType': 'Individual'
    }

    headers = {
        'Authorization': f'Bearer {id_token}',
        'Content-Type': 'application/json'
    }

    # Test endpoints
    endpoints = [
        ('create_user_profile', 'POST', profile_data),
        ('get_tax_documents', 'GET', None),
        ('get_tax_summary', 'GET', None)
    ]

    base_url = 'https://{}-yzkwo2eyeq-uc.a.run.app'

    for endpoint, method, data in endpoints:
        url = base_url.format(endpoint.replace('_', '-'))
        print(f"\nTesting {endpoint}...")
        
        try:
            if method == 'POST':
                response = requests.post(url, headers=headers, json=data)
            else:
                response = requests.get(url, headers=headers)
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

    # Clean up - delete test user
    try:
        auth.delete_user(user.uid)
        print("\nDeleted test user")
    except Exception as e:
        print(f"\nError deleting user: {e}")

if __name__ == '__main__':
    test_functions()
