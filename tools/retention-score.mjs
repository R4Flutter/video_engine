// retention-score.mjs — bridge yt_engine's learned sentence-heat model onto the
// long-form plan, next to the internal longformQC completion proxy.
//
// yt_engine side (miner/alignment.py): a ridge on corpus-standardized sentence
// features predicting within-video retention heat (heat_z), residualized on a
// 50-bin position curve, fitted on 13,024 sentences / 36 videos / 9 finance
// channels (reports/retention_coefficients.json). Every regex below is a
// verbatim port so the features match the training data exactly.
//
// Our side: script_beats.md (sentences + beat timings) and director-plan.json
// (qc.projectedCompletion — the long-form completion proxy, and
// qc.scores.retention — the 13th director dimension, both written by
// tools/direct.mjs). Sentence durations are approximated by an even read
// inside each beat — the same honest estimate align.py's note about word
// timings describes, and what the render pipeline assumes until a take exists.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BEATS_MD = join(ROOT, "script_beats.md");
const MODEL_JSON = "C:/Users/rajna/yt_engine/reports/retention_coefficients.json";
const MOMENTS_JSON = "C:/Users/rajna/yt_engine/reports/retention_moments.json";

// --------------------------------------------------------- yt_engine lexicons
const CONTRAST = /\b(but|however|yet|although|though|instead|despite|until)\b/i;
const CONSEQUENCE = /\b(so|therefore|because|which meant|thus|as a result|that's why)\b/i;
const DOLLAR = /(\$\s?[\d,.]+|\b\d[\d,.]*\s?(dollars?|bucks)\b)/i;
const PERCENT = /(\d+(\.\d+)?\s?%|\bpercent\b)/i;
const DIGITS = /\d/;
const SPELLED = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|trillion)\b/i;
const ROUND_NUM = /\b(\d+)(000|00)\b|\b(ten|hundred|thousand|million|billion)\b/i;
const TITLES = /\b(mr|mrs|ms|dr|ceo|founder|president|chairman|billionaire|investor)\b/i;
const ORG_HINT = /\b(inc|corp|corporation|company|bank|group|holdings|ventures|capital|fund|llc|ltd)\b/i;
const ABSTRACT = /^(the\s+)?(economy|market|value|growth|inflation|system|industry|concept|idea|problem|situation|process|strategy|business model)\b/i;
const PROPER = /(?<!^)(?<![.!?]\s)\b([A-Z][a-zA-Z]{2,})\b/g;
const STOP_CAPS = new Set([
  "I", "The", "But", "And", "So", "It", "This", "That", "He", "She", "They",
  "We", "You", "In", "On", "At", "If", "When", "What", "Why", "How", "Now",
]);

const words = (s) => s.trim().split(/\s+/).filter(Boolean);
const SENT = /(?<=[.!?"])\s+/;
const HAS_NUMBER_ON_SCREEN = /[\d$%]|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)\b/i;
// Modules that always render a number on screen by construction.
const STAGING_MODULES = new Set(["stat", "chart", "investChart"]);

// ------------------------------------------------------------------ inputs
const md = readFileSync(BEATS_MD, "utf8");
const beats = [];
const headerRe = /### BEAT (\d+) — (.+?) \((\d+):(\d+)–(\d+):(\d+)\)/g;
let m;
while ((m = headerRe.exec(md))) {
  const [, n, name, h1, m1, h2, m2] = m;
  const start = Number(h1) * 60 + Number(m1);
  const end = Number(h2) * 60 + Number(m2);
  const block = md.slice(m.index + m[0].length, headerRe.lastIndex === m.index + m[0].length ? md.indexOf("\n### BEAT", m.index + m[0].length) : m.index + m[0].length + md.slice(m.index + m[0].length).indexOf("\n### BEAT"));
  const audioMatch = block.match(/^\| \*\*Audio\*\* \| (.*) \|$/m);
  if (!audioMatch) throw new Error(`beat ${n} has no Audio row`);
  const textMatch = block.match(/^\| \*\*On-screen text\*\* \| (.*) \|$/m);
  const moduleMatch = block.match(/^\| \*\*Module\*\* \| (.*) \|$/m);
  beats.push({ n: Number(n), name, start, end, vo: audioMatch[1].trim(), text: textMatch?.[1]?.trim() ?? "", module: moduleMatch?.[1]?.trim() ?? "" });
}
if (!beats.length) throw new Error("no beats parsed from script_beats.md");
const duration = beats[beats.length - 1].end;

// --------------------------------------------------------------- featurize
// Sentence-level clone of miner/alignment.py featurize(). t_start/t_end come
// from an even read inside the beat.
const sentences = [];
let lastEntityT = 0, lastNumberT = 0, prevLen = null;
for (const b of beats) {
  const dur = b.end - b.start;
  const parts = b.vo.split(SENT).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) continue;
  const bw = words(b.vo).length || 1;
  let cum = 0;
  for (const part of parts) {
    const wc = words(part).length;
    const tStart = b.start + dur * (cum / bw);
    cum += wc;
    const tEnd = b.start + dur * (cum / bw);
    const s = { beat: b.n, text: part, t_start: tStart, t_end: tEnd, word_count: wc, wpm: (wc / Math.max(0.3, tEnd - tStart)) * 60, rel_pos: tStart / duration };
    const hasDollar = DOLLAR.test(part);
    const hasNum = DIGITS.test(part) || SPELLED.test(part);
    s.has_dollar = hasDollar ? 1 : 0;
    s.has_number = hasNum ? 1 : 0;
    s.has_percent = PERCENT.test(part) ? 1 : 0;
    s.number_specific = hasNum && !ROUND_NUM.test(part) ? 1 : 0;
    s.is_question = part.trimEnd().endsWith("?") ? 1 : 0;
    s.is_contrast = CONTRAST.test(part) ? 1 : 0;
    s.is_consequence = CONSEQUENCE.test(part) ? 1 : 0;
    PROPER.lastIndex = 0;
    const proper = [...part.matchAll(PROPER)].map((x) => x[1]).filter((x) => !STOP_CAPS.has(x));
    s.names_person = TITLES.test(part) || proper.length > 0 ? 1 : 0;
    s.names_org = ORG_HINT.test(part) ? 1 : 0;
    s.new_entity = proper.length > 0 ? 1 : 0;
    s.abstract_subj = ABSTRACT.test(part) ? 1 : 0;
    s.sec_since_entity = +(tStart - lastEntityT).toFixed(2);
    s.sec_since_number = +(tStart - lastNumberT).toFixed(2);
    s.len_delta = prevLen === null ? 0 : +(wc - prevLen).toFixed(1);
    if (proper.length) lastEntityT = tStart;
    if (hasNum) lastNumberT = tStart;
    prevLen = wc;
    sentences.push(s);
  }
}

// ---------------------------------------------------------- standardize+score
// Corpus-calibrated: features are z-scored with the moments of the exact
// corpus the ridge was fitted on (reports/retention_moments.json), so the
// residual is in the model's own units — a script line scoring +0.1σ is
// predicted to hold heat like a sentence 0.1σ above the corpus average at the
// same position.
const model = JSON.parse(readFileSync(MODEL_JSON, "utf8"));
const { features: moments } = JSON.parse(readFileSync(MOMENTS_JSON, "utf8"));
const coefMap = new Map(model.coefficients.map((c) => [c.feature, c.effect]));
const FEATURES = ["has_dollar", "has_number", "number_specific", "has_percent",
  "is_question", "is_contrast", "is_consequence", "names_person", "names_org",
  "new_entity", "abstract_subj", "sec_since_entity", "sec_since_number",
  "word_count", "wpm", "len_delta"];

for (const s of sentences) {
  const residual = FEATURES.reduce(
    (sum, f) => sum + (coefMap.get(f) ?? 0) * ((s[f] - moments[f].mean) / moments[f].std),
    0,
  );
  const bin = Math.min(49, Math.max(0, Math.floor(s.rel_pos * 50)));
  s.residual = residual;
  s.predictedHeat = model.position_curve[bin] + residual;
}

// ------------------------------------------------------------------ report
// Two signals, both corpus-calibrated:
//   residual    — the script-controlled part. What the model predicts a line
//                 does vs the average corpus sentence AT THE SAME POSITION.
//   predicted   — residual + the corpus position curve (retention's natural
//                 decay across a video's runtime, which every video shares).
const meanResidual = sentences.reduce((a, s) => a + s.residual, 0) / sentences.length;
const above = sentences.filter((s) => s.residual > 0).length;

const byBeat = new Map();
for (const s of sentences) {
  const b = byBeat.get(s.beat) ?? { beat: s.beat, w: 0, heat: 0 };
  b.w += s.t_end - s.t_start;
  b.heat += s.residual * (s.t_end - s.t_start);
  byBeat.set(s.beat, b);
}
// Staged credit: the model was fitted on spoken transcripts and cannot see the
// video. When a beat's authored staging carries a number on screen (on-screen
// text with a number, or a stat/chart module that renders one), the moment
// contains the model's strongest lever even if the narration does not. The
// credit is the model's own has_number effect for a present number, in corpus
// z units. `score` is what the viewer experiences; `heat` stays narration-only.
const stagedCredit = (coefMap.get("has_number") ?? 0) * ((1 - moments.has_number.mean) / moments.has_number.std);
for (const b of byBeat.values()) {
  const beat = beats.find((x) => x.n === b.beat);
  const staged = Boolean(beat && (HAS_NUMBER_ON_SCREEN.test(beat.text) || STAGING_MODULES.has(beat.module)));
  b.staged = staged;
  b.score = b.heat / b.w + (staged ? stagedCredit : 0);
}
const beatHeat = [...byBeat.values()].map((b) => ({ beat: b.beat, heat: b.heat / b.w, staged: b.staged, score: b.score })).sort((a, b) => b.score - a.score);
const hot = beatHeat.slice(0, 3);
const risk = beatHeat.slice(-3).reverse();

