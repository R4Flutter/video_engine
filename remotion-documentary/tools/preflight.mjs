#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = process.argv[2] || "src";
const sourceRoot = path.join(root, source);
const publicRoot = path.join(root, "public");

if (!fs.existsSync(sourceRoot)) {
  console.error(`Preflight failed: source directory not found: ${sourceRoot}`);
  process.exit(1);
}

const files = fs
  .readdirSync(sourceRoot, {recursive: true})
  .filter((p) => typeof p === "string" && /\.(tsx?|json)$/.test(p));

const sourceText = files.map((p) => fs.readFileSync(path.join(sourceRoot, p), "utf8")).join("\n");

const bad = files.filter((p) =>
  fs.readFileSync(path.join(sourceRoot, p), "utf8").includes("reserved · phase 13+")
);

if (bad.length) {
  console.error("DEAD PLACEHOLDER FOUND:\n" + bad.join("\n"));
  process.exit(1);
}

// Validate built-in assets referenced by test/demo compositions before Remotion starts.
// User-provided production assets are validated by the script resolver/runtime.
const assetRefs = new Set();
const staticFilePattern = /staticFile\(\s*["']([^"']+)["']\s*\)/g;
const publicPathPattern = /["']\/(sample-[^"']+)["']/g;
for (const match of sourceText.matchAll(staticFilePattern)) assetRefs.add(match[1]);
for (const match of sourceText.matchAll(publicPathPattern)) assetRefs.add(match[1]);

const missingAssets = [...assetRefs]
  .filter((relativePath) => relativePath.startsWith("sample-") || relativePath.startsWith("test-"))
  .filter((relativePath) => !fs.existsSync(path.join(publicRoot, relativePath)));

if (missingAssets.length) {
  console.error("MISSING BUILT-IN PUBLIC ASSETS:\n" + missingAssets.join("\n"));
  process.exit(1);
}

console.log(`Preflight OK: ${files.length} source files scanned; no dead placeholder text; ${assetRefs.size} referenced built-in assets verified.`);
