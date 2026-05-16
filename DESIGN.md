# TaxFront — System Design

## Overview

TaxFront is a full-stack tax document management platform targeting individual filers and their accountants. Users upload tax documents, AI agents process and audit them, and automated tooling fills IRS forms on their behalf.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Browser                   │
│          React 18 + TypeScript + TailwindCSS        │
└───────────────────┬─────────────────────────────────┘
                    │ Firebase SDK (auth, storage)
                    │ HTTPS (agent calls)
          ┌─────────▼──────────┐
          │   Firebase Platform │
          │                    │
          │  ┌──────────────┐  │
          │  │ Firebase Auth │  │
          │  └──────────────┘  │
          │  ┌──────────────┐  │
          │  │   Firestore   │  │ ◄── metadata, document status
          │  └──────────────┘  │
          │  ┌──────────────┐  │
          │  │Firebase Store │  │ ◄── raw document files (PDF, images)
          │  └──────────────┘  │
          │  ┌──────────────┐  │
          │  │Cloud Functions│  │ ◄── serverless AI agents, triggers
          │  └──────────────┘  │
          └────────────────────┘
                    │
          ┌─────────▼──────────┐
          │   Flask Backend    │ (local dev / Docker)
          │   Python 3.12+     │
          │                    │
          │  agents/           │
          │  tax_forms/        │
          │  embedding/        │
          │  queue/            │
          └────────────────────┘
