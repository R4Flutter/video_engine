#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VIDEO = path.join(ROOT, "video");
const manifest = JSON.parse(fs.readFileSync(path.join(VIDEO, "src", "shorts-manifest.json"), "utf8"));
const plan = JSON.parse(fs.readFileSync(path.join(VIDEO, "src", "director-plan.json"), "utf8"));
const issues = [];
const results = [];

if (plan?.project?.mode !== "LONGFORM_DOCUMENTARY" || Number(plan?.project?.durationInSeconds) < 120) {
  issues.push("source director plan is not a valid long-form episode");
}
if (manifest?.mode !== "SHORTS_FROM_LONGFORM") issues.push("manifest is not marked SHORTS_FROM_LONGFORM");
if (Number(manifest?.source?.duration || 0) < 120) issues.push("manifest source duration is not long-form");

for (const s of manifest.shorts ?? []) {
  const beats = s.beats ?? [];
  const duration = Number(s.duration || 0);
  let score = 100;
  const warn = (msg, penalty) => { issues.push(`${s.id}: ${msg}`); score -= penalty; };
  if (duration < 22 || duration > 58) warn(`duration ${duration.toFixed(1)}s outside 22–58s`, 20);
  if (beats.length < 3) warn("too few narrative states", 15);
  if (!s.hook) warn("no standalone hook", 20);
  if (!s.payoff) warn("no payoff/reframe", 20);
  if (beats.length && Number(beats[0].start) > 0.25) warn("content does not begin at the Short frame zero", 10);
  if (!beats.some((b) => b.visual && (b.visual.assetPath || b.visual.asset || b.visual.footage))) warn("no preserved visual asset metadata; renderer may fall back to abstract graphics", 15);
  for (let i = 1; i < beats.length; i++) {
    if (beats[i].module === beats[i - 1].module && Number(beats[i].end) - Number(beats[i].start) > 6) warn(`repeated ${beats[i].module} state`, 5);
  }
  results.push({ id: s.id, duration, score: Math.max(0, score), hook: s.hook, payoff: s.payoff });
}

const report = { mode: "SHORTS_FROM_LONGFORM", count: results.length, source: manifest.source ?? null, results, issues };
fs.mkdirSync(path.join(VIDEO, "out"), { recursive: true });
fs.writeFileSync(path.join(VIDEO, "out", "shorts-qc.json"), JSON.stringify(report, null, 2) + "\n");
console.log("SHORTS QC");
for (const r of results) console.log(`  ${r.id}  ${r.duration.toFixed(1)}s  ${r.score}/100`);
if (issues.length) { console.log("WARNINGS"); for (const x of issues) console.log(`  ! ${x}`); }
if (results.length !== 3 || results.some((r) => r.score < 80) || issues.some((x) => x.startsWith("source director plan"))) process.exitCode = 1;
