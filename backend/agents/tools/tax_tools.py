"""
Pure tax calculation tools for TaxFront agents.

These tools implement IRS rules as deterministic Python functions — no LLM reasoning,
no Firestore access. The agent uses them as a reliable calculator so it doesn't have
to rely on its own (potentially stale) parametric knowledge for exact dollar thresholds.

All figures are for Tax Year 2024 (returns filed in 2025) unless otherwise noted.
Sources: IRS Rev. Proc. 2023-34, IRS Publication 15-T, IRS Publication 505.
"""

import json
from langchain_core.tools import tool


# ---------------------------------------------------------------------------
# 2024 Federal Income Tax Brackets
# (MFJ = Married Filing Jointly, MFS = Married Filing Separately,
#  HH  = Head of Household, S = Single)
# ---------------------------------------------------------------------------

_BRACKETS_2024 = {
    "single": [
        (11_600,   0.10),
        (47_150,   0.12),
        (100_525,  0.22),
        (191_950,  0.24),
        (243_725,  0.32),
        (609_350,  0.35),
        (float("inf"), 0.37),
    ],
    "married_filing_jointly": [
        (23_200,   0.10),
        (94_300,   0.12),
        (201_050,  0.22),
        (383_900,  0.24),
        (487_450,  0.32),
        (731_200,  0.35),
        (float("inf"), 0.37),
    ],
    "married_filing_separately": [
        (11_600,   0.10),
        (47_150,   0.12),
        (100_525,  0.22),
        (191_950,  0.24),
        (243_725,  0.32),
        (365_600,  0.35),
        (float("inf"), 0.37),
    ],
    "head_of_household": [
        (16_550,   0.10),
        (63_100,   0.12),
        (100_500,  0.22),
        (191_950,  0.24),
        (243_700,  0.32),
        (609_350,  0.35),
        (float("inf"), 0.37),
    ],
}

_STANDARD_DEDUCTIONS_2024 = {
    "single": 14_600,
    "married_filing_jointly": 29_200,
    "married_filing_separately": 14_600,
    "head_of_household": 21_900,
}

# Blind / age-65+ additional standard deduction (2024)
_ADDITIONAL_STANDARD_DEDUCTION_2024 = {
    "single":                   1_550,   # per qualifying condition
    "married_filing_jointly":   1_550,   # per qualifying condition (per spouse)
    "married_filing_separately": 1_550,
    "head_of_household":        1_550,
}

# SE tax: 15.3% on net earnings up to Social Security wage base, 2.9% above
_SS_WAGE_BASE_2024 = 168_600
_SE_RATE_FULL    = 0.153   # below wage base
_SE_RATE_MEDICARE = 0.029  # above wage base


def _normalize_filing_status(status: str) -> str | None:
    """Normalize various ways users might describe filing status. Returns None if unrecognized."""
    mapping = {
        "single": "single",
        "s": "single",
        "mfj": "married_filing_jointly",
        "married filing jointly": "married_filing_jointly",
        "married_filing_jointly": "married_filing_jointly",
        "jointly": "married_filing_jointly",
        "mfs": "married_filing_separately",
        "married filing separately": "married_filing_separately",
        "married_filing_separately": "married_filing_separately",
        "separately": "married_filing_separately",
        "hoh": "head_of_household",
        "head of household": "head_of_household",
        "head_of_household": "head_of_household",
    }
    return mapping.get(status.strip().lower())


def _compute_tax_from_brackets(taxable_income: float, brackets) -> float:
    """
    Compute tax using the marginal bracket structure.
    `brackets` is a list of (upper_bound, rate) tuples sorted ascending.
    """
    tax = 0.0
    prev_upper = 0.0
    for upper, rate in brackets:
        if taxable_income <= 0:
            break
        band = min(taxable_income, upper - prev_upper)
        tax += band * rate
        taxable_income -= band
        prev_upper = upper
    return round(tax, 2)


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

