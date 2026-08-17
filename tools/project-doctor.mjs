#!/usr/bin/env node
// Fast production sanity check. This is intentionally deterministic and does
// not render video: it catches stale generated artifacts, missing compositions,
// invalid long-form/Shorts routing, and broken source relationships.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VIDEO = path.join(ROOT, "video");
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const errors = [];
const warn = [];

const script = read(path.join(VIDEO, "src/script.json"));
const plan = read(path.join(VIDEO, "src/director-plan.json"));
const manifest = read(path.join(VIDEO, "src/shorts-manifest.json"));
const rootTsx = fs.readFileSync(path.join(VIDEO, "src/Root.tsx"), "utf8");
const packageJson = read(path.join(VIDEO, "package.json"));

const isLong = Number(script.durationInSeconds) >= 120;
if (isLong) {
  if (script.engine !== "finance") errors.push(`long-form script engine is ${script.engine}`);
  if (plan.project?.mode !== "LONGFORM_DOCUMENTARY") errors.push(`long-form plan mode is ${plan.project?.mode}`);
  if (Number(plan.project?.durationInSeconds) < 120) errors.push("director plan is not long-form");
  if (plan.project?.width !== 1920 || plan.project?.height !== 1080) errors.push("long-form plan is not 1920x1080");
  if (plan.project?.title !== script.title) errors.push("script and director titles differ");
}

for (const id of ["FinanceLong", "Shorts1", "Shorts2", "Shorts3"]) {
  if (!rootTsx.includes(`id=\"${id}\"`)) errors.push(`Root.tsx does not register ${id}`);
}
if (!packageJson.scripts?.gate) errors.push("package.json has no strict gate");
if (!packageJson.scripts?.shorts) errors.push("package.json has no Shorts pipeline");

if (manifest.mode === "SHORTS_FROM_LONGFORM" && manifest.shorts.length) {
  if (manifest.shorts.length !== 3) errors.push(`expected 3 Shorts, found ${manifest.shorts.length}`);
  for (const s of manifest.shorts) {
    if (s.duration < 22 || s.duration > 58) errors.push(`${s.id} duration ${s.duration}s is outside 22–58s`);
    if (!s.beats?.length) errors.push(`${s.id} has no beats`);
    for (const b of s.beats ?? []) {
      if (!b.audio) warn.push(`${s.id} beat ${b.n} has no audio binding yet`);
    }
  }
} else if (manifest.shorts.length === 0) {
  warn.push("Shorts manifest is empty; run npm run shorts after the long-form plan is green");
}

const forbidden = new Set(["coinDrop", "coinStack", "jarFill", "mountain", "kinetic"]);
for (const b of plan.beats ?? []) if (isLong && forbidden.has(b?.visual?.module)) errors.push(`long-form beat ${b.n} still uses legacy Short module ${b.visual.module}`);

console.log("VIDEO ENGINE DOCTOR");
console.log(`  source   ${script.title}`);
console.log(`  mode     ${isLong ? "LONGFORM_DOCUMENTARY" : "SHORT"}`);
console.log(`  duration ${script.durationInSeconds}s`);
for (const w of warn) console.log(`  WARN  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
console.log(`  RESULT   ${errors.length ? "FAIL" : "PASS"}`);
if (errors.length) process.exit(1);
