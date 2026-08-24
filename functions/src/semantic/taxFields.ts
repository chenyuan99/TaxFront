/**
 * Canonical tax field and metric definitions.
 *
 * Single source of truth for document classification, extracted-field aliases,
 * and income aggregation. The accountant and auditor tool sets both read from
 * here so their numbers cannot drift apart.
 *
 * Field names written by the extractor live in flows/extractor.ts; the alias
 * lists below are the union of that schema plus the legacy names older
 * documents may still carry.
 */

/**
 * Coerce a primitive to text. Objects and arrays yield "" rather than
 * "[object Object]" — extracted data comes from a model's JSON, so a nested
 * object in a scalar field is possible and must not become a garbage value.
 */
export function asText(val: unknown): string {
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return "";
}

/** Parse a monetary value that may arrive as a number, "1,234.56", or "$1,234.56". */
export function safeFloat(val: unknown): number {
  if (typeof val === "number") return Number.isNaN(val) ? 0 : val;
  const text = asText(val);
  if (!text) return 0;
  const n = Number.parseFloat(text.replace(/[,$]/g, "").trim());
  return Number.isNaN(n) ? 0 : n;
}

/** First alias present on the record wins; absent or unparseable yields 0. */
export function pickAmount(ext: Record<string, unknown>, aliases: readonly string[]): number {
  for (const alias of aliases) {
    if (ext[alias] != null) return safeFloat(ext[alias]);
  }
  return 0;
}

/** First alias present on the record, as a trimmed string; "" when absent. */
export function pickString(ext: Record<string, unknown>, aliases: readonly string[]): string {
  for (const alias of aliases) {
    if (ext[alias] != null) return asText(ext[alias]).trim();
  }
  return "";
}

export type DocCategory =
  | "W2"
  | "SELF_EMPLOYMENT"
  | "INTEREST"
  | "DIVIDEND"
  | "MORTGAGE"
  | "DONATION"
  | "FORM_1040"
  | "OTHER";

/** Canonical alias chains, most specific name first. */
export const FIELD_ALIASES = {
  wages: ["wages", "gross_wages", "income"],
  federalWithheld: ["federal_tax_withheld", "federal_income_tax"],
  stateWithheld: ["state_tax_withheld", "state_income_tax"],
  socialSecurityWithheld: ["social_security_tax_withheld", "ss_withheld"],
  medicareWithheld: ["medicare_tax_withheld", "medicare_withheld"],
  selfEmployment: ["nonemployee_compensation", "net_profit", "income", "amount"],
  interest: ["interest_income", "income", "amount"],
  dividends: ["total_dividends", "ordinary_dividends", "income", "amount"],
  mortgageInterest: ["mortgage_interest", "interest_paid", "amount"],
  donation: ["donation_amount", "amount"],
  employerEin: ["employer_ein", "ein"],
  form1040Income: ["total_income", "agi", "income"],
  genericIncome: ["income", "amount"],
} as const;

/** Uppercase and strip separators so "1099-INT", "1099 int" and "1099int" all match. */
export function normalizeDocType(documentType: unknown): string {
  return asText(documentType).toUpperCase().replace(/[-\s_]/g, "");
}

export function classifyDocument(documentType: unknown): DocCategory {
  const t = normalizeDocType(documentType);
  if (t.includes("W2")) return "W2";
  if (t.includes("1099NEC") || t.includes("NEC") || t.includes("SCHEDULEC")) return "SELF_EMPLOYMENT";
  if (t.includes("1099INT") || (t.includes("1099") && t.includes("INT"))) return "INTEREST";
  if (t.includes("1099DIV") || (t.includes("1099") && t.includes("DIV"))) return "DIVIDEND";
  if (t.includes("1098") || t.includes("MORTGAGE")) return "MORTGAGE";
  if (t.includes("CHARITABLE") || t.includes("DONATION") || t.includes("RECEIPT")) return "DONATION";
  if (t.includes("1040")) return "FORM_1040";
  return "OTHER";
}

/** Extracted payload of a document, tolerating the legacy `metadata` key. */
export function extractedFieldsOf(doc: Record<string, unknown>): Record<string, unknown> {
  return (doc.extractedData ?? doc.metadata ?? {}) as Record<string, unknown>;
}

/**
 * The income figure carried by a single document, chosen by its category.
 * Used for per-document audit checks, where there is no aggregate to draw on.
 */
export function documentIncome(ext: Record<string, unknown>, category: DocCategory): number {
  switch (category) {
    case "W2": return pickAmount(ext, FIELD_ALIASES.wages);
    case "SELF_EMPLOYMENT": return pickAmount(ext, FIELD_ALIASES.selfEmployment);
    case "INTEREST": return pickAmount(ext, FIELD_ALIASES.interest);
    case "DIVIDEND": return pickAmount(ext, FIELD_ALIASES.dividends);
    case "FORM_1040": return pickAmount(ext, FIELD_ALIASES.form1040Income);
    case "MORTGAGE":
    case "DONATION": return 0;
    default: return pickAmount(ext, FIELD_ALIASES.genericIncome);
  }
}

