from firebase_admin import initialize_app, db
from firebase_functions import https_fn
from flask import Flask, render_template, send_from_directory
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask

app = Flask(__name__)

# Initialize Firebase
cred = credentials.Certificate("path/to/your/service-account-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

@app.route('/')
def index():
    # Access Firestore data
    users_ref = db.collection('users')
    docs = users_ref.stream()

    for doc in docs:
        print(f'{doc.id} => {doc.to_dict()}')

    return "Firestore connected successfully!"

initialize_app()
# app = Flask(__name__)

# @app.route("/")
# def hello_world():
#     return render_template('index.html')



# Expose Flask app as a single Cloud Function:
@app.route('/sample/<filename>')
def get_json(filename):
    print(f"Requesting {filename}")
    return send_from_directory('sample', filename)


@https_fn.on_request()
def httpsflaskexample(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()

if __name__ == '__main__':
    app.run(debug=True)
