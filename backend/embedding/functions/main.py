import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.vector import Vector

# Create a Firestore client
db = firestore.client()

collectionRef = db.collection(u'users')

doc = {
    "name": "Your Document Name",
    "description": "Some description about the document",
    "embedding_field": Vector([0.18332680, 0.24160706, 0.3416704])
}

# Initialize the Firebase app
cred = credentials.Certificate("path/to/your/service-account-key.json")
firebase_admin.initialize_app(cred)


# Add data to Firestore
doc_ref = db.collection(u'users').document(u'alovelace')
doc_ref.set({
  u'first': u'Ada',
  u'last': u'Lovelace',
  u'born': 1815
})

# Read data from Firestore
doc = doc_ref.get()
if doc.exists:
  print(f'Document data: {doc.to_dict()}')
else:
  print(u'No such document!')
