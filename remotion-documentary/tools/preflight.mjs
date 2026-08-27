#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const source = process.argv[2] || "src";
const files = fs.readdirSync(path.join(root, source), {recursive:true}).filter((p) => typeof p === "string" && /\.(tsx?|json)$/.test(p));
const bad = files.filter((p) => fs.readFileSync(path.join(root, source, p), "utf8").includes("reserved · phase 13+"));
if (bad.length) { console.error("DEAD PLACEHOLDER FOUND:\n" + bad.join("\n")); process.exit(1); }
console.log(`Preflight OK: ${files.length} source files scanned; no placeholder renderer text remains.`);
