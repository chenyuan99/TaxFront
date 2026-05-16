# TaxFront Task Backlog

## Pending

### Add `runFullAnalysis` Cloud Function
**Decision:** Skip orchestrator agent. Instead add a plain `runFullAnalysis` onCall function that runs `runAccountantAgent` and `runAuditorAgent` in parallel via `Promise.all` and returns a combined result.

**Why:** Achieves the "one button, unified report" UX without a third LLM call, no extra latency beyond the slower of the two agents, no new prompt to maintain.

**Implementation notes:**
- Add `runFullAnalysis` to `functions/src/index.ts` (same memory/timeout config as the other two)
- Call both agents in parallel: `const [accountantOut, auditorOut] = await Promise.all([runAccountantAgent(...), runAuditorAgent(...)])`
- Return `{ status: "ok", userId, accountant: accountantOut, auditor: auditorOut }`
- Add `api.runFullAnalysis()` to `frontend/src/services/api.ts`
- Add a single "Analyze My Taxes" button to `Dashboard.tsx` that calls it and renders both sections

### Document parsing pipeline (Cloud Functions)
The old Python `parser.py` handled PDF OCR and data extraction. The current `processNewTaxDocument` trigger (`functions/src/index.ts`) only stamps a timestamp and sets `status: "processed"` — it does not extract any data. Until this is rebuilt, `extractedData` is always empty and agents cannot do real analysis.

**Approach:** Replace the stub with a real extraction pipeline in TypeScript Cloud Functions.

**Implementation notes:**
- Use the Google Cloud Document AI API (`@google-cloud/documentai`) or the Gemini file API (`ai.generate` with inline PDF) to extract structured fields from uploaded PDFs
- Map extracted fields to the schema expected by `build_tax_summary` and `check_audit_triggers`:
  - W-2: `wages`, `federal_tax_withheld`, `state_tax_withheld`, `social_security_tax_withheld`, `medicare_tax_withheld`, `employer_ein`
  - 1099-NEC: `nonemployee_compensation`
  - 1099-INT: `interest_income`
  - 1099-DIV: `total_dividends`, `ordinary_dividends`
  - 1098: `mortgage_interest`
- Write extracted fields to `taxDocuments/{id}.extractedData` in Firestore
- Set `status: "processed"` on success, `status: "error"` with `errorMessage` on failure
- The document is already in Firebase Storage when the trigger fires — fetch it via the Admin SDK (`getStorage().bucket().file(data.storagePath).download()`)
- Consider a `documentType` auto-detection step before extraction (infer from filename or first-pass OCR)

**Testing without the pipeline:** Manually write `extractedData` directly to a Firestore document to test agents end-to-end.

### Wire filing status from user profile
Currently hardcoded as `'single'` in `Dashboard.tsx` line 48. Should be pulled from the authenticated user's Firestore profile instead.
