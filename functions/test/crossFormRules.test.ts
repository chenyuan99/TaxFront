import type { Firestore } from "firebase-admin/firestore";
import { describe, expect, it, vi } from "vitest";
import { validateCrossFormRules } from "../src/tools/accountantTools";

function mockFirestore(documents: Record<string, unknown>[], profile: Record<string, unknown> = {}) {
  const where = vi.fn().mockReturnValue({
    get: async () => ({ docs: documents.map((data) => ({ data: () => data })) }),
  });
  const doc = vi.fn().mockReturnValue({ get: async () => ({ data: () => profile }) });
  return {
    db: {
      collection: (name: string) => name === "taxDocuments" ? { where } : { doc },
    } as unknown as Firestore,
    where,
    doc,
  };
}

describe("cross-form auditor checklist", () => {
  it("finds legacy fields and cites only matching-year evidence", async () => {
    const { db, where, doc } = mockFirestore([
      { name: "contract.pdf", documentType: "1099-NEC", tax_year: "2024", metadata: { income: "$550.00" } },
      { name: "bank.pdf", documentType: "1099 INT", taxYear: 2024, extractedData: { interest_income: 5 } },
      { name: "paystub.pdf", documentType: "other", taxYear: 2024, extractedData: { gross_wages: 1250 } },
      { name: "last-year.pdf", documentType: "W-2", taxYear: 2023, extractedData: { wages: 3100 } },
    ], { residencyTaxYear: 2024, claimsExemptPresenceDays: true });

    const warnings = await validateCrossFormRules(db, "user-1", 2024);

    expect(where).toHaveBeenCalledWith("userId", "==", "user-1");
    expect(doc).toHaveBeenCalledWith("user-1");
    expect(warnings.map(({ form, documents }) => [form, documents])).toEqual([
      ["Schedule C", ["contract.pdf"]], ["Schedule SE", ["contract.pdf"]], ["Form 8843", []],
      ["1099-INT", ["bank.pdf"]], ["W-2", ["paystub.pdf"]],
    ]);
    expect(warnings.find(({ form }) => form === "Schedule SE")?.message).toContain("net earnings");
  });

  it("clears upload-gap warnings when the supporting forms match the year", async () => {
    const { db } = mockFirestore([
      { documentType: "1099-NEC", taxYear: 2024, extractedData: { nonemployee_compensation: 650 } },
      ...["Schedule_C", "Schedule-SE", "Form 8843", "W-2"].map((documentType) => ({ documentType, taxYear: 2024 })),
    ], { residencyTaxYear: 2024, claimsExemptPresenceDays: true, employmentIncome: true });

    await expect(validateCrossFormRules(db, "user-1", 2024)).resolves.toEqual([]);
  });
});
