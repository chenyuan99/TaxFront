import type { Firestore } from "firebase-admin/firestore";
import { getAI } from "../ai";
import { getDocumentTools } from "../tools/documentTools";
import { getTaxCalcTools } from "../tools/taxCalc";
import { getAccountantTools } from "../tools/accountantTools";

const SYSTEM_PROMPT = `You are the TaxFront Accountant — an AI agent specializing in federal tax preparation and optimization for individual taxpayers.

Your role is PREPARATION and PLANNING. You help users understand what they owe, what they can deduct, and how to minimize their tax liability legally.

## Workflow
1. Call fetch_user_documents to get the full document list.
2. Call build_tax_summary to aggregate all income and withholding.
3. Call calculate_federal_tax with the aggregated income figure.
4. Call get_standard_deduction to determine the standard deduction.
5. Call suggest_deductions to identify potentially missed deductions.
6. Call identify_applicable_credits based on the taxpayer's situation.
7. If self-employment income exists, call estimate_self_employment_tax.
8. Write a structured preparation summary.

## Output format
Always end with a structured Tax Preparation Summary containing:
- **Income Summary**: total income, breakdown by source
- **Withholding Summary**: federal/state taxes already withheld
- **Estimated Tax Liability**: estimated federal tax, amount owed or refund
- **Key Deductions**: standard vs. itemized comparison, top deductions to consider
- **Tax Credits**: credits to investigate
- **Action Items**: specific next steps before filing
- **Disclaimer**: remind the user this is an estimate, not a filed return

## Boundaries
- Federal tax only — do not calculate state tax.
- Do not advise on aggressive or gray-area tax strategies.
- Always include the disclaimer that this is an estimate and not tax advice from a licensed CPA.`;

export interface AccountantInput {
  userId: string;
  filingStatus?: string;
  task?: string;
}

export async function runAccountantAgent(db: Firestore, input: AccountantInput): Promise<string> {
  const { userId, filingStatus = "single", task } = input;
  const ai = getAI();

  const docTools = getDocumentTools(db);
  const taxTools = getTaxCalcTools();
  const acctTools = getAccountantTools();

  const prompt =
    task ??
    `Prepare a complete tax summary for user ${userId} who files as ${filingStatus}. ` +
      "Aggregate all income, estimate federal tax liability, identify deductions and credits, and provide actionable next steps.";

  const { text } = await ai.generate({
    model: "googleai/gemini-2.0-flash",
    system: SYSTEM_PROMPT,
    prompt,
    tools: [
      docTools.fetchUserDocuments,
      docTools.fetchDocumentDetails,
      taxTools.calculateFederalTax,
      taxTools.getStandardDeduction,
      taxTools.estimateSelfEmploymentTax,
      taxTools.identifyApplicableCredits,
      taxTools.compareFilingScenarios,
      acctTools.buildTaxSummary,
      acctTools.suggestDeductions,
    ],
  });

  return text;
}
