import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

let _ai: ReturnType<typeof genkit> | null = null;

export function getAI(): ReturnType<typeof genkit> {
  if (!_ai) {
    _ai = genkit({ plugins: [googleAI()] });
  }
  return _ai;
}
