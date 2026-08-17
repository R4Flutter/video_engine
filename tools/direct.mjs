// tools/direct.mjs — run the deterministic director for Short or LongForm.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const has = (name) => process.argv.includes(`--${name}`) || process.argv.includes(name);
const scriptPath = resolve(root, arg("script", "video/src/script.json"));
const outPath = resolve(root, arg("out", "video/src/director-plan.json"));
const overlayArg = arg("overlay", null);
const referencePath = resolve(root, arg("references", "yt_engine/reference-patterns.json"));
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const overlay = overlayArg ? JSON.parse(readFileSync(resolve(root, overlayArg), "utf8")) : undefined;
const { buildShortPlan } = await import(pathToFileURL(join(root, "video/src/director/plan.ts")).href);
const { buildLongformRenderContract } = await import(pathToFileURL(join(root, "tools/longform-render-contract.mjs")).href);
const { plan: rawPlan, warnings, issues, qc } = buildShortPlan(script, overlay);

// Long-form uses the same proven editorial engines, then passes the resulting
// plan through a Vidosy-inspired deterministic scene contract. This keeps the
// AI/director layer responsible for editorial decisions while Remotion gets a
// strict, serializable execution plan.
let plan = rawPlan;
if (plan.project.mode === "LONG_FORM") {
  let references = [];
  try { references = JSON.parse(readFileSync(referencePath, "utf8")); } catch { /* optional until yt_engine produces patterns */ }
  plan = buildLongformRenderContract(plan, Array.isArray(references) ? references : []);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(plan, null, 2));
if (has("quiet")) { console.log(`WROTE      ${outPath}`); process.exit(0); }
const bar = (v, width = 24) => { const n = Math.max(0, Math.min(width, Math.round(v * width))); return "█".repeat(n) + "·".repeat(width - n); };
const isLongForm = plan.project.mode === "LONG_FORM";
console.log(`DIRECTOR   ${plan.project.title}`);
console.log(`  mode     ${isLongForm ? "LONG_FORM" : "SHORT"}`);
console.log(`  format   ${plan.project.width}x${plan.project.height}@${plan.project.fps} · ${plan.project.durationInSeconds}s · ${plan.beats.length} beats · ${plan.project.engine}`);
if (isLongForm) {
  console.log(``);
  console.log(`LONG-FORM OPENING CONTRACT`);
  console.log(`  renderer   FinanceLong`);
  console.log(`  editorial  visual-first → evidence ladder → delayed interpretation`);
  console.log(`  execution  Vidosy-inspired deterministic render contract`);
  console.log(`  scenes     ${plan.renderContract?.sceneCount ?? plan.beats.length}`);
  console.log(`  references ${plan.renderContract?.referencePatternCount ?? 0}`);
  console.log(``);
  console.log(`COMPLETION  long-form proxy ${qc.projectedRetention.toFixed(1)}% (comparative QA, not YouTube prediction)`);
  console.log(`SEQUENCES   ${plan.sequences.length}`);
  const eventRate = plan.project.durationInSeconds ? plan.attentionEvents.length / (plan.project.durationInSeconds / 60) : 0;
  console.log(`EVENT RATE  ${eventRate.toFixed(1)} attention events/min`);
} else {
  const fz = plan.frameZero;
  const pct = (v) => `${Math.round(v * 100)}%`;
  console.log(`FRAME ZERO`);
  console.log(`  text     "${fz.text}"`);
  console.log(`  read     ${fz.words} words / ${fz.chars} chars · held ${fz.holdFrames}f (${(fz.holdFrames / plan.project.fps).toFixed(2)}s) · type ${fz.size}`);
  console.log(`  checks   glanceable ${fz.glanceable ? "yes" : "NO"} · audio-synced ${fz.audioSynced ? "yes" : "NO"} · lever ${fz.hookType} · claim complete at ${fz.timeToClaim.toFixed(1)}s`);
  console.log(`RETENTION  projected ${pct(plan.projectedRetention)} reach the final frame`);
  for (const s of plan.swipeCurve) { const beat = plan.beats.find((b) => b.n === s.beat); console.log(`  ${String(s.at).padStart(5)}s  b${String(s.beat).padStart(2)} ${bar(s.retained)} ${String(pct(s.retained)).padStart(4)}  −${pct(s.risk).padStart(3)}  ${beat?.visual.module ?? ""}`); if (s.drivers.length) console.log(`            ${s.drivers.join(" · ")}`); }
}
console.log(``);
console.log(`LOOP       motif "${plan.loop.motif}" · closes ${plan.loop.closes ? "yes" : "NO"} · seamless ${plan.loop.seamless ? "yes" : "NO"}`);
console.log(`EVENTS     ${plan.attentionEvents.length} attention · ${plan.audioEvents.length} audio · ${plan.transitions.length} transitions · ${plan.beats.filter((b) => b.jCut || b.lCut).length} j/l cuts`);
console.log(`MODULES    ${plan.beats.map((b) => b.visual.module).join(" → ")}`);
if (warnings.length) { console.log(``); console.log(`WARNINGS   ${warnings.length}`); for (const w of warnings.slice(0, 14)) console.log(`  ! ${w}`); }
console.log(``);
console.log(`TIMELINE   ${issues.length ? `${issues.length} validation issues` : "validated clean"}`);
for (const i of issues.slice(0, 8)) console.log(`  ✗ ${i.message}`);
console.log(``);
console.log(`SCORES`);
for (const [k, v] of Object.entries(qc.scores)) console.log(`  ${k.padEnd(14)} ${bar(v / 10, 20)} ${v.toFixed(1)}/10`);
console.log(`  ${"OVERALL".padEnd(14)} ${bar(qc.score / 10, 20)} ${qc.score}/10`);
console.log(``);
console.log(`WROTE      ${outPath}`);
console.log(`           run "npm run qc" for findings`);