```

### Runtime environments

| Environment | Frontend | Backend |
|---|---|---|
| Development | `npm run dev` on :5173 | `python app.py` on :8080 |
| Docker | Nginx on :80 | Gunicorn on :5000 |
| Production | Firebase Hosting (static) | Firebase Cloud Functions (Gen 2) |

In production the Flask app is not deployed — its logic is replicated in TypeScript Cloud Functions (`functions/src/`). The Flask server exists for local development and Docker self-hosting only.

---

## Frontend

**Stack:** React 18, TypeScript 5.7, Vite 6.4, TailwindCSS 3.4, React Router v6, react-firebase-hooks.

### Routing (`src/App.tsx`)

```
/login          → Auth
/register       → Register
/terms          → TermsOfService
/privacy        → Privacy
/contact        → Contact
/about          → About
/calculator     → TaxCalculator
/forms          → TaxForms
/storage-test   → StorageTest
/jobs           → Jobs (auth-guarded)
/profile        → Profile (auth-guarded)
/*              → Dashboard | AccountantDashboard | Auth
```

The catch-all renders `AccountantDashboard` when the signed-in user's email contains `"accountant"`; otherwise it renders `Dashboard`. Role detection is client-side and email-based — not cryptographically enforced.

### State management

No global store. Auth state comes from `firebase.onAuthStateChanged` in `App.tsx` and propagates through props. Document state lives in Firebase and is fetched per-component via hooks.

### Firebase integration (`src/firebase.ts`)

Initializes Firebase App, Auth, Storage, and Analytics. All credentials are injected at build time as `VITE_FIREBASE_*` environment variables.

---

## Backend

**Stack:** Python 3.12+, Flask, LangChain, Firebase Admin SDK, PyPDF2, FAISS, Playwright/Chromium.

### `app.py` — Flask dev server

- Serves the built frontend SPA (catch-all `/<path>`).
- Exposes `/health`, `/firebase-status`, `/agents/auditor`, `/agents/accountant`.
- Gracefully degrades when Firebase credentials are absent (returns 503 from guarded routes).
- CORS allows localhost origins and production domains.

### AI Agents (`backend/agents/`)

All agents inherit from `BaseAgent`:

```
BaseAgent
├── __init__(db, model, temperature, verbose, openai_api_key)
│   ├── Builds ChatOpenAI (default: gpt-4o-mini, temp=0)
│   ├── Assembles tools: create_document_tools(db) + specialized tools
│   └── Compiles LangGraph agent via create_agent()
├── run(task, chat_history) → {output, messages}   # synchronous
└── stream(task, chat_history) → Iterator          # streaming events

AccountantAgent(BaseAgent)
└── Aggregates income, estimates liability, identifies deductions

AuditorAgent(BaseAgent)
└── Cross-references documents, flags IRS audit triggers, produces risk report
```

System prompts are loaded from Markdown skill files (`agents/skills/<name>.md`). Temperature is fixed at 0 for deterministic tax analysis.

### Tax Form Automation (`backend/tax_forms/`)

- `form_definitions.py` — `FormType` enum + `FormField` / `FormDefinition` dataclasses. Each field carries its PDF page, (x, y) coordinates, field type, and optional validation rules.
- `form_filler.py` — Chromium browser automation (Playwright) that opens an IRS PDF URL, positions the cursor at each field's coordinates, and types extracted values.
- `routes.py` — Flask blueprint exposing form-filling endpoints.

Supported forms: 1040, W-2, 1099-INT, 1099-DIV, 1099-B, 1099-MISC.

### Document Parsing (`backend/parser/`)

Firebase Cloud Functions (Python) triggered by Firestore document creation. `parser.py` extracts structured data from uploaded PDFs and images, then writes results back to Firestore.

### Embedding & RAG (`backend/embedding/`, `backend/faiss_index/`)

Documents are embedded into a local FAISS index. The RAG pipeline is used by agents' document tools to perform semantic search over a user's tax document corpus.

### Async Task Queue (`backend/queue/`)

- `task_manager.py` — orchestrates multi-step agent workflows.
- `task_processors.py` — executes individual processing steps (parsing, embedding, form filling).

---

## Firebase Cloud Functions (`functions/`)

Production agent runtime written in TypeScript (Gen 2 functions).

| Function | Trigger | Purpose |
|---|---|---|
| `runAccountant` | HTTPS callable | Runs AccountantAgent for a user |
| `runAuditor` | HTTPS callable | Runs AuditorAgent for a user |
| `createUserProfile` | HTTPS callable | Upserts user profile in Firestore |
| `getTaxDocuments` | HTTPS callable | Returns user's document list |
| `getTaxSummary` | HTTPS callable | Aggregates document type counts |
| `processNewTaxDocument` | Firestore trigger (`taxDocuments/{id}`) | Marks new document as processed |

All callable functions require Firebase Auth. Agent functions run with 1 GiB memory and a 300-second timeout.

---

## Data Model (Firestore)

### `users/{uid}`
```
name:         string
taxId:        string
businessType: string
updatedAt:    ISO-8601 string
```

### `taxDocuments/{documentId}`
```
userId:      string          (Firebase UID)
type:        string          (W-2 | 1099-INT | 1040 | …)
uploadDate:  ISO-8601 string
status:      "pending" | "processed"
processedAt: ISO-8601 string
storageRef:  string          (Firebase Storage path)
```

---

## Document Upload Flow

```
1. User selects file in DocumentUpload.tsx
2. File uploaded to Firebase Storage (direct from browser via Firebase SDK)
3. Firestore document created in taxDocuments/ with status="pending"
4. processNewTaxDocument Cloud Function fires on creation → sets status="processed"
5. parser.py (Cloud Function) extracts structured data and writes back to Firestore
6. Agents can query documents via document_tools using the FAISS index or Firestore
```

---

## Role-Based Access

| Role | Detection | Capabilities |
|---|---|---|
| User | `email` does not contain `"accountant"` | Upload docs, Dashboard, TaxCalculator, TaxForms, Chat |
| Accountant | `email` contains `"accountant"` | AccountantDashboard, run Auditor/Accountant agents |

Role is derived client-side from the authenticated user's email at login time. Server-side enforcement relies on Firebase Auth tokens passed to Cloud Functions.

---

## Deployment

### Production (Firebase)

- **Frontend**: Built with `npm run build`, deployed to Firebase Hosting via GitHub Actions.
- **Cloud Functions**: TypeScript functions in `functions/` deployed via Firebase CLI.
- **Backend Flask**: Not deployed to production — Cloud Functions replace it.

### Docker (self-hosted)

```yaml
services:
  frontend:   Nginx on :80, built from docker/frontend/Dockerfile
  backend:    Gunicorn on :5000, built from docker/backend/Dockerfile
```

Both containers share `taxfront-network`. Backend has a persistent `backend_data` volume.

### Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_FIREBASE_*` | Frontend build | Firebase client config |
| `GOOGLE_APPLICATION_CREDENTIALS` | Backend | Path to service account JSON |
| `FIREBASE_STORAGE_BUCKET` | Backend | Override storage bucket |
| `OPENAI_API_KEY` | Backend agents | LLM calls |
| `FLASK_DEBUG` | Backend | Enable debug mode |
| `PORT` | Backend | Server port (default 8080) |

---

## Testing

| Layer | Framework | Location |
|---|---|---|
| Frontend | Vitest + jsdom | `frontend/src/**/*.test.*` |
| Backend agents | Pytest | `backend/agents/tests/` |
| Parser functions | Pytest | `backend/parser/functions/test_*.py` |
| Metadata schema | Pytest | `backend/test/test_metadata_schema.py` |

Run frontend tests: `cd frontend && npm test`  
Run backend tests: `cd backend && python -m pytest --cov`

---

## Key Design Decisions

**Firebase as the primary data layer** — auth, storage, and database are all Firebase, which eliminates the need for a separate auth service and gives the frontend direct, secure access to storage without proxying through the backend.

**Flask for local development only** — the Flask server mirrors Cloud Function logic so developers can iterate without deploying. This avoids a separate local emulator setup for agent testing.

**Temperature=0 for all agents** — tax analysis requires consistent, repeatable outputs. Non-determinism in LLM responses would make audit results unreliable.

**FAISS for document search** — an embedded FAISS index avoids the latency and cost of a managed vector store for the MVP. The index file lives at `backend/faiss_index/`.

**Email-based role detection** — simple heuristic (`email.includes("accountant")`) used for role routing. Sufficient for the current user base; a Firestore `roles` collection would be the natural next step if finer-grained permissions are needed.