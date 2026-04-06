"""
Tests for AccountantAgent specialized tools.

Same philosophy as test_auditor_agent.py: test the business-logic tools directly,
plus one smoke test that the agent constructs correctly.
"""

import json
import sys
import os
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from agents.accountant_agent import (
    _build_tax_summary,
    _suggest_deductions,
    AccountantAgent,
)


# ---------------------------------------------------------------------------
# Test data
# ---------------------------------------------------------------------------

SAMPLE_DOCS_JSON = json.dumps({
    "status": "ok",
    "documents": [
        {
            "id": "doc_w2",
            "name": "W2_Acme.pdf",
            "documentType": "W-2",
            "taxYear": 2024,
            "status": "processed",
            "extractedData": {
                "wages": 80_000,
                "federal_tax_withheld": 14_000,
                "state_tax_withheld": 5_000,
                "social_security_tax_withheld": 4_960,
                "medicare_tax_withheld": 1_160,
                "employer_ein": "12-3456789",
            },
        },
        {
            "id": "doc_1099nec",
            "name": "1099NEC_Freelance.pdf",
            "documentType": "1099-NEC",
            "taxYear": 2024,
            "status": "processed",
            "extractedData": {"nonemployee_compensation": 20_000},
        },
        {
            "id": "doc_1099int",
            "name": "1099INT_Bank.pdf",
            "documentType": "1099-INT",
            "taxYear": 2024,
            "status": "processed",
            "extractedData": {"interest_income": 500},
        },
        {
            "id": "doc_mortgage",
            "name": "1098_Mortgage.pdf",
            "documentType": "1098",
            "taxYear": 2024,
            "status": "processed",
            "extractedData": {"mortgage_interest": 12_000},
        },
    ],
})

EMPTY_DOCS_JSON = json.dumps({"status": "ok", "documents": []})


# ---------------------------------------------------------------------------
# _build_tax_summary
# ---------------------------------------------------------------------------

class TestBuildTaxSummary:

    def test_aggregates_w2_wages(self):
        result = json.loads(_build_tax_summary(SAMPLE_DOCS_JSON, "single"))
        assert result["income_summary"]["w2_wages"] == 80_000

    def test_aggregates_self_employment_income(self):
        result = json.loads(_build_tax_summary(SAMPLE_DOCS_JSON, "single"))
        assert result["income_summary"]["self_employment_income"] == 20_000

    def test_aggregates_interest_income(self):
        result = json.loads(_build_tax_summary(SAMPLE_DOCS_JSON, "single"))
        assert result["income_summary"]["interest_income"] == 500

    def test_total_income_is_sum_of_sources(self):
        result = json.loads(_build_tax_summary(SAMPLE_DOCS_JSON, "single"))
        expected_total = 80_000 + 20_000 + 500
        assert result["income_summary"]["total_income"] == pytest.approx(expected_total, abs=1)

    def test_withholding_aggregated(self):
        result = json.loads(_build_tax_summary(SAMPLE_DOCS_JSON, "single"))
        assert result["withholding_summary"]["federal_income_tax_withheld"] == 14_000
        assert result["withholding_summary"]["state_income_tax_withheld"] == 5_000

    def test_mortgage_interest_in_itemizable_expenses(self):
        result = json.loads(_build_tax_summary(SAMPLE_DOCS_JSON, "single"))
        assert result["itemizable_expenses_found"].get("mortgage_interest") == 12_000

    def test_income_sources_list_populated(self):
        result = json.loads(_build_tax_summary(SAMPLE_DOCS_JSON, "single"))
        sources = {s["source"] for s in result["income_sources"]}
        assert any("W-2" in s for s in sources)
        assert any("1099-NEC" in s or "Self-employment" in s for s in sources)

    def test_empty_documents_returns_zero_totals(self):
        result = json.loads(_build_tax_summary(EMPTY_DOCS_JSON, "single"))
        assert result["income_summary"]["total_income"] == 0.0
        assert result["withholding_summary"]["federal_income_tax_withheld"] == 0.0

    def test_unprocessed_documents_listed(self):
        docs_with_unprocessed = json.dumps({
            "documents": [
                {
                    "id": "doc_pending",
                    "name": "mystery.pdf",
                    "documentType": "unknown",
                    "status": "pending",
                    "extractedData": {},  # empty — not yet processed
                },
            ]
        })
        result = json.loads(_build_tax_summary(docs_with_unprocessed, "single"))
        # Document with no extracted data should appear in unprocessed list
        assert "mystery.pdf" in result["unprocessed_documents"]

    def test_invalid_json_handled(self):
        result = json.loads(_build_tax_summary("not json", "single"))
        assert result["status"] == "error"

    def test_multiple_w2s_wages_summed(self):
        two_w2s = json.dumps({
            "documents": [
                {
                    "id": "w2_job1",
                    "documentType": "W-2",
                    "extractedData": {"wages": 60_000, "federal_tax_withheld": 10_000},
                },
                {
                    "id": "w2_job2",
                    "documentType": "W-2",
                    "extractedData": {"wages": 40_000, "federal_tax_withheld": 6_000},
                },
            ]
        })
        result = json.loads(_build_tax_summary(two_w2s, "single"))
        assert result["income_summary"]["w2_wages"] == 100_000
        assert result["withholding_summary"]["federal_income_tax_withheld"] == 16_000


# ---------------------------------------------------------------------------
# _suggest_deductions
# ---------------------------------------------------------------------------

class TestSuggestDeductions:

    def test_always_includes_above_the_line_deductions(self):
        result = json.loads(_suggest_deductions(SAMPLE_DOCS_JSON, "single", 100_000))
        categories = [s["category"] for s in result["deduction_suggestions"]]
        assert any("Above-the-line" in c for c in categories)

    def test_se_deductions_shown_when_1099_present(self):
        result = json.loads(_suggest_deductions(SAMPLE_DOCS_JSON, "single", 100_000))
        categories = [s["category"] for s in result["deduction_suggestions"]]
        assert any("Self-employment" in c for c in categories)

    def test_se_deductions_absent_when_only_w2(self):
        w2_only = json.dumps({
            "documents": [{
                "id": "w2",
                "documentType": "W-2",
                "extractedData": {"wages": 80_000},
            }]
        })
        result = json.loads(_suggest_deductions(w2_only, "single", 80_000))
        categories = [s["category"] for s in result["deduction_suggestions"]]
        assert not any("Self-employment" in c for c in categories)

    def test_mortgage_deduction_included(self):
        result = json.loads(_suggest_deductions(SAMPLE_DOCS_JSON, "single", 100_000))
        # Flatten all items across all categories
        all_items = []
        for section in result["deduction_suggestions"]:
            all_items.extend(section.get("items", []))
        deduction_names = [item["deduction"] for item in all_items]
        assert any("Mortgage" in name for name in deduction_names)

    def test_medical_threshold_calculated_from_income(self):
        result = json.loads(_suggest_deductions(SAMPLE_DOCS_JSON, "single", 100_000))
        all_items = []
        for section in result["deduction_suggestions"]:
            all_items.extend(section.get("items", []))
        medical = next((i for i in all_items if "Medical" in i["deduction"]), None)
        assert medical is not None
        # 7.5% of $100,000 = $7,500
        assert medical["threshold_amount"] == pytest.approx(7_500, abs=1)

    def test_salt_deduction_always_included(self):
        result = json.loads(_suggest_deductions(EMPTY_DOCS_JSON, "single", 50_000))
        all_items = []
        for section in result["deduction_suggestions"]:
            all_items.extend(section.get("items", []))
        deduction_names = [item["deduction"] for item in all_items]
        assert any("SALT" in name or "State and local" in name for name in deduction_names)

    def test_invalid_json_returns_error(self):
        result = json.loads(_suggest_deductions("bad json", "single", 100_000))
        assert result["status"] == "error"


# ---------------------------------------------------------------------------
# AccountantAgent construction smoke test
# ---------------------------------------------------------------------------

class TestAccountantAgentConstruction:

    def test_agent_constructs_with_mocked_llm(self):
        """Verify the agent wires up without errors (no API call made)."""
        mock_db = MagicMock()

        with patch("agents.base_agent.ChatOpenAI") as mock_llm_class:
            mock_llm_instance = MagicMock()
            mock_llm_instance.bind_tools.return_value = mock_llm_instance
            mock_llm_class.return_value = mock_llm_instance

            agent = AccountantAgent(db=mock_db, model="gpt-4o-mini")

        assert agent is not None
        tool_names = {t.name for t in agent._tools}

        # Shared tools
        assert "fetch_user_documents" in tool_names
        assert "fetch_document_details" in tool_names

        # Accountant-specific tools
        assert "build_tax_summary" in tool_names
        assert "suggest_deductions" in tool_names
        assert "calculate_federal_tax" in tool_names
        assert "get_standard_deduction" in tool_names
        assert "estimate_self_employment_tax" in tool_names
        assert "identify_applicable_credits" in tool_names
        assert "compare_filing_scenarios" in tool_names
