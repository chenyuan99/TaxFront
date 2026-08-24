import { describe, expect, it } from "vitest";
import {
  FIELD_ALIASES,
  classifyDocument,
  collectIncome,
  documentIncome,
  extractedFieldsOf,
  normalizeDocType,
  parseDocumentsJson,
  pickAmount,
  pickString,
  round2,
  safeFloat,
} from "../src/semantic/taxFields";

describe("safeFloat", () => {
  it("passes numbers through", () => {
    expect(safeFloat(1234.56)).toBe(1234.56);
    expect(safeFloat(0)).toBe(0);
    expect(safeFloat(-500)).toBe(-500);
  });

  // Regression: auditTools used bare parseFloat, which truncated at the comma.
  it("parses money strings that carry separators", () => {
    expect(safeFloat("1,234.56")).toBe(1234.56);
    expect(safeFloat("$120,000.00")).toBe(120000);
    expect(safeFloat("  $1,500,000  ")).toBe(1500000);
  });

  it("treats missing and unparseable values as zero", () => {
    expect(safeFloat(null)).toBe(0);
    expect(safeFloat(undefined)).toBe(0);
    expect(safeFloat("")).toBe(0);
    expect(safeFloat("not a number")).toBe(0);
    expect(safeFloat(NaN)).toBe(0);
  });

  // The extractor's output is model-generated JSON, so a nested object where a
  // scalar was expected is possible. It must not stringify to "[object Object]".
  it("treats non-scalar values as zero rather than stringifying them", () => {
    expect(safeFloat({ value: 100 })).toBe(0);
    expect(safeFloat([100])).toBe(0);
  });
});

describe("pickAmount", () => {
  it("takes the first alias present, not the first non-zero", () => {
    expect(pickAmount({ wages: 100, gross_wages: 200 }, FIELD_ALIASES.wages)).toBe(100);
    expect(pickAmount({ wages: 0, gross_wages: 200 }, FIELD_ALIASES.wages)).toBe(0);
  });

  it("falls through absent aliases", () => {
    expect(pickAmount({ income: 500 }, FIELD_ALIASES.wages)).toBe(500);
  });

  it("returns zero when no alias matches", () => {
    expect(pickAmount({ unrelated: 1 }, FIELD_ALIASES.wages)).toBe(0);
  });
});

describe("pickString", () => {
  it("returns the first alias present, trimmed", () => {
    expect(pickString({ employer_ein: " 11-1111111 " }, FIELD_ALIASES.employerEin)).toBe("11-1111111");
    expect(pickString({ ein: "22-2222222" }, FIELD_ALIASES.employerEin)).toBe("22-2222222");
  });

  it("returns an empty string when absent", () => {
    expect(pickString({}, FIELD_ALIASES.employerEin)).toBe("");
  });

  it("returns an empty string for a non-scalar value", () => {
    expect(pickString({ employer_ein: { nested: true } }, FIELD_ALIASES.employerEin)).toBe("");
  });
});

describe("normalizeDocType", () => {
  it("collapses every separator spelling to one form", () => {
    for (const spelling of ["1099-INT", "1099 INT", "1099_int", "1099int"]) {
      expect(normalizeDocType(spelling)).toBe("1099INT");
    }
  });

  it("tolerates missing types", () => {
    expect(normalizeDocType(null)).toBe("");
    expect(normalizeDocType(undefined)).toBe("");
  });
});

describe("classifyDocument", () => {
  it("maps each form to its category", () => {
    expect(classifyDocument("W-2")).toBe("W2");
    expect(classifyDocument("1099-NEC")).toBe("SELF_EMPLOYMENT");
    expect(classifyDocument("Schedule-C")).toBe("SELF_EMPLOYMENT");
    expect(classifyDocument("1099-INT")).toBe("INTEREST");
    expect(classifyDocument("1099-DIV")).toBe("DIVIDEND");
    expect(classifyDocument("1098")).toBe("MORTGAGE");
    expect(classifyDocument("charitable-receipt")).toBe("DONATION");
    expect(classifyDocument("1040")).toBe("FORM_1040");
    expect(classifyDocument("something-else")).toBe("OTHER");
    expect(classifyDocument(undefined)).toBe("OTHER");
  });

  // Regression: the auditor's INT/DIV filters did not strip separators.
  it("classifies separator variants identically", () => {
    expect(classifyDocument("1099 INT")).toBe("INTEREST");
    expect(classifyDocument("1099int")).toBe("INTEREST");
    expect(classifyDocument("1099 DIV")).toBe("DIVIDEND");
  });
});

