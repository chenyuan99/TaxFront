"""
TaxFront AI Agents
==================

Two specialized agents for tax document processing:

AuditorAgent
    Compliance verification and audit risk assessment.
    Use this to check documents for errors, missing data, IRS audit triggers,
    and income inconsistencies before filing.

    Example::

        from agents import AuditorAgent
        from firebase_admin import firestore

        db = firestore.client()
        auditor = AuditorAgent(db=db)
        result = auditor.run(
            "Audit all tax documents for user abc123 and give me the risk report."
        )
        print(result["output"])

AccountantAgent
    Tax preparation, optimization, and planning.
    Use this to estimate tax liability, identify deductions and credits,
    and generate a tax preparation summary.

    Example::

        from agents import AccountantAgent
        from firebase_admin import firestore

        db = firestore.client()
        accountant = AccountantAgent(db=db)
        result = accountant.run(
            "Prepare a tax summary for user abc123 who files as single."
        )
        print(result["output"])

Recommended workflow
--------------------
Run the Auditor first to surface data quality issues, then run the Accountant
on clean data for optimization. Both agents share the same Firestore client.

    auditor_result = auditor.run("Audit documents for user abc123")
    accountant_result = accountant.run("Prepare tax summary for user abc123, single filer")
"""

from .accountant_agent import AccountantAgent
from .auditor_agent import AuditorAgent
from .base_agent import BaseAgent

__all__ = ["AuditorAgent", "AccountantAgent", "BaseAgent"]
