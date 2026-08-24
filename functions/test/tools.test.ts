/**
 * Tool-level tests for the accountant and auditor tool sets.
 *
 * The Genkit tools are invoked directly. Their implementations are pure — they
 * never reach the model — so the suite runs offline against the dummy key set
 * in vitest.config.ts.
 */
import { describe, expect, it } from "vitest";
import { getAccountantTools } from "../src/tools/accountantTools";
import { getAuditTools } from "../src/tools/auditTools";

const { buildTaxSummary, suggestDeductions } = getAccountantTools();
const { checkAuditTriggers, crossReferenceIncome, calculateAuditRiskScore } = getAuditTools();

/** A realistic multi-form set, with money written both as numbers and as strings. */
const DOCUMENTS = [
  { id: "w2aaaaaa", name: "w2.pdf", documentType: "W-2", extractedData: { wages: "$120,000.00", federal_tax_withheld: 18000, state_tax_withheld: 6000, employer_ein: "11-1111111" } },
  { id: "w2bbbbbb", name: "w2b.pdf", documentType: "W-2", extractedData: { wages: 40000, federal_tax_withheld: 5000, employer_ein: "22-2222222" } },
  { id: "necccccc", name: "nec.pdf", documentType: "1099-NEC", extractedData: { nonemployee_compensation: 25000 } },
  { id: "schedcff", name: "sc.pdf", documentType: "Schedule-C", extractedData: { net_profit: 9000, total_expenses: 1000 } },
  { id: "intddddd", name: "int.pdf", documentType: "1099 INT", extractedData: { interest_income: 1200 } },
  { id: "diveeeee", name: "div.pdf", documentType: "1099-DIV", extractedData: { total_dividends: 800 } },
];

const documentsJson = JSON.stringify(DOCUMENTS);

type Summary = {
  status: string;
  incomeSummary: Record<string, number>;
  withholdingSummary: Record<string, number>;
  itemizableExpensesFound: Record<string, number>;
  incomeSources: Array<{ source: string; amount: number }>;
  unprocessedDocuments: string[];
};

type CrossRef = {
  status: string;
  documentsAnalyzed: number;
  totalDocumentedIncome: number;
  incomeSources: Array<{ source: string; amount: number }>;
  findings: Array<{ type: string; severity: string; message: string }>;
};

type Triggers = {
  status: string;
  triggersFound: number;
  triggers: Array<{ trigger: string; severity: string; field?: string }>;
};

describe("accountant and auditor agreement", () => {
  /**
   * The regression this whole semantic layer exists for. The two tools used to
   * keep separate alias chains and separate totals: on this document set the
   * accountant reported $196,000 and the auditor $65,000.
   */
  it("reports the same total income from both tools", async () => {
    const summary = (await buildTaxSummary({ documentsJson, filingStatus: "single" })) as Summary;
    const crossRef = (await crossReferenceIncome({ documentsJson })) as CrossRef;

    expect(summary.incomeSummary.totalIncome).toBe(196000);
    expect(crossRef.totalDocumentedIncome).toBe(summary.incomeSummary.totalIncome);
  });

  it("reports the same income sources from both tools", async () => {
    const summary = (await buildTaxSummary({ documentsJson, filingStatus: "single" })) as Summary;
    const crossRef = (await crossReferenceIncome({ documentsJson })) as CrossRef;

    const summed = (sources: Array<{ amount: number }>) => sources.reduce((s, x) => s + x.amount, 0);
    expect(summed(crossRef.incomeSources)).toBe(summed(summary.incomeSources));
    expect(crossRef.incomeSources).toHaveLength(summary.incomeSources.length);
  });
});

