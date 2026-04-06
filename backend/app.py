"""
TaxFront Flask development server.

This file is for LOCAL DEVELOPMENT only. In production the app runs as
Firebase Cloud Functions (see parser/functions/main.py).

Firebase credentials are resolved in this order:
  1. GOOGLE_APPLICATION_CREDENTIALS env var → path to service account JSON
  2. Application Default Credentials (gcloud auth application-default login)
  3. No credentials → server starts in limited mode (Firebase routes return 503)

Set OPENAI_API_KEY in your .env file to use the AI agents.
"""

import os
import re
import logging

import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()                          # backend/.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))  # root .env

def _parse_firebase_config():
    """Extract projectId and storageBucket from the JS-object FIREBASE_CONFIG env var."""
    raw = os.getenv("FIREBASE_CONFIG", "")
    project_id = re.search(r'projectId:\s*["\']([^"\']+)', raw)
    bucket     = re.search(r'storageBucket:\s*["\']([^"\']+)', raw)
    return (
        project_id.group(1) if project_id else None,
        bucket.group(1)     if bucket     else None,
    )

_fb_project_id, _fb_bucket = _parse_firebase_config()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app = Flask(
    __name__,
    static_folder=FRONTEND_DIST,
    static_url_path="",
)

CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://taxfront.vercel.app",
            "https://tax-front.vercel.app",
            "https://taxfront.io",
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
    }
})

# ---------------------------------------------------------------------------
# Firebase init — gracefully degrade if credentials are not available
# ---------------------------------------------------------------------------

db = None
firebase_ready = False

if not firebase_admin._apps:
    try:
        sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        # Resolve relative to root dir (../) if not found next to backend/
        if sa_path and not os.path.exists(sa_path):
            root_path = os.path.join(os.path.dirname(__file__), "..", sa_path)
            if os.path.exists(root_path):
                sa_path = root_path
        if sa_path and os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            logger.info("Firebase: using service account from %s", sa_path)
        else:
            cred = credentials.ApplicationDefault()
            logger.info("Firebase: using Application Default Credentials")

        firebase_admin.initialize_app(cred, {
            "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET") or _fb_bucket or "taxfront.appspot.com",
            "projectId":     os.getenv("GOOGLE_CLOUD_PROJECT")    or _fb_project_id,
        })
        db = firestore.client()
        firebase_ready = True
        logger.info("Firebase connected successfully.")

    except Exception as e:
        logger.warning(
            "Firebase unavailable — running in limited mode.\n"
            "  Reason: %s\n"
            "  To fix: set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path\n"
            "  or run: gcloud auth application-default login", e
        )


def require_firebase(f):
    """Decorator: returns 503 if Firebase is not configured."""
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not firebase_ready:
            return jsonify({
                "error": "Firebase not configured",
                "hint": "Set GOOGLE_APPLICATION_CREDENTIALS in your .env file "
                        "or run: gcloud auth application-default login"
            }), 503
        return f(*args, **kwargs)
    return wrapper


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.after_request
def add_security_headers(response):
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response


@app.route("/")
def index():
    """Serve the frontend app, or return API info if no build exists."""
    index_html = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_html):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({
        "status": "ok",
        "service": "TaxFront backend (dev server)",
        "firebase": "connected" if firebase_ready else "not configured",
        "routes": ["/health", "/firebase-status", "/agents/auditor", "/agents/accountant"],
        "hint": "Run 'npm run build' in frontend/ to serve the UI here.",
    })


@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "firebase": firebase_ready,
        "openai": bool(os.getenv("OPENAI_API_KEY")),
    })


@app.route("/firebase-status")
@require_firebase
def firebase_status():
    """Verify Firestore is reachable by listing top-level collections."""
    collections = [c.id for c in db.collections()]
    return jsonify({"status": "ok", "collections": collections})


@app.route("/debug/users")
@require_firebase
def debug_users():
    """List sample user IDs from taxDocuments (dev only)."""
    docs = db.collection("taxDocuments").limit(10).stream()
    seen = {}
    for doc in docs:
        data = doc.to_dict() or {}
        uid = data.get("userId")
        if uid and uid not in seen:
            seen[uid] = {
                "user_id": uid,
                "sample_doc_type": data.get("type", "unknown"),
                "status": data.get("status", "unknown"),
            }
    return jsonify({"users": list(seen.values())})


@app.route("/sample/<filename>")
def get_json(filename):
    return send_from_directory("sample", filename)


# ---------------------------------------------------------------------------
# Agent routes
# ---------------------------------------------------------------------------

@app.route("/agents/auditor", methods=["POST"])
@require_firebase
def run_auditor():
    """
    Run the AuditorAgent against a user's tax documents.

    Body (JSON):
      user_id  — required, Firebase user ID
      task     — optional, custom instruction (default: full audit)
    """
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", "").strip()
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    task = body.get("task") or (
        f"Audit all tax documents for user {user_id}. "
        "Check for data quality issues, IRS audit triggers, income cross-references, "
        "and produce a full risk report."
    )

    try:
        from agents import AuditorAgent
        agent = AuditorAgent(db=db)
        result = agent.run(task)
        return jsonify({"status": "ok", "user_id": user_id, "output": result["output"]})
    except Exception as e:
        logger.error("AuditorAgent error: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/agents/accountant", methods=["POST"])
@require_firebase
def run_accountant():
    """
    Run the AccountantAgent against a user's tax documents.

    Body (JSON):
      user_id        — required, Firebase user ID
      filing_status  — optional (default: single)
      task           — optional, custom instruction
    """
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", "").strip()
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    filing_status = body.get("filing_status", "single")
    task = body.get("task") or (
        f"Prepare a complete tax summary for user {user_id} who files as {filing_status}. "
        "Aggregate all income, estimate federal tax liability, identify deductions and credits, "
        "and provide actionable next steps."
    )

    try:
        from agents import AccountantAgent
        agent = AccountantAgent(db=db)
        result = agent.run(task)
        return jsonify({"status": "ok", "user_id": user_id, "output": result["output"]})
    except Exception as e:
        logger.error("AccountantAgent error: %s", e)
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# SPA catch-all — must be last so API routes take priority
# ---------------------------------------------------------------------------

@app.route("/<path:path>")
def spa_fallback(path: str):
    """
    Serve static assets directly (JS/CSS/images); fall back to index.html
    for any other path so React Router can handle client-side navigation.
    """
    asset = os.path.join(FRONTEND_DIST, path)
    if os.path.exists(asset) and os.path.isfile(asset):
        return send_from_directory(FRONTEND_DIST, path)
    index_html = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_html):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({"error": f"Not found: {path}"}), 404


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() in ("true", "1", "t")
    port = int(os.getenv("PORT", 8080))
    logger.info("Starting TaxFront dev server on http://localhost:%d", port)
    logger.info("Firebase: %s | OpenAI: %s",
                "ready" if firebase_ready else "NOT configured (limited mode)",
                "key set" if os.getenv("OPENAI_API_KEY") else "NOT set")
    app.run(debug=debug_mode, port=port)
