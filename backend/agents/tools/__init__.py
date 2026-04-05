"""Tax tools package — document retrieval and IRS calculation tools."""

from .document_tools import create_document_tools
from .tax_tools import (
    calculate_federal_tax,
    compare_filing_scenarios,
    estimate_self_employment_tax,
    get_standard_deduction,
    identify_applicable_credits,
)

__all__ = [
    "create_document_tools",
    "calculate_federal_tax",
    "compare_filing_scenarios",
    "estimate_self_employment_tax",
    "get_standard_deduction",
    "identify_applicable_credits",
]

__all__ = [
    "create_document_tools",
    "calculate_federal_tax",
    "compare_filing_scenarios",
    "estimate_self_employment_tax",
    "get_standard_deduction",
    "identify_applicable_credits",
]
