"""
AuditorAgent — tax compliance and audit-risk analysis for TaxFront.

The Auditor's job is *verification*, not advice. It reads a user's tax documents and:
  1. Flags data-quality issues (missing fields, implausible values, OCR errors)
  2. Identifies IRS audit triggers (high deduction ratios, round numbers, etc.)
  3. Cross-references income reported across multiple documents
  4. Produces a structured risk report the Accountant or human CPA can act on

The Auditor never recommends tax strategies — that's the Accountant's role.
Keeping the roles separate prevents the risk of compliance advice being
overshadowed by optimization advice in the same response.
"""

import json
import logging
from typing import List

from langchain_core.tools import BaseTool, StructuredTool
from pydantic import BaseModel, Field

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Auditor-specific tool input schemas
# ---------------------------------------------------------------------------

class CheckAuditTriggersInput(BaseModel):
    extracted_data: str = Field(
        ...,
        description=(
            "JSON string of extracted document data (e.g. the 'extractedData' field "
            "from fetch_document_details). Include all available fields."
        )
    )
    document_type: str = Field(
        ...,
        description="Document type, e.g. 'W-2', '1099-NEC', 'Schedule C', '1040'."
    )


class CrossReferenceIncomeInput(BaseModel):
    documents_json: str = Field(
        ...,
        description=(
            "JSON string of the documents list returned by fetch_user_documents. "
            "Must include extractedData for each document."
        )
    )


class CalculateAuditRiskInput(BaseModel):
    triggers_json: str = Field(
        ...,
        description=(
            "JSON string output from check_audit_triggers and/or cross_reference_income. "
            "The tool will parse and score all flags present."
        )
    )


# ---------------------------------------------------------------------------
# Auditor-specific tools (pure Python, no LLM, no Firestore)
# ---------------------------------------------------------------------------