@tool
def calculate_federal_tax(
    gross_income: float,
    filing_status: str,
    deductions: float = 0.0,
    additional_income: float = 0.0,
) -> str:
    """
    Estimate 2024 federal income tax liability.

    Args:
        gross_income: Total wages, salaries, and other ordinary income (W-2 box 1, 1099-NEC, etc.).
        filing_status: One of: single, married_filing_jointly, married_filing_separately, head_of_household.
        deductions: Total itemized deductions. Pass 0 to use the standard deduction automatically.
        additional_income: Other taxable income not in gross_income (interest, dividends, capital gains, etc.).

    Returns a JSON object with taxable_income, estimated_tax, effective_rate, and marginal_rate.
    """
    try:
        status = _normalize_filing_status(filing_status)
        if status is None:
            return json.dumps({"status": "error", "message": f"Unknown filing status: '{filing_status}'. "
                               "Use: single, married_filing_jointly, married_filing_separately, head_of_household."})
        brackets = _BRACKETS_2024[status]

        std_deduction = _STANDARD_DEDUCTIONS_2024[status]
        # Use whichever is larger — this is the most common error in DIY returns
        actual_deduction = max(deductions, std_deduction)
        used_standard = actual_deduction == std_deduction

        total_income = gross_income + additional_income
        taxable_income = max(0.0, total_income - actual_deduction)
        estimated_tax = _compute_tax_from_brackets(taxable_income, brackets)

        # Marginal rate = rate of the bracket the last dollar of income falls into
        marginal_rate = 0.0
        for upper, rate in brackets:
            if taxable_income <= upper:
                marginal_rate = rate
                break

        effective_rate = round(estimated_tax / total_income, 4) if total_income > 0 else 0.0

        return json.dumps({
            "status": "ok",
            "tax_year": 2024,
            "filing_status": status,
            "gross_income": gross_income,
            "additional_income": additional_income,
            "total_income": total_income,
            "deduction_used": actual_deduction,
            "used_standard_deduction": used_standard,
            "standard_deduction_amount": std_deduction,
            "taxable_income": taxable_income,
            "estimated_federal_tax": estimated_tax,
            "effective_rate_pct": round(effective_rate * 100, 2),
            "marginal_rate_pct": round(marginal_rate * 100, 1),
            "note": (
                "This is a simplified estimate. It does not account for AMT, "
                "NIIT, credits, phase-outs, or state taxes."
            ),
        })
    except Exception as exc:
        return json.dumps({"status": "error", "message": str(exc)})


@tool
def get_standard_deduction(filing_status: str, age_65_or_blind_count: int = 0) -> str:
    """
    Return the 2024 standard deduction for a given filing status.

    Args:
        filing_status: One of: single, married_filing_jointly, married_filing_separately, head_of_household.
        age_65_or_blind_count: Number of qualifying conditions (each taxpayer aged 65+ or legally blind
            counts as one). For MFJ, max is 4 (two spouses, each can qualify twice).

    Returns the base standard deduction plus any additional amounts.
    """
    try:
        status = _normalize_filing_status(filing_status)
        if status is None:
            return json.dumps({"status": "error", "message": f"Unknown filing status: '{filing_status}'."})
        base = _STANDARD_DEDUCTIONS_2024[status]

        additional_per = _ADDITIONAL_STANDARD_DEDUCTION_2024[status]
        additional_total = additional_per * age_65_or_blind_count
        total = base + additional_total

        return json.dumps({
            "status": "ok",
            "tax_year": 2024,
            "filing_status": status,
            "base_standard_deduction": base,
            "additional_for_age_or_blindness": additional_total,
            "total_standard_deduction": total,
        })
    except Exception as exc:
        return json.dumps({"status": "error", "message": str(exc)})