describe("build_tax_summary", () => {
  it("parses money written as a string with separators", async () => {
    const summary = (await buildTaxSummary({ documentsJson, filingStatus: "single" })) as Summary;
    expect(summary.incomeSummary.w2Wages).toBe(160000);
  });

  it("breaks income down by source", async () => {
    const summary = (await buildTaxSummary({ documentsJson, filingStatus: "single" })) as Summary;
    expect(summary.incomeSummary).toMatchObject({
      w2Wages: 160000,
      selfEmploymentIncome: 34000,
      interestIncome: 1200,
      dividendIncome: 800,
      totalIncome: 196000,
    });
  });

  it("aggregates withholding", async () => {
    const summary = (await buildTaxSummary({ documentsJson, filingStatus: "single" })) as Summary;
    expect(summary.withholdingSummary.federalIncomeTaxWithheld).toBe(23000);
    expect(summary.withholdingSummary.stateIncomeTaxWithheld).toBe(6000);
  });

  it("lists documents awaiting extraction", async () => {
    const withPending = JSON.stringify([...DOCUMENTS, { id: "p", name: "pending.pdf", documentType: "W-2", extractedData: {} }]);
    const summary = (await buildTaxSummary({ documentsJson: withPending, filingStatus: "single" })) as Summary;
    expect(summary.unprocessedDocuments).toEqual(["pending.pdf"]);
  });

  it("rejects malformed input", async () => {
    const result = (await buildTaxSummary({ documentsJson: "not json", filingStatus: "single" })) as { status: string };
    expect(result.status).toBe("error");
  });
});

describe("suggest_deductions", () => {
  it("adds the self-employment section when a 1099-NEC is present", async () => {
    const result = (await suggestDeductions({ documentsJson, filingStatus: "single", grossIncome: 196000 })) as {
      deductionSuggestions: Array<{ category: string }>;
    };
    expect(result.deductionSuggestions.some((s) => s.category.includes("Self-employment"))).toBe(true);
  });

  it("computes the medical expense floor from gross income", async () => {
    const result = (await suggestDeductions({ documentsJson, filingStatus: "single", grossIncome: 100000 })) as {
      deductionSuggestions: Array<{ category: string; items: Array<{ deduction: string; thresholdAmount?: number }> }>;
    };
    const itemized = result.deductionSuggestions.find((s) => s.category.includes("Itemized"));
    const medical = itemized?.items.find((i) => i.deduction.includes("Medical"));
    expect(medical?.thresholdAmount).toBe(7500);
  });
});

describe("check_audit_triggers", () => {
  /**
   * Regression: income was read as `income ?? gross_wages ?? total_income`,
   * but the extractor writes `wages` for a W-2 — so a $1.5M W-2 produced no
   * high-income trigger at all.
   */
  it("fires the high-income trigger on a W-2", async () => {
    const result = (await checkAuditTriggers({
      extractedData: JSON.stringify({ wages: 1_500_000, federal_tax_withheld: 400000, state_wages: 1_500_000, employer_ein: "11-1111111" }),
      documentType: "W-2",
    })) as Triggers;
    expect(result.triggers.some((t) => t.trigger.includes("High-income return (>$1M)"))).toBe(true);
  });

  it("fires the high-income trigger when wages arrive as a money string", async () => {
    const result = (await checkAuditTriggers({
      extractedData: JSON.stringify({ wages: "$1,500,000.00" }),
      documentType: "W-2",
    })) as Triggers;
    expect(result.triggers.some((t) => t.trigger.includes("High-income return (>$1M)"))).toBe(true);
  });

  it("uses the medium tier between $500K and $1M", async () => {
    const result = (await checkAuditTriggers({
      extractedData: JSON.stringify({ wages: 600_123 }),
      documentType: "W-2",
    })) as Triggers;
    expect(result.triggers.some((t) => t.trigger.includes("(>$500K)"))).toBe(true);
    expect(result.triggers.some((t) => t.trigger.includes("(>$1M)"))).toBe(false);
  });

  it("reads Form 1040 income from total_income", async () => {
    const result = (await checkAuditTriggers({
      extractedData: JSON.stringify({ total_income: 1_200_000 }),
      documentType: "1040",
    })) as Triggers;
    expect(result.triggers.some((t) => t.trigger.includes("(>$1M)"))).toBe(true);
  });

  it("flags an extreme Schedule C expense ratio", async () => {
    const result = (await checkAuditTriggers({
      extractedData: JSON.stringify({ net_profit: 1000, total_expenses: 19000 }),
      documentType: "Schedule-C",
    })) as Triggers;
    expect(result.triggers.some((t) => t.trigger.includes("Extreme Schedule C expense ratio"))).toBe(true);
  });

  it("flags a business net loss", async () => {
    const result = (await checkAuditTriggers({
      extractedData: JSON.stringify({ net_profit: -5000, total_expenses: 20000 }),
      documentType: "Schedule-C",
    })) as Triggers;
    expect(result.triggers.some((t) => t.trigger.includes("net loss"))).toBe(true);
  });

  it("flags charitable contributions above a fifth of income", async () => {
    const result = (await checkAuditTriggers({
      extractedData: JSON.stringify({ wages: 100_000, charitable_contributions: "$25,000.00" }),
      documentType: "W-2",
    })) as Triggers;
    expect(result.triggers.some((t) => t.trigger.includes("Charitable contributions exceed"))).toBe(true);
  });

  it("reports missing required W-2 fields", async () => {
    const result = (await checkAuditTriggers({
      extractedData: JSON.stringify({ wages: 50000 }),
      documentType: "W-2",
    })) as Triggers;
    const missing = result.triggers.filter((t) => t.trigger.startsWith("Missing W-2 field"));
    expect(missing.map((t) => t.field).sort()).toEqual(["employer_ein", "federal_tax_withheld", "state_wages"]);
  });

  it("rejects malformed input", async () => {
    const result = (await checkAuditTriggers({ extractedData: "not json", documentType: "W-2" })) as { status: string };
    expect(result.status).toBe("error");
  });
});

