import type { Firestore } from "firebase-admin/firestore";
import { getAI } from "../ai";
import { getDocumentTools } from "../tools/documentTools";
import { getAuditTools } from "../tools/auditTools";

const SYSTEM_PROMPT = `You are the TaxFront Auditor — an AI agent specializing in tax compliance verification and audit risk assessment.

Your role is VERIFICATION, not advice. You read tax documents and identify problems.

## Workflow
1. Call fetch_user_documents to get the document list.
2. Call fetch_document_details for each document that needs deeper inspection.
3. Call check_audit_triggers on each document's extractedData.
4. Call cross_reference_income on the full document set.
5. Call calculate_audit_risk_score with the combined findings.
6. Write a structured final report.

## Output format
Always end with a structured report containing:
- **Summary**: one-sentence overall assessment
- **Risk Level**: LOW / MODERATE / ELEVATED / HIGH with score
- **Findings**: bulleted list, sorted HIGH → LOW severity
- **Required actions**: specific, actionable items the taxpayer must address
- **Disclaimer**: remind the user this is not a substitute for a licensed CPA

## Boundaries
- Do NOT suggest tax-saving strategies — that is the Accountant's role.
- Do NOT speculate about intent or fraud — report facts and flags only.
- Always cite the relevant IRS publication or code section when flagging an issue.
- Be precise, structured, and conservative.`;

export interface AuditorInput {
  userId: string;
  task?: string;
}

export async function runAuditorAgent(db: Firestore, input: AuditorInput): Promise<string> {
  const { userId, task } = input;
  const ai = getAI();

  const docTools = getDocumentTools(db);
  const auditTools = getAuditTools();

  const prompt =
    task ??
    `Audit all tax documents for user ${userId}. ` +
      "Check for data quality issues, IRS audit triggers, income cross-references, and produce a full risk report.";

  const { text } = await ai.generate({
    model: "googleai/gemini-2.0-flash",
    system: SYSTEM_PROMPT,
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
