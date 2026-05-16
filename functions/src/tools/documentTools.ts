import { z } from "genkit";
import type { Firestore } from "firebase-admin/firestore";
import { getAI } from "../ai";

let _tools: ReturnType<typeof buildDocumentTools> | null = null;

function buildDocumentTools(db: Firestore) {
  const ai = getAI();

  const fetchUserDocuments = ai.defineTool(
    {
      name: "fetch_user_documents",
      description:
        "Retrieve all tax documents for a user from Firestore. Returns document IDs, types (W-2, 1099, etc.), tax year, processing status, and extracted financial data. Use this first to get an overview before drilling into individual documents.",
      inputSchema: z.object({
        userId: z.string().describe("Firebase user ID"),
        taxYear: z.number().optional().describe("Optional filter by tax year, e.g. 2024"),
      }),
      outputSchema: z.unknown(),
    },
    async ({ userId, taxYear }) => {
      const query = db.collection("taxDocuments").where("userId", "==", userId);
      const snapshot = await query.get();

      if (snapshot.empty) {
        return { status: "no_documents", message: `No documents found for user ${userId}`, documents: [] };
      }

      const documents = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          const docYear = data.taxYear ?? data.tax_year ?? null;
          if (taxYear != null && docYear !== taxYear) return null;
          return {
            id: doc.id,
            name: data.name ?? "unknown",
            documentType: data.type ?? data.documentType ?? "unknown",
            taxYear: docYear,
            status: data.status ?? "unknown",
            uploadDate: data.uploadDate ?? null,
            extractedData: data.extractedData ?? data.metadata ?? {},
          };
        })
        .filter(Boolean);

      if (documents.length === 0) {
        return { status: "no_documents", message: `No documents for user ${userId}${taxYear ? ` for ${taxYear}` : ""}`, documents: [] };
      }

      return { status: "ok", count: documents.length, documents };
    }
  );

  const fetchDocumentDetails = ai.defineTool(
    {
      name: "fetch_document_details",
      description:
        "Get the complete details of a single tax document by its Firestore document ID. Use this after fetch_user_documents when you need the full extracted data for a specific document.",
      inputSchema: z.object({
        documentId: z.string().describe("Firestore document ID"),
      }),
      outputSchema: z.unknown(),
    },
    async ({ documentId }) => {
      const ref = db.collection("taxDocuments").doc(documentId);
      const doc = await ref.get();

      if (!doc.exists) {
        return { status: "not_found", message: `Document ${documentId} does not exist` };
      }

      const data = { ...doc.data(), id: documentId };
      delete (data as Record<string, unknown>).url;
      return { status: "ok", document: data };
    }
  );

  return { fetchUserDocuments, fetchDocumentDetails };
}

export function getDocumentTools(db: Firestore) {
  if (!_tools) _tools = buildDocumentTools(db);
  return _tools;
}
