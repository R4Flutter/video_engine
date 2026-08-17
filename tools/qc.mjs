// tools/qc.mjs — the editorial gate.
//
//   node --experimental-strip-types tools/qc.mjs [--plan video/src/director-plan.json]
//                                                [--strict]
//
// Re-runs the director over script.json, prints every finding with the reason
// it matters and the fix, and writes the same report to video/out/qc-report.txt.
//
// Exit codes: 0 normally, 1 when --strict and a FATAL finding exists. That is
// the flag to put in front of `remotion render` once you trust it.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const strict = process.argv.includes("--strict");

const scriptPath = resolve(root, arg("--script", "video/src/script.json"));
const script = JSON.parse(readFileSync(scriptPath, "utf8"));

const { buildLongFormPlan } = await import(
  pathToFileURL(join(root, "video/src/director/plan.ts")).href
);
const { plan, qc } = buildLongFormPlan(script);

const fmt = (s) => {
  if (s < 0) return "  ——";
  return `${s.toFixed(1).padStart(4)}s`;
};
const ICON = { warn: "⚠", info: "·", good: "✓" };
const TAG = { FATAL: "[FATAL]", HIGH: "[HIGH] ", MED: "[MED]  ", LOW: "[LOW]  " };

const lines = [];
const p = (s = "") => lines.push(s);

p(`RETENTION QC`);
p(`────────────────────────────────────────────────────────`);
p(`${qc.video.title}`);
p(`${qc.video.duration}s · ${qc.video.beats} beats · projected ${qc.projectedRetention}% reach the end`);
p();

const fatal = qc.findings.filter((f) => f.severity === "FATAL");
if (fatal.length) {
  p(`⛔ ${fatal.length} blocking issue${fatal.length === 1 ? "" : "s"} — do not render yet`);
  p();
}

for (const f of qc.findings) {
  if (f.level === "good") continue;
  p(`${fmt(f.at)} ${ICON[f.level]} ${TAG[f.severity] ?? "       "} ${f.rule}${f.beat ? ` (beat ${f.beat})` : ""}`);
  p(`        ${f.message}`);
  if (f.reason) p(`        why:  ${f.reason}`);
  if (f.fix) p(`        fix:  ${f.fix}`);
  p();
}

const good = qc.findings.filter((f) => f.level === "good");
if (good.length) {
  p(`PASSING`);
  for (const f of good) p(`  ✓ ${f.rule} — ${f.message}`);
  p();
}

p(`SCORES`);
for (const [k, v] of Object.entries(qc.scores)) {
  p(`  ${k.padEnd(15)} ${v.toFixed(1).padStart(4)}/10`);
}
p(`  ${"OVERALL".padEnd(15)} ${qc.score.toFixed(1).padStart(4)}/10`);
p();
p(`  under 6.0 → fix the findings before rendering`);
p(`  6.0–7.5   → renderable, but the top finding is worth an hour`);
p(`  over 7.5  → ship it`);
p();
p(`The scores are an internal heuristic over the plan. They rank two cuts of`);
p(`this script against each other. They do not predict views, and they cannot`);
p(`see whether the idea is any good — only whether the edit serves it.`);

const out = lines.join("\n") + "\n";
console.log(out);

const outFile = join(root, "video/out/qc-report.txt");
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, out);
console.log(`WROTE      ${outFile}`);

if (strict && fatal.length) {
  console.error(`\nFAILED: ${fatal.length} blocking issue(s). Fix them or drop --strict.`);
  process.exit(1);
}
