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

### Decide the fate of the Python `backend/`
`firebase.json` deploys only `functions/` (TypeScript). The frontend talks exclusively to Firebase callables — nothing in `frontend/src` references `VITE_API_URL`, the variable the Flask service is exposed under in `docker-compose.yml`. `backend/app.py` does not import `task_manager`, `tax_forms`, or `form_filler` either.

So these are unreachable from the running app: `backend/queue/`, `backend/embedding/`, `backend/src/*rag_pipeline.py`, `backend/tax_forms/`, `backend/parser/`, `backend/agents/`.

**Decision needed:** delete them, or keep them and mark them clearly as superseded. Right now they read as live architecture and have already caused at least one round of misdirected planning. If tax form filling gets rebuilt, do it in the TS stack with `pdf-lib` rather than reviving `form_filler.py`'s browser automation.

### Externalize audit thresholds
`check_audit_triggers` hardcodes its rule constants: `> $1M` / `> $500K` income tiers, `0.9` / `0.75` Schedule C expense ratios, `0.2` charitable-to-income ratio, `$1,500` Schedule B floor. They are invisible to the agent except through the tool's prose description, and a CPA cannot review or adjust them without a code change.

Candidate approaches: plain exported constants in `src/semantic/`, an Apache Ossie YAML semantic model (`ai_context` would also ground the agents), or Rego policies evaluated via `@open-policy-agent/opa-wasm`.

The OPA option is written up in `docs/open-policy-agent.md` — evaluated and deliberately not adopted, with the two conditions that would change the answer (rules branching by tax year / state / filing status, or a CPA rather than an engineer owning them).

## Done

### Test suite for `functions/`
Vitest, in `functions/test/`. `npm test` / `npm run test:watch`. 57 tests, offline — the Genkit tools are invoked directly and their implementations never reach the model, so a dummy key in `vitest.config.mts` is enough.

- `taxFields.test.ts` — the semantic layer: money parsing, alias resolution, document classification, income aggregation.
- `tools.test.ts` — the tools themselves, including the cross-tool agreement invariant (accountant and auditor must report the same total income) and a named regression case for each bug listed below.

Verified by mutation: reintroducing the two original bugs in `taxFields.ts` fails 22 of the 57 tests.

### Unify tax semantics across the accountant and auditor tools
`accountantTools.ts` and `auditTools.ts` each carried their own field-alias chains, document-type matching, and income totals, and they disagreed.

Both now read from `functions/src/semantic/taxFields.ts`. See "Semantic layer" in `CLAUDE.md`.

Fixed along the way:
- `auditTools` parsed money with bare `parseFloat`, so `"$120,000.00"` became `0` and `"1,234.56"` became `1`. Now uses the shared `safeFloat`.
- `check_audit_triggers` read income as `income ?? gross_wages ?? total_income`, but the extractor writes `wages` for a W-2 — the high-income triggers never fired on a W-2. Now resolves per document category.
- `cross_reference_income` omitted interest, dividends, and Schedule C income from `totalDocumentedIncome`. On a mixed seven-document set the accountant reported $196,000 and the auditor $65,000; both now report $196,000.
- The auditor's `1099-INT` / `1099-DIV` matching did not strip separators, so `"1099 INT"` was silently skipped.

### Document parsing pipeline (Cloud Functions)
Shipped as `functions/src/flows/extractor.ts` — downloads the file, sends it inline to `gemini-2.5-flash`, and writes structured fields to `taxDocuments/{id}.extractedData`, with `status: "error"` and `errorMessage` on failure. The prompt in that file is the authoritative list of extracted field names per form type.

### Wire filing status from user profile
`Dashboard.tsx` reads `filingStatus` from the user's Firestore profile and surfaces a `filingStatusMissing` prompt when it is absent. The `useState('single')` on line 41 is only an initial value.
