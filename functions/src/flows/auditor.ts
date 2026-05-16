import type { Firestore } from "firebase-admin/firestore";
import { getAI } from "../ai";
import { getDocumentTools } from "../tools/documentTools";
import { getAuditTools } from "../tools/auditTools";
import { loadPrompt } from "../prompts";

export interface AuditorInput {
  userId: string;
  task?: string;
}

export async function runAuditorAgent(db: Firestore, input: AuditorInput): Promise<string> {
  const { userId, task } = input;
  const ai = getAI();

  const docTools = getDocumentTools(db);
  const auditTools = getAuditTools();

  const userContext = `User ID: ${userId}\n\n`;

  const defaultTask =
    `Audit all tax documents. Start by calling fetch_user_documents, then check_audit_triggers ` +
    `for each document, then cross_reference_income across all documents, then ` +
    `calculate_audit_risk_score with the combined findings. Produce a full risk report.`;

  const prompt = userContext + (task ?? defaultTask);

  const { text } = await ai.generate({
    model: "googleai/gemini-2.0-flash",
    system: loadPrompt("auditor"),
    prompt,
    tools: [
      docTools.fetchUserDocuments,
      docTools.fetchDocumentDetails,
      auditTools.checkAuditTriggers,
      auditTools.crossReferenceIncome,
      auditTools.calculateAuditRiskScore,
    ],
  });

  return text;
}