@tool
def estimate_self_employment_tax(net_profit: float) -> str:
    """
    Estimate self-employment (SE) tax for Schedule SE (2024).

    Self-employment tax is 15.3% on 92.35% of net earnings up to the Social Security
    wage base ($168,600 for 2024), then 2.9% (Medicare only) above that.
    The deductible half of SE tax reduces AGI.

    Args:
        net_profit: Net profit from Schedule C / self-employment activities.
    """
    try:
        if net_profit <= 0:
            return json.dumps({
                "status": "ok",
                "net_profit": net_profit,
                "se_tax": 0.0,
                "deductible_half": 0.0,
                "note": "No SE tax owed on a net loss or zero profit."
            })

        # IRS multiplies net profit by 0.9235 before applying rates (the 7.65%
        # employer-equivalent portion isn't taxed on itself)
        net_earnings = net_profit * 0.9235

        if net_earnings <= _SS_WAGE_BASE_2024:
            se_tax = net_earnings * _SE_RATE_FULL
        else:
            se_tax = (_SS_WAGE_BASE_2024 * _SE_RATE_FULL +
                      (net_earnings - _SS_WAGE_BASE_2024) * _SE_RATE_MEDICARE)

        se_tax = round(se_tax, 2)
        deductible_half = round(se_tax / 2, 2)

        return json.dumps({
            "status": "ok",
            "tax_year": 2024,
            "net_profit": net_profit,
            "net_earnings_subject_to_se": round(net_earnings, 2),
            "ss_wage_base": _SS_WAGE_BASE_2024,
            "se_tax": se_tax,
            "deductible_half_of_se_tax": deductible_half,
            "note": (
                "Deduct the deductible_half from gross income when computing AGI "
                "(Form 1040, Schedule 1, Part II)."
            ),
        })
    except Exception as exc:
        return json.dumps({"status": "error", "message": str(exc)})


@tool
def identify_applicable_credits(
    filing_status: str,
    agi: float,
    has_dependent_children: bool = False,
    child_count: int = 0,
    paid_child_care: bool = False,
    paid_education_expenses: bool = False,
    has_retirement_contributions: bool = False,
) -> str:
    """
    Identify common 2024 federal tax credits the taxpayer may qualify for.

    This is a screening tool — it flags credits worth investigating further.
    It does NOT compute the exact credit amount (those require additional inputs).

    Args:
        filing_status: Tax filing status.
        agi: Adjusted Gross Income.
        has_dependent_children: True if taxpayer has qualifying dependent children.
        child_count: Number of qualifying children under age 17.
        paid_child_care: True if taxpayer paid for child/dependent care to work.
        paid_education_expenses: True if taxpayer or dependent paid qualified tuition.
        has_retirement_contributions: True if taxpayer contributed to IRA / 401(k).
    """
    try:
        status = _normalize_filing_status(filing_status)
        credits = []

        # Child Tax Credit (CTC) — up to $2,000 per qualifying child
        # Phase-out starts at $200k single / $400k MFJ
        ctc_threshold = 400_000 if status == "married_filing_jointly" else 200_000
        if has_dependent_children and child_count > 0 and agi < ctc_threshold:
            credits.append({
                "credit": "Child Tax Credit (CTC)",
                "max_per_child": 2_000,
                "max_refundable_per_child": 1_700,
                "qualifying_children": child_count,
                "potential_max": child_count * 2_000,
                "form": "Schedule 8812",
            })

        # Earned Income Tax Credit (EITC) — rough income thresholds for 2024
        eitc_limits = {
            0: (18_591 if status == "married_filing_jointly" else 17_640),
            1: (49_084 if status == "married_filing_jointly" else 46_560),
            2: (55_768 if status == "married_filing_jointly" else 52_918),
            3: (59_899 if status == "married_filing_jointly" else 56_838),
        }
        children_for_eitc = min(child_count, 3)
        eitc_limit = eitc_limits.get(children_for_eitc, eitc_limits[3])
        if agi < eitc_limit and status != "married_filing_separately":
            credits.append({
                "credit": "Earned Income Tax Credit (EITC)",
                "qualifying_children_counted": children_for_eitc,
                "agi_threshold_used": eitc_limit,
                "note": "Refundable. Use Schedule EIC and IRS EITC Assistant to confirm.",
                "form": "Schedule EIC",
            })

        # Child and Dependent Care Credit
        if paid_child_care and has_dependent_children:
            credits.append({
                "credit": "Child and Dependent Care Credit",
                "max_expenses_covered": 6_000,  # for 2+ qualifying persons
                "note": "Non-refundable. Employer-provided FSA benefits reduce the expense base.",
                "form": "Form 2441",
            })

        # American Opportunity Credit / Lifetime Learning Credit
        if paid_education_expenses:
            aotc_limit = 180_000 if status == "married_filing_jointly" else 90_000
            if agi < aotc_limit:
                credits.append({
                    "credit": "American Opportunity Tax Credit (AOTC)",
                    "max_credit": 2_500,
                    "refundable_portion": "40% (up to $1,000)",
                    "note": "First 4 years of higher education only.",
                    "form": "Form 8863",
                })
            credits.append({
                "credit": "Lifetime Learning Credit (LLC)",
                "max_credit": 2_000,
                "note": "Non-refundable. No limit on years of study. Cannot claim with AOTC.",
                "form": "Form 8863",
            })

        # Saver's Credit (Retirement Savings Contributions Credit)
        savers_limits = {
            "married_filing_jointly": 76_500,
            "head_of_household": 57_375,
            "single": 38_250,
            "married_filing_separately": 38_250,
        }
        savers_limit = savers_limits.get(status, 38_250)
        if has_retirement_contributions and agi < savers_limit:
            credits.append({
                "credit": "Saver's Credit (Retirement Savings Contributions Credit)",
                "max_credit": 1_000,  # $2,000 MFJ
                "note": "Non-refundable. Rate (10%/20%/50%) depends on AGI and filing status.",
                "form": "Form 8880",
            })

        if not credits:
            return json.dumps({
                "status": "ok",
                "credits_identified": [],
                "message": "No common credits identified based on the provided information. "
                           "Consider consulting a tax professional for less common credits.",
            })

        return json.dumps({
            "status": "ok",
            "credits_identified": credits,
            "disclaimer": (
                "This is a screening tool only. Exact eligibility depends on additional "
                "factors. Verify each credit with the relevant IRS form instructions."
            ),
        }, indent=2)

    except Exception as exc:
        return json.dumps({"status": "error", "message": str(exc)})


