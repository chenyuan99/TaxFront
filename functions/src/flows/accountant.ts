import type { Firestore } from "firebase-admin/firestore";
import { getAI } from "../ai";
import { getDocumentTools } from "../tools/documentTools";
import { getTaxCalcTools } from "../tools/taxCalc";
import { getAccountantTools } from "../tools/accountantTools";
import { loadPrompt } from "../prompts";

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

  const userContext =
    `User ID: ${userId}\n` +
    `Filing status: ${filingStatus}\n\n`;

  const defaultTask =
    `Prepare a complete tax summary. Start by calling fetch_user_documents, then build_tax_summary, ` +
    `then calculate_federal_tax. Identify all applicable deductions and credits, and produce an ` +
    `actionable preparation summary.`;

  const prompt = userContext + (task ?? defaultTask);

  const { text } = await ai.generate({
    model: "googleai/gemini-2.0-flash",
    system: loadPrompt("accountant"),
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
