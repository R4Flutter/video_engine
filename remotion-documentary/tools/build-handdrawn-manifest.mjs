#!/usr/bin/env node
/**
 * Build the deterministic long-form hand-drawn asset manifest.
 *
 * Input:
 *   remotion-documentary/public/handdrawn/
 *
 * Expected filenames:
 *   01_A_5-second_hand-drawn_ani.png
 *   02_A_5-second_hand-drawn_ani.png
 *   ...
 *
 * The leading integer is the canonical editorial order. The engine never
 * chooses a "best" image for these shots and never substitutes another asset.
 */
import {existsSync, mkdirSync, readdirSync, writeFileSync, statSync} from "node:fs";
import {extname} from "node:path";
import {fileURLToPath} from "node:url";
import {dirname, join, relative, resolve} from "node:path";

const toolDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(toolDir, "..");
const publicDir = join(root, "public", "handdrawn");
const outputDir = join(root, "src", "handdrawn");
const outputFile = join(outputDir, "handdrawn-manifest.json");
const allowed = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const prefix = /^(\d{1,4})(?:[_-]|\s)/;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, {recursive: true});
  throw new Error(`Missing asset folder contents: ${publicDir}. Copy the 01_..., 02_..., ... hand-drawn stills into public/handdrawn first.`);
}

const candidates = walk(publicDir)
  .filter((file) => allowed.has(extname(file).toLowerCase()))
  .map((file) => {
    const name = file.split(/[/\\]/).pop() ?? file;
    const match = name.match(prefix);
    if (!match) return null;
    return {
      order: Number(match[1]),
      file: `handdrawn/${relative(publicDir, file).replace(/\\/g, "/")}`,
      name,
      bytes: statSync(file).size,
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.order - b.order || a.file.localeCompare(b.file));

if (candidates.length === 0) {
  throw new Error(`No numbered hand-drawn stills found in ${publicDir}. Expected names like 01_A_5-second_hand-drawn_ani.png.`);
}

const seen = new Set();
for (const asset of candidates) {
  if (seen.has(asset.order)) throw new Error(`Duplicate hand-drawn asset order ${asset.order}: multiple files share the same numeric prefix.`);
  seen.add(asset.order);
}

for (let i = 0; i < candidates.length; i += 1) {
  const expected = i + 1;
  if (candidates[i].order !== expected) {
    throw new Error(`Hand-drawn asset sequence has a gap: expected ${String(expected).padStart(2, "0")}, found ${String(candidates[i].order).padStart(2, "0")}.`);
  }
}

mkdirSync(outputDir, {recursive: true});
const manifest = candidates.map(({order, file, name, bytes}) => ({order, file, name, bytes}));
writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Wrote ${manifest.length} hand-drawn assets -> ${outputFile}`);
for (const asset of manifest) console.log(`${String(asset.order).padStart(2, "0")}  ${asset.file}`);
