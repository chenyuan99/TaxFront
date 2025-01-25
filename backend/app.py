from firebase_admin import initialize_app, db
from firebase_functions import https_fn
from flask import Flask, render_template, send_from_directory
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, make_response
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "https://taxfront.vercel.app","https://tax-front.vercel.app", "https://taxfront.io"],  # Add your frontend domains
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize Firebase
cred = credentials.Certificate("path/to/your/service-account-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

@app.after_request
def add_security_headers(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    return response

@app.route('/')
def index():
    # Access Firestore data
    users_ref = db.collection('users')
    docs = users_ref.stream()

    for doc in docs:
        print(f'{doc.id} => {doc.to_dict()}')

    return "Firestore connected successfully!"

initialize_app()

@app.route('/sample/<filename>')
def get_json(filename):
    print(f"Requesting {filename}")
    return send_from_directory('sample', filename)

@https_fn.on_request()
def httpsflaskexample(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()

if __name__ == '__main__':
    import os
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    app.run(debug=debug_mode)
