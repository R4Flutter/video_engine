// Hard boundary for the finance long-form pipeline.
// The repository may contain Shorts tooling for other products, but the finance
// episode call graph must never import or invoke it.
//
// The guard is invocation-aware: a forbidden identifier is only flagged when it
// is actually CALLED (name followed by "("), or referenced through an
// import/require/spawn. Merely naming an entry point in a defensive blocklist
// (e.g. longform-preflight.mjs refusing to call it) is not a dependency.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const relativePath = p => p.replace(/\\/g, "/").replace(new RegExp(`^${root.replace(/\\/g, "/")}/`), "");
const protectedPaths = [
  "tools/direct.mjs",
  "tools/longform-director.mjs",
  "tools/longform-autofix.mjs",
  "tools/longform-preflight.mjs",
  "tools/qc.mjs",
  "tools/engine/search.mjs",
  "tools/engine/auditor.mjs",
  "tools/engine/loop.mjs",
  "video/src/FinanceLong.tsx",
  "video/src/LongFormColdOpen.tsx",
  "video/src/LongFormScenes.tsx",
];
const tokens = [
  "buildShortPlan", "ShortPlan", "estimateSwipe", "SwipeRisk", "planFrameZero",
  "FrameZero", "FinanceShort", "ShortsQC", "ShortLoopPlanner", "ShortsDerivedPlan",
  "ShortRender", "ShortsSwipeRisk", "runRetentionQC", "ShortFrameZero",
];
const call = new RegExp(`\\b(?:${tokens.join("|")})\\s*\\(`, "g");
const linkage = /(?:import|require)\s*\(\s*['"][^'")]*(?:short|swipe|framezero|derivedplan)[^'")]*['"]\)/gi;
const spawn = /spawn(?:Sync)?\s*\(\s*[\s\S]{0,160}\b(?:short|Swipe|FrameZero)\b/i;

const failures = [];
const seen = new Set();
const queue = [...protectedPaths];
// Transitive reachability: follow static imports AND spawned tool paths from
// every protected entry so a forbidden reference two hops deep is still a
// failure — a Shorts import inside a script the pipeline spawns is reachable.
while (queue.length) {
  const relative = queue.shift();
  if (seen.has(relative)) continue;
  seen.add(relative);
  const path = resolve(root, relative);
  let text = "";
  try { text = readFileSync(path, "utf8"); } catch { continue; }
  for (const [name, re] of [["call", call], ["import/require", linkage], ["spawn", spawn]]) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m) failures.push(`${relative}: forbidden long-form ${name} reference ${m[0].slice(0, 80)}`);
  }
  const specifiers = [];
  for (const s of text.matchAll(/(?:import\s*[^'"]*?\s*from\s*|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g)) {
    const spec = s[1];
    if (!spec.startsWith(".") && !spec.startsWith(root)) continue;
    const abs = resolve(dirname(path), spec);
    for (const cand of [abs, `${abs}.mjs`, `${abs}.js`, `${abs}.ts`, `${abs}.tsx`]) {
      if (cand.startsWith(root) && !cand.includes("node_modules") && existsSync(cand)) { specifiers.push(relativePath(cand)); break; }
    }
  }
  for (const s of text.matchAll(/spawn(?:Sync)?\s*\(\s*(?:["'`]node["'`]|["'`]npx["'`])\s*,\s*\[\s*[^\]]*?['"`]([^'"`]+\.(?:mjs|js|ts|py))['"`]/g)) {
    const p = s[1].replace(/\\/g, "/");
    const abs = resolve(dirname(path), p.startsWith(root) ? p : p);
    if (existsSync(abs) && abs.startsWith(root)) specifiers.push(relativePath(abs));
  }
  queue.push(...specifiers);
}
if (failures.length) {
  console.error("LONG-FORM CALLGRAPH: FAIL");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`LONG-FORM CALLGRAPH: PASS (${seen.size} reachable protected files)`);