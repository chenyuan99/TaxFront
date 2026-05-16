import * as fs from "fs";
import * as path from "path";

export function loadPrompt(name: string): string {
  // prompts.ts compiles to lib/prompts.js, so __dirname === lib/.
  // The build script copies functions/prompts/ into lib/prompts/.
  const filePath = path.join(__dirname, "prompts", `${name}.md`);
  return fs.readFileSync(filePath, "utf-8");
}
