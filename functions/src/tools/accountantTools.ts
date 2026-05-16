import { z } from "genkit";
import { getAI } from "../ai";

function safeFloat(val: unknown): number {
  if (val == null) return 0;
  const n = parseFloat(String(val).replace(/,|\$/g, "").trim());
  return isNaN(n) ? 0 : n;
}

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
      let docs: Record<string, unknown>[];
      try {
        const parsed = JSON.parse(documentsJson);
        docs = Array.isArray(parsed) ? parsed : (parsed.documents ?? []);
      } catch {
        return { status: "error", message: "documentsJson must be valid JSON" };
      }

      let w2Wages = 0, federalWithheld = 0, stateWithheld = 0, ssWithheld = 0, medicareWithheld = 0;
      let selfEmploymentIncome = 0, interestIncome = 0, dividendIncome = 0, otherIncome = 0;
      const itemizableExpenses: Record<string, number> = {};
      const incomeSources: unknown[] = [];
      const unprocessedDocs: string[] = [];

      for (const doc of docs) {
        const ext = (doc.extractedData ?? doc.metadata ?? {}) as Record<string, unknown>;
        const docType = String(doc.documentType ?? "").toUpperCase().replace(/[-\s]/g, "");
        const docName = String(doc.name ?? doc.id ?? "unknown");

        if (Object.keys(ext).length === 0) { unprocessedDocs.push(docName); continue; }

        if (docType.includes("W2")) {
          const wages = safeFloat(ext.wages ?? ext.gross_wages ?? ext.income);
          const fedWh = safeFloat(ext.federal_tax_withheld ?? ext.federal_income_tax);
          const ssWh = safeFloat(ext.social_security_tax_withheld ?? ext.ss_withheld);
          const medWh = safeFloat(ext.medicare_tax_withheld ?? ext.medicare_withheld);
          const stWh = safeFloat(ext.state_tax_withheld ?? ext.state_income_tax);
          w2Wages += wages; federalWithheld += fedWh; stateWithheld += stWh; ssWithheld += ssWh; medicareWithheld += medWh;
          if (wages > 0) incomeSources.push({ source: "W-2", document: docName, amount: wages, federalWithheld: fedWh });
        } else if (docType.includes("1099NEC") || docType.includes("NEC") || docType.includes("SCHEDULEC")) {
          const amount = safeFloat(ext.nonemployee_compensation ?? ext.net_profit ?? ext.income);
          selfEmploymentIncome += amount;
          if (amount > 0) incomeSources.push({ source: "1099-NEC / Self-employment", document: docName, amount });
        } else if (docType.includes("1099INT") || (docType.includes("1099") && docType.includes("INT"))) {
          interestIncome += safeFloat(ext.interest_income ?? ext.income ?? ext.amount);
        } else if (docType.includes("1099DIV") || (docType.includes("1099") && docType.includes("DIV"))) {
          dividendIncome += safeFloat(ext.total_dividends ?? ext.ordinary_dividends ?? ext.income);
        } else if (docType.includes("1098") || docType.includes("MORTGAGE")) {
          const interest = safeFloat(ext.mortgage_interest ?? ext.interest_paid ?? ext.amount);
          if (interest > 0) itemizableExpenses.mortgageInterest = (itemizableExpenses.mortgageInterest ?? 0) + interest;
        } else if (docType.includes("CHARITABLE") || docType.includes("DONATION") || docType.includes("RECEIPT")) {
          const donation = safeFloat(ext.amount ?? ext.donation_amount);
          if (donation > 0) itemizableExpenses.charitableContributions = (itemizableExpenses.charitableContributions ?? 0) + donation;
        } else {
          const generic = safeFloat(ext.income ?? ext.amount);
          if (generic > 0) { otherIncome += generic; incomeSources.push({ source: `Other (${doc.documentType ?? "unknown"})`, document: docName, amount: generic }); }
        }
      }

      const totalIncome = w2Wages + selfEmploymentIncome + interestIncome + dividendIncome + otherIncome;
      const totalItemizable = Object.values(itemizableExpenses).reduce((a, b) => a + b, 0);

      return {
        status: "ok", filingStatus,
        incomeSummary: {
          w2Wages: Math.round(w2Wages * 100) / 100,
          selfEmploymentIncome: Math.round(selfEmploymentIncome * 100) / 100,
          interestIncome: Math.round(interestIncome * 100) / 100,
          dividendIncome: Math.round(dividendIncome * 100) / 100,
          otherIncome: Math.round(otherIncome * 100) / 100,
          totalIncome: Math.round(totalIncome * 100) / 100,
        },
        withholdingSummary: {
          federalIncomeTaxWithheld: Math.round(federalWithheld * 100) / 100,
          stateIncomeTaxWithheld: Math.round(stateWithheld * 100) / 100,
          socialSecurityWithheld: Math.round(ssWithheld * 100) / 100,
          medicareWithheld: Math.round(medicareWithheld * 100) / 100,
        },
        itemizableExpensesFound: itemizableExpenses,
        totalItemizableExpenses: Math.round(totalItemizable * 100) / 100,
        incomeSources, unprocessedDocuments: unprocessedDocs,
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
      let docs: Record<string, unknown>[];
      try {
        const parsed = JSON.parse(documentsJson);
        docs = Array.isArray(parsed) ? parsed : (parsed.documents ?? []);
      } catch {
        return { status: "error", message: "documentsJson must be valid JSON" };
      }

      const docTypesPresent = new Set(docs.map((d) => String(d.documentType ?? "").toUpperCase().replace(/[-\s]/g, "")));
      const has1099NEC = [...docTypesPresent].some((t) => t.includes("1099NEC") || t.includes("NEC"));
      const hasMortgage = [...docTypesPresent].some((t) => t.includes("1098") || t.includes("MORTGAGE"));
      const hasDonations = [...docTypesPresent].some((t) => t.includes("CHARITABLE") || t.includes("DONATION"));
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
        { deduction: "Medical expenses exceeding 7.5% of AGI", thresholdPct: 7.5, thresholdAmount: Math.round(grossIncome * 0.075 * 100) / 100, note: "Only the amount above the threshold is deductible.", form: "Schedule A, Lines 1-4" },
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