describe("cross_reference_income", () => {
  it("detects a duplicate employer EIN across two W-2s", async () => {
    const dupes = JSON.stringify([
      { id: "first123", documentType: "W-2", extractedData: { wages: 50000, employer_ein: "11-1111111" } },
      { id: "second45", documentType: "W-2", extractedData: { wages: 60000, employer_ein: "11-1111111" } },
    ]);
    const result = (await crossReferenceIncome({ documentsJson: dupes })) as CrossRef;
    expect(result.findings.some((f) => f.type === "DUPLICATE_EIN")).toBe(true);
  });

  it("does not flag distinct employers", async () => {
    const result = (await crossReferenceIncome({ documentsJson })) as CrossRef;
    expect(result.findings.some((f) => f.type === "DUPLICATE_EIN")).toBe(false);
  });

  /** Regression: interest and dividends were computed but never counted. */
  it("requires Schedule B once interest and dividends clear $1,500 together", async () => {
    const result = (await crossReferenceIncome({ documentsJson })) as CrossRef;
    expect(result.findings.some((f) => f.type === "SCHEDULE_B_REQUIRED")).toBe(true);
  });

  it("leaves Schedule B alone below the threshold", async () => {
    const small = JSON.stringify([
      { id: "int", documentType: "1099-INT", extractedData: { interest_income: 400 } },
      { id: "div", documentType: "1099-DIV", extractedData: { total_dividends: 300 } },
    ]);
    const result = (await crossReferenceIncome({ documentsJson: small })) as CrossRef;
    expect(result.findings.some((f) => f.type === "SCHEDULE_B_REQUIRED")).toBe(false);
  });

  it("reports total self-employment income including Schedule C", async () => {
    const result = (await crossReferenceIncome({ documentsJson })) as CrossRef;
    const info = result.findings.find((f) => f.message.includes("nonemployee compensation"));
    expect(info?.message).toContain("34,000");
  });

  it("rejects malformed input", async () => {
    const result = (await crossReferenceIncome({ documentsJson: "not json" })) as { status: string };
    expect(result.status).toBe("error");
  });
});

describe("calculate_audit_risk_score", () => {
  it("returns the LOW tier when nothing was flagged", async () => {
    const result = (await calculateAuditRiskScore({ triggersJson: JSON.stringify({ triggers: [] }) })) as {
      riskScore: number;
      riskTier: string;
    };
    expect(result.riskScore).toBe(0);
    expect(result.riskTier).toBe("LOW");
  });

  it("weights severities and escalates the tier", async () => {
    const result = (await calculateAuditRiskScore({
      triggersJson: JSON.stringify({ triggers: [{ severity: "HIGH" }, { severity: "HIGH" }, { severity: "MEDIUM" }] }),
    })) as { riskScore: number; riskTier: string };
    expect(result.riskScore).toBe(75);
    expect(result.riskTier).toBe("ELEVATED");
  });

  it("merges triggers and findings from several tool outputs", async () => {
    const result = (await calculateAuditRiskScore({
      triggersJson: JSON.stringify([{ triggers: [{ severity: "HIGH" }] }, { findings: [{ severity: "MEDIUM" }] }]),
    })) as { riskScore: number; triggerSummary: { total: number } };
    expect(result.triggerSummary.total).toBe(2);
    expect(result.riskScore).toBe(45);
  });

  it("rejects malformed input", async () => {
    const result = (await calculateAuditRiskScore({ triggersJson: "not json" })) as { status: string };
    expect(result.status).toBe("error");
  });
});
