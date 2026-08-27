#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = process.argv[2] || "src";
const sourceRoot = path.join(root, source);

if (!fs.existsSync(sourceRoot)) {
  console.error(`Preflight failed: source directory not found: ${sourceRoot}`);
  process.exit(1);
}

const files = fs
  .readdirSync(sourceRoot, {recursive: true})
  .filter((p) => typeof p === "string" && /\.(tsx?|json)$/.test(p));

const bad = files.filter((p) =>
  fs.readFileSync(path.join(sourceRoot, p), "utf8").includes("reserved · phase 13+")
);

if (bad.length) {
  console.error("DEAD PLACEHOLDER FOUND:\n" + bad.join("\n"));
  process.exit(1);
}

console.log(`Preflight OK: ${files.length} source files scanned; no placeholder renderer text remains.`);
