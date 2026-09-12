/**
 * Copies the bundled template tree into the target directory, rendering
 * placeholder tokens in both file contents and file/directory names.
 *
 * Rename conventions (npm strips some dotfiles from published packages):
 *   _gitignore  -> .gitignore
 *   _easignore  -> .easignore
 *   _env.example -> .env.example
 */
import { cp, mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const SPECIAL_RENAMES: Record<string, string> = {
  _gitignore: ".gitignore",
  _easignore: ".easignore",
  "_env.example": ".env.example",
};

const BINARY_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".ttf", ".otf"]);

function renderName(name: string, tokens: Record<string, string>): string {
  const special = SPECIAL_RENAMES[name];
  let out = special ?? name;
  for (const [token, value] of Object.entries(tokens)) {
    out = out.replaceAll(token, value);
  }
  return out;
}

function renderContent(content: string, tokens: Record<string, string>): string {
  let out = content;
  for (const [token, value] of Object.entries(tokens)) {
    out = out.replaceAll(token, value);
  }
  return out;
}

export async function scaffoldTemplate(
  templateDir: string,
  targetDir: string,
  tokens: Record<string, string>,
): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(templateDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(templateDir, entry.name);
    const destName = renderName(entry.name, tokens);
    const dest = path.join(targetDir, destName);
    if (entry.isDirectory()) {
      await scaffoldTemplate(src, dest, tokens);
    } else if (BINARY_EXTENSIONS.has(path.extname(entry.name))) {
      await cp(src, dest);
    } else {
      const content = await readFile(src, "utf8");
      await writeFile(dest, renderContent(content, tokens));
    }
  }
}

/** Kept exported for tests / future dry-run mode. */
export const _internal = { renderName, renderContent, rename };
