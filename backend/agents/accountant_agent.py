"""
AccountantAgent — tax preparation and optimization for TaxFront.

The Accountant's job is *preparation and planning*, not compliance auditing.
It reads a user's documents and:
  1. Estimates federal tax liability from extracted income data
  2. Identifies deductions and credits the user may qualify for
  3. Compares filing scenarios (MFJ vs MFS, itemize vs standard)
  4. Guides the user toward an accurate, optimized return
  5. Generates a tax preparation summary ready for review or form-filling

The Accountant deliberately does NOT audit for compliance — that's the Auditor.
The Accountant assumes the documents are correct and focuses on optimization.
If both agents are used together, run the Auditor first, fix issues, then the Accountant.
"""

import json
import logging
from typing import List

from langchain_core.tools import BaseTool, StructuredTool
from pydantic import BaseModel, Field

from .base_agent import BaseAgent
from .tools.tax_tools import (
    calculate_federal_tax,
    compare_filing_scenarios,
    estimate_self_employment_tax,
    get_standard_deduction,
    identify_applicable_credits,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Accountant-specific tool input schemas
# ---------------------------------------------------------------------------

class BuildTaxSummaryInput(BaseModel):
    documents_json: str = Field(
        ...,
        description=(
            "JSON string of the documents list returned by fetch_user_documents. "
            "Must include extractedData for each document. "
            "This tool aggregates all income, withholding, and deduction data."
        )
    )
    filing_status: str = Field(
        ...,
        description=(
            "Taxpayer's filing status: single, married_filing_jointly, "
            "married_filing_separately, or head_of_household."
        )
    )


class SuggestDeductionsInput(BaseModel):
    documents_json: str = Field(
        ...,
        description="JSON string of the user's documents from fetch_user_documents."
    )
    filing_status: str = Field(
        ...,
        description="Taxpayer's filing status."
    )
    gross_income: float = Field(
        ...,
        description="Total gross income from all sources."
    )


# ---------------------------------------------------------------------------
# Accountant-specific tool implementations
# ---------------------------------------------------------------------------

def _build_tax_summary(documents_json: str, filing_status: str) -> str:
    """
    Aggregate income, withholding, and deduction data from all documents into
    a single tax summary.

    This is the foundation for tax preparation — the Accountant uses this
    aggregate view to feed into the calculation tools rather than working
    document-by-document.
    """
    try:
        docs_data = json.loads(documents_json) if isinstance(documents_json, str) else documents_json
    except json.JSONDecodeError:
        return json.dumps({"status": "error", "message": "documents_json must be valid JSON."})

    if isinstance(docs_data, dict):
        docs = docs_data.get("documents", [])
    else:
        docs = docs_data

    # Income aggregation
    w2_wages = 0.0
    federal_withheld = 0.0
    state_withheld = 0.0
    social_security_withheld = 0.0
    medicare_withheld = 0.0
    self_employment_income = 0.0
    interest_income = 0.0
    dividend_income = 0.0
    other_income = 0.0
    itemizable_expenses = {}  # Deductions found in documents

    income_sources = []
    unprocessed_docs = []

    for doc in docs:
        ext = doc.get("extractedData") or doc.get("metadata") or {}
        doc_type = str(doc.get("documentType", "")).upper().replace("-", "").replace(" ", "")
        doc_name = doc.get("name", doc.get("id", "unknown"))

        if not ext:
            unprocessed_docs.append(doc_name)
            continue

        # W-2: wages, withholding
        if "W2" in doc_type:
            wages = _safe_float(ext.get("wages") or ext.get("gross_wages") or ext.get("income"))
            fed_wh = _safe_float(ext.get("federal_tax_withheld") or ext.get("federal_income_tax"))
            ss_wh = _safe_float(ext.get("social_security_tax_withheld") or ext.get("ss_withheld"))
            med_wh = _safe_float(ext.get("medicare_tax_withheld") or ext.get("medicare_withheld"))
            st_wh = _safe_float(ext.get("state_tax_withheld") or ext.get("state_income_tax"))

            w2_wages += wages
            federal_withheld += fed_wh
            state_withheld += st_wh
            social_security_withheld += ss_wh
            medicare_withheld += med_wh

            if wages > 0:
                income_sources.append({
                    "source": "W-2",
                    "document": doc_name,
                    "amount": wages,
                    "federal_withheld": fed_wh,
                })

        # 1099-NEC / Schedule C: self-employment
        elif "1099NEC" in doc_type or "SCHEDULEC" in doc_type or "NEC" in doc_type:
            amount = _safe_float(
                ext.get("nonemployee_compensation")
                or ext.get("net_profit")
                or ext.get("income")
            )
            self_employment_income += amount
            if amount > 0:
                income_sources.append({
                    "source": "1099-NEC / Self-employment",
                    "document": doc_name,
                    "amount": amount,
                })

        # 1099-INT: interest
        elif "1099INT" in doc_type or "INT" in doc_type:
            amount = _safe_float(ext.get("interest_income") or ext.get("income") or ext.get("amount"))
            interest_income += amount

        # 1099-DIV: dividends
        elif "1099DIV" in doc_type or "DIV" in doc_type:
            amount = _safe_float(
                ext.get("total_dividends") or ext.get("ordinary_dividends") or ext.get("income")
            )
            dividend_income += amount

        # Mortgage interest statement (1098)
        elif "1098" in doc_type or "MORTGAGE" in doc_type:
            mortgage_interest = _safe_float(
                ext.get("mortgage_interest") or ext.get("interest_paid") or ext.get("amount")
            )
            if mortgage_interest > 0:
                itemizable_expenses["mortgage_interest"] = (
                    itemizable_expenses.get("mortgage_interest", 0) + mortgage_interest
                )

        # Charitable contribution receipts
        elif "CHARITABLE" in doc_type or "DONATION" in doc_type or "RECEIPT" in doc_type:
            donation = _safe_float(ext.get("amount") or ext.get("donation_amount"))
            if donation > 0:
                itemizable_expenses["charitable_contributions"] = (
                    itemizable_expenses.get("charitable_contributions", 0) + donation
                )

        else:
            # Generic: try to extract any income field
            generic_income = _safe_float(ext.get("income") or ext.get("amount"))
            if generic_income > 0:
                other_income += generic_income
                income_sources.append({
                    "source": f"Other ({doc.get('documentType', 'unknown')})",
                    "document": doc_name,
                    "amount": generic_income,
                })

    total_income = (
        w2_wages + self_employment_income + interest_income
        + dividend_income + other_income
    )

    total_itemizable = sum(itemizable_expenses.values())

    return json.dumps({
        "status": "ok",
        "filing_status": filing_status,
        "income_summary": {
            "w2_wages": round(w2_wages, 2),
            "self_employment_income": round(self_employment_income, 2),
            "interest_income": round(interest_income, 2),
            "dividend_income": round(dividend_income, 2),
            "other_income": round(other_income, 2),
            "total_income": round(total_income, 2),
        },
        "withholding_summary": {
            "federal_income_tax_withheld": round(federal_withheld, 2),
            "state_income_tax_withheld": round(state_withheld, 2),
            "social_security_withheld": round(social_security_withheld, 2),
            "medicare_withheld": round(medicare_withheld, 2),
        },
        "itemizable_expenses_found": itemizable_expenses,
        "total_itemizable_expenses": round(total_itemizable, 2),
        "income_sources": income_sources,
        "unprocessed_documents": unprocessed_docs,
        "note": (
            "This summary is based on extracted document data. "
            "Verify against original documents before filing."
        ),
    }, indent=2)


def _suggest_deductions(documents_json: str, filing_status: str, gross_income: float) -> str:
    """
    Identify deductions the taxpayer may qualify for beyond what's in their documents.

    This tool looks at what document types are present (and absent) and generates
    a checklist of commonly missed deductions worth investigating. The goal is to
    prompt the user to gather documentation they may not have uploaded yet.
    """
    try:
        docs_data = json.loads(documents_json) if isinstance(documents_json, str) else documents_json
    except json.JSONDecodeError:
        return json.dumps({"status": "error", "message": "documents_json must be valid JSON."})

    if isinstance(docs_data, dict):
        docs = docs_data.get("documents", [])
    else:
        docs = docs_data

    doc_types_present = {
        str(d.get("documentType", "")).upper().replace("-", "").replace(" ", "")
        for d in docs
    }

    has_w2 = any("W2" in t for t in doc_types_present)
    has_1099nec = any("1099NEC" in t or "NEC" in t for t in doc_types_present)
    has_mortgage = any("1098" in t or "MORTGAGE" in t for t in doc_types_present)
    has_donations = any("CHARITABLE" in t or "DONATION" in t for t in doc_types_present)

    suggestions = []

    # Above-the-line deductions (reduce AGI — valuable for everyone)
    suggestions.append({
        "category": "Above-the-line deductions (reduce AGI)",
        "items": [
            {
                "deduction": "Student loan interest",
                "max_deduction": 2_500,
                "agi_phase_out_start": 75_000 if "SINGLE" in filing_status.upper() else 155_000,
                "action": "Check Form 1098-E from your loan servicer.",
                "form": "Schedule 1, Line 21",
            },
            {
                "deduction": "IRA contribution deduction",
                "max_deduction": 7_000,  # 2024; $8,000 if age 50+
                "note": "Deductibility phases out if covered by workplace plan. See IRS Pub. 590-A.",
                "action": "Confirm IRA contributions made before April 15, 2025.",
                "form": "Schedule 1, Line 20",
            },
            {
                "deduction": "Health Savings Account (HSA) contribution",
                "max_deduction": 4_150,  # 2024 self-only; $8,300 family
                "action": "Check Form 5498-SA from your HSA custodian.",
                "form": "Schedule 1, Line 13 (Form 8889)",
            },
        ]
    })

    # Self-employment deductions
    if has_1099nec:
        suggestions.append({
            "category": "Self-employment deductions (Schedule C)",
            "items": [
                {
                    "deduction": "Self-employed health insurance premiums",
                    "note": "100% deductible above the line if not eligible for employer-sponsored plan.",
                    "form": "Schedule 1, Line 17",
                },
                {
                    "deduction": "SEP-IRA or Solo 401(k) contributions",
                    "max_deduction": 69_000,  # 2024
                    "note": "Up to 25% of net self-employment income.",
                    "form": "Schedule 1, Line 16",
                },
                {
                    "deduction": "Half of self-employment tax",
                    "note": "Automatically calculated via Schedule SE. Reduces AGI.",
                    "form": "Schedule 1, Line 15",
                },
                {
                    "deduction": "Business use of vehicle",
                    "note": "Standard mileage rate: $0.67/mile for 2024 (IRS Notice 2024-08). "
                            "Keep a mileage log.",
                    "form": "Schedule C, Part II",
                },
            ]
        })

    # Itemized deductions (only valuable if total > standard deduction)
    itemized = []
    if has_mortgage:
        itemized.append({
            "deduction": "Mortgage interest",
            "note": "Deductible on acquisition debt up to $750,000 (loans after Dec 15, 2017). "
                    "Check Form 1098 from lender.",
            "form": "Schedule A, Line 8",
        })
    else:
        itemized.append({
            "deduction": "Mortgage interest",
            "note": "No Form 1098 found. If you own a home, obtain Form 1098 from your lender.",
            "form": "Schedule A, Line 8",
        })

    if not has_donations:
        itemized.append({
            "deduction": "Charitable contributions",
            "note": "Cash donations require a receipt; non-cash over $250 requires written acknowledgment. "
                    "No charitable documents found — check if you made any donations.",
            "form": "Schedule A, Lines 11-12",
        })

    itemized.append({
        "deduction": "State and local taxes (SALT)",
        "max_deduction": 10_000,  # TCJA cap, extended through 2025
        "note": "Limited to $10,000 ($5,000 MFS). Includes state income OR sales tax + property tax.",
        "form": "Schedule A, Lines 5-6",
    })
    itemized.append({
        "deduction": "Medical expenses exceeding 7.5% of AGI",
        "threshold_pct": 7.5,
        "threshold_amount": round(gross_income * 0.075, 2),
        "note": "Only the amount above the threshold is deductible. "
                "Often overlooked: long-term care premiums, mileage to doctors.",
        "form": "Schedule A, Lines 1-4",
    })

    suggestions.append({
        "category": "Itemized deductions (Schedule A) — worth claiming if total > standard deduction",
        "standard_deduction_reminder": "Compare your total itemized deductions against the standard deduction before choosing.",
        "items": itemized,
    })

    return json.dumps({
        "status": "ok",
        "filing_status": filing_status,
        "gross_income": gross_income,
        "deduction_suggestions": suggestions,
        "disclaimer": (
            "These are potential deductions to investigate — not confirmed eligibility. "
            "Each deduction has specific requirements. Consult IRS publications or a CPA "
            "to confirm eligibility for your situation."
        ),
    }, indent=2)


def _safe_float(val) -> float:
    """Convert a value to float, returning 0.0 on failure."""
    if val is None:
        return 0.0
    try:
        return float(str(val).replace(",", "").replace("$", "").strip())
    except (ValueError, TypeError):
        return 0.0


# ---------------------------------------------------------------------------
# AccountantAgent
# ---------------------------------------------------------------------------

class AccountantAgent(BaseAgent):
    """
    AI agent that assists with tax preparation, optimization, and planning.

    Responsibilities:
      - Aggregate income and withholding from uploaded documents
      - Calculate estimated federal tax liability
      - Identify deductions and credits the user may be missing
      - Compare filing scenarios (MFJ vs MFS, itemize vs standard)
      - Estimate self-employment tax for freelancers / contractors
      - Generate a tax preparation summary

    NOT responsible for:
      - Compliance auditing or flagging errors in documents (→ AuditorAgent)
      - Actually filling and submitting tax forms (→ form_filler.py)
      - State tax calculations (federal only)
    """

    def _get_specialized_tools(self) -> List[BaseTool]:
        return [
            # Aggregation tool (Firestore-free, operates on the JSON from fetch_user_documents)
            StructuredTool.from_function(
                func=_build_tax_summary,
                name="build_tax_summary",
                description=(
                    "Aggregate income, withholding, and deduction data from all of a user's "
                    "tax documents into a single summary. Pass the full documents JSON from "
                    "fetch_user_documents and the taxpayer's filing status. "
                    "Use this before calling calculate_federal_tax."
                ),
                args_schema=BuildTaxSummaryInput,
            ),
            StructuredTool.from_function(
                func=_suggest_deductions,
                name="suggest_deductions",
                description=(
                    "Identify deductions the taxpayer may qualify for based on their documents "
                    "and income. Returns above-the-line deductions, itemized deductions, and "
                    "self-employment deductions as a checklist. "
                    "Requires the documents JSON, filing status, and gross income."
                ),
                args_schema=SuggestDeductionsInput,
            ),
            # Tax calculation tools from tax_tools.py (shared pure-calculation tools)
            calculate_federal_tax,
            get_standard_deduction,
            estimate_self_employment_tax,
            identify_applicable_credits,
            compare_filing_scenarios,
        ]
