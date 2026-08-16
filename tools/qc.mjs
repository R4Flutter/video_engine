// tools/qc.mjs — the editorial gate.
// Strict mode now means strict: any FATAL or materially weak overall score blocks rendering.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
const strict = process.argv.includes("--strict");
const scriptPath = resolve(root, arg("--script", "video/src/script.json"));
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const { buildShortPlan } = await import(pathToFileURL(join(root, "video/src/director/plan.ts")).href);
const { plan, qc } = buildShortPlan(script);
const fmt = (s) => s < 0 ? "  ——" : `${s.toFixed(1).padStart(4)}s`;
const ICON = { warn: "⚠", info: "·", good: "✓" };
const TAG = { FATAL: "[FATAL]", HIGH: "[HIGH] ", MED: "[MED]  ", LOW: "[LOW]  " };
const lines = [];
const p = (s = "") => lines.push(s);
p("RETENTION QC");
p("────────────────────────────────────────────────────────");
p(`${qc.video.title}`);
p(`${qc.video.duration}s · ${qc.video.beats} beats · projected ${qc.projectedRetention}% reach the end`);
p();
const fatal = qc.findings.filter((f) => f.severity === "FATAL");
const high = qc.findings.filter((f) => f.severity === "HIGH");
if (fatal.length) { p(`⛔ ${fatal.length} blocking issue${fatal.length === 1 ? "" : "s"} — do not render yet`); p(); }
for (const f of qc.findings) {
  if (f.level === "good") continue;
  p(`${fmt(f.at)} ${ICON[f.level] ?? "·"} ${TAG[f.severity] ?? "       "} ${f.rule}${f.beat ? ` (beat ${f.beat})` : ""}`);
  p(`        ${f.message}`);
  if (f.reason) p(`        why:  ${f.reason}`);
  if (f.fix) p(`        fix:  ${f.fix}`);
  p();
}
const good = qc.findings.filter((f) => f.level === "good");
if (good.length) { p("PASSING"); for (const f of good) p(`  ✓ ${f.rule} — ${f.message}`); p(); }
p("SCORES");
for (const [k, v] of Object.entries(qc.scores)) p(`  ${k.padEnd(15)} ${v.toFixed(1).padStart(4)}/10`);
p(`  ${"OVERALL".padEnd(15)} ${qc.score.toFixed(1).padStart(4)}/10`);
p();
p("STRICT GATE");
p("  requires: no FATAL, no HIGH findings, overall >= 8.5/10, projected retention >= 25%");
const strictBlocked = fatal.length > 0 || high.length > 0 || qc.score < 8.5 || qc.projectedRetention < 25;
p(`  verdict: ${strictBlocked ? "BLOCKED" : "PASS"}`);
const out = lines.join("\n") + "\n";
console.log(out);
const outFile = join(root, "video/out/qc-report.txt");
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, out);
console.log(`WROTE      ${outFile}`);
if (strict && strictBlocked) {
  console.error(`\nRETENTION GATE BLOCKED — fix the findings before rendering.`);
  process.exit(1);
}