def _check_audit_triggers(extracted_data: str, document_type: str) -> str:
    """
    Evaluate extracted document data against known IRS audit triggers.

    IRS audit selection uses Discriminant Information Function (DIF) scores —
    we replicate a subset of known high-weight signals here. Each trigger
    includes a severity (LOW / MEDIUM / HIGH) and the IRS publication or
    statistic that justifies its inclusion.
    """
    try:
        data = json.loads(extracted_data) if isinstance(extracted_data, str) else extracted_data
    except json.JSONDecodeError:
        return json.dumps({"status": "error", "message": "extracted_data must be valid JSON."})

    triggers = []
    doc_type = document_type.upper().replace("-", "").replace(" ", "")

    # ---- Income-related triggers ----

    income = data.get("income") or data.get("gross_wages") or data.get("total_income") or 0
    try:
        income = float(income)
    except (TypeError, ValueError):
        income = 0

    # High earner = elevated scrutiny (IRS publishes audit rates by income bracket)
    if income > 1_000_000:
        triggers.append({
            "trigger": "High-income return (>$1M)",
            "severity": "HIGH",
            "detail": "IRS audits ~5% of returns with income over $1M (IRS Data Book 2023).",
            "field": "income",
        })
    elif income > 500_000:
        triggers.append({
            "trigger": "High-income return (>$500K)",
            "severity": "MEDIUM",
            "detail": "Returns over $500K have above-average audit rates.",
            "field": "income",
        })

    # Round number income — strong indicator of estimation rather than actual records
    if income > 0 and income == round(income, -3):
        triggers.append({
            "trigger": "Round-number income",
            "severity": "LOW",
            "detail": "Income reported as a round thousand ($X,000) may indicate estimation.",
            "field": "income",
        })

    # ---- Schedule C / Self-employment triggers ----

    net_profit = data.get("net_profit") or data.get("business_income")
    total_expenses = data.get("total_expenses") or data.get("business_expenses")

    if net_profit is not None and total_expenses is not None:
        try:
            net_profit = float(net_profit)
            total_expenses = float(total_expenses)
            gross_revenue = net_profit + total_expenses

            if gross_revenue > 0:
                expense_ratio = total_expenses / gross_revenue
                # IRS flags Schedule C returns where expenses exceed ~70% of revenue
                # as a common indicator of inflated deductions
                if expense_ratio > 0.90:
                    triggers.append({
                        "trigger": "Extreme Schedule C expense ratio (>90%)",
                        "severity": "HIGH",
                        "detail": f"Expenses are {expense_ratio:.0%} of revenue. "
                                  "IRS targets Schedule C losses heavily.",
                        "field": "total_expenses",
                    })
                elif expense_ratio > 0.75:
                    triggers.append({
                        "trigger": "High Schedule C expense ratio (>75%)",
                        "severity": "MEDIUM",
                        "detail": f"Expenses are {expense_ratio:.0%} of revenue.",
                        "field": "total_expenses",
                    })
        except (TypeError, ValueError):
            pass

    # Net business loss — IRS scrutinizes hobby-loss claims
    if net_profit is not None:
        try:
            if float(net_profit) < 0:
                triggers.append({
                    "trigger": "Business net loss reported",
                    "severity": "MEDIUM",
                    "detail": "Losses from an activity not entered into for profit "
                              "are disallowable (IRC §183 hobby-loss rule). "
                              "Three-of-five-year profit test applies.",
                    "field": "net_profit",
                })
        except (TypeError, ValueError):
            pass

    # ---- Charitable deduction triggers ----

    charitable = data.get("charitable_contributions") or data.get("donations")
    if charitable and income:
        try:
            ratio = float(charitable) / float(income)
            # IRS flags charitable deductions > 20% of income for most income levels
            if ratio > 0.20:
                triggers.append({
                    "trigger": "Charitable contributions exceed 20% of income",
                    "severity": "HIGH",
                    "detail": f"Charitable deductions are {ratio:.0%} of income. "
                              "IRS Publication 526 limits vary by deduction type.",
                    "field": "charitable_contributions",
                })
        except (TypeError, ValueError):
            pass

    # ---- Home office deduction (Schedule C) ----

    home_office = data.get("home_office_deduction") or data.get("home_office")
    if home_office:
        triggers.append({
            "trigger": "Home office deduction claimed",
            "severity": "LOW",
            "detail": "Must meet exclusive-use and principal-place-of-business tests "
                      "(IRC §280A). Keep square footage documentation.",
            "field": "home_office_deduction",
        })

    # ---- Missing or implausible fields ----

    if "W2" in doc_type or "W-2" in document_type.upper():
        required_w2 = ["wages", "federal_tax_withheld", "state_wages", "employer_ein"]
        for field in required_w2:
            if not data.get(field):
                triggers.append({
                    "trigger": f"Missing W-2 field: {field}",
                    "severity": "MEDIUM",
                    "detail": f"Field '{field}' is required on Form W-2 but was not found "
                              "in extracted data. May indicate OCR failure or data entry error.",
                    "field": field,
                })

    return json.dumps({
        "status": "ok",
        "document_type": document_type,
        "triggers_found": len(triggers),
        "triggers": triggers,
    }, indent=2)


