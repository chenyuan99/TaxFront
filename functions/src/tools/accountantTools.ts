import { z } from "genkit";
import { getAI } from "../ai";
import { classifyDocument, collectIncome, parseDocumentsJson, round2 } from "../semantic/taxFields";

let _tools: ReturnType<typeof buildAccountantTools> | null = null;

function buildAccountantTools() {
  const ai = getAI();

  const buildTaxSummary = ai.defineTool(
    {
      name: "build_tax_summary",
      description:
        "Aggregate income, withholding, and deduction data from all of a user's tax documents into a single summary. Pass the full documents JSON from fetch_user_documents and the taxpayer's filing status. Use this before calling calculate_federal_tax.",
      inputSchema: z.object({
        documentsJson: z.string().describe("JSON string of the documents list from fetch_user_documents"),
        filingStatus: z.string().describe("single | married_filing_jointly | married_filing_separately | head_of_household"),
      }),
      outputSchema: z.unknown(),
    },
    async ({ documentsJson, filingStatus }) => {
      const docs = parseDocumentsJson(documentsJson);
      if (docs === null) {
        return { status: "error", message: "documentsJson must be valid JSON" };
      }

      const agg = collectIncome(docs);
      const totalItemizable = Object.values(agg.itemizableExpenses).reduce((a, b) => a + b, 0);

      const sourceLabels: Record<string, string> = {
        W2: "W-2",
        SELF_EMPLOYMENT: "1099-NEC / Self-employment",
        INTEREST: "1099-INT",
        DIVIDEND: "1099-DIV",
      };

      return {
        status: "ok", filingStatus,
        incomeSummary: {
          w2Wages: round2(agg.w2Wages),
          selfEmploymentIncome: round2(agg.selfEmploymentIncome),
          interestIncome: round2(agg.interestIncome),
          dividendIncome: round2(agg.dividendIncome),
          otherIncome: round2(agg.otherIncome),
          totalIncome: round2(agg.totalIncome),
        },
        withholdingSummary: {
          federalIncomeTaxWithheld: round2(agg.federalWithheld),
          stateIncomeTaxWithheld: round2(agg.stateWithheld),
          socialSecurityWithheld: round2(agg.socialSecurityWithheld),
          medicareWithheld: round2(agg.medicareWithheld),
        },
        itemizableExpensesFound: agg.itemizableExpenses,
        totalItemizableExpenses: round2(totalItemizable),
        incomeSources: agg.sources.map((s) => ({
          source: sourceLabels[s.category] ?? `Other (${s.documentType})`,
          document: s.documentName,
          amount: round2(s.amount),
          federalWithheld: round2(s.federalWithheld),
        })),
        unprocessedDocuments: agg.unprocessedDocuments,
        note: "Based on extracted document data. Verify against originals before filing.",
      };
    }
  );

  const suggestDeductions = ai.defineTool(
    {
      name: "suggest_deductions",
      description:
        "Identify deductions the taxpayer may qualify for based on their documents and income. Returns above-the-line deductions, itemized deductions, and self-employment deductions as a checklist.",
      inputSchema: z.object({
        documentsJson: z.string(),
        filingStatus: z.string(),
        grossIncome: z.number(),
      }),
      outputSchema: z.unknown(),
    },
    async ({ documentsJson, filingStatus, grossIncome }) => {
      const docs = parseDocumentsJson(documentsJson);
      if (docs === null) {
        return { status: "error", message: "documentsJson must be valid JSON" };
      }

      const categories = new Set(docs.map((d) => classifyDocument(d.documentType)));
      const has1099NEC = categories.has("SELF_EMPLOYMENT");
      const hasMortgage = categories.has("MORTGAGE");
      const hasDonations = categories.has("DONATION");
      const isMFJ = filingStatus.toLowerCase().includes("jointly");

      const suggestions: unknown[] = [
        {
          category: "Above-the-line deductions (reduce AGI)",
          items: [
            { deduction: "Student loan interest", maxDeduction: 2500, agiPhaseOutStart: isMFJ ? 155000 : 75000, action: "Check Form 1098-E from your loan servicer.", form: "Schedule 1, Line 21" },
            { deduction: "IRA contribution deduction", maxDeduction: 7000, note: "Deductibility phases out if covered by workplace plan.", action: "Confirm IRA contributions made before April 15, 2025.", form: "Schedule 1, Line 20" },
            { deduction: "HSA contribution", maxDeduction: 4150, action: "Check Form 5498-SA from your HSA custodian.", form: "Schedule 1, Line 13 (Form 8889)" },
          ],
        },
      ];

      if (has1099NEC) {
        suggestions.push({
          category: "Self-employment deductions (Schedule C)",
          items: [
            { deduction: "Self-employed health insurance premiums", note: "100% deductible above the line if not eligible for employer plan.", form: "Schedule 1, Line 17" },
            { deduction: "SEP-IRA or Solo 401(k) contributions", maxDeduction: 69000, note: "Up to 25% of net self-employment income.", form: "Schedule 1, Line 16" },
            { deduction: "Half of self-employment tax", note: "Calculated via Schedule SE. Reduces AGI.", form: "Schedule 1, Line 15" },
            { deduction: "Business use of vehicle", note: "Standard mileage: $0.67/mile for 2024 (IRS Notice 2024-08). Keep mileage log.", form: "Schedule C, Part II" },
          ],
        });
      }

      const itemized: unknown[] = [
        hasMortgage
          ? { deduction: "Mortgage interest", note: "Deductible on acquisition debt up to $750,000 (loans after Dec 15, 2017).", form: "Schedule A, Line 8" }
          : { deduction: "Mortgage interest", note: "No Form 1098 found. If you own a home, obtain Form 1098 from your lender.", form: "Schedule A, Line 8" },
        ...(!hasDonations ? [{ deduction: "Charitable contributions", note: "Cash donations need a receipt; non-cash >$250 requires written acknowledgment. No charitable documents found.", form: "Schedule A, Lines 11-12" }] : []),
        { deduction: "State and local taxes (SALT)", maxDeduction: 10000, note: "Limited to $10,000 ($5,000 MFS). State income or sales tax + property tax.", form: "Schedule A, Lines 5-6" },
        { deduction: "Medical expenses exceeding 7.5% of AGI", thresholdPct: 7.5, thresholdAmount: round2(grossIncome * 0.075), note: "Only the amount above the threshold is deductible.", form: "Schedule A, Lines 1-4" },
      ];

      suggestions.push({ category: "Itemized deductions (Schedule A) — claim if total > standard deduction", items: itemized });

      return {
        status: "ok", filingStatus, grossIncome, deductionSuggestions: suggestions,
        disclaimer: "Potential deductions to investigate — not confirmed eligibility. Verify with IRS publications or a CPA.",
      };
    }
  );

  return { buildTaxSummary, suggestDeductions };
}

export function getAccountantTools() {
  if (!_tools) _tools = buildAccountantTools();
  return _tools;
}

