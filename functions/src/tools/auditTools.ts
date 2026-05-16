import { z } from "genkit";
import { getAI } from "../ai";

let _tools: ReturnType<typeof buildAuditTools> | null = null;

function buildAuditTools() {
  const ai = getAI();

  const checkAuditTriggers = ai.defineTool(
    {
      name: "check_audit_triggers",
      description:
        "Evaluate extracted tax document data against known IRS audit triggers: income levels, Schedule C expense ratios, charitable deduction ratios, home office claims, and missing required fields.",
      inputSchema: z.object({
        extractedData: z.string().describe("JSON string of the document's extractedData field"),
        documentType: z.string().describe("e.g. 'W-2', '1099-NEC', 'Schedule C', '1040'"),
      }),
      outputSchema: z.unknown(),
    },
    async ({ extractedData, documentType }) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(extractedData);
      } catch {
        return { status: "error", message: "extractedData must be valid JSON" };
      }

      const triggers: unknown[] = [];
      const docType = documentType.toUpperCase().replace(/[-\s]/g, "");

      const income = parseFloat(String(data.income ?? data.gross_wages ?? data.total_income ?? 0)) || 0;

      if (income > 1_000_000) {
        triggers.push({ trigger: "High-income return (>$1M)", severity: "HIGH", detail: "IRS audits ~5% of returns with income over $1M (IRS Data Book 2023).", field: "income" });
      } else if (income > 500_000) {
        triggers.push({ trigger: "High-income return (>$500K)", severity: "MEDIUM", detail: "Returns over $500K have above-average audit rates.", field: "income" });
      }

      if (income > 0 && income === Math.round(income / 1000) * 1000) {
        triggers.push({ trigger: "Round-number income", severity: "LOW", detail: "Income reported as a round thousand may indicate estimation.", field: "income" });
      }

      const netProfit = data.net_profit != null ? parseFloat(String(data.net_profit)) : null;
      const totalExpenses = data.total_expenses != null ? parseFloat(String(data.total_expenses)) : null;

      if (netProfit != null && totalExpenses != null && !isNaN(netProfit) && !isNaN(totalExpenses)) {
        const grossRevenue = netProfit + totalExpenses;
        if (grossRevenue > 0) {
          const expenseRatio = totalExpenses / grossRevenue;
          if (expenseRatio > 0.9) {
            triggers.push({ trigger: "Extreme Schedule C expense ratio (>90%)", severity: "HIGH", detail: `Expenses are ${Math.round(expenseRatio * 100)}% of revenue. IRS targets Schedule C losses heavily.`, field: "total_expenses" });
          } else if (expenseRatio > 0.75) {
            triggers.push({ trigger: "High Schedule C expense ratio (>75%)", severity: "MEDIUM", detail: `Expenses are ${Math.round(expenseRatio * 100)}% of revenue.`, field: "total_expenses" });
          }
        }
        if (netProfit < 0) {
          triggers.push({ trigger: "Business net loss reported", severity: "MEDIUM", detail: "Losses from a non-profit activity are disallowable (IRC §183 hobby-loss rule). Three-of-five-year profit test applies.", field: "net_profit" });
        }
      }

      const charitable = data.charitable_contributions != null ? parseFloat(String(data.charitable_contributions)) : null;
      if (charitable != null && income > 0 && !isNaN(charitable)) {
        const ratio = charitable / income;
        if (ratio > 0.2) {
          triggers.push({ trigger: "Charitable contributions exceed 20% of income", severity: "HIGH", detail: `Charitable deductions are ${Math.round(ratio * 100)}% of income. IRS Publication 526 limits vary by deduction type.`, field: "charitable_contributions" });
        }
      }

      if (data.home_office_deduction || data.home_office) {
        triggers.push({ trigger: "Home office deduction claimed", severity: "LOW", detail: "Must meet exclusive-use and principal-place-of-business tests (IRC §280A). Keep square footage documentation.", field: "home_office_deduction" });
      }

      if (docType.includes("W2")) {
        for (const field of ["wages", "federal_tax_withheld", "state_wages", "employer_ein"]) {
          if (!data[field]) {
            triggers.push({ trigger: `Missing W-2 field: ${field}`, severity: "MEDIUM", detail: `Field '${field}' is required on Form W-2 but was not found. May indicate OCR failure or data entry error.`, field });
          }
        }
      }

      return { status: "ok", documentType, triggersFound: triggers.length, triggers };
    }
  );

  const crossReferenceIncome = ai.defineTool(
    {
      name: "cross_reference_income",
      description:
        "Check income consistency across all of a user's tax documents. Detects duplicate employer EINs, unreported 1099 income, and Schedule B requirements. Pass the full documents JSON from fetch_user_documents.",
      inputSchema: z.object({ documentsJson: z.string() }),
      outputSchema: z.unknown(),
    },
    async ({ documentsJson }) => {
      let docs: Record<string, unknown>[];
      try {
        const parsed = JSON.parse(documentsJson);
        docs = Array.isArray(parsed) ? parsed : (parsed.documents ?? []);
      } catch {
        return { status: "error", message: "documentsJson must be valid JSON" };
      }

      const findings: unknown[] = [];
      const incomeSources: unknown[] = [];

      const w2Docs = docs.filter((d) => String(d.documentType ?? "").toUpperCase().replace(/[-\s]/g, "").includes("W2"));
      const necDocs = docs.filter((d) => { const t = String(d.documentType ?? "").toUpperCase(); return t.includes("1099") && t.includes("NEC"); });
      const intDocs = docs.filter((d) => String(d.documentType ?? "").toUpperCase().includes("1099-INT") || String(d.documentType ?? "").toUpperCase().includes("1099INT"));
      const divDocs = docs.filter((d) => String(d.documentType ?? "").toUpperCase().includes("1099-DIV") || String(d.documentType ?? "").toUpperCase().includes("1099DIV"));

      const einsSeenMap: Record<string, string> = {};
      for (const doc of w2Docs) {
        const ext = (doc.extractedData ?? {}) as Record<string, unknown>;
        const ein = String(ext.employer_ein ?? ext.ein ?? "");
        const docId = String(doc.id ?? "unknown");
        if (ein) {
          if (einsSeenMap[ein]) {
            findings.push({ type: "DUPLICATE_EIN", severity: "HIGH", message: `Employer EIN ${ein} appears on multiple W-2s (IDs: ${einsSeenMap[ein]}, ${docId}). May be a duplicate upload or two part-year jobs.`, documentIds: [einsSeenMap[ein], docId] });
          } else {
            einsSeenMap[ein] = docId;
          }
        }
        const wages = parseFloat(String(ext.wages ?? ext.gross_wages ?? ext.income ?? 0)) || 0;
        if (wages > 0) incomeSources.push({ source: `W-2 (${docId.slice(0, 8)}…)`, amount: wages });
      }

      let necTotal = 0;
      for (const doc of necDocs) {
        const ext = (doc.extractedData ?? {}) as Record<string, unknown>;
        const amount = parseFloat(String(ext.nonemployee_compensation ?? ext.income ?? ext.amount ?? 0)) || 0;
        if (amount > 0) { necTotal += amount; incomeSources.push({ source: `1099-NEC (${String(doc.id ?? "").slice(0, 8)}…)`, amount }); }
      }
      if (necTotal > 0) findings.push({ type: "INFO", severity: "LOW", message: `Total 1099-NEC nonemployee compensation: $${necTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}. Ensure reported on Schedule C or Schedule 1 Line 8.` });

      const interestTotal = intDocs.reduce((sum, d) => sum + (parseFloat(String((d.extractedData as Record<string, unknown> | undefined)?.interest_income ?? (d.extractedData as Record<string, unknown> | undefined)?.amount ?? 0)) || 0), 0);
      const dividendTotal = divDocs.reduce((sum, d) => sum + (parseFloat(String((d.extractedData as Record<string, unknown> | undefined)?.total_dividends ?? (d.extractedData as Record<string, unknown> | undefined)?.amount ?? 0)) || 0), 0);
      if (interestTotal + dividendTotal > 1500) {
        findings.push({ type: "SCHEDULE_B_REQUIRED", severity: "MEDIUM", message: `Combined interest ($${interestTotal.toFixed(2)}) and dividends ($${dividendTotal.toFixed(2)}) exceed $1,500 — Schedule B is required.` });
      }

      const totalDocumentedIncome = (incomeSources as Array<{ amount: number }>).reduce((sum, s) => sum + s.amount, 0);

      return {
        status: "ok", documentsAnalyzed: docs.length,
        totalDocumentedIncome: Math.round(totalDocumentedIncome * 100) / 100,
        incomeSources, findings,
        note: "Cross-reference limited to extracted document data. Full reconciliation requires filed Form 1040.",
      };
    }
  );

  const calculateAuditRiskScore = ai.defineTool(
    {
      name: "calculate_audit_risk_score",
      description:
        "Synthesize audit trigger findings into a numeric risk score and tier (LOW/MODERATE/ELEVATED/HIGH). Pass the combined JSON output from check_audit_triggers and/or cross_reference_income.",
      inputSchema: z.object({ triggersJson: z.string() }),
      outputSchema: z.unknown(),
    },
    async ({ triggersJson }) => {
      let data: unknown;
      try {
        data = JSON.parse(triggersJson);
      } catch {
        return { status: "error", message: "triggersJson must be valid JSON" };
      }

      const allTriggers: Array<{ severity?: string }> = [];
      if (Array.isArray(data)) {
        for (const item of data) {
          if (typeof item === "object" && item !== null) {
            allTriggers.push(...((item as Record<string, unknown>).triggers as typeof allTriggers ?? []));
            allTriggers.push(...((item as Record<string, unknown>).findings as typeof allTriggers ?? []));
          }
        }
      } else if (typeof data === "object" && data !== null) {
        allTriggers.push(...(((data as Record<string, unknown>).triggers as typeof allTriggers) ?? []));
        allTriggers.push(...(((data as Record<string, unknown>).findings as typeof allTriggers) ?? []));
      }

      const weights: Record<string, number> = { HIGH: 30, MEDIUM: 15, LOW: 5, INFO: 0 };
      const score = allTriggers.reduce((sum, t) => sum + (weights[t.severity ?? "LOW"] ?? 5), 0);

      let tier: string, recommendation: string;
      if (score === 0) { tier = "LOW"; recommendation = "No significant audit flags detected. Return appears routine."; }
      else if (score <= 20) { tier = "LOW"; recommendation = "Minor flags present. Address LOW-severity items as best practice."; }
      else if (score <= 50) { tier = "MODERATE"; recommendation = "Some audit triggers detected. Review MEDIUM-severity items before filing. Organize supporting documentation."; }
      else if (score <= 90) { tier = "ELEVATED"; recommendation = "Multiple audit triggers present. CPA review recommended before filing."; }
      else { tier = "HIGH"; recommendation = "Significant audit risk. Professional tax preparation strongly recommended. Do not file without addressing HIGH-severity items."; }

      return {
        status: "ok", riskScore: score, riskTier: tier,
        triggerSummary: {
          highSeverity: allTriggers.filter((t) => t.severity === "HIGH").length,
          mediumSeverity: allTriggers.filter((t) => t.severity === "MEDIUM").length,
          lowSeverity: allTriggers.filter((t) => t.severity === "LOW" || t.severity === "INFO").length,
          total: allTriggers.length,
        },
        recommendation,
        disclaimer: "This score is a heuristic estimate, not an IRS DIF score.",
      };
    }
  );

  return { checkAuditTriggers, crossReferenceIncome, calculateAuditRiskScore };
}

export function getAuditTools() {
  if (!_tools) _tools = buildAuditTools();
  return _tools;
}


