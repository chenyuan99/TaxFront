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
- **Built with**: TypeScript, Genkit, `@genkit-ai/googleai`, Firebase Admin SDK
- **Entry point**: `src/index.ts` — all callables and triggers
  - `runAccountant` / `runAuditor` - agent entry points
  - `getTaxDocuments` / `getTaxSummary` / `createUserProfile`
  - `processNewTaxDocument` - Firestore `onDocumentCreated` trigger on `taxDocuments`
  - `pushNewNotification` - Firestore `onDocumentCreated` trigger on `notifications`, fans out web push
- **`src/flows/`** - agent and pipeline definitions
  - `extractor.ts` - Gemini document extraction. Its `EXTRACTION_PROMPT` is the authoritative list of extracted field names per form type.
  - `accountant.ts` / `auditor.ts` - agent flows
- **`src/jobs.ts`** - backend-owned job records and the notifications they emit (see below)
- **`src/push.ts`** - FCM delivery for those notifications, with dead-token pruning
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

### Job notifications (`functions/src/jobs.ts` → `frontend/src/services/notificationService.ts`)
Background work runs in a Firestore trigger with no HTTP response to return to, so the job record is the channel back to the browser.

- `processNewTaxDocument` opens a job (`jobs/{jobId}`, keyed by document id so a retried invocation reuses it), advances it to `processing`, then closes it as `completed` or `failed`.
- The terminal write is a transaction: the job update and a `notifications/{id}` row land together, so the frontend can never see a finished job without its notification. `finishJob` is a no-op on an already-terminal job, so a redelivered trigger cannot notify twice.
- The frontend is a **reader only** on both collections — `jobService` and `notificationService` hold `onSnapshot` listeners and mark notifications read. Never add client-side job status mutation: a tab writing its own view of job state races the trigger doing the work.
- `extractTaxDocument` returns an `ExtractionResult` rather than throwing. It still writes `status` onto the document record; the return value exists so the trigger knows which notification to send.

Both queries filter by `userId` and order by `createdAt`, so each collection needs a composite index on (`userId` asc, `createdAt` desc). These live in `firestore.indexes.json` and ship with `firebase deploy --only firestore:indexes` — without them the listener fails at runtime with `The query requires an index`, not at build time.

Security rules must let a user read their own `jobs` and `notifications` rows, update only the `read` field on their notifications, and own `users/{uid}/fcmTokens/*`; job writes belong to the backend. There is no `firestore.rules` in this repo, so `firebase.json` deliberately declares only `firestore.indexes` — adding a `rules` pointer would deploy an empty ruleset over whatever is live.

**Web push (FCM).** The bell only reaches tabs that are open, so `pushNewNotification` fires off the notification row and pushes to the user's devices.

- Push hangs off `notifications`, not off the job, so anything that writes a notification gets push for free and a failed send retries without re-running extraction.
- Messages are **data-only**. A `notification` payload would be rendered by the browser on top of what `frontend/public/firebase-messaging-sw.js` shows, and would take click handling away from us. Do not add one.
- `sendPushToUser` never throws — push is best-effort and must not fail the job behind it. It prunes tokens FCM reports as permanently dead.
- Registration tokens live at `users/{uid}/fcmTokens/{token}`, written by `frontend/src/services/pushService.ts`. Tokens rotate, so `refreshPushToken()` re-registers on every load for an already-opted-in user.
- The service worker cannot read `import.meta.env`, so `pushService` registers it by hand with the Firebase config on its query string, at FCM's own `/firebase-cloud-messaging-push-scope` — deliberately narrower than the app-shell worker at `/` so the two coexist.
- Requires `VITE_FIREBASE_VAPID_KEY` (Firebase Console → Project Settings → Cloud Messaging → Web Push certificates). Unset, `getPushPermission()` reports `unconfigured`, the opt-in is hidden, and the in-app bell still works.

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
- **Cloud Functions**: Node 22, TypeScript 5.6, Genkit 1.34, `@genkit-ai/googleai` 1.28, firebase-admin 13

## AI Model Standards
- **Mandatory Model**: AI agents (Accountant and Auditor) MUST use `googleai/gemini-2.5-flash`.
- **Tool Calling**: Agents must be configured with `maxTurns: 5` in `ai.generate()` to ensure multi-turn tool calling completes automatically.
- **Why not gemini-3-flash-preview**: Gemini 3 requires mandatory `thoughtSignature` fields on every function call part in multi-turn history. The current `@genkit-ai/googleai` SDK (v1.28.0) drops these signatures in `fromFunctionCall`, causing 400 errors during tool-calling loops. Revisit when Genkit ships the fix.
- **Why gemini-2.5-flash**: Thought signatures are optional (not mandatory) for Gemini 2.5 function calls, so Genkit's current implementation works correctly. It is a newer and more capable model than what was originally used.
