"""
Document retrieval tools for TaxFront agents.

These tools give agents read access to the `taxDocuments` Firestore collection.
We use a factory function (`create_document_tools`) rather than module-level globals
so that the Firestore client can be injected — matching the pattern used throughout
this codebase (see task_manager.py, task_processors.py).

Each tool returns a JSON string so the LLM can reason over structured data without
needing extra parsing in the agent loop.
"""

import json
import logging
from typing import List

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Input schemas (Pydantic) — LangChain uses these to generate the function
# signatures that OpenAI sees, so descriptions here directly affect LLM quality.
# ---------------------------------------------------------------------------

class FetchUserDocumentsInput(BaseModel):
    user_id: str = Field(
        ...,
        description="Firebase user ID whose tax documents should be retrieved."
    )
    tax_year: int | None = Field(
        None,
        description="Optional. Filter documents to a specific tax year (e.g. 2024). "
                    "Omit to retrieve documents for all years."
    )


class FetchDocumentDetailsInput(BaseModel):
    document_id: str = Field(
        ...,
        description="Firestore document ID of the specific tax document to retrieve."
    )


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def create_document_tools(db) -> List[StructuredTool]:
    """
    Return a list of LangChain tools bound to the given Firestore client.

    Call this once per agent instance so each agent has its own isolated tool set.
    The `db` parameter is a `google.cloud.firestore.Client` (or firebase_admin.firestore
    client) — whichever the caller already holds.
    """

    def fetch_user_documents(user_id: str, tax_year: int | None = None) -> str:
        """
        Retrieve all tax documents for a user from Firestore.

        We keep the returned payload lean (id, type, year, status, extractedData) so the
        agent doesn't burn context window on storage URLs and processing timestamps that
        are irrelevant to tax analysis.
        """
        try:
            query = db.collection("taxDocuments").where("userId", "==", user_id)
            docs = list(query.stream())

            if not docs:
                return json.dumps({
                    "status": "no_documents",
                    "message": f"No tax documents found for user {user_id}.",
                    "documents": []
                })

            results = []
            for doc in docs:
                data = doc.to_dict() or {}
                # Apply optional year filter here instead of in Firestore so we don't
                # need a composite index for every possible (userId, taxYear) pair.
                doc_year = data.get("taxYear") or data.get("tax_year")
                if tax_year is not None and doc_year != tax_year:
                    continue

                results.append({
                    "id": doc.id,
                    "name": data.get("name", "unknown"),
                    "documentType": data.get("type", data.get("documentType", "unknown")),
                    "taxYear": doc_year,
                    "status": data.get("status", "unknown"),
                    "uploadDate": data.get("uploadDate"),
                    # extractedData is the parser output — this is the financially
                    # relevant part (income, withholding, tax_id, etc.)
                    "extractedData": data.get("extractedData") or data.get("metadata") or {},
                })

            if not results:
                msg = f"No documents found for user {user_id}"
                if tax_year:
                    msg += f" for tax year {tax_year}"
                return json.dumps({"status": "no_documents", "message": msg, "documents": []})

            return json.dumps({
                "status": "ok",
                "count": len(results),
                "documents": results
            }, default=str)

        except Exception as exc:
            logger.error("fetch_user_documents failed: %s", exc)
            return json.dumps({"status": "error", "message": str(exc)})

    def fetch_document_details(document_id: str) -> str:
        """
        Retrieve full details of a specific tax document.

        Use this after `fetch_user_documents` has returned the document IDs.
        Returns the complete Firestore document including all extracted fields.
        """
        try:
            doc_ref = db.collection("taxDocuments").document(document_id)
            doc = doc_ref.get()

            if not doc.exists:
                return json.dumps({
                    "status": "not_found",
                    "message": f"Document {document_id} does not exist."
                })

            data = doc.to_dict() or {}
            # Strip the raw storage URL — agents don't need it and it's long
            data.pop("url", None)
            data["id"] = document_id

            return json.dumps({"status": "ok", "document": data}, default=str)

        except Exception as exc:
            logger.error("fetch_document_details failed for %s: %s", document_id, exc)
            return json.dumps({"status": "error", "message": str(exc)})

    return [
        StructuredTool.from_function(
            func=fetch_user_documents,
            name="fetch_user_documents",
            description=(
                "Retrieve all tax documents for a user. Returns document IDs, types "
                "(W-2, 1099, etc.), tax year, processing status, and extracted financial "
                "data (income, withholding, deductions). Use this first to get an overview "
                "before drilling into individual documents."
            ),
            args_schema=FetchUserDocumentsInput,
        ),
        StructuredTool.from_function(
            func=fetch_document_details,
            name="fetch_document_details",
            description=(
                "Get the complete details of a single tax document by its ID. "
                "Use this after fetch_user_documents when you need the full extracted data "
                "for a specific document."
            ),
            args_schema=FetchDocumentDetailsInput,
        ),
    ]