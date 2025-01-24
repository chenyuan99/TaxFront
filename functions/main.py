from firebase_functions import https_fn, firestore_fn
from firebase_admin import initialize_app, firestore, auth
import json
from datetime import datetime
from functools import lru_cache
from google.cloud.firestore import Query

# Initialize Firebase lazily
_db = None
_auth = None

def get_db():
    global _db
    if _db is None:
        initialize_app()
        _db = firestore.client()
    return _db

@lru_cache(maxsize=1000)
def verify_token(token: str) -> dict:
    """Cache token verification results"""
    global _auth
    if _auth is None:
        _auth = auth
    return _auth.verify_id_token(token)

def get_user_documents_query(uid: str) -> Query:
    """Get optimized query for user documents"""
    return (get_db()
            .collection('taxDocuments')
            .where('userId', '==', uid)
            .order_by('uploadDate', direction=firestore.Query.DESCENDING)
            .limit(100))  # Limit to recent documents

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
        try:
            decoded_token = verify_token(id_token)
            uid = decoded_token['uid']
        except Exception as e:
            return https_fn.Response('Invalid token', status=401)
        
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
        try:
            decoded_token = verify_token(id_token)
            uid = decoded_token['uid']
        except Exception as e:
            return https_fn.Response('Invalid token', status=401)
        
        # Use optimized query
        docs = get_user_documents_query(uid).stream()
        
        # Format response
        documents = [{
            'id': doc.id,
            **doc.to_dict()
        } for doc in docs]
            
        return https_fn.Response(
            json.dumps({'documents': documents}),
            headers={'Cache-Control': 'public, max-age=300'},  # Cache for 5 minutes
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
        
        # Update document
        document.reference.update(metadata)
        
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
        try:
            decoded_token = verify_token(id_token)
            uid = decoded_token['uid']
        except Exception as e:
            return https_fn.Response('Invalid token', status=401)
        
        # Use optimized query
        docs = get_user_documents_query(uid).stream()
        
        # Calculate summary
        total_documents = 0
        document_types = {}
        latest_update = None
        
        for doc in docs:
            data = doc.to_dict()
            total_documents += 1
            
            doc_type = data.get('type', 'unknown')
            document_types[doc_type] = document_types.get(doc_type, 0) + 1
            
            upload_date = data.get('uploadDate')
            if upload_date and (not latest_update or upload_date > latest_update):
                latest_update = upload_date
        
        summary = {
            'totalDocuments': total_documents,
            'documentTypes': document_types,
            'lastUpdated': latest_update
        }
        
        return https_fn.Response(
            json.dumps(summary),
            headers={'Cache-Control': 'public, max-age=300'},  # Cache for 5 minutes
            content_type='application/json'
        )
    except Exception as e:
        return https_fn.Response(f'Error: {str(e)}', status=500)