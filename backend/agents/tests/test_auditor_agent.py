"""
Tests for AuditorAgent specialized tools.

We test the three auditor tools directly (they're pure Python functions, not LLM calls)
and do one smoke test that the AuditorAgent constructs without error.

We don't test the full LLM loop — that would require an OpenAI API key and produces
non-deterministic output. The value is in testing the tools that contain the business logic.
"""

import json
import sys
import os
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

# Import the private tool functions directly for unit testing
from agents.auditor_agent import (
    _check_audit_triggers,
    _cross_reference_income,
    _calculate_audit_risk_score,
    AuditorAgent,
)


# ---------------------------------------------------------------------------
# _check_audit_triggers
# ---------------------------------------------------------------------------

class TestCheckAuditTriggers:

    def test_high_income_flagged(self):
        data = json.dumps({"income": 1_500_000})
        result = json.loads(_check_audit_triggers(data, "W-2"))
        triggers = result["triggers"]
        assert any("High-income" in t["trigger"] for t in triggers)
        high_triggers = [t for t in triggers if t["severity"] == "HIGH"]
        assert len(high_triggers) >= 1

    def test_medium_income_flagged_appropriately(self):
        data = json.dumps({"income": 600_000})
        result = json.loads(_check_audit_triggers(data, "W-2"))
        triggers = result["triggers"]
        assert any("High-income" in t["trigger"] and t["severity"] == "MEDIUM"
                   for t in triggers)

    def test_round_number_income_flagged(self):
        data = json.dumps({"income": 50_000})  # round thousand
        result = json.loads(_check_audit_triggers(data, "W-2"))
        triggers = result["triggers"]
        assert any("Round-number" in t["trigger"] for t in triggers)

    def test_extreme_schedule_c_expense_ratio(self):
        data = json.dumps({"net_profit": 5_000, "total_expenses": 95_000})
        result = json.loads(_check_audit_triggers(data, "Schedule C"))
        triggers = result["triggers"]
        assert any("Extreme" in t["trigger"] and t["severity"] == "HIGH"
                   for t in triggers)

    def test_high_schedule_c_expense_ratio(self):
        # 80% expense ratio — high but not extreme
        data = json.dumps({"net_profit": 20_000, "total_expenses": 80_000})
        result = json.loads(_check_audit_triggers(data, "Schedule C"))
        triggers = result["triggers"]
        assert any("High Schedule C" in t["trigger"] for t in triggers)

    def test_business_net_loss_flagged(self):
        data = json.dumps({"net_profit": -10_000})
        result = json.loads(_check_audit_triggers(data, "Schedule C"))
        triggers = result["triggers"]
        assert any("net loss" in t["trigger"].lower() for t in triggers)

    def test_charitable_over_20pct_flagged(self):
        data = json.dumps({"income": 100_000, "charitable_contributions": 25_000})
        result = json.loads(_check_audit_triggers(data, "1040"))
        triggers = result["triggers"]
        assert any("Charitable" in t["trigger"] for t in triggers)

    def test_home_office_flagged(self):
        data = json.dumps({"home_office_deduction": 3_000})
        result = json.loads(_check_audit_triggers(data, "Schedule C"))
        triggers = result["triggers"]
        assert any("Home office" in t["trigger"] for t in triggers)

    def test_missing_w2_fields_flagged(self):
        # W-2 with no federal withholding
        data = json.dumps({"wages": 50_000})
        result = json.loads(_check_audit_triggers(data, "W-2"))
        triggers = result["triggers"]
        missing_triggers = [t for t in triggers if "Missing W-2 field" in t["trigger"]]
        assert len(missing_triggers) > 0

    def test_clean_return_no_triggers(self):
        data = json.dumps({
            "wages": 52_300,  # non-round
            "federal_tax_withheld": 8_000,
            "state_wages": 52_300,
            "employer_ein": "12-3456789",
        })
        result = json.loads(_check_audit_triggers(data, "W-2"))
        # Should have zero or only very minor triggers
        high_triggers = [t for t in result["triggers"] if t["severity"] == "HIGH"]
        assert len(high_triggers) == 0

    def test_invalid_json_returns_error(self):
        result = json.loads(_check_audit_triggers("not valid json", "W-2"))
        assert result["status"] == "error"


# ---------------------------------------------------------------------------
# _cross_reference_income
# ---------------------------------------------------------------------------

SAMPLE_DOCS = {
    "status": "ok",
    "documents": [
        {
            "id": "doc_w2_a",
            "documentType": "W-2",
            "extractedData": {
                "wages": 75_000,
                "employer_ein": "12-3456789",
                "federal_tax_withheld": 12_000,
            },
        },
        {
            "id": "doc_w2_b",
            "documentType": "W-2",
            "extractedData": {
                "wages": 30_000,
                "employer_ein": "98-7654321",
                "federal_tax_withheld": 4_500,
            },
        },
        {
            "id": "doc_1099nec",
            "documentType": "1099-NEC",
            "extractedData": {"nonemployee_compensation": 15_000},
        },
    ],
}


class TestCrossReferenceIncome:

    def test_income_sources_aggregated(self):
        result = json.loads(_cross_reference_income(json.dumps(SAMPLE_DOCS)))
        assert result["status"] == "ok"
        # Should find W-2 wages from both docs + 1099-NEC
        assert result["total_documented_income"] == pytest.approx(120_000, abs=1)

    def test_duplicate_ein_flagged(self):
        docs_with_duplicate = {
            "documents": [
                {
                    "id": "doc_w2_1",
                    "documentType": "W-2",
                    "extractedData": {"wages": 50_000, "employer_ein": "11-1111111"},
                },
                {
                    "id": "doc_w2_2",
                    "documentType": "W-2",
                    "extractedData": {"wages": 50_000, "employer_ein": "11-1111111"},  # same EIN
                },
            ]
        }
        result = json.loads(_cross_reference_income(json.dumps(docs_with_duplicate)))
        findings = result["findings"]
        assert any(f["type"] == "DUPLICATE_EIN" and f["severity"] == "HIGH"
                   for f in findings)

    def test_1099_nec_income_reported_in_findings(self):
        result = json.loads(_cross_reference_income(json.dumps(SAMPLE_DOCS)))
        findings = result["findings"]
        assert any("1099-NEC" in f["message"] for f in findings)

    def test_schedule_b_required_when_interest_plus_dividends_over_1500(self):
        docs = {
            "documents": [
                {
                    "id": "doc_int",
                    "documentType": "1099-INT",
                    "extractedData": {"interest_income": 1_000},
                },
                {
                    "id": "doc_div",
                    "documentType": "1099-DIV",
                    "extractedData": {"total_dividends": 800},
                },
            ]
        }
        result = json.loads(_cross_reference_income(json.dumps(docs)))
        assert any(f["type"] == "SCHEDULE_B_REQUIRED" for f in result["findings"])

    def test_no_schedule_b_when_under_threshold(self):
        docs = {
            "documents": [
                {
                    "id": "doc_int",
                    "documentType": "1099-INT",
                    "extractedData": {"interest_income": 100},
                },
            ]
        }
        result = json.loads(_cross_reference_income(json.dumps(docs)))
        assert not any(f["type"] == "SCHEDULE_B_REQUIRED" for f in result["findings"])

    def test_empty_documents_handled(self):
        result = json.loads(_cross_reference_income(json.dumps({"documents": []})))
        assert result["status"] == "ok"
        assert result["total_documented_income"] == 0.0

    def test_invalid_json_returns_error(self):
        result = json.loads(_cross_reference_income("not json"))
        assert result["status"] == "error"


# ---------------------------------------------------------------------------
# _calculate_audit_risk_score
# ---------------------------------------------------------------------------

class TestCalculateAuditRiskScore:

    def test_no_triggers_is_low_risk(self):
        data = json.dumps({"triggers": [], "findings": []})
        result = json.loads(_calculate_audit_risk_score(data))
        assert result["risk_tier"] == "LOW"
        assert result["risk_score"] == 0

    def test_single_high_trigger_is_moderate(self):
        data = json.dumps({
            "triggers": [{"severity": "HIGH", "trigger": "test"}]
        })
        result = json.loads(_calculate_audit_risk_score(data))
        # 30 points for HIGH → MODERATE tier
        assert result["risk_score"] == 30
        assert result["risk_tier"] == "MODERATE"

    def test_multiple_high_triggers_elevated(self):
        data = json.dumps({
            "triggers": [
                {"severity": "HIGH", "trigger": "trigger1"},
                {"severity": "HIGH", "trigger": "trigger2"},
                {"severity": "MEDIUM", "trigger": "trigger3"},
            ]
        })
        result = json.loads(_calculate_audit_risk_score(data))
        # 30 + 30 + 15 = 75 → ELEVATED
        assert result["risk_score"] == 75
        assert result["risk_tier"] == "ELEVATED"

    def test_very_high_score_is_high_risk(self):
        data = json.dumps({
            "triggers": [{"severity": "HIGH"}] * 4  # 120 points
        })
        result = json.loads(_calculate_audit_risk_score(data))
        assert result["risk_tier"] == "HIGH"

    def test_trigger_counts_in_summary(self):
        data = json.dumps({
            "triggers": [
                {"severity": "HIGH"},
                {"severity": "MEDIUM"},
                {"severity": "LOW"},
                {"severity": "LOW"},
            ]
        })
        result = json.loads(_calculate_audit_risk_score(data))
        assert result["trigger_summary"]["high_severity"] == 1
        assert result["trigger_summary"]["medium_severity"] == 1
        assert result["trigger_summary"]["low_severity"] == 2

    def test_accepts_findings_from_cross_reference(self):
        # cross_reference_income returns "findings", not "triggers"
        data = json.dumps({
            "findings": [{"severity": "HIGH", "type": "DUPLICATE_EIN"}]
        })
        result = json.loads(_calculate_audit_risk_score(data))
        assert result["risk_score"] == 30

    def test_invalid_json_returns_error(self):
        result = json.loads(_calculate_audit_risk_score("not json"))
        assert result["status"] == "error"


# ---------------------------------------------------------------------------
# AuditorAgent construction smoke test
# ---------------------------------------------------------------------------

class TestAuditorAgentConstruction:

    def test_agent_constructs_with_mocked_llm(self):
        """Verify the agent wires up without errors (no API call made)."""
        mock_db = MagicMock()

        with patch("agents.base_agent.ChatOpenAI") as mock_llm_class:
            # Make the mock LLM support bind_tools (required by create_openai_tools_agent)
            mock_llm_instance = MagicMock()
            mock_llm_instance.bind_tools.return_value = mock_llm_instance
            mock_llm_class.return_value = mock_llm_instance

            agent = AuditorAgent(db=mock_db, model="gpt-4o-mini")

        assert agent is not None
        # Should have 5 tools: 2 shared document tools + 3 auditor-specific tools
        tool_names = {t.name for t in agent._tools}
        assert "fetch_user_documents" in tool_names
        assert "fetch_document_details" in tool_names
        assert "check_audit_triggers" in tool_names
        assert "cross_reference_income" in tool_names
        assert "calculate_audit_risk_score" in tool_names
