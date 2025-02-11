import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.vector import Vector

# Create a Firestore client
db = firestore.client()

# Reference the 'users' collection
collectionRef = db.collection(u'users')

# Define a sample document with vector embedding
doc = {
    "name": "Your Document Name",  # Document name
    "description": "Some description about the document",  # Document description
    "embedding_field": Vector([0.18332680, 0.24160706, 0.3416704])  # Vector embedding field
}

# Initialize the Firebase app using a service account key
cred = credentials.Certificate("path/to/your/service-account-key.json")
firebase_admin.initialize_app(cred)

# Add a document to Firestore
doc_ref = db.collection(u'users').document(u'alovelace')
doc_ref.set({
  u'first': u'Ada',  # First name
  u'last': u'Lovelace',  # Last name
  u'born': 1815  # Birth year
})

# Retrieve and read the document from Firestore
doc = doc_ref.get()
if doc.exists:
  print(f'Document data: {doc.to_dict()}')  # Print document data if it exists
else:
  print(u'No such document!')  # Print message if document does not exist