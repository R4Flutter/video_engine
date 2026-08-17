import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const path = resolve(ROOT, "video/src/director-plan.json");
const plan = JSON.parse(readFileSync(path, "utf8"));
if (plan?.project?.mode !== "LONGFORM_DOCUMENTARY") throw new Error("LongFormAutofix requires LONGFORM_DOCUMENTARY");

let changed = 0;
const beats = plan.beats || [];
for (let i = 0; i < beats.length; i++) {
  const b = beats[i];
  const d = Number(b.end) - Number(b.start);
  const currentChanges = Array.isArray(b?.render?.motion?.internalChangeAt) ? b.render.motion.internalChangeAt : [];
  if (d > 10 && currentChanges.length === 0) {
    b.render = b.render || {};
    b.render.motion = { ...(b.render.motion || {}), internalChangeAt: [Number((d * 0.55).toFixed(2))] };
    changed++;
  }
  if (i > 0 && b?.visual?.module === beats[i - 1]?.visual?.module && b?.render?.transition === "cut") {
    b.render = b.render || {};
    b.render.transition = "contrast";
    changed++;
  }
  if ((b?.retention?.fatigueRisk ?? 0) >= 0.55) {
    b.render = b.render || {};
    b.render.motion = { ...(b.render.motion || {}), internalChangeAt: currentChanges.length ? currentChanges : [Number((d * 0.5).toFixed(2))] };
  }
}

plan.qc = plan.qc || {};
plan.qc.autofix = { changedFields: changed, iterations: changed ? 1 : 0, scope: "timing/visual/motion/transition only; no narrative facts or source claims modified" };
writeFileSync(path, JSON.stringify(plan, null, 2), "utf8");
console.log(`LONGFORM AUTOFIX  ${changed ? `applied ${changed} deterministic repairs` : "no repairs needed"}`);
console.log(`WROTE             ${path}`);
