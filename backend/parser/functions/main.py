import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
from firebase_functions import https_fn, firestore_fn
import json
from datetime import datetime
from functools import wraps
import tempfile
import os
from urllib.parse import urlparse

# Initialize Firebase Admin
cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred, {
    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'taxfront.appspot.com')
})
db = firestore.client()
bucket = storage.bucket()  # Get default bucket

def get_cors_headers(origin):
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '3600',
        'Access-Control-Allow-Credentials': 'true',
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'require-corp'
    }

def cors_enabled(func):
    @wraps(func)
    def wrapper(req: https_fn.Request) -> https_fn.Response:
        origin = req.headers.get('Origin', '')
        allowed_origins = [
            'https://tax-front.vercel.app',
            'https://taxfront-1e142.web.app',
            'https://taxfront-1e142.firebaseapp.com',
            'http://localhost:5173',
            'http://localhost:3000'
        ]
        
        if origin not in allowed_origins and not origin.endswith('.vercel.app'):
            return https_fn.Response(
                json.dumps({"error": "Origin not allowed"}),
                status=403,
                headers={"Content-Type": "application/json"}
            )

        if req.method == 'OPTIONS':
            return https_fn.Response(
                '',
                status=204,
                headers=get_cors_headers(origin)
            )

        try:
            response = func(req)
            
            if isinstance(response, https_fn.Response):
                for key, value in get_cors_headers(origin).items():
                    response.headers[key] = value
                return response
                
            return https_fn.Response(
                json.dumps(response),
                status=200,
                headers={
                    "Content-Type": "application/json",
                    **get_cors_headers(origin)
                }
            )
        except Exception as e:
            return https_fn.Response(
                json.dumps({"error": str(e)}),
                status=500,
                headers={
                    "Content-Type": "application/json",
                    **get_cors_headers(origin)
                }
            )
    
    return wrapper