@tool
def compare_filing_scenarios(
    spouse1_income: float,
    spouse2_income: float,
    total_deductions: float = 0.0,
) -> str:
    """
    Compare Married Filing Jointly vs. Married Filing Separately tax liability.

    Args:
        spouse1_income: Gross income for spouse 1.
        spouse2_income: Gross income for spouse 2.
        total_deductions: Combined itemized deductions (pass 0 to use standard deductions).
    """
    try:
        def compute(status: str, income: float, deductions: float) -> dict:
            s = _normalize_filing_status(status)
            brackets = _BRACKETS_2024[s]
            std = _STANDARD_DEDUCTIONS_2024[s]
            deduction_used = max(deductions, std)
            taxable = max(0.0, income - deduction_used)
            tax = _compute_tax_from_brackets(taxable, brackets)
            return {
                "filing_status": s,
                "income": income,
                "deduction_used": deduction_used,
                "taxable_income": taxable,
                "estimated_tax": tax,
            }

        # MFJ — combined income, one return
        mfj = compute(
            "married_filing_jointly",
            spouse1_income + spouse2_income,
            total_deductions
        )

        # MFS — each spouse files separately, deductions split evenly
        # (splitting evenly is a simplification; optimal split requires full analysis)
        mfs_1 = compute("married_filing_separately", spouse1_income, total_deductions / 2)
        mfs_2 = compute("married_filing_separately", spouse2_income, total_deductions / 2)
        mfs_combined_tax = round(mfs_1["estimated_tax"] + mfs_2["estimated_tax"], 2)

        difference = round(mfj["estimated_tax"] - mfs_combined_tax, 2)
        recommended = "married_filing_jointly" if mfj["estimated_tax"] <= mfs_combined_tax else "married_filing_separately"

        return json.dumps({
            "status": "ok",
            "tax_year": 2024,
            "married_filing_jointly": mfj,
            "married_filing_separately": {
                "spouse1": mfs_1,
                "spouse2": mfs_2,
                "combined_tax": mfs_combined_tax,
            },
            "tax_difference_mfj_minus_mfs": difference,
            "lower_tax_option": recommended,
            "note": (
                "MFS disqualifies several credits (EITC, education credits, child care credit) "
                "and raises income thresholds for others. Lower tax alone may not make MFS "
                "the right choice. Consult a tax professional before choosing MFS."
            ),
        }, indent=2)

    except Exception as exc:
        return json.dumps({"status": "error", "message": str(exc)})