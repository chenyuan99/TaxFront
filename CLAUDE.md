# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TaxFront is a tax document management platform: a React frontend talking to Firebase (Auth, Firestore, Storage) and TypeScript Cloud Functions. It features user authentication, document management, Gemini-based document extraction, and AI agents for tax and audit tasks.

The stack is entirely TypeScript and Firebase. A Python Flask backend (`backend/`) existed previously but was superseded by the Cloud Functions and removed; if you find references to it in older docs or issues, they are stale.

## Common Commands

### Frontend Development
- **Start dev server**: `cd frontend && npm run dev` (runs on http://localhost:5173 by default)
- **Build for production**: `cd frontend && npm build`
- **Run tests**: `cd frontend && npm test` or `npm run test:watch` for watch mode
- **Lint code**: `cd frontend && npm run lint`
- **Generate API types**: `cd frontend && npm run generate:api` (from OpenAPI schema at `../api-docs/openapi.yml`)
- **Preview build**: `cd frontend && npm run preview`

### Cloud Functions (`/functions`) — the live backend
- **Typecheck**: `cd functions && npx tsc --noEmit`
- **Build**: `cd functions && npm run build`
- **Run emulator**: `cd functions && npm run serve`
- **Deploy**: `cd functions && npm run deploy`
- **Run tests**: `cd functions && npm test` or `npm run test:watch` for watch mode

### Docker (frontend only)
- **Build and run**: `docker-compose up --build` (serves the built frontend via Nginx on port 80)

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

### Cloud Functions (`/functions`)
- **Built with**: TypeScript, Genkit, `@genkit-ai/google-genai`, Firebase Admin SDK
- **Entry point**: `src/index.ts` — all callables and triggers
  - `runAccountant` / `runAuditor` - agent entry points
  - `getTaxDocuments` / `getTaxSummary` / `createUserProfile`
  - `processNewTaxDocument` - Firestore `onDocumentCreated` trigger
- **`src/flows/`** - agent and pipeline definitions
  - `extractor.ts` - Gemini document extraction. Its `EXTRACTION_PROMPT` is the authoritative list of extracted field names per form type.
  - `accountant.ts` / `auditor.ts` - agent flows
- **`src/tools/`** - Genkit tool definitions the agents call
  - `accountantTools.ts` - `build_tax_summary`, `suggest_deductions`
  - `auditTools.ts` - `check_audit_triggers`, `cross_reference_income`, `calculate_audit_risk_score`
  - `taxCalc.ts` - 2024 brackets, standard deductions, SS wage base
  - `documentTools.ts` - Firestore document fetching
- **`src/semantic/`** - see below
- **Database**: Cloud Firestore. **File storage**: Firebase Storage.

### Semantic layer (`functions/src/semantic/taxFields.ts`)
Single source of truth for document classification, extracted-field aliases, and income aggregation. **Both tool sets must read from it.**

Before adding a field lookup or an income total to any tool, check whether it belongs here instead. The accountant and auditor previously kept parallel alias chains and disagreed on total income by a wide margin on the same documents; that class of bug is what this module exists to prevent.

- `safeFloat` / `pickAmount` - money parsing that tolerates `"$1,234.56"`. Never use bare `parseFloat` on extracted values.
- `classifyDocument` / `normalizeDocType` - the only correct way to branch on `documentType`; handles `1099-INT`, `1099 INT`, `1099int` alike.
- `FIELD_ALIASES` - canonical alias chains, most specific name first.
- `collectIncome` - the authoritative aggregate. `totalIncome` is the one income figure; do not re-derive it.
- `documentIncome` - per-document income for single-document audit checks.

## Architecture Notes

### Frontend-Backend Communication
- Frontend uses the Firebase SDK directly for auth and storage
- All server work runs in TypeScript Cloud Functions, invoked via `httpsCallable` from `frontend/src/services/api.ts`

### Role-Based Access
- **Users**: Can upload documents, view dashboard, access tax calculator
- **Accountants**: Have dedicated dashboard, access to auditor and accountant agents
- Role determined by email domain check in `App.tsx` (accountant if email contains "accountant")

### Document Flow
1. User uploads document via `DocumentUpload.tsx`
2. Document stored in Firebase Storage
3. The `processNewTaxDocument` trigger runs extraction via `flows/extractor.ts`
4. Metadata and status tracked in Firestore
5. Agents can process documents for tax/audit purposes

### Tax Form Automation
Not currently implemented. A previous Python implementation used Chromium automation with manual field positioning; if this is rebuilt, do it in the TS stack with `pdf-lib` AcroForm filling. See `TASKS.md`.

## Testing Strategy

- **Frontend**: Vitest for unit tests, jsdom environment for DOM testing
- **Cloud Functions**: Vitest, in `functions/test/`. `cd functions && npm test` (or `npm run test:watch`).
  - `taxFields.test.ts` covers the semantic layer; `tools.test.ts` invokes the Genkit tools directly.
  - Tools are testable offline because their implementations are pure — they never reach the model. `vitest.config.mts` supplies a dummy API key so the Genkit `googleAI` plugin can construct.
  - Keep the cross-tool agreement test in `tools.test.ts`: the accountant and auditor must report the same total income for the same documents. That invariant is the reason the semantic layer exists.
- **Coverage**: `@vitest/coverage-v8`

## Architecture Decisions

- `docs/open-policy-agent.md` — OPA/Rego for the audit trigger rules. Evaluated, not adopted; records what would change the answer.

## Development Workflow

1. Frontend changes: Make changes in `/frontend`, test with `npm run test:watch`, dev server reflects changes instantly
2. Cloud Function changes: Edit `/functions/src`, `npx tsc --noEmit` to typecheck, `npm run serve` for the emulator
3. New API endpoints:
   - Add the callable to `functions/src/index.ts`
   - Add the client wrapper to `frontend/src/services/api.ts`
   - Update the OpenAPI spec at `api-docs/openapi.yml`, then `npm run generate:api` in frontend to sync types
4. Agent tools: Add to the appropriate file in `functions/src/tools/`. Take field lookups and income totals from `src/semantic/taxFields.ts` rather than re-deriving them.

## Deployment

- **Frontend**: Firebase Hosting, deployed via GitHub Actions
- **Cloud Functions**: `firebase deploy --only functions`
- **Docker**: `docker-compose.yml` builds the frontend only. Cloud Functions are deployed with the Firebase CLI, not containerized.

## Key Dependencies & Versions

- **Frontend**: React 18.3, Vite 6.4, TailwindCSS 3.4, TypeScript 5.7
- **Cloud Functions**: Node 22, TypeScript 5.6, Genkit 1.41, `@genkit-ai/google-genai` 1.41, firebase-admin 13

## AI Model Standards
- **Mandatory Model**: AI agents (Accountant and Auditor) MUST use `googleai/gemini-2.5-flash`.
- **Tool Calling**: Agents must be configured with `maxTurns: 5` in `ai.generate()` to ensure multi-turn tool calling completes automatically.
- **Plugin**: Use `@genkit-ai/google-genai`. The old `@genkit-ai/googleai` is deprecated by npm ("Use @genkit-ai/google-genai package instead") and was last published 2026-03-26. Model reference strings are unchanged — `googleAI.model('gemini-2.5-flash')` still resolves to `googleai/gemini-2.5-flash`.
- **Why gemini-2.5-flash**: Thought signatures are optional (not mandatory) for Gemini 2.5 function calls, so tool calling works correctly.
- **gemini-3 status — the SDK blocker is resolved, but not yet enabled here.** Gemini 3 requires a `thoughtSignature` on every function call part in multi-turn history. The old plugin's `fromFunctionCall` returned `{ toolRequest: { name, input, ref } }` and dropped the signature, causing 400 errors mid tool-calling loop. `@genkit-ai/google-genai` round-trips it: `fromGeminiToolCall` stashes it via `maybeAddThoughtSignatureAndMetadata` into `part.metadata.thoughtSignature`, and `toGeminiToolRequest` reattaches it via `maybeAddGeminiThoughtSignatureAndMetadata`. The old plugin also knows no gemini-3 model names at all; the new one ships ten.

  This was verified by reading the published sources, **not** by a live run. Before switching the mandate to gemini-3, exercise a real multi-turn tool-calling loop against the API and confirm no 400s — the offline suite never reaches the model, so it cannot catch this.
