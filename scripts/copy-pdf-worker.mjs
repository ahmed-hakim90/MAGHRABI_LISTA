import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(
  root,
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs",
);
const dest = path.join(root, "public", "pdf.worker.min.mjs");

await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.copyFile(src, dest);