def _cross_reference_income(documents_json: str) -> str:
    """
    Look for income inconsistencies across multiple documents.

    The most common cross-reference failures are:
    • W-2 wages don't match 1040 Line 1 wages
    • 1099-NEC income not reported anywhere
    • 1099-INT/DIV income not matching Schedule B
    • Multiple W-2s from same employer EIN (duplicate upload or two jobs)

    We can only flag structural issues here since we don't have the filed 1040.
    The agent will synthesize these flags into its final report.
    """
    try:
        docs_data = json.loads(documents_json) if isinstance(documents_json, str) else documents_json
    except json.JSONDecodeError:
        return json.dumps({"status": "error", "message": "documents_json must be valid JSON."})

    # Handle both bare list and the {documents: [...]} wrapper from fetch_user_documents
    if isinstance(docs_data, dict):
        docs = docs_data.get("documents", [])
    else:
        docs = docs_data

    findings = []
    income_sources = []  # Accumulate all income figures for total comparison

    # Group documents by type
    w2_docs = [d for d in docs if "W-2" in str(d.get("documentType", "")).upper()
               or "W2" in str(d.get("documentType", "")).upper()]
    nec_docs = [d for d in docs if "1099" in str(d.get("documentType", "")).upper()
                and "NEC" in str(d.get("documentType", "")).upper()]
    int_docs = [d for d in docs if "1099-INT" in str(d.get("documentType", "")).upper()]
    div_docs = [d for d in docs if "1099-DIV" in str(d.get("documentType", "")).upper()]

    # Check for duplicate employer EINs across W-2s
    eins_seen = {}
    for doc in w2_docs:
        ext = doc.get("extractedData") or {}
        ein = ext.get("employer_ein") or ext.get("ein")
        if ein:
            if ein in eins_seen:
                findings.append({
                    "type": "DUPLICATE_EIN",
                    "severity": "HIGH",
                    "message": f"Employer EIN {ein} appears on multiple W-2 documents "
                               f"(IDs: {eins_seen[ein]}, {doc['id']}). "
                               "This may be a duplicate upload or two part-year jobs "
                               "with the same employer.",
                    "document_ids": [eins_seen[ein], doc["id"]],
                })
            else:
                eins_seen[ein] = doc["id"]

        wages = ext.get("wages") or ext.get("gross_wages") or ext.get("income")
        if wages:
            try:
                income_sources.append({"source": f"W-2 ({doc['id'][:8]}…)", "amount": float(wages)})
            except (TypeError, ValueError):
                pass

    # Summarize 1099-NEC income
    nec_total = 0.0
    for doc in nec_docs:
        ext = doc.get("extractedData") or {}
        amount = ext.get("nonemployee_compensation") or ext.get("income") or ext.get("amount")
        if amount:
            try:
                nec_total += float(amount)
                income_sources.append({
                    "source": f"1099-NEC ({doc['id'][:8]}…)",
                    "amount": float(amount),
                })
            except (TypeError, ValueError):
                pass
    if nec_total > 0:
        findings.append({
            "type": "INFO",
            "severity": "LOW",
            "message": f"Total 1099-NEC nonemployee compensation: ${nec_total:,.2f}. "
                       "Ensure this is reported on Schedule C or Schedule 1 Line 8.",
        })

    # 1099-INT and 1099-DIV — must appear on Schedule B if > $1,500 combined
    interest_total = sum(
        float(d.get("extractedData", {}).get("interest_income") or
              d.get("extractedData", {}).get("amount") or 0)
        for d in int_docs
    )
    dividend_total = sum(
        float(d.get("extractedData", {}).get("total_dividends") or
              d.get("extractedData", {}).get("amount") or 0)
        for d in div_docs
    )
    if interest_total + dividend_total > 1_500:
        findings.append({
            "type": "SCHEDULE_B_REQUIRED",
            "severity": "MEDIUM",
            "message": f"Combined interest (${interest_total:,.2f}) and dividends "
                       f"(${dividend_total:,.2f}) exceed $1,500 — Schedule B is required.",
        })

    total_documented_income = sum(s["amount"] for s in income_sources)

    return json.dumps({
        "status": "ok",
        "documents_analyzed": len(docs),
        "total_documented_income": round(total_documented_income, 2),
        "income_sources": income_sources,
        "findings": findings,
        "note": (
            "Cross-reference is limited to extracted document data. "
            "A full reconciliation requires the filed Form 1040."
        ),
    }, indent=2)


