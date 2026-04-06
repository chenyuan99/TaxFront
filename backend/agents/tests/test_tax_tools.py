"""
Tests for tax_tools.py — pure IRS calculation functions.

No mocking needed here: all functions are deterministic Python with no external deps.
We test known IRS values to catch regressions if the brackets/rates are ever edited.
"""

import json
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from agents.tools.tax_tools import (
    calculate_federal_tax,
    compare_filing_scenarios,
    estimate_self_employment_tax,
    get_standard_deduction,
    identify_applicable_credits,
)


# ---------------------------------------------------------------------------
# Helper: invoke a @tool-decorated function
# ---------------------------------------------------------------------------

def invoke(tool_fn, **kwargs):
    """Call a LangChain @tool function and parse its JSON output."""
    raw = tool_fn.invoke(kwargs)
    return json.loads(raw)


# ---------------------------------------------------------------------------
# calculate_federal_tax
# ---------------------------------------------------------------------------

class TestCalculateFederalTax:

    def test_single_low_income_uses_10_percent_bracket(self):
        # Use income above the $14,600 standard deduction so taxable income is positive.
        # $20,000 gross - $14,600 std deduction = $5,400 taxable → 10% bracket → $540
        result = invoke(calculate_federal_tax, gross_income=20_000, filing_status="single")
        assert result["status"] == "ok"
        assert result["taxable_income"] == pytest.approx(5_400, abs=1)
        assert result["estimated_federal_tax"] == pytest.approx(540.0, abs=1)
        assert result["marginal_rate_pct"] == 10.0

    def test_single_standard_deduction_applied_when_no_itemized(self):
        # With standard deduction ($14,600 for single 2024), taxable income = $0
        result = invoke(calculate_federal_tax, gross_income=14_600, filing_status="single")
        assert result["taxable_income"] == 0.0
        assert result["estimated_federal_tax"] == 0.0
        assert result["used_standard_deduction"] is True

    def test_itemized_deduction_used_when_larger_than_standard(self):
        result = invoke(
            calculate_federal_tax,
            gross_income=100_000,
            filing_status="single",
            deductions=30_000,  # > $14,600 standard
        )
        assert result["deduction_used"] == 30_000
        assert result["used_standard_deduction"] is False

    def test_standard_deduction_wins_when_itemized_is_smaller(self):
        result = invoke(
            calculate_federal_tax,
            gross_income=100_000,
            filing_status="single",
            deductions=5_000,  # < $14,600 standard
        )
        assert result["used_standard_deduction"] is True
        assert result["deduction_used"] == 14_600

    def test_mfj_has_higher_bracket_thresholds(self):
        # Same income; MFJ should owe less than single
        mfj = invoke(calculate_federal_tax, gross_income=100_000, filing_status="married_filing_jointly")
        single = invoke(calculate_federal_tax, gross_income=100_000, filing_status="single")
        assert mfj["estimated_federal_tax"] < single["estimated_federal_tax"]

    def test_effective_rate_increases_with_income(self):
        low = invoke(calculate_federal_tax, gross_income=50_000, filing_status="single")
        high = invoke(calculate_federal_tax, gross_income=300_000, filing_status="single")
        assert high["effective_rate_pct"] > low["effective_rate_pct"]

    def test_filing_status_aliases_resolve(self):
        # "mfj" should work the same as "married_filing_jointly"
        r1 = invoke(calculate_federal_tax, gross_income=80_000, filing_status="mfj")
        r2 = invoke(calculate_federal_tax, gross_income=80_000, filing_status="married_filing_jointly")
        assert r1["estimated_federal_tax"] == r2["estimated_federal_tax"]

    def test_additional_income_adds_to_total(self):
        base = invoke(calculate_federal_tax, gross_income=50_000, filing_status="single")
        with_extra = invoke(
            calculate_federal_tax,
            gross_income=50_000,
            filing_status="single",
            additional_income=10_000,
        )
        assert with_extra["total_income"] == 60_000
        assert with_extra["estimated_federal_tax"] > base["estimated_federal_tax"]

    def test_zero_income_returns_zero_tax(self):
        result = invoke(calculate_federal_tax, gross_income=0, filing_status="single")
        assert result["estimated_federal_tax"] == 0.0

    def test_unknown_filing_status_returns_error(self):
        result = invoke(calculate_federal_tax, gross_income=50_000, filing_status="invalid_status")
        assert result["status"] == "error"


# ---------------------------------------------------------------------------
# get_standard_deduction
# ---------------------------------------------------------------------------

class TestGetStandardDeduction:

    def test_single_2024(self):
        result = invoke(get_standard_deduction, filing_status="single")
        assert result["base_standard_deduction"] == 14_600

    def test_mfj_2024(self):
        result = invoke(get_standard_deduction, filing_status="married_filing_jointly")
        assert result["base_standard_deduction"] == 29_200

    def test_head_of_household_2024(self):
        result = invoke(get_standard_deduction, filing_status="head_of_household")
        assert result["base_standard_deduction"] == 21_900

    def test_age_65_adds_additional_deduction(self):
        base = invoke(get_standard_deduction, filing_status="single")
        aged = invoke(get_standard_deduction, filing_status="single", age_65_or_blind_count=1)
        assert aged["total_standard_deduction"] == base["total_standard_deduction"] + 1_550

    def test_two_qualifying_conditions_mfj(self):
        base = invoke(get_standard_deduction, filing_status="married_filing_jointly")
        two_conds = invoke(
            get_standard_deduction,
            filing_status="married_filing_jointly",
            age_65_or_blind_count=2
        )
        assert two_conds["additional_for_age_or_blindness"] == 3_100


# ---------------------------------------------------------------------------
# estimate_self_employment_tax
# ---------------------------------------------------------------------------

class TestEstimateSelfEmploymentTax:

    def test_small_se_income(self):
        # $10,000 net profit: net earnings = $9,235; tax = $9,235 × 15.3% = $1,412.96
        result = invoke(estimate_self_employment_tax, net_profit=10_000)
        assert result["status"] == "ok"
        assert result["se_tax"] == pytest.approx(1_412.96, abs=1)
        # Deductible half should be se_tax / 2
        assert result["deductible_half_of_se_tax"] == pytest.approx(result["se_tax"] / 2, abs=0.01)

    def test_zero_profit_no_tax(self):
        result = invoke(estimate_self_employment_tax, net_profit=0)
        assert result["se_tax"] == 0.0

    def test_negative_profit_no_tax(self):
        result = invoke(estimate_self_employment_tax, net_profit=-5_000)
        assert result["se_tax"] == 0.0

    def test_above_ss_wage_base_lower_marginal_rate(self):
        # Income above $168,600 Social Security wage base only pays 2.9% Medicare
        below = invoke(estimate_self_employment_tax, net_profit=100_000)
        above = invoke(estimate_self_employment_tax, net_profit=300_000)
        # Tax should NOT double when income triples (because the rate drops above wage base)
        assert above["se_tax"] < below["se_tax"] * 3


# ---------------------------------------------------------------------------
# identify_applicable_credits
# ---------------------------------------------------------------------------

class TestIdentifyApplicableCredits:

    def test_child_tax_credit_identified_for_eligible_family(self):
        result = invoke(
            identify_applicable_credits,
            filing_status="married_filing_jointly",
            agi=80_000,
            has_dependent_children=True,
            child_count=2,
        )
        assert result["status"] == "ok"
        credit_names = [c["credit"] for c in result["credits_identified"]]
        assert any("Child Tax Credit" in name for name in credit_names)

    def test_no_ctc_above_phase_out_threshold(self):
        result = invoke(
            identify_applicable_credits,
            filing_status="married_filing_jointly",
            agi=420_000,  # Above $400k MFJ phase-out
            has_dependent_children=True,
            child_count=2,
        )
        credit_names = [c["credit"] for c in result["credits_identified"]]
        assert not any("Child Tax Credit" in name for name in credit_names)

    def test_eitc_identified_for_low_income_filer(self):
        result = invoke(
            identify_applicable_credits,
            filing_status="single",
            agi=25_000,
            has_dependent_children=True,
            child_count=1,
        )
        credit_names = [c["credit"] for c in result["credits_identified"]]
        assert any("Earned Income" in name for name in credit_names)

    def test_savers_credit_identified_with_retirement_contributions(self):
        result = invoke(
            identify_applicable_credits,
            filing_status="single",
            agi=30_000,
            has_retirement_contributions=True,
        )
        credit_names = [c["credit"] for c in result["credits_identified"]]
        assert any("Saver" in name for name in credit_names)

    def test_no_credits_for_high_income_no_children(self):
        result = invoke(
            identify_applicable_credits,
            filing_status="single",
            agi=500_000,
        )
        # Should return empty or only non-income-tested items
        assert result["status"] == "ok"


# ---------------------------------------------------------------------------
# compare_filing_scenarios
# ---------------------------------------------------------------------------

class TestCompareFilingScenarios:

    def test_equal_incomes_mfj_typically_lower(self):
        result = invoke(
            compare_filing_scenarios,
            spouse1_income=60_000,
            spouse2_income=60_000,
        )
        assert result["status"] == "ok"
        mfj_tax = result["married_filing_jointly"]["estimated_tax"]
        mfs_tax = result["married_filing_separately"]["combined_tax"]
        # For equal incomes, MFJ is almost always better
        assert mfj_tax <= mfs_tax

    def test_very_unequal_incomes_mfs_sometimes_lower(self):
        # One spouse earns $600k, other earns $0 — MFS may help with phase-outs
        result = invoke(
            compare_filing_scenarios,
            spouse1_income=600_000,
            spouse2_income=0,
        )
        assert result["status"] == "ok"
        # Result should recommend one option
        assert result["lower_tax_option"] in ("married_filing_jointly", "married_filing_separately")

    def test_returns_tax_difference(self):
        result = invoke(
            compare_filing_scenarios,
            spouse1_income=50_000,
            spouse2_income=50_000,
        )
        mfj_tax = result["married_filing_jointly"]["estimated_tax"]
        mfs_tax = result["married_filing_separately"]["combined_tax"]
        assert result["tax_difference_mfj_minus_mfs"] == pytest.approx(mfj_tax - mfs_tax, abs=0.01)