export interface IncomeSource {
  category: DocCategory;
  documentId: string;
  documentName: string;
  documentType: string;
  amount: number;
  federalWithheld: number;
}

export interface IncomeAggregate {
  w2Wages: number;
  selfEmploymentIncome: number;
  interestIncome: number;
  dividendIncome: number;
  otherIncome: number;
  /** The authoritative total. Never re-derive this from `sources`. */
  totalIncome: number;
  federalWithheld: number;
  stateWithheld: number;
  socialSecurityWithheld: number;
  medicareWithheld: number;
  itemizableExpenses: Record<string, number>;
  sources: IncomeSource[];
  unprocessedDocuments: string[];
  documentsByCategory: Record<DocCategory, Record<string, unknown>[]>;
}

function emptyByCategory(): Record<DocCategory, Record<string, unknown>[]> {
  return { W2: [], SELF_EMPLOYMENT: [], INTEREST: [], DIVIDEND: [], MORTGAGE: [], DONATION: [], FORM_1040: [], OTHER: [] };
}

/**
 * Aggregate every income and withholding figure across a user's documents.
 *
 * A Form 1040 is classified and returned but contributes nothing to
 * `totalIncome` — it restates income already counted from the source documents.
 */
export function collectIncome(docs: Record<string, unknown>[]): IncomeAggregate {
  const agg: IncomeAggregate = {
    w2Wages: 0, selfEmploymentIncome: 0, interestIncome: 0, dividendIncome: 0, otherIncome: 0, totalIncome: 0,
    federalWithheld: 0, stateWithheld: 0, socialSecurityWithheld: 0, medicareWithheld: 0,
    itemizableExpenses: {}, sources: [], unprocessedDocuments: [], documentsByCategory: emptyByCategory(),
  };

  for (const doc of docs) {
    const ext = extractedFieldsOf(doc);
    const category = classifyDocument(doc.documentType);
    const documentId = asText(doc.id) || "unknown";
    const documentName = asText(doc.name) || asText(doc.id) || "unknown";
    const documentType = asText(doc.documentType) || "unknown";

    agg.documentsByCategory[category].push(doc);

    if (Object.keys(ext).length === 0) {
      agg.unprocessedDocuments.push(documentName);
      continue;
    }

    const amount = documentIncome(ext, category);
    let federalWithheld = 0;

    switch (category) {
      case "W2":
        agg.w2Wages += amount;
        federalWithheld = pickAmount(ext, FIELD_ALIASES.federalWithheld);
        agg.federalWithheld += federalWithheld;
        agg.stateWithheld += pickAmount(ext, FIELD_ALIASES.stateWithheld);
        agg.socialSecurityWithheld += pickAmount(ext, FIELD_ALIASES.socialSecurityWithheld);
        agg.medicareWithheld += pickAmount(ext, FIELD_ALIASES.medicareWithheld);
        break;
      case "SELF_EMPLOYMENT":
        agg.selfEmploymentIncome += amount;
        break;
      case "INTEREST":
        agg.interestIncome += amount;
        break;
      case "DIVIDEND":
        agg.dividendIncome += amount;
        break;
      case "MORTGAGE": {
        const interest = pickAmount(ext, FIELD_ALIASES.mortgageInterest);
        if (interest > 0) agg.itemizableExpenses.mortgageInterest = (agg.itemizableExpenses.mortgageInterest ?? 0) + interest;
        break;
      }
      case "DONATION": {
        const donation = pickAmount(ext, FIELD_ALIASES.donation);
        if (donation > 0) agg.itemizableExpenses.charitableContributions = (agg.itemizableExpenses.charitableContributions ?? 0) + donation;
        break;
      }
      case "FORM_1040":
        break;
      default:
        agg.otherIncome += amount;
        break;
    }

    if (amount > 0 && category !== "FORM_1040") {
      agg.sources.push({ category, documentId, documentName, documentType, amount, federalWithheld });
    }
  }

  agg.totalIncome = agg.w2Wages + agg.selfEmploymentIncome + agg.interestIncome + agg.dividendIncome + agg.otherIncome;
  return agg;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Parse the `documentsJson` argument shared by several tools. */
export function parseDocumentsJson(documentsJson: string): Record<string, unknown>[] | null {
  try {
    const parsed = JSON.parse(documentsJson);
    return Array.isArray(parsed) ? parsed : (parsed.documents ?? []);
  } catch {
    return null;
  }
}
