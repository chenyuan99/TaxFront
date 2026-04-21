# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TaxFront is a full-stack tax document management platform with a React frontend and Python backend. It features user authentication, document management, tax form automation, and AI-powered agents for tax and audit tasks.

## Common Commands

### Frontend Development
- **Start dev server**: `cd frontend && npm run dev` (runs on http://localhost:5173 by default)
- **Build for production**: `cd frontend && npm build`
- **Run tests**: `cd frontend && npm test` or `npm run test:watch` for watch mode
- **Lint code**: `cd frontend && npm run lint`
- **Generate API types**: `cd frontend && npm run generate:api` (from OpenAPI schema at `../api-docs/openapi.yml`)
- **Preview build**: `cd frontend && npm run preview`

### Backend Development
- **Run Flask app**: `cd backend && python app.py`
- **Run Firebase emulator**: `cd backend/parser/functions && firebase emulators:start`
- **Run backend tests**: `cd backend && python -m pytest` or `python -m pytest --cov` for coverage
- **Run parser function tests**: `cd backend/parser/functions && python -m pytest test_functions.py`
- **Run agent tests**: `cd backend/agents && python -m pytest tests/`
- **Code formatting**: `cd backend && black .` (configured in requirements)
- **Linting**: `cd backend && flake8`

## Project Structure

### Frontend (`/frontend`)
- **Built with**: React 18, TypeScript, Vite, TailwindCSS
- **Main routing**: `src/App.tsx` - Contains route definitions and role-based rendering (user vs accountant dashboards)
- **Key components**:
  - `Auth.tsx` / `Register.tsx` - Firebase authentication flows
  - `Dashboard.tsx` - User document dashboard
  - `AccountantDashboard.tsx` - Accountant-specific dashboard (role-based on email containing "accountant")
  - `DocumentUpload.tsx` / `DocumentList.tsx` - Document management
  - `TaxForms.tsx` - Tax form UI
  - `TaxCalculator.tsx` - Tax calculation interface
  - `Chat.tsx` - AI chatbot interface
  - `Profile.tsx` - User profile management
- **Firebase integration**: `src/firebase.ts` (authentication, storage, analytics)
- **Testing**: Vitest with jsdom environment
- **State management**: React hooks with Firebase hooks (`react-firebase-hooks`)

### Backend (`/backend`)
- **Main app**: `app.py` - Flask application entry point
- **Core components**:
  - `/agents/` - LangChain-based AI agents for accounting and auditing tasks
    - `accountant_agent.py` - Tax accounting assistant
    - `auditor_agent.py` - Audit verification
    - `base_agent.py` - Agent base class
    - `tools/` - Tool definitions for agents (tax_tools.py, document_tools.py)
  - `/parser/functions/` - Firebase Cloud Functions (Python)
    - `main.py` - Function handlers
    - `parser.py` - Document parsing logic
  - `/tax_forms/` - Tax form automation and filling
    - `form_definitions.py` - Form schema definitions
    - `form_filler.py` - Browser-based PDF form filling
    - `routes.py` - API endpoints
  - `/embedding/` - Vector embedding and RAG pipeline
  - `/queue/` - Async task processing
    - `task_manager.py` - Task orchestration
    - `task_processors.py` - Task execution
  - `/src/` - Additional utilities and RAG pipelines
  - `/utils/browser.py` - Browser automation utilities
- **Dependencies**: LangChain, Firebase Admin SDK, PyPDF2, Pillow, Pytest
- **Database**: Cloud Firestore
- **File storage**: Firebase Storage

## Architecture Notes

### Frontend-Backend Communication
- Frontend uses Firebase SDK directly for auth and storage
- Backend Flask app handles complex processing (document parsing, form filling, AI agents)
- Firebase Cloud Functions serve as serverless workers

### Role-Based Access
- **Users**: Can upload documents, view dashboard, access tax calculator
- **Accountants**: Have dedicated dashboard, access to auditor and accountant agents
- Role determined by email domain check in `App.tsx` (accountant if email contains "accountant")

### Document Flow
1. User uploads document via `DocumentUpload.tsx`
2. Document stored in Firebase Storage
3. Cloud Functions trigger parsing via `parser.py`
4. Metadata and status tracked in Firestore
5. Agents can process documents for tax/audit purposes

### Tax Form Automation
- Forms defined in `form_definitions.py` (including 1040, W-2, etc.)
- `form_filler.py` handles browser-based PDF form filling with proper field positioning
- Supports multi-page forms and custom field validation rules
- Uses Chromium browser automation

## Testing Strategy

- **Frontend**: Vitest for unit tests, jsdom environment for DOM testing
- **Backend**: Pytest for unit/integration tests
  - Agent tests: `backend/agents/tests/`
  - Function tests: `backend/parser/functions/test_*.py`
- **Coverage**: Use `pytest --cov` and `@vitest/coverage-v8`

## Development Workflow

1. Frontend changes: Make changes in `/frontend`, test with `npm test:watch`, dev server reflects changes instantly
2. Backend changes: Modify Python files, test with `pytest`, use Firebase emulator for Cloud Functions
3. New API endpoints: 
   - Add endpoint in backend
   - Update OpenAPI spec at `api-docs/openapi.yml`
   - Run `npm run generate:api` in frontend to sync types
4. Agent tools: Add to appropriate tool file in `/agents/tools/`, ensure tests in `tests/` directory

## Deployment

- **Frontend**: Automatically deployed via GitHub Actions workflow
- **Backend**: Cloud Functions deployed automatically
- **Docker**: Both services containerized (see docker-compose.yml)
  - Frontend: Node.js build + Nginx serving
  - Backend: Python Flask + Gunicorn

## Key Dependencies & Versions

- **Frontend**: React 18.3, Vite 6.4, TailwindCSS 3.4, TypeScript 5.7
- **Backend**: Python 3.12+, Flask, LangChain, Firebase Admin SDK, PyPDF2
