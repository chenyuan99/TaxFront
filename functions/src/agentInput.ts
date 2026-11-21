import { HttpsError } from "firebase-functions/v2/https";

const MAX_USER_ID_LENGTH = 128;
const MAX_FILING_STATUS_LENGTH = 64;
const MAX_TASK_LENGTH = 16_384;

function readString(
  data: Record<string, unknown>,
  field: string,
  maxLength: number,
): string | undefined {
  const value = data[field];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new HttpsError("invalid-argument", `${field} must be a string of at most ${maxLength} characters`);
  }
  return value;
}

/** Keep callable inputs scalar and bounded before constructing a Genkit prompt. */
export function readAgentInput(
  input: unknown,
  agent: "accountant" | "auditor",
): { userId: string; task?: string; filingStatus?: string } {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpsError("invalid-argument", "Expected an object");
  }

  const data = input as Record<string, unknown>;
  const userId = readString(data, "userId", MAX_USER_ID_LENGTH);
  if (!userId) throw new HttpsError("invalid-argument", "userId is required");

  return {
    userId,
    task: readString(data, "task", MAX_TASK_LENGTH),
    ...(agent === "accountant"
      ? { filingStatus: readString(data, "filingStatus", MAX_FILING_STATUS_LENGTH) }
      : {}),
  };
}