describe("extractedFieldsOf", () => {
  it("prefers extractedData and falls back to the legacy metadata key", () => {
    expect(extractedFieldsOf({ extractedData: { wages: 1 } })).toEqual({ wages: 1 });
    expect(extractedFieldsOf({ metadata: { wages: 2 } })).toEqual({ wages: 2 });
    expect(extractedFieldsOf({})).toEqual({});
  });
});

describe("documentIncome", () => {
  // Regression: check_audit_triggers read income/gross_wages/total_income, but
  // the extractor writes `wages` for a W-2 — so this used to resolve to 0.
  it("reads W-2 income from wages", () => {
    expect(documentIncome({ wages: 1_500_000 }, "W2")).toBe(1_500_000);
    expect(documentIncome({ wages: "$1,500,000.00" }, "W2")).toBe(1_500_000);
  });

  it("reads each other category from its own canonical field", () => {
    expect(documentIncome({ nonemployee_compensation: 25000 }, "SELF_EMPLOYMENT")).toBe(25000);
    expect(documentIncome({ net_profit: 9000 }, "SELF_EMPLOYMENT")).toBe(9000);
    expect(documentIncome({ interest_income: 1200 }, "INTEREST")).toBe(1200);
    expect(documentIncome({ total_dividends: 800 }, "DIVIDEND")).toBe(800);
    expect(documentIncome({ total_income: 999 }, "FORM_1040")).toBe(999);
    expect(documentIncome({ amount: 42 }, "OTHER")).toBe(42);
  });

  it("reports no income for expense-only documents", () => {
    expect(documentIncome({ mortgage_interest: 8000 }, "MORTGAGE")).toBe(0);
    expect(documentIncome({ amount: 500 }, "DONATION")).toBe(0);
  });
});

