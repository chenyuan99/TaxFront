# Open Policy Agent (Rego) for Audit Rules — Evaluation

**Status:** evaluated, not adopted. Revisit when the triggers listed below outgrow hand-written TypeScript.

## The candidate

[Open Policy Agent](https://www.openpolicyagent.org/) is a general-purpose policy engine. Policies are written in Rego, a declarative query language: a policy takes a JSON `input` document and produces a decision — commonly a set of violations.

The obvious target in TaxFront is `check_audit_triggers` in `functions/src/tools/auditTools.ts`. It already has exactly that shape: extracted document data in, a list of `{ trigger, severity, detail, field }` objects out. The rules are currently hardcoded constants:

| Rule | Constant | Severity |
|---|---|---|
| High-income return | income > $1,000,000 | HIGH |
| High-income return | income > $500,000 | MEDIUM |
| Round-number income | income is an exact multiple of 1,000 | LOW |
| Extreme Schedule C expense ratio | expenses / revenue > 0.90 | HIGH |
| High Schedule C expense ratio | expenses / revenue > 0.75 | MEDIUM |
| Business net loss | net_profit < 0 | MEDIUM |
| Outsized charitable deduction | charitable / income > 0.20 | HIGH |
| Schedule B required | interest + dividends > $1,500 | MEDIUM |

Eight constants, spread across two functions, invisible to anyone who cannot read TypeScript.

## What it would look like

Rules become data:

```rego
package taxfront.audit

import rego.v1

triggers contains t if {
	input.income > 1000000
	t := {
		"trigger": "High-income return (>$1M)",
		"severity": "HIGH",
		"detail": "IRS audits ~5% of returns with income over $1M (IRS Data Book 2023).",
		"field": "income",
	}
}

triggers contains t if {
	ratio := input.total_expenses / (input.net_profit + input.total_expenses)
	ratio > 0.9
	t := {
		"trigger": "Extreme Schedule C expense ratio (>90%)",
		"severity": "HIGH",
		"field": "total_expenses",
	}
}
```

No separate service is required. Rego compiles to WebAssembly and loads inside the existing Cloud Function:

```bash
opa build -t wasm -e taxfront/audit/triggers policy/ -o bundle.tar.gz
```

The function then evaluates it via [`@open-policy-agent/opa-wasm`](https://github.com/open-policy-agent/npm-opa-wasm). The `input` document is whatever the tool already assembles — which, since the semantic layer landed, is a clean canonical record rather than raw extracted fields.

## Why it is not adopted yet

**The rule set is too small.** Eight constants do not justify a second language, an `opa` binary in CI, a WASM artifact in the build, and WASM instantiation on every cold start. Hand-written conditionals are cheaper to read and cheaper to run at this size.

**Most of OPA's value is elsewhere.** Bundle distribution, decision logging, and centralized policy management exist to make *authorization* decisions consistent across many services. These triggers are not authorization — they are heuristic scoring inside one function. Adopting OPA here buys the language and little of the platform.

**Rego has a real learning curve.** Partial set rules, `default`, comprehension semantics, and the absence of ordinary control flow all take time. That cost is worth paying when non-engineers own the rules; today engineers do.

## What would change the answer

Adopt it when either becomes true:

- **The rule set branches.** Per-tax-year thresholds, per-state rules, or per-filing-status variants would turn eight constants into dozens of near-duplicates. That is the point where a rule language stops being overhead.
- **A CPA owns the rules.** If tax professionals rather than engineers should be adjusting audit thresholds, Rego in a reviewable policy directory beats constants buried in `auditTools.ts` — a policy file can be diffed and approved without a TypeScript review.

If neither happens, the cheaper move covering most of the benefit is to lift the constants into exported values under `functions/src/semantic/`, or into an Apache Ossie YAML model where they sit alongside the metric definitions.

## Relationship to the semantic layer

The two are complementary, not competing. A policy engine needs a well-formed `input` document, and `collectIncome` in `functions/src/semantic/taxFields.ts` produces exactly that. Whichever way this decision goes, the semantic layer is a prerequisite: before it existed, the accountant and auditor tools resolved the same fields differently, so any policy evaluated against their output would have inherited the disagreement.

## Not a fit: role-based access

OPA is sometimes proposed for the role check in `frontend/src/App.tsx`, which grants accountant privileges when the user's email contains `"accountant"`. That is a genuine weakness — it is a client-side check on an attacker-controlled string — but OPA is the wrong remedy. The enforcement points in this stack are Firebase Auth and Firestore security rules, and Firestore rules are their own language that OPA cannot supply. The fix is Firebase custom claims set by a trusted Cloud Function, enforced in `firestore.rules`.

## References

- [OPA documentation](https://www.openpolicyagent.org/docs/latest/)
- [Rego policy language](https://www.openpolicyagent.org/docs/latest/policy-language/)
- [npm-opa-wasm](https://github.com/open-policy-agent/npm-opa-wasm)
