# TaxFront

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/chenyuan99/TaxFront/frontend.yml)](https://github.com/chenyuan99/TaxFront/actions)
[![codecov](https://codecov.io/gh/chenyuan99/TaxFront/branch/main/graph/badge.svg)](https://codecov.io/gh/chenyuan99/TaxFront)

TaxFront is an AI-assisted tax document management platform for individual filers and accountants. Users upload tax documents, Firebase stores and tracks them, Cloud Functions extract structured tax data, and specialized AI agents produce preparation and compliance reports.

## Current Architecture

```text
Browser
  React 18 + TypeScript + Vite + TailwindCSS
  Firebase SDK for Auth, Storage, Firestore, callable Functions
    |
    v
Firebase / Google Cloud
  Firebase Auth             user identity
  Firebase Storage          uploaded PDFs and images
  Cloud Firestore           profiles, document metadata, extractedData
  Firebase Cloud Functions  production API, extraction, agent runtime
    |
    v
Genkit + Gemini 2.5 Flash
  document extraction
  accountant and auditor agents

Local / self-hosted only
  Python Flask backend
  Python agent, parser, RAG, queue, and tax-form modules
  Docker Compose frontend + backend stack
```

Production is centered on the root `functions/` TypeScript Cloud Functions. The Python Flask app in `backend/` is for local development, Docker self-hosting, and legacy or experimental backend modules.

## Main Capabilities

- Firebase Authentication with separate user and accountant experiences.
- Direct document upload from the browser to Firebase Storage.
- Firestore-backed document status, summaries, profile data, and extracted fields.
- Gemini-powered document extraction for W-2, 1099-NEC, 1099-INT, 1099-DIV, 1098, 1040, Schedule C, and fallback `other` documents.
- AI Accountant agent for 2024 federal tax preparation estimates, deductions, credits, AGI flow, withholding, and action items.
- AI Auditor agent for data quality checks, cross-form consistency, IRS audit triggers, and risk scoring.
- Local Python backend for Flask routes, LangChain agents, parsing experiments, FAISS/RAG, task queue, and IRS form tooling.
- Docker setup for a self-hosted Nginx frontend plus Gunicorn/Flask backend.

## Runtime Components

### Frontend (`frontend/`)

The frontend is a React 18, TypeScript, Vite, TailwindCSS application. It initializes Firebase in `frontend/src/firebase.ts`, routes in `frontend/src/App.tsx`, uploads documents from dashboard components, and calls Cloud Functions through `frontend/src/services/api.ts`.

Key routes and views include login, registration, dashboard, accountant dashboard, tax calculator, tax forms, jobs, profile, storage test, and static legal/info pages.

### Production Cloud Functions (`functions/`)

The root `functions/` package is the current production backend. It uses Node 22, Firebase Functions v2, Firebase Admin, Genkit, and `@genkit-ai/googleai`.

Callable functions:

| Function | Purpose |
| --- | --- |
| `runAccountant` | Runs the Accountant agent for the authenticated user. |
| `runAuditor` | Runs the Auditor agent for the authenticated user. |
| `createUserProfile` | Upserts the current user's profile in Firestore. |
| `getTaxDocuments` | Returns the current user's latest tax documents. |
| `getTaxSummary` | Aggregates document counts and last update metadata. |

Firestore trigger:

| Trigger | Purpose |
| --- | --- |
| `processNewTaxDocument` on `taxDocuments/{documentId}` | Downloads the uploaded file URL, calls Gemini extraction, writes `documentType`, `taxYear`, `extractedData`, `status`, and `processedAt`. |

AI model standard: agent and extraction flows use `googleai/gemini-2.5-flash` with Genkit. Agent prompts live in `functions/prompts/` and are copied into `functions/lib/prompts/` during build.

### Python Backend (`backend/`)

`backend/app.py` is a Flask development server and Docker backend. It can serve the built frontend, expose health/Firebase checks, and run local `/agents/auditor` and `/agents/accountant` routes when Firebase and `OPENAI_API_KEY` are configured.

Important modules:

| Path | Purpose |
| --- | --- |
| `backend/agents/` | Python Accountant and Auditor agents, LangChain/LangGraph tools, tests, and Markdown skills. |
| `backend/parser/` | Python document parser and legacy Firebase function code. |
| `backend/tax_forms/` | IRS form definitions, PDF/form filling, and Flask routes. |
| `backend/embedding/`, `backend/faiss_index/`, `backend/src/` | FAISS/RAG and experimental OpenAI, Vertex AI, and Ollama pipelines. |
| `backend/queue/` | Firestore-backed async task queue and processors. |

### Docs And Design Assets

Project-authored Markdown lives across the root, `.kiro/steering/`, `backend/`, `docker/`, `docs/`, `frontend/`, and `functions/prompts/`. The large design-system docs in `frontend/` define the current UI palette, component patterns, and implementation conventions.

## Data Model

### `users/{uid}`

```text
name: string
taxId: string
businessType: string
updatedAt: ISO-8601 string
```

### `taxDocuments/{documentId}`

```text
userId: string
name: string
originalName: string
type: string
size: number
url: string
uploadDate: ISO-8601 string
status: "pending" | "processed" | "error"
documentType: string
taxYear: number | null
extractedData: object
processedAt: ISO-8601 string
errorMessage: string
```

## Document Flow

1. A signed-in user selects a PDF or image in the React dashboard.
2. The browser uploads the file directly to Firebase Storage.
3. The browser creates a `taxDocuments` Firestore record with `status: "pending"` and the download URL.
4. `processNewTaxDocument` runs on Firestore creation.
5. The function downloads the file and sends inline PDF/image content to Gemini.
6. Extracted fields are written back to Firestore as `extractedData`; status becomes `processed` or `error`.
7. `runAccountant` and `runAuditor` fetch the user's documents, invoke tools, and return structured reports.

## Getting Started

### Prerequisites

- Node.js 22+ for frontend and root Cloud Functions.
- npm.
- Python 3.12+ for the local Flask backend.
- Firebase CLI.
- Google Cloud / Firebase project access.
- Docker and Docker Compose for self-hosted local deployment.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` by default.

Build and test:

```bash
cd frontend
npm run build
npm test
npm run lint
```

Frontend environment variables use the `VITE_FIREBASE_*` prefix. See `frontend/.env.example`.

### Cloud Functions

```bash
cd functions
npm install
npm run build
npm run serve
```

Deploy:

```bash
cd functions
npm run deploy
```

Required runtime configuration includes Firebase project credentials and Google AI/Genkit access for Gemini.

### Python Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The Flask server defaults to `http://localhost:8080`.

Useful environment variables:

```text
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
OPENAI_API_KEY=your_openai_key
FLASK_DEBUG=false
PORT=8080
```

## Docker

```bash
docker-compose up --build
```

Default services:

| Service | Port | Description |
| --- | --- | --- |
| Frontend | `80` | Built React app served by Nginx. |
| Backend | `5000` | Flask app served by Gunicorn. |

See [docker/README.md](docker/README.md) for environment variables, health checks, production compose commands, and maintenance notes.

## Testing

```bash
cd frontend
npm test
```

```bash
cd backend
python -m pytest
python -m pytest --cov
```

```bash
cd functions
npm run build
```

Backend agent business logic is covered with pytest tests under `backend/agents/tests/`; frontend tests use Vitest.

## API Notes

The current frontend uses Firebase callable functions for the active AI agent APIs. Some older REST-style documentation remains in root and `docs/` Markdown files for historical context and API planning, but root `functions/src/index.ts` is the source of truth for production callable functions.

The frontend can regenerate OpenAPI types when `api-docs/openapi.yml` changes:

```bash
cd frontend
npm run generate:api
```

## Security

TaxFront handles sensitive tax documents and personally identifiable information. Keep service account JSON files, API keys, and `.env` files out of commits. Firebase Auth is required for callable production functions, and Firestore queries scope user document reads to the authenticated UID.

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security policy details.

## Known Gaps

- Accountant filing status is still hardcoded to `single` in the dashboard call path.
- The older REST helper methods in `frontend/src/services/api.ts` may not match the callable-only production function names.
- Root and `docs/` API Markdown includes historical `taxRAG` and REST endpoint content that should be treated as legacy unless reconciled with `functions/src/index.ts`.

See [TASKS.md](TASKS.md) for the active backlog.

## License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxFront.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxFront?ref=badge_large)

## Contact

Yuan Chen - [@chenyuan99](https://github.com/chenyuan99)

Project Link: [https://github.com/chenyuan99/TaxFront](https://github.com/chenyuan99/TaxFront)