describe("collectIncome", () => {
  const mixedDocs = [
    { id: "w2aaaaaa", name: "w2.pdf", documentType: "W-2", extractedData: { wages: "$120,000.00", federal_tax_withheld: 18000, state_tax_withheld: 6000, social_security_tax_withheld: 7440, medicare_tax_withheld: 1740, employer_ein: "11-1111111" } },
    { id: "w2bbbbbb", name: "w2b.pdf", documentType: "W-2", extractedData: { wages: 40000, federal_tax_withheld: 5000, employer_ein: "22-2222222" } },
    { id: "necccccc", name: "nec.pdf", documentType: "1099-NEC", extractedData: { nonemployee_compensation: 25000 } },
    { id: "schedcff", name: "sc.pdf", documentType: "Schedule-C", extractedData: { net_profit: 9000, total_expenses: 1000 } },
    { id: "intddddd", name: "int.pdf", documentType: "1099 INT", extractedData: { interest_income: 1200 } },
    { id: "diveeeee", name: "div.pdf", documentType: "1099-DIV", extractedData: { total_dividends: 800 } },
    { id: "mtghhhhh", name: "1098.pdf", documentType: "1098", extractedData: { mortgage_interest: 8000 } },
    { id: "donjjjjj", name: "gift.pdf", documentType: "charitable-receipt", extractedData: { amount: 2500 } },
    { id: "f1040ggg", name: "1040.pdf", documentType: "1040", extractedData: { total_income: 999999 } },
  ];

  it("breaks income down by category", () => {
    const agg = collectIncome(mixedDocs);
    expect(agg.w2Wages).toBe(160000);
    expect(agg.selfEmploymentIncome).toBe(34000);
    expect(agg.interestIncome).toBe(1200);
    expect(agg.dividendIncome).toBe(800);
    expect(agg.otherIncome).toBe(0);
    expect(agg.totalIncome).toBe(196000);
  });

  // The invariant the accountant/auditor split used to violate.
  it("keeps totalIncome equal to the sum of its reported sources", () => {
    const agg = collectIncome(mixedDocs);
    const sourceSum = agg.sources.reduce((sum, s) => sum + s.amount, 0);
    expect(sourceSum).toBe(agg.totalIncome);
  });

  it("counts Schedule C profit as self-employment income", () => {
    const agg = collectIncome([{ id: "sc", documentType: "Schedule-C", extractedData: { net_profit: 9000 } }]);
    expect(agg.selfEmploymentIncome).toBe(9000);
    expect(agg.totalIncome).toBe(9000);
  });

  it("classifies a Form 1040 but excludes it from income, to avoid double counting", () => {
    const agg = collectIncome(mixedDocs);
    expect(agg.documentsByCategory.FORM_1040).toHaveLength(1);
    expect(agg.sources.some((s) => s.category === "FORM_1040")).toBe(false);
    expect(agg.totalIncome).toBe(196000);
  });

  it("aggregates withholding across every W-2", () => {
    const agg = collectIncome(mixedDocs);
    expect(agg.federalWithheld).toBe(23000);
    expect(agg.stateWithheld).toBe(6000);
    expect(agg.socialSecurityWithheld).toBe(7440);
    expect(agg.medicareWithheld).toBe(1740);
  });

  it("collects itemizable expenses without counting them as income", () => {
    const agg = collectIncome(mixedDocs);
    expect(agg.itemizableExpenses).toEqual({ mortgageInterest: 8000, charitableContributions: 2500 });
    expect(agg.totalIncome).toBe(196000);
  });

  it("sums repeated expense documents of the same kind", () => {
    const agg = collectIncome([
      { id: "a", documentType: "1098", extractedData: { mortgage_interest: 5000 } },
      { id: "b", documentType: "1098", extractedData: { mortgage_interest: 3000 } },
    ]);
    expect(agg.itemizableExpenses.mortgageInterest).toBe(8000);
  });

  it("reports documents that have not been extracted yet", () => {
    const agg = collectIncome([
      { id: "pending", name: "scan.pdf", documentType: "W-2", extractedData: {} },
      { id: "done", name: "w2.pdf", documentType: "W-2", extractedData: { wages: 100 } },
    ]);
    expect(agg.unprocessedDocuments).toEqual(["scan.pdf"]);
    expect(agg.w2Wages).toBe(100);
  });

  it("groups every document by category, including unextracted ones", () => {
    const agg = collectIncome(mixedDocs);
    expect(agg.documentsByCategory.W2).toHaveLength(2);
    expect(agg.documentsByCategory.SELF_EMPLOYMENT).toHaveLength(2);
    expect(agg.documentsByCategory.INTEREST).toHaveLength(1);
  });

  it("falls back to 'unknown' rather than stringifying a non-scalar id or name", () => {
    const agg = collectIncome([{ id: { nested: true }, name: ["a"], documentType: "W-2", extractedData: { wages: 100 } }]);
    expect(agg.sources[0].documentId).toBe("unknown");
    expect(agg.sources[0].documentName).toBe("unknown");
  });

  it("returns a zeroed aggregate for no documents", () => {
    const agg = collectIncome([]);
    expect(agg.totalIncome).toBe(0);
    expect(agg.sources).toEqual([]);
    expect(agg.unprocessedDocuments).toEqual([]);
  });
});

describe("parseDocumentsJson", () => {
  it("accepts a bare array and a wrapped object", () => {
    expect(parseDocumentsJson('[{"id":"a"}]')).toEqual([{ id: "a" }]);
    expect(parseDocumentsJson('{"documents":[{"id":"a"}]}')).toEqual([{ id: "a" }]);
  });

  it("returns null on malformed JSON so callers can report an error", () => {
    expect(parseDocumentsJson("not json")).toBeNull();
  });
});

describe("round2", () => {
  it("rounds to cents", () => {
    expect(round2(1234.5678)).toBe(1234.57);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});
