from firebase_functions import https_fn, firestore_fn
from firebase_admin import initialize_app, firestore, auth
import json
from datetime import datetime

# Initialize Firebase lazily
_db = None

def get_db():
    global _db
    if _db is None:
        initialize_app()
        _db = firestore.client()
    return _db

@https_fn.on_request()
def create_user_profile(req: https_fn.Request) -> https_fn.Response:
    """Create or update a user profile with tax-related information"""
    try:
        # Verify Firebase ID token
        if req.method != 'POST':
            return https_fn.Response('Method not allowed', status=405)
            
        auth_header = req.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return https_fn.Response('Unauthorized', status=401)
        
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        # Get request data
        data = req.get_json()
        
        # Required fields
        required_fields = ['name', 'taxId', 'businessType']
        if not all(field in data for field in required_fields):
            return https_fn.Response('Missing required fields', status=400)
            
        # Add timestamp
        data['updatedAt'] = datetime.now().isoformat()
        
        # Store in Firestore
        get_db().collection('users').document(uid).set(data, merge=True)
        
        return https_fn.Response('Profile updated successfully')
    except Exception as e:
        return https_fn.Response(f'Error: {str(e)}', status=500)

@https_fn.on_request()
def get_tax_documents(req: https_fn.Request) -> https_fn.Response:
    """Retrieve user's tax documents"""
    try:
        if req.method != 'GET':
            return https_fn.Response('Method not allowed', status=405)
            
        # Verify authentication
        auth_header = req.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return https_fn.Response('Unauthorized', status=401)
            
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        # Query documents
        docs = get_db().collection('taxDocuments').where('userId', '==', uid).stream()
        
        # Format response
        documents = []
        for doc in docs:
            doc_data = doc.to_dict()
            doc_data['id'] = doc.id
            documents.append(doc_data)
            
        return https_fn.Response(
            json.dumps({'documents': documents}),
            content_type='application/json'
        )
    except Exception as e:
        return https_fn.Response(f'Error: {str(e)}', status=500)

@firestore_fn.on_document_created(document="taxDocuments/{documentId}")
def process_new_tax_document(
    event: firestore_fn.Event[firestore_fn.DocumentSnapshot | None]
) -> None:
    """Process newly uploaded tax documents"""
    try:
        document = event.data
        if document is None:
            return
            
        # Get document data
        data = document.to_dict()
        if data is None:
            return
            
        # Add metadata
        metadata = {
            'processedAt': datetime.now().isoformat(),
            'status': 'processed'
        }
        
        # Update document with metadata
        document.reference.update(metadata)
        
        # Add to user's document count
        if 'userId' in data:
            user_ref = get_db().collection('users').document(data['userId'])
            user_ref.update({
                'documentCount': firestore.Increment(1)
            })
            
    except Exception as e:
        print(f"Error processing document: {str(e)}")

@https_fn.on_request()
def get_tax_summary(req: https_fn.Request) -> https_fn.Response:
    """Generate a summary of user's tax situation"""
    try:
        if req.method != 'GET':
            return https_fn.Response('Method not allowed', status=405)
            
        # Verify authentication
        auth_header = req.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return https_fn.Response('Unauthorized', status=401)
            
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        # Get user's documents
        docs = get_db().collection('taxDocuments').where('userId', '==', uid).stream()
        
        # Calculate summary
        summary = {
            'totalDocuments': 0,
            'lastUpdated': None,
            'documentTypes': {}
        }
        
        for doc in docs:
            data = doc.to_dict()
            summary['totalDocuments'] += 1
            
            doc_type = data.get('type', 'unknown')
            summary['documentTypes'][doc_type] = summary['documentTypes'].get(doc_type, 0) + 1
            
            updated_at = data.get('updatedAt')
            if updated_at and (not summary['lastUpdated'] or updated_at > summary['lastUpdated']):
                summary['lastUpdated'] = updated_at
        
        return https_fn.Response(
            json.dumps(summary),
            content_type='application/json'
        )
    except Exception as e:
        return https_fn.Response(f'Error: {str(e)}', status=500)