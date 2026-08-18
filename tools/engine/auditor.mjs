// auditor.mjs — stages 3 & 4 of the closed loop: Gemini Editorial Audit +
// Gemini Repair/Edit Loop.
//
//   script.json + plan + yt_engine signals + assets + long-form rules
//        ↓
//   Gemini (senior documentary editor) — full narration & script visible
//        ↓  critique: 8 axes (hook, curiosity, pacing, visuals, evidence,
//        |            reveals, chapters, premium) → READY / NOT READY
//        ↓  patches: strict edit vocabulary, NEVER narration
//   deterministic LongForm Director applies patches → QC again
//        ↓  repeat up to 3 rounds → READY | another repair | give up (gate decides)
//
// Determinism guards: narration is invariant-checked every round (byte-level
// multiset), every patch is coerced against the allowed vocabulary, and the
// production gate (qc.mjs --strict) remains the final arbiter. No Gemini
// output ever reaches the renderer without passing the deterministic gate.
//
//   node tools/engine/auditor.mjs [--script video/src/script.json]
//        [--plan video/src/director-plan.json] [--max-rounds 3] [--no-gemini]
//
// Writes gemini-audit.json (rounds, verdicts, patches, models) and, when the
// loop produced a better plan, the repaired director-plan.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlan } from "../longform-director.mjs";
import { generateJson, loadApiKey } from "./llm.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const scriptPath = resolve(ROOT, arg("script", "video/src/script.json"));
const planPath = resolve(ROOT, arg("plan", "video/src/director-plan.json"));
const referencePath = resolve(ROOT, "yt_engine/reference-patterns.json");
const MODEL_PATH = process.env.YT_ENGINE_MODEL || "C:/Users/rajna/yt_engine/reports/retention_coefficients.json";
const MOMENTS_PATH = process.env.YT_ENGINE_MOMENTS || "C:/Users/rajna/yt_engine/reports/retention_moments.json";
const MAX_ROUNDS = Math.max(1, Number(arg("max-rounds", "3")) || 3);
const noGemini = process.argv.includes("--no-gemini");

// ------------------------------------------------------------------ axes
const AXES = ["hook", "curiosity", "pacing", "visuals", "evidence", "reveals", "chapters", "premium"];

// ------------------------------------------------------- patch vocabulary
const CAMERAS = ["push", "settle", "punch", "hold"];
const REVEAL_MODES = ["IMMEDIATE", "SEQUENTIAL", "COUNTER_REVEAL", "HIDDEN_THEN_REVEAL", "PROGRESSIVE"];
const MODULES = ["stat", "chart", "investChart", "timeline", "compare", "evidence", "footage"];
const PATTERNS = ["spread", "front", "back", "even"];
const POLICIES = ["payoff", "chapters"];
const SCALE = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || lo));

export function coercePatches(patches, beatCount) {
  const dials = {};
  const cameraOverrides = {}, revealOverrides = {}, evidenceOverrides = {};
  const applied = [], rejected = [];
  if (!Array.isArray(patches)) { rejected.push({ reason: "not_an_array" }); return { dials, cameraOverrides, revealOverrides, evidenceOverrides, applied, rejected }; }
  for (const p of patches) {
    if (!p || typeof p !== "object") { rejected.push({ reason: "malformed" }); continue; }
    const op = String(p.op || "");
    if (op === "dials" && p.dials && typeof p.dials === "object") {
      const d = p.dials;
      if (PATTERNS.includes(d.stagingPattern)) dials.stagingPattern = d.stagingPattern;
      if (CAMERAS.includes(d.cameraBias) || d.cameraBias === null) dials.cameraBias = d.cameraBias;
      if (d.revealShift !== undefined) dials.revealShift = SCALE(d.revealShift, 0, 1);
      if (POLICIES.includes(d.contrastPolicy)) dials.contrastPolicy = d.contrastPolicy;
      if (d.jcutAdd !== undefined) dials.jcutAdd = Math.round(SCALE(d.jcutAdd, 0, 3));
      applied.push({ op: "dials", value: d });
    } else if (op === "camera" || op === "reveal" || op === "evidence") {
      const n = Number(p.beat);
      if (!Number.isInteger(n) || n < 1 || n > beatCount) { rejected.push({ reason: `bad_beat_${p.beat}` }); continue; }
      const key = String(n);
      if (op === "camera") { if (!CAMERAS.includes(p.camera)) { rejected.push({ reason: `bad_camera_${p.camera}` }); continue; } cameraOverrides[key] = p.camera; }
      if (op === "reveal") { if (!REVEAL_MODES.includes(p.mode)) { rejected.push({ reason: `bad_mode_${p.mode}` }); continue; } revealOverrides[key] = p.mode; }
      if (op === "evidence") { if (!MODULES.includes(p.module)) { rejected.push({ reason: `bad_module_${p.module}` }); continue; } evidenceOverrides[key] = p.module; }
      applied.push({ op, beat: n, value: op === "camera" ? p.camera : op === "reveal" ? p.mode : p.module });
    } else if (op === "jcut") { dials.jcutAdd = Math.round(SCALE(p.add, 0, 3)); applied.push({ op: "jcut", value: p.add }); }
    else if (op === "staging") { if (!PATTERNS.includes(p.pattern)) { rejected.push({ reason: `bad_pattern_${p.pattern}` }); continue; } dials.stagingPattern = p.pattern; applied.push({ op: "staging", value: p.pattern }); }
    else if (op === "contrast") { if (!POLICIES.includes(p.policy)) { rejected.push({ reason: `bad_policy_${p.policy}` }); continue; } dials.contrastPolicy = p.policy; applied.push({ op: "contrast", value: p.policy }); }
    else rejected.push({ op, reason: "unknown_op" });
  }
  return { dials, cameraOverrides, revealOverrides, evidenceOverrides, applied, rejected };
}

// ----------------------------------------------------------------- context
function assetsIndex() {
  const dirs = ["video/public/images", "video/public/audio", "video/public/footage", "video/public/vo"];
  const out = [];
  for (const d of dirs) {
    const p = join(ROOT, d);
    if (!existsSync(p)) continue;
    for (const f of readdirSync(p)) {
      const full = join(p, f);
      if (statSync(full).isFile()) out.push(`${d.replace("video/public/", "")}/${f}`);
    }
  }
  return out.slice(0, 60);
}

function buildContext(script, plan) {
  const narration = (script.beats || []).map((b, i) => {
    const pb = plan.beats?.find(x => Number(x.n) === Number(b.n));
    return { n: b.n, chapter: pb?.chapterId || "?", purpose: b.purpose, start: b.start, end: b.end,
             vo: b.vo || b.text, question: b.question || "", reveal: b.reveal || "" };
  });
  const scores = plan.qc?.scores || {};
  const metrics = plan.qc?.metrics || {};
  const signals = { coefficients: [], positionCurve: [], moments: null, references: null };
  if (existsSync(MODEL_PATH)) {
    const m = JSON.parse(readFileSync(MODEL_PATH, "utf8"));
    signals.coefficients = (m.coefficients || []).map(c => ({ feature: c.feature, effect: c.effect })).sort((a, b) => b.effect - a.effect);
    signals.positionCurve = m.position_curve || [];
    signals.selfCalibrated = m.self_calibrated_at || null;
  }
  if (existsSync(MOMENTS_PATH)) { try { signals.moments = JSON.parse(readFileSync(MOMENTS_PATH, "utf8")); } catch { /* ignore */ } }
  if (existsSync(referencePath)) { try { signals.references = JSON.parse(readFileSync(referencePath, "utf8")); } catch { /* ignore */ } }
  return { narration, scores, metrics, signals, assets: assetsIndex(),
           search: plan.search || {}, coldOpen: plan.coldOpen?.selected?.archetype || null,
           chapterCount: new Set((plan.beats || []).map(b => b.chapterId)).size };
}

const SYSTEM = `You are a senior documentary editor who has studied thousands of VIRAL
long-form videos (20-minute documentaries, premium YouTube features, Netflix
documentaries) and knows what separates a 100k-view essay from a 5M-view one.

Lead with your own editorial judgment. Your training already contains what
viral long-form looks like: front-loaded hook density, escalating curiosity
loops that never resolve early, chapter rhythm that resets attention every
3-5 minutes, visual variety that prevents fatigue, evidence that makes claims
feel credible, reveals that land AFTER tension peaks, and a payoff that makes
the whole thing feel inevitable. Judge the plan the way you would judge a
pitch for a documentary you want to be famous.

You review a generated long-form documentary EDITORIAL PLAN against the
narration, the channel's retention model, and the available assets.

The yt_engine signals in the prompt are STATISTICAL DATA, not authority:
they are channel-level correlations from a corpus model. Treat them as one
informative input — if the data suggests one thing but your editorial
judgment says the pacing/hook/evidence is wrong, your judgment wins. Never
let a coefficient override your sense of what makes video hold an audience.

You never rewrite narration — the spoken script is canonical and final. You
only critique STRUCTURE and VISUAL/EDITORIAL DECISIONS, and you request
small, precise, mechanically-appliable patches.

Patch vocabulary (only these, nothing else):
- {"op":"dials","dials":{"stagingPattern":"spread|front|back|even","cameraBias":"push|settle|punch|hold|null","revealShift":0..1,"contrastPolicy":"payoff|chapters","jcutAdd":0..3}}
- {"op":"camera","beat":N,"camera":"push|settle|punch|hold"}
- {"op":"reveal","beat":N,"mode":"IMMEDIATE|SEQUENTIAL|COUNTER_REVEAL|HIDDEN_THEN_REVEAL|PROGRESSIVE"}
- {"op":"evidence","beat":N,"module":"stat|chart|investChart|timeline|compare|evidence|footage"}
- {"op":"jcut","add":0..3}  {"op":"staging","pattern":"..."}  {"op":"contrast","policy":"payoff|chapters"}

Rules:
- beat N refers to the beat number in the narration list (1-based).
- Only request an evidence module if the narration of that beat actually
  supports it (numbers -> stat; datasets -> chart/timeline/compare; a source
  -> evidence; footage -> footage).
- Never ask to change narration, questions, reveals, or chapter TITLES.
- Prefer the fewest, highest-leverage patches. Zero patches is a valid answer.

Scoring bar: 10 = would hold a general audience for the whole video; 8 = good
but you see why some viewers would drop; 6 or below = a real problem that
costs viewers. Be specific: name the beat numbers. If everything is strong,
ready=true and patches=[]. If something is weak, ready=false and request
precise patches from the vocabulary.

Respond with strict JSON:
{"verdicts":{"hook":{"score":1..10,"issue":null|"..."},"curiosity":{...},"pacing":{...},"visuals":{...},"evidence":{...},"reveals":{...},"chapters":{...},"premium":{...}},"ready":true|false,"top_issue":null|"...","patches":[...]}`;

export function auditPrompt(ctx) {
  const topCoef = ctx.signals.coefficients.slice(0, 12).map(c => `  ${c.feature} ${c.effect > 0 ? "+" : ""}${c.effect}`).join("\n");
  const curve = ctx.signals.positionCurve;
  const curveSummary = curve.length ? `starts ${curve[0]?.toFixed(2)}, ends ${curve[curve.length - 1]?.toFixed(2)}, min bin ${curve.indexOf(Math.min(...curve))}, max bin ${curve.indexOf(Math.max(...curve))}` : "n/a";
  const dims = Object.entries(ctx.scores).map(([k, v]) => `  ${k} ${v}/10`).join("\n");
  const beats = ctx.narration.map(b =>
    `[${b.n}] ch:${b.chapter} ${b.purpose} ${Number(b.end) - Number(b.start)}s "${b.vo}"${b.question ? ` Q:${b.question}` : ""}${b.reveal ? ` R:${b.reveal}` : ""}`).join("\n");
  const assets = ctx.assets.length ? ctx.assets.join(", ") : "none";
  return `LONG-FORM DOCUMENTARY — EDITORIAL AUDIT
Title: ${ctx.narration[0] ? "see beats" : ""} (${ctx.narration.length} beats, ${ctx.chapterCount} chapters, cold open: ${ctx.coldOpen})

=== FULL NARRATION (canonical, never edit) ===
${beats}

=== DETERMINISTIC QC SCORES (13 dims, gate is 8/10 each) ===
${dims}

=== YT_ENGINE SIGNALS (channel retention model — ADVISORY DATA, your judgment wins) ===
Top coefficients (effect on per-sentence retention, residualized on position):
${topCoef || "n/a"}
Position curve: ${curveSummary}
Self-calibrated: ${ctx.signals.selfCalibrated || "no (corpus model)"}

=== AVAILABLE ASSETS ===
${assets}

=== CURRENT SEARCH CONTEXT ===
variant: ${ctx.search.tag || "baseline"}  seed: ${ctx.search.seed || "?"}
dials: ${JSON.stringify(ctx.search.dials || {})}

Audit as a senior documentary editor who has seen what viral long-form looks
like. Lead with your own judgment: how would a general audience actually
experience this 19-minute video? Would they stay? Where exactly would they
leave and why? Use the yt_engine coefficients only to confirm or question
your instinct — never to override it. Score each axis 1-10 (10 = premium
documentary, nothing to fix). Be specific: name the beat numbers. If
everything is strong, ready=true and patches=[]. If something is weak,
ready=false and request precise patches from the vocabulary.`;
}

// ------------------------------------------------------------------ loop
export async function audit(script, plan, { maxRounds = MAX_ROUNDS, key = null, skip = noGemini } = {}) {
  const round = [];
  const baseDials = { ...(plan.search?.dials || {}) };
  const pristineTag = String(plan.search?.tag || "baseline").replace(/(\+[^+]+)+$/, "");
  const seed = Number(plan.search?.seed ?? 20260817);
  const narrationKey = p => p.beats.map(b => JSON.stringify(b.narrative)).sort();
  const baseNarration = narrationKey(plan);
  const previousPlanPath = planPath;
  let currentDials = baseDials, currentPlan = plan;
  const status = { key: Boolean(key), maxRounds };

  for (let r = 1; r <= maxRounds; r++) {
    if (skip || !key) {
      round.push({ round: r, skipped: "no_gemini", scores: currentPlan.qc?.score });
      status.skipped = true;
      break;
    }
    // Context is rebuilt every round from the CURRENT plan so the auditor
    // judges what it actually patched, never a stale snapshot from round 1.
    const ctx = buildContext(script, currentPlan);
    if (!res.ok) { round.push({ round: r, error: res.reason, detail: res.errors }); status.error = res.reason; status.models = res.errors; break; }
    const v = res.data || {};
    const verdicts = {};
    for (const ax of AXES) {
      const vx = v.verdicts?.[ax] || {};
      verdicts[ax] = { score: SCALE(vx.score, 0, 10), issue: vx.issue ?? null };
    }
    const ready = Boolean(v.ready);
    const { dials, cameraOverrides, revealOverrides, evidenceOverrides, applied, rejected } = coercePatches(v.patches, script.beats.length);
    const newDials = { ...currentDials, ...dials,
      cameraOverrides: { ...(currentDials.cameraOverrides || {}), ...cameraOverrides },
      revealOverrides: { ...(currentDials.revealOverrides || {}), ...revealOverrides },
      evidenceOverrides: { ...(currentDials.evidenceOverrides || {}), ...evidenceOverrides } };
    const next = buildPlan(script, { previousPlanPath, references: referencePath, seed, dials: { ...newDials, tag: `${pristineTag}+gemini-r${r}` } });
    if (narrationKey(next).join("|") !== baseNarration.join("|")) {
      round.push({ round: r, fatal: "narration_changed", model: res.model, verdicts, patches: applied });
      status.fatal = true;
      break;
    }
    round.push({ round: r, model: res.model, modelsTried: res.modelsTried || [res.model], ready, top_issue: v.top_issue ?? null, verdicts, patches: applied, rejected,
                 score_after: next.qc?.score, gate_after: next.qc?.scores || {} });
    currentDials = newDials;
    currentPlan = next;
    if (ready && applied.length === 0) { status.ready = true; status.rounds = r; break; }
    status.rounds = r;
  }

  return { status, round, plan: currentPlan, dials: currentDials };
}

// -------------------------------------------------------------------- CLI
const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replaceAll("\\", "/")}`).href;
if (isMain) {
  const script = JSON.parse(readFileSync(scriptPath, "utf8"));
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const { status, round, plan: finalPlan } = await audit(script, plan, { key: noGemini ? null : loadApiKey() });

  const auditPath = resolve(ROOT, "video/out/gemini-audit.json");
  mkdirSync(dirname(auditPath), { recursive: true });
  const doc = { generated: new Date().toISOString(), title: script.title, maxRounds: MAX_ROUNDS, status, round };
  writeFileSync(auditPath, JSON.stringify(doc, null, 2), "utf8");

  console.log(`GEMINI AUDITOR  ${doc.title}`);
  for (const r of round) {
    if (r.skipped || r.error || r.fatal) { console.log(`  round ${r.round}: ${r.fatal || r.error || r.skipped} ${r.detail ? "(" + (Array.isArray(r.detail) ? r.detail.join("; ") : r.detail) + ")" : ""}`); continue; }
    const weakest = Object.entries(r.verdicts).sort((a, b) => a[1].score - b[1].score)[0];
    console.log(`  round ${r.round}: ${r.ready ? "READY" : "NOT READY"} · model ${r.model} · weakest ${weakest[0]} ${weakest[1].score}/10 · ${r.patches.length} patch(es) · QC ${r.score_after}/10`);
    if (r.top_issue) console.log(`           issue: ${r.top_issue}`);
  }
  if (!status.ready && !status.skipped && !status.error && !status.fatal) {
    console.error(`AUDITOR NOT READY after ${status.rounds} round(s) — plan NOT written, pipeline halts`);
    process.exit(3);
  }
  const changed = status.rounds > 0 && !status.skipped && !status.error && !status.fatal;
  if (changed && round.length) {
    writeFileSync(planPath, JSON.stringify(finalPlan, null, 2), "utf8");
    console.log(`WROTE ${planPath} (after ${status.rounds} round(s))`);
  } else {
    console.log("  plan unchanged");
  }
  console.log(`AUDIT ${auditPath}`);
  if (status.skipped) console.log("  no GEMINI_API_KEY — deterministic path only");
}