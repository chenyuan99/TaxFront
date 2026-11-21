import type { Firestore } from "firebase-admin/firestore";
import { getAI } from "../ai";

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseExtractionResponse(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const value: unknown = JSON.parse(fenced?.[1] ?? trimmed);
  if (!isObject(value)) throw new Error("Expected an extraction object");

  const { documentType, taxYear, extractedData } = value;
  if (typeof documentType !== "string" || !documentType.trim() || !isObject(extractedData)) {
    throw new Error("Expected a document type and extracted fields");
  }
  if (taxYear != null && (typeof taxYear !== "number" || !Number.isInteger(taxYear) ||
    taxYear < 1000 || taxYear > 9999)) {
    throw new Error("Expected a four-digit tax year");
  }
  return { documentType, taxYear: taxYear ?? null, extractedData };
}

const EXTRACTION_PROMPT = `You are a tax document extraction engine. Analyze the provided tax document image or PDF and return ONLY a JSON object. Do not include markdown code fences, explanations, or any text outside the JSON.

Return this exact structure:
{
  "documentType": "<one of: W-2, 1099-NEC, 1099-INT, 1099-DIV, 1098, 1040, Schedule-C, other>",
  "taxYear": <4-digit year as a number, e.g. 2024>,
  "extractedData": {
    <include ONLY fields that are clearly visible in the document, as numbers>
  }
}

Field names to use in extractedData by form type:
- W-2: wages, federal_tax_withheld, state_tax_withheld, social_security_tax_withheld, medicare_tax_withheld, employer_ein, employer_name, state_wages
- 1099-NEC: nonemployee_compensation, payer_name, payer_ein
- 1099-INT: interest_income, payer_name, payer_ein
- 1099-DIV: total_dividends, ordinary_dividends, qualified_dividends, payer_name, payer_ein
- 1098: mortgage_interest, lender_name, outstanding_principal, points_paid
- 1040: total_income, agi, taxable_income, total_tax, refund_amount
- Schedule-C: gross_receipts, total_expenses, net_profit, business_name

All monetary values must be numbers (not strings). Omit fields that are blank or not legible.`;

/**
 * Outcome of an extraction run, reported to the caller so it can close out the
 * surrounding job. The document record is updated either way — the return value
 * exists so the trigger knows whether to notify success or failure.
 */
export type ExtractionResult =
  | { ok: true; documentType: string; taxYear: number | null; fieldsExtracted: number }
  | { ok: false; error: string };

export async function extractTaxDocument(
  db: Firestore,
  documentId: string,
  url: string,
  filename: string,
  mimeType: string
): Promise<ExtractionResult> {
  const docRef = db.collection("taxDocuments").doc(documentId);
  const ai = getAI();

  // Download the file bytes
  let pdfBase64: string;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} downloading document`);
    const buffer = await response.arrayBuffer();
    pdfBase64 = Buffer.from(buffer).toString("base64");
  } catch (err) {
    const error = `Failed to download document: ${(err as Error).message}`;
    await docRef.update({
      status: "error",
      errorMessage: error,
      processedAt: new Date().toISOString(),
    });
    return { ok: false, error };
  }

  // Resolve content type — prefer stored MIME, fallback to filename extension
  let contentType = mimeType;
  if (!contentType || contentType === "application/octet-stream") {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    contentType = ext === "pdf" ? "application/pdf" : ext.match(/^(png|jpg|jpeg)$/) ? `image/${ext === "jpg" ? "jpeg" : ext}` : "application/pdf";
  }

  // Extract fields using Gemini with inline content
  let rawText: string;
  try {
    const { text } = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      prompt: [
        { media: { url: `data:${contentType};base64,${pdfBase64}`, contentType } },
        { text: EXTRACTION_PROMPT },
      ],
    });
    rawText = text;
  } catch (err) {
    const error = `Gemini extraction failed: ${(err as Error).message}`;
    await docRef.update({
      status: "error",
      errorMessage: error,
      processedAt: new Date().toISOString(),
    });
    return { ok: false, error };
  }

  let parsed: ReturnType<typeof parseExtractionResponse>;
  try {
    parsed = parseExtractionResponse(rawText);
  } catch {
    const error = "Extraction returned an invalid response";
    await docRef.update({
      status: "error",
      errorMessage: error,
      processedAt: new Date().toISOString(),
    });
    return { ok: false, error };
  }

  const { documentType, taxYear, extractedData } = parsed;

  await docRef.update({
    documentType,
    taxYear,
    extractedData,
    status: "processed",
    processedAt: new Date().toISOString(),
  });

  return { ok: true, documentType, taxYear, fieldsExtracted: Object.keys(extractedData).length };
}
