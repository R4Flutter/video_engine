#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "video", "src", "shorts-manifest.json"), "utf8"));
const issues = [];
const results = [];

for (const s of manifest.shorts ?? []) {
  const beats = s.beats ?? [];
  const duration = Number(s.duration || 0);
  let score = 100;
  const warn = (msg, penalty) => { issues.push(`${s.id}: ${msg}`); score -= penalty; };
  if (duration < 22 || duration > 58) warn(`duration ${duration.toFixed(1)}s outside 22–58s`, 20);
  if (beats.length < 3) warn("too few narrative states", 15);
  if (!s.hook) warn("no standalone hook", 20);
  if (!s.payoff) warn("no payoff/reframe", 20);
  if (beats.length && beats[0].start > 2.0) warn("hook arrives too late", 15);
  for (let i = 1; i < beats.length; i++) {
    if (beats[i].module === beats[i - 1].module && beats[i].end - beats[i].start > 6) warn(`repeated ${beats[i].module} state`, 5);
  }
  results.push({ id: s.id, duration, score: Math.max(0, score), hook: s.hook, payoff: s.payoff });
}

const report = { mode: "SHORTS_FROM_LONGFORM", count: results.length, results, issues };
fs.writeFileSync(path.join(ROOT, "video", "out", "shorts-qc.json"), JSON.stringify(report, null, 2) + "\n");
console.log("SHORTS QC");
for (const r of results) console.log(`  ${r.id}  ${r.duration.toFixed(1)}s  ${r.score}/100`);
if (issues.length) { console.log("WARNINGS"); for (const x of issues) console.log(`  ! ${x}`); }
if (results.length !== 3 || results.some((r) => r.score < 75)) process.exitCode = 1;
