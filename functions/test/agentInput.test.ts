import { describe, expect, it } from "vitest";
import { readAgentInput } from "../src/agentInput";

describe("readAgentInput", () => {
  it("accepts an accountant request from the dashboard", () => {
    const input = { userId: "user-1", filingStatus: "single", task: "Review my tax situation" };
    expect(readAgentInput(input, "accountant")).toEqual(input);
  });

  it("preserves the default task when an auditor request omits it", () => {
    expect(readAgentInput({ userId: "user-1" }, "auditor")).toEqual({
      userId: "user-1",
      task: undefined,
    });
  });

  it("reports a caller error for a missing user ID, non-text field, or invalid body", () => {
    for (const input of [{}, { userId: "user-1", task: 123 }, null]) {
      expect(() => readAgentInput(input, "auditor")).toThrow(
        expect.objectContaining({ code: "invalid-argument" }),
      );
    }
  });

  it("enforces the filing-status length limit before constructing the prompt", () => {
    const textAtLimit = "s".repeat(64);
    expect(readAgentInput({ userId: "user-1", filingStatus: textAtLimit }, "accountant").filingStatus)
      .toBe(textAtLimit);
    expect(() => readAgentInput({ userId: "user-1", filingStatus: textAtLimit + "s" }, "accountant"))
      .toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });
});