def verify_auth_token(req: https_fn.Request):
    if 'Authorization' not in req.headers:
        raise ValueError('No authorization token provided')
    
    token = req.headers['Authorization'].split('Bearer ')[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise ValueError(f'Invalid authorization token: {str(e)}')

@https_fn.on_request()
@cors_enabled
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
        db.collection('users').document(uid).set(data, merge=True)
        
        return https_fn.Response('Profile updated successfully')
    except Exception as e:
        return https_fn.Response(f'Error: {str(e)}', status=500)

@https_fn.on_request()
@cors_enabled
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
        docs = db.collection('taxDocuments').where('userId', '==', uid).stream()
        
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
            print("No document data received")
            return
            
        # Get document data
        data = document.to_dict()
        if data is None:
            print("Document data is empty")
            return

        # Validate required fields
        required_fields = ['userId', 'url', 'name', 'type']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print(f"Missing required fields: {missing_fields}")
            document.reference.update({
                'status': 'error',
                'error': f'Missing required fields: {missing_fields}',
                'processedAt': datetime.now().isoformat()
            })
            return

        try:
            # Parse URL to get blob path
            url = data['url']
            if not url.startswith('gs://'):
                # Convert HTTP URL to GCS path
                parsed_url = urlparse(url)
                path = parsed_url.path.lstrip('/')  # Remove leading slash
                # Skip the first part which is the bucket name
                blob_path = '/'.join(path.split('/')[1:])
            else:
                # Already a GCS path
                blob_path = url.split('/', 3)[3]  # Skip gs://bucket/
                
            # Get blob from default bucket
            blob = bucket.blob(blob_path)
            
            # Create a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(data['name'])[1]) as temp_file:
                blob.download_to_filename(temp_file.name)
                
                # Process the document based on type
                metadata = {}
                if data['type'] == 'application/pdf':
                    from .parser import TaxDocumentParser
                    parser = TaxDocumentParser(temp_file.name)
                    extracted_text = parser.extract_text()
                    if extracted_text:
                        parsed_data = parser.parse_data()
                        metadata.update(parsed_data)
                        
                # Clean up temp file
                os.unlink(temp_file.name)
                
            # Update document with metadata and status
            update_data = {
                'processedAt': datetime.now().isoformat(),
                'status': 'processed',
                'metadata': metadata,
                'processingDetails': {
                    'success': True,
                    'timestamp': datetime.now().isoformat(),
                    'documentVersion': '1.0'
                }
            }
            
            # Add extracted metadata if available
            if metadata:
                update_data['extractedData'] = metadata
                
            document.reference.update(update_data)
            
            # Update user's document summary
            user_ref = db.collection('users').document(data['userId'])
            user_ref.set({
                'documentCount': firestore.Increment(1),
                'lastUploadAt': datetime.now().isoformat(),
                'documentTypes': {
                    data['type']: firestore.Increment(1)
                }
            }, merge=True)
            
        except Exception as process_error:
            print(f"Error processing document content: {str(process_error)}")
            document.reference.update({
                'status': 'error',
                'error': str(process_error),
                'processedAt': datetime.now().isoformat()
            })
            
    except Exception as e:
        print(f"Error in process_new_tax_document: {str(e)}")
        if document and document.reference:
            try:
                document.reference.update({
                    'status': 'error',
                    'error': str(e),
                    'processedAt': datetime.now().isoformat()
                })
            except Exception as update_error:
                print(f"Error updating document with error status: {str(update_error)}")

@https_fn.on_request()
@cors_enabled
def get_tax_summary(req: https_fn.Request) -> https_fn.Response:
    """Generate a summary of user's tax situation"""
    try:
        if req.method != 'GET':
            return https_fn.Response('Method not allowed', status=405)
            
        # Verify authentication
        decoded_token = verify_auth_token(req)
        uid = decoded_token['uid']
        
        # Get user's profile and documents
        user_ref = db.collection('users').document(uid)
        user_data = user_ref.get().to_dict() or {}
        
        docs_query = (db.collection('taxDocuments')
                     .where('userId', '==', uid)
                     .order_by('uploadDate', direction=firestore.Query.DESCENDING)
                     .limit(100))
        docs = docs_query.stream()
        
        # Calculate summary
        summary = {
            'totalDocuments': user_data.get('documentCount', 0),
            'lastUpdated': user_data.get('lastUploadAt'),
            'documentTypes': user_data.get('documentTypes', {}),
            'processingStatus': {
                'processed': 0,
                'pending': 0,
                'error': 0
            },
            'recentDocuments': []
        }
        
        # Process recent documents
        for doc in docs:
            data = doc.to_dict()
            
            # Update processing status count
            status = data.get('status', 'pending')
            summary['processingStatus'][status] = summary['processingStatus'].get(status, 0) + 1
            
            # Add to recent documents if processed successfully
            if status == 'processed' and len(summary['recentDocuments']) < 5:
                summary['recentDocuments'].append({
                    'id': doc.id,
                    'name': data.get('name'),
                    'type': data.get('type'),
                    'uploadDate': data.get('uploadDate'),
                    'metadata': data.get('metadata', {})
                })
        
        return https_fn.Response(
            json.dumps(summary),
            headers={'Cache-Control': 'public, max-age=300'},  # Cache for 5 minutes
            content_type='application/json'
        )
    except Exception as e:
        print(f"Error in get_tax_summary: {str(e)}")
        return https_fn.Response(
            json.dumps({"error": str(e)}),
            status=500,
            content_type='application/json'
        )

@https_fn.on_request()
@cors_enabled
def process_document(req: https_fn.Request) -> https_fn.Response:
    """Process a specific document manually"""
    try:
        if req.method != 'POST':
            return https_fn.Response('Method not allowed', status=405)
            
        # Verify authentication
        decoded_token = verify_auth_token(req)
        uid = decoded_token['uid']
        
        # Get document ID from request
        data = req.get_json()
        if not data or 'documentId' not in data:
            return https_fn.Response(
                json.dumps({"error": "Missing documentId"}),
                status=400,
                content_type='application/json'
            )
            
        document_id = data['documentId']
        
        # Get document reference
        doc_ref = db.collection('taxDocuments').document(document_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return https_fn.Response(
                json.dumps({"error": "Document not found"}),
                status=404,
                content_type='application/json'
            )
            
        doc_data = doc.to_dict()
        
        # Verify document belongs to user
        if doc_data.get('userId') != uid:
            return https_fn.Response(
                json.dumps({"error": "Unauthorized"}),
                status=403,
                content_type='application/json'
            )
            
        # Process document
        try:
            # Parse URL to get blob path
            url = doc_data['url']
            if not url.startswith('gs://'):
                # Convert HTTP URL to GCS path
                parsed_url = urlparse(url)
                path = parsed_url.path.lstrip('/')  # Remove leading slash
                # Skip the first part which is the bucket name
                blob_path = '/'.join(path.split('/')[1:])
            else:
                # Already a GCS path
                blob_path = url.split('/', 3)[3]  # Skip gs://bucket/
                
            # Get blob from default bucket
            blob = bucket.blob(blob_path)
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(doc_data['name'])[1]) as temp_file:
                blob.download_to_filename(temp_file.name)
                
                # Process based on file type
                metadata = {}
                if doc_data['type'] == 'application/pdf':
                    from .parser import TaxDocumentParser
                    parser = TaxDocumentParser(temp_file.name)
                    extracted_text = parser.extract_text()
                    if extracted_text:
                        parsed_data = parser.parse_data()
                        metadata.update(parsed_data)
                        
                # Clean up
                os.unlink(temp_file.name)
                
            # Update document
            update_data = {
                'status': 'processed',
                'metadata': metadata,
                'processedAt': datetime.now().isoformat(),
                'processingDetails': {
                    'success': True,
                    'timestamp': datetime.now().isoformat(),
                    'documentVersion': '1.0'
                }
            }
            
            doc_ref.update(update_data)
            
            return https_fn.Response(
                json.dumps({
                    "success": True,
                    "documentId": document_id,
                    "metadata": metadata
                }),
                content_type='application/json'
            )
            
        except Exception as e:
            error_message = str(e)
            doc_ref.update({
                'status': 'error',
                'error': error_message,
                'processedAt': datetime.now().isoformat()
            })
            
            return https_fn.Response(
                json.dumps({
                    "success": False,
                    "documentId": document_id,
                    "error": error_message
                }),
                status=500,
                content_type='application/json'
            )
            
    except Exception as e:
        return https_fn.Response(
            json.dumps({"error": str(e)}),
            status=500,
            content_type='application/json'
        )

@https_fn.on_request()
@cors_enabled
def get_document_status(req: https_fn.Request) -> https_fn.Response:
    """Get the current status and metadata of a document"""
    try:
        if req.method != 'GET':
            return https_fn.Response('Method not allowed', status=405)
            
        # Verify authentication
        decoded_token = verify_auth_token(req)
        uid = decoded_token['uid']
        
        # Get document ID from query params
        document_id = req.args.get('documentId')
        if not document_id:
            return https_fn.Response(
                json.dumps({"error": "Missing documentId"}),
                status=400,
                content_type='application/json'
            )
            
        # Get document
        doc_ref = db.collection('taxDocuments').document(document_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return https_fn.Response(
                json.dumps({"error": "Document not found"}),
                status=404,
                content_type='application/json'
            )
            
        doc_data = doc.to_dict()
        
        # Verify document belongs to user
        if doc_data.get('userId') != uid:
            return https_fn.Response(
                json.dumps({"error": "Unauthorized"}),
                status=403,
                content_type='application/json'
            )
            
        # Return status and metadata
        return https_fn.Response(
            json.dumps({
                "status": doc_data.get('status', 'pending'),
                "metadata": doc_data.get('metadata'),
                "error": doc_data.get('error')
            }),
            headers={'Cache-Control': 'public, max-age=60'},  # Cache for 1 minute
            content_type='application/json'
        )
        
    except Exception as e:
        return https_fn.Response(
            json.dumps({"error": str(e)}),
            status=500,
            content_type='application/json'
        )