// Hard boundary for the finance long-form pipeline.
// The repository may contain Shorts tooling for other products, but the finance
// episode call graph must never import or invoke it.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const protectedPaths = [
  "tools/direct.mjs",
  "tools/longform-director.mjs",
  "tools/longform-autofix.mjs",
  "tools/longform-preflight.mjs",
  "tools/qc.mjs",
  "video/src/FinanceLong.tsx",
  "video/src/LongFormColdOpen.tsx",
  "video/src/LongFormScenes.tsx",
];
const forbidden = [
  /buildShortPlan/, /ShortPlan/, /estimateSwipe/, /SwipeRisk/, /planFrameZero/,
  /FrameZero/, /FinanceShort/, /ShortsQC/, /derive-shorts/, /shorts-qc/,
  /render-shorts/, /ShortLoopPlanner/, /ShortsDerivedPlan/, /ShortRender/,
];
const failures = [];
for (const relative of protectedPaths) {
  const path = resolve(root, relative);
  let text = "";
  try { text = readFileSync(path, "utf8"); } catch { continue; }
  for (const pattern of forbidden) {
    if (pattern.test(text)) failures.push(`${relative}: forbidden long-form dependency/reference ${pattern}`);
  }
}
if (failures.length) {
  console.error("LONG-FORM CALLGRAPH: FAIL");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`LONG-FORM CALLGRAPH: PASS (${protectedPaths.length} protected entry/render files)`);
