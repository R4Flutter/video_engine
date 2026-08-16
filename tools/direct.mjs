// tools/direct.mjs — run the director.
//
//   node --experimental-strip-types tools/direct.mjs
//        [--script video/src/script.json]
//        [--out video/src/director-plan.json]
//        [--overlay video/src/director.overlay.json]
//        [--quiet]
//
// Reads script.json (and an optional hand-written overlay of editorial notes),
// runs the deterministic director, resolves every physical asset requirement,
// and writes the ShortPlan that the renderer and QC consume.
//
// Asset resolution is fail-closed: a required footage/document/image reference
// without a real file is a hard error. We never silently replace editorial
// footage with PaperBG.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(name);

const scriptPath = resolve(root, arg("--script", "video/src/script.json"));
const outPath = resolve(root, arg("--out", "video/src/director-plan.json"));
const overlayArg = arg("--overlay", null);

const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const overlay = overlayArg ? JSON.parse(readFileSync(resolve(root, overlayArg), "utf8")) : undefined;
const effectiveScript = overlay
  ? {
      ...script,
      title: overlay.project?.title ?? script.title,
      beats: script.beats.map((b) => overlay.beats?.[b.n] ? { ...b, ...overlay.beats[b.n] } : b),
    }
  : script;

const { buildShortPlan } = await import(
  pathToFileURL(join(root, "video/src/director/plan.ts")).href
);
const { assetForBeat, assetIssuesForScript } = await import(
  pathToFileURL(join(root, "video/src/director/assets.ts")).href
);

const { plan, warnings, issues, qc } = buildShortPlan(script, overlay);

const assetIssues = assetIssuesForScript(effectiveScript);
for (const issue of assetIssues) warnings.push(`assets: ${issue}`);

// Keep the runtime's existing footage.json contract populated for backwards
// compatibility, but derive it from the same canonical asset resolution that
// is written into director-plan.json. The renderer no longer has an independent
// interpretation of what “footage” means.
const footageMap = {};
for (const beat of effectiveScript.beats) {
  const asset = assetForBeat(beat);
  const directed = plan.beats.find((b) => b.n === beat.n);
  if (!directed || !asset) continue;
  directed.assetId = asset.id;
  directed.assetPath = asset.path;
  directed.assetType = asset.type;
  if (asset.type === "video" || asset.type === "image") footageMap[String(beat.n)] = asset.path;
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(plan, null, 2));
writeFileSync(join(root, "video/src/footage.json"), JSON.stringify(footageMap, null, 2) + "\n");

if (assetIssues.length) {
  console.error(`ASSET GATE FAILED — ${assetIssues.length} unresolved required asset(s)`);
  for (const issue of assetIssues) console.error(`  ✗ ${issue}`);
  process.exit(2);
}

if (has("--quiet")) {
  console.log(`WROTE      ${outPath}`);
  process.exit(0);
}

const pct = (v) => `${Math.round(v * 100)}%`;
const bar = (v, width = 24) => {
  const n = Math.max(0, Math.min(width, Math.round(v * width)));
  return "█".repeat(n) + "·".repeat(width - n);
};

const fz = plan.frameZero;
console.log(`DIRECTOR   ${plan.project.title}`);
console.log(
  `  format   ${plan.project.width}x${plan.project.height}@${plan.project.fps} · ${plan.project.durationInSeconds}s · ${plan.beats.length} beats · ${plan.project.engine}`,
);
console.log(``);
console.log(`ASSETS     ${Object.keys(footageMap).length} resolved physical asset(s)`);
console.log(`FRAME ZERO`);
console.log(`  text     "${fz.text}"`);
console.log(
  `  read     ${fz.words} words / ${fz.chars} chars · held ${fz.holdFrames}f (${(fz.holdFrames / plan.project.fps).toFixed(2)}s) · type ${fz.size}`,
);
console.log(
  `  checks   glanceable ${fz.glanceable ? "yes" : "NO"} · audio-synced ${fz.audioSynced ? "yes" : "NO"} · lever ${fz.hookType} · claim complete at ${fz.timeToClaim.toFixed(1)}s`,
);
console.log(``);
console.log(`RETENTION  projected ${pct(plan.projectedRetention)} reach the final frame`);
for (const s of plan.swipeCurve) {
  const beat = plan.beats.find((b) => b.n === s.beat);
  console.log(
    `  ${String(s.at).padStart(5)}s  b${String(s.beat).padStart(2)} ${bar(s.retained)} ${String(pct(s.retained)).padStart(4)}  −${pct(s.risk).padStart(3)}  ${beat?.visual.module ?? ""}`,
  );
  if (s.drivers.length) console.log(`            ${s.drivers.join(" · ")}`);
}
console.log(``);
console.log(`LOOP       motif "${plan.loop.motif}" · closes ${plan.loop.closes ? "yes" : "NO"} · seamless ${plan.loop.seamless ? "yes" : "NO"}`);
console.log(
  `EVENTS     ${plan.attentionEvents.length} attention · ${plan.audioEvents.length} audio · ${plan.transitions.length} transitions · ${plan.beats.filter((b) => b.jCut || b.lCut).length} j/l cuts`,
);
console.log(`MODULES    ${plan.beats.map((b) => b.visual.module).join(" → ")}`);

if (warnings.length) {
  console.log(``);
  console.log(`WARNINGS   ${warnings.length}`);
  for (const w of warnings.slice(0, 14)) console.log(`  ! ${w}`);
}
console.log(``);
console.log(`TIMELINE   ${issues.length ? `${issues.length} validation issues` : "validated clean"}`);
for (const i of issues.slice(0, 8)) console.log(`  ✗ ${i.message}`);

console.log(``);
console.log(`SCORES`);
for (const [k, v] of Object.entries(qc.scores)) {
  console.log(`  ${k.padEnd(14)} ${bar(v / 10, 20)} ${v.toFixed(1)}/10`);
}
console.log(`  ${"OVERALL".padEnd(14)} ${bar(qc.score / 10, 20)} ${qc.score}/10`);
console.log(``);
console.log(`WROTE      ${outPath}`);
console.log(`           resolved assets written to video/src/footage.json`);
console.log(`           run "npm run qc" for the findings and what to do about them`);
