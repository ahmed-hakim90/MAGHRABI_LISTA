// Lets `node --test` run TypeScript sources that import with the "@/" alias
// or without file extensions, matching how Next.js resolves them.
import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveFile(base) {
  return [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")].find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let base = null;
    if (specifier.startsWith("@/")) {
      base = path.join(root, specifier.slice(2));
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:")
    ) {
      base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    }
    const file = base ? resolveFile(base) : undefined;
    return nextResolve(file ? pathToFileURL(file).href : specifier, context);
  },
});