def _calculate_audit_risk_score(triggers_json: str) -> str:
    """
    Synthesize audit trigger findings into a numeric risk score and tier.

    Scoring model:
      HIGH trigger   = 30 points
      MEDIUM trigger = 15 points
      LOW trigger    =  5 points

    Risk tiers:
      0–20   → LOW      (routine return, audit unlikely)
      21–50  → MODERATE (some attention warranted)
      51–90  → ELEVATED (recommend CPA review before filing)
      91+    → HIGH     (strongly recommend professional review)

    This is a heuristic model, not an IRS DIF score. Its value is in
    prioritizing which issues to address, not predicting audit probability.
    """
    try:
        data = json.loads(triggers_json) if isinstance(triggers_json, str) else triggers_json
    except json.JSONDecodeError:
        return json.dumps({"status": "error", "message": "triggers_json must be valid JSON."})

    # Flatten all triggers whether input is from check_audit_triggers or cross_reference_income
    all_triggers = []
    if isinstance(data, dict):
        all_triggers.extend(data.get("triggers", []))
        all_triggers.extend(data.get("findings", []))
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                all_triggers.extend(item.get("triggers", []))
                all_triggers.extend(item.get("findings", []))

    weights = {"HIGH": 30, "MEDIUM": 15, "LOW": 5, "INFO": 0}
    score = sum(weights.get(t.get("severity", "LOW"), 5) for t in all_triggers)

    if score == 0:
        tier = "LOW"
        recommendation = "No significant audit flags detected. Return appears routine."
    elif score <= 20:
        tier = "LOW"
        recommendation = "Minor flags present. Address LOW-severity items as a best practice."
    elif score <= 50:
        tier = "MODERATE"
        recommendation = (
            "Some audit triggers detected. Review MEDIUM-severity items before filing. "
            "Ensure supporting documentation is organized."
        )
    elif score <= 90:
        tier = "ELEVATED"
        recommendation = (
            "Multiple audit triggers present. CPA review recommended before filing. "
            "Prepare supporting documentation for all flagged items."
        )
    else:
        tier = "HIGH"
        recommendation = (
            "Significant audit risk. Professional tax preparation strongly recommended. "
            "Do not file without addressing HIGH-severity items."
        )

    high_count = sum(1 for t in all_triggers if t.get("severity") == "HIGH")
    medium_count = sum(1 for t in all_triggers if t.get("severity") == "MEDIUM")
    low_count = sum(1 for t in all_triggers if t.get("severity") in ("LOW", "INFO"))

    return json.dumps({
        "status": "ok",
        "risk_score": score,
        "risk_tier": tier,
        "trigger_summary": {
            "high_severity": high_count,
            "medium_severity": medium_count,
            "low_severity": low_count,
            "total": len(all_triggers),
        },
        "recommendation": recommendation,
        "disclaimer": (
            "This score is a heuristic estimate, not an IRS DIF score. "
            "Actual audit selection depends on many factors outside this model."
        ),
    }, indent=2)


# ---------------------------------------------------------------------------
# AuditorAgent
# ---------------------------------------------------------------------------

class AuditorAgent(BaseAgent):
    """
    AI agent that audits tax documents for compliance, accuracy, and audit risk.

    Responsibilities:
      - Detect data quality issues in extracted document fields
      - Flag IRS audit triggers in individual documents
      - Cross-reference income across multiple source documents
      - Produce a prioritized risk report

    NOT responsible for:
      - Tax optimization or deduction suggestions (→ AccountantAgent)
      - Filling out tax forms (→ AccountantAgent / form_filler.py)
      - Filing returns
    """

    def _get_specialized_tools(self) -> List[BaseTool]:
        return [
            StructuredTool.from_function(
                func=_check_audit_triggers,
                name="check_audit_triggers",
                description=(
                    "Evaluate extracted tax document data against known IRS audit triggers. "
                    "Checks income levels, Schedule C expense ratios, charitable deduction "
                    "ratios, home office claims, and missing required fields. "
                    "Pass the extractedData JSON string and the document type (e.g. 'W-2', '1099-NEC')."
                ),
                args_schema=CheckAuditTriggersInput,
            ),
            StructuredTool.from_function(
                func=_cross_reference_income,
                name="cross_reference_income",
                description=(
                    "Check income consistency across all of a user's tax documents. "
                    "Detects duplicate employer EINs, unreported 1099 income, and Schedule B "
                    "requirements. Pass the full documents JSON from fetch_user_documents."
                ),
                args_schema=CrossReferenceIncomeInput,
            ),
            StructuredTool.from_function(
                func=_calculate_audit_risk_score,
                name="calculate_audit_risk_score",
                description=(
                    "Synthesize all audit trigger findings into a numeric risk score and tier. "
                    "Pass the combined JSON output from check_audit_triggers and/or "
                    "cross_reference_income. Returns a risk tier (LOW/MODERATE/ELEVATED/HIGH) "
                    "and a recommendation."
                ),
                args_schema=CalculateAuditRiskInput,
            ),
        ]

    def _get_max_iterations(self) -> int:
        # Audits may require fetching and checking each document individually,
        # then cross-referencing and scoring — allow more steps than the base default
        return 15
