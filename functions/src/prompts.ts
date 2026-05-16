import * as fs from "fs";
import * as path from "path";

export function loadPrompt(name: string): string {
  // In compiled output, __dirname is functions/lib/src (or functions/lib for index).
  // prompts/ lives at functions/prompts/, two levels up from functions/lib/src/.
  const filePath = path.join(__dirname, "../../prompts", `${name}.md`);
  return fs.readFileSync(filePath, "utf-8");
}
