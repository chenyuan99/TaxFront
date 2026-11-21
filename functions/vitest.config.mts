import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // The Genkit googleAI plugin requires a key to construct, but the tools
    // under test are pure — they never reach the model. A dummy value keeps
    // the suite offline and credential-free.
    env: {
      GEMINI_API_KEY: "test-dummy-key",
      GOOGLE_API_KEY: "test-dummy-key",
      GOOGLE_GENAI_API_KEY: "test-dummy-key",
    },
  },
});