const spark = (vals) => {
  const lo = Math.min(...vals), hi = Math.max(...vals), rng = hi - lo || 1;
  return vals.map((v) => "▁▂▃▄▅▆▇█"[Math.min(7, Math.max(0, Math.floor(((v - lo) / rng) * 8)))]).join("");
};
const binHeat = Array.from({ length: 50 }, () => []);
for (const s of sentences) binHeat[Math.min(49, Math.floor(s.rel_pos * 50))].push(s.predictedHeat);
const ours = binHeat.map((a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0));

let proxy = null;
let directorRetention = null;
try {
  const plan = JSON.parse(readFileSync(join(ROOT, "video/src/director-plan.json"), "utf8"));
  proxy = plan.qc?.projectedCompletion ?? null;
  directorRetention = plan.qc?.scores?.retention ?? null;
} catch (e) {
  console.error(`  (proxy unavailable: ${e.message})`);
}

const fmtBeat = (b) => `BEAT ${String(b.beat).padStart(2)}  ${beats.find((x) => x.n === b.beat)?.name ?? ""}`;

if (process.argv.includes("--detail")) {
  const want = new Set(
    (process.argv[process.argv.indexOf("--detail") + 1] ?? "").split(",").map((s) => Number(s.trim())).filter(Boolean),
  );
  for (const s of sentences) {
    if (want.size && !want.has(s.beat)) continue;
    const parts = FEATURES.map((f) => ((coefMap.get(f) ?? 0) * ((s[f] - moments[f].mean) / moments[f].std))).map((v, i) => `${FEATURES[i]}:${v >= 0 ? "+" : ""}${v.toFixed(3)}`).sort((a, b) => Math.abs(parseFloat(b.split(":")[1])) - Math.abs(parseFloat(a.split(":")[1])));
    console.log(`b${String(s.beat).padStart(2)} ${s.residual >= 0 ? "+" : ""}${s.residual.toFixed(3)}σ  wpm=${s.wpm.toFixed(0)} wc=${s.word_count} · ${parts.slice(0, 3).join(" · ")}`);
    console.log(`      "${s.text.slice(0, 110)}"`);
  }
  process.exit(0);
}

console.log("YT-ENGINE RETENTION MODEL  (ridge · heat_z residualized on 50-bin position)");
console.log(`  corpus   ${model.n_sentences.toLocaleString()} sentences · ${model.n_videos} videos · ${model.n_channels} channels · confidence ${model.confidence}`);
console.log(`  language residual   ${meanResidual >= 0 ? "+" : ""}${meanResidual.toFixed(2)}σ  (corpus average sentence = 0 at the same position)`);
console.log(`  sentences above the corpus line   ${above}/${sentences.length}`);
console.log("");
for (const b of hot) console.log(`  HOTTEST    ${fmtBeat(b)}  ${b.score >= 0 ? "+" : ""}${b.score.toFixed(2)}σ${b.staged ? " (staged)" : ""}`);
for (const b of risk) console.log(`  RISKIEST   ${fmtBeat(b)}  ${b.score >= 0 ? "+" : ""}${b.score.toFixed(2)}σ${b.staged ? " (staged)" : ""}`);
console.log("");
console.log(`  shape  ours    ${spark(ours)}`);
console.log(`         corpus  ${spark(model.position_curve)}`);
console.log("");

console.log("RETENTION SCORE");
console.log(`  completion proxy (long-form model)   ${proxy !== null ? `${(proxy * 100).toFixed(1)}% projected reach the final frame` : "n/a (run npm run direct first)"}`);
console.log(`  retention dimension (director)       ${directorRetention !== null ? `${directorRetention.toFixed(1)}/10 (gate 8)` : "n/a (run npm run direct first)"}`);
console.log(`  language residual (yt_engine)   ${meanResidual >= 0 ? "+" : ""}${meanResidual.toFixed(2)}σ vs corpus average sentence at the same position`);
console.log("");
console.log("  note: the proxy is comparative QA, not a YouTube forecast. The residual is on");
console.log("        the model's own scale, calibrated to the 231,061-sentence corpus it was");
console.log("        fitted on. Sentence durations use the even-read approximation until a");
console.log("        voice take provides real word timings. Beat scores marked (staged) include");
console.log("        the model's has_number credit because the beat's authored staging carries");
console.log("        a number on screen (text row or stat/chart module) — the model itself only");
console.log("        sees spoken transcripts.");
