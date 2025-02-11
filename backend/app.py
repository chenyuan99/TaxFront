# Import necessary modules from firebase_admin and firebase_functions.
from firebase_admin import initialize_app, db  # 'db' is imported but not used in this snippet
from firebase_functions import https_fn  # Import HTTPS function decorator for Firebase Functions
from flask import Flask, render_template, send_from_directory  # Import Flask utilities for creating web routes
import firebase_admin  # Import firebase_admin for initializing Firebase app
from firebase_admin import credentials, firestore  # Import credentials for Firebase and Firestore client
from flask import Flask, make_response  # (Redundant) Import Flask and make_response for custom responses
from flask_cors import CORS  # Import CORS to handle Cross-Origin Resource Sharing

# Create a Flask application instance
app = Flask(__name__)

# Configure CORS settings for the Flask app.
# This enables cross-origin requests from specified frontend domains.
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000", 
            "https://taxfront.vercel.app",
            "https://tax-front.vercel.app", 
            "https://taxfront.io"
        ],  # Add your frontend domains here
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize Firebase with service account credentials.
# Replace "path/to/your/service-account-key.json" with the actual path.
cred = credentials.Certificate("path/to/your/service-account-key.json")
firebase_admin.initialize_app(cred)
# Get the Firestore client to interact with the Firestore database.
db = firestore.client()

# After every request, add additional security headers to the response.
@app.after_request
def add_security_headers(response):
    # 'Cross-Origin-Opener-Policy' helps mitigate side-channel attacks.
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    # 'Cross-Origin-Embedder-Policy' ensures that resources are only loaded from the same origin.
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    return response

# Define a route for the root URL.
@app.route('/')
def index():
    # Access Firestore 'users' collection and stream all documents.
    users_ref = db.collection('users')
    docs = users_ref.stream()

    # Print each document's ID and its data to the console.
    for doc in docs:
        print(f'{doc.id} => {doc.to_dict()}')

    # Return a simple confirmation message.
    return "Firestore connected successfully!"

# Call initialize_app() again. Note: This appears redundant since Firebase is already initialized above.
initialize_app()

# Define a route to serve static JSON files from the 'sample' directory.
@app.route('/sample/<filename>')
def get_json(filename):
    # Log the requested filename to the console.
    print(f"Requesting {filename}")
    # Serve the requested file from the 'sample' directory.
    return send_from_directory('sample', filename)

# Define an HTTPS Firebase Function.
@https_fn.on_request()
def httpsflaskexample(req: https_fn.Request) -> https_fn.Response:
    # Create a Flask request context from the Firebase function's environment.
    with app.request_context(req.environ):
        # Dispatch the request using Flask's full dispatch mechanism.
        return app.full_dispatch_request()

# If this script is run directly, start the Flask development server.
if __name__ == '__main__':
    import os
    # Determine if debug mode should be enabled based on the FLASK_DEBUG environment variable.
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    app.run(debug=debug_mode)
