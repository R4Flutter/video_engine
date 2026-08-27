import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertLongformScript, LONGFORM_MODE } from "./longform-policy.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// --------------------------------------------------------------- utilities
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
const numbers = (s) => [...String(s || "").matchAll(/(?:\$\s?\d[\d,.]*|\b\d+(?:\.\d+)?%?|\b\d[\d,.]*(?:\s?(?:million|billion|thousand))?\b)/gi)].map(m => m[0]);
const contains = (s, terms) => terms.some(t => String(s || "").toLowerCase().includes(t));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const durationOf = b => Math.max(0.1, Number(b.end) - Number(b.start));
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ------------------------------------------------------- cold-open candidates
const COLD_OPEN_ARCHETYPES = [
  ["contradiction", (n1, n2, q) => `${n1}. But the room is still mostly empty.`, () => "Why does this business model work?"],
  ["mystery", () => "The strange part isn't how many people pay. It's how few can show up.", () => "Why would underuse be valuable?"],
  ["consequence", () => "A tiny fraction of customers showing up at once would hit the physical limit.", () => "Why is non-use economically useful?"],
  ["recognition", () => "The customer who keeps paying can be more valuable than the customer who keeps using.", () => "What happens when inertia becomes part of the economics?"],
  ["evidence-first", (n1, n2) => `${n1} members. ${n2}. Those two numbers should not fit together.`, () => "What is the missing piece?"],
  ["visual-mystery", () => "This empty room is not a failure. It is evidence.", () => "Evidence of what?"],
  ["high-stakes", () => "The business can become more profitable when customers use less of what they bought.", () => "How can that be rational and repeatable?"],
  ["human-paradox", () => "You do not have to stop loving the product for the company to profit from you barely using it.", () => "Why would a customer relationship reward inertia?"],
];
function coldOpenCandidates(beats) {
  const first = beats[0] || {}, second = beats[1] || {};
  const n1 = numbers(first.vo || first.text)[0] || first.text || "A huge number";
  const n2 = numbers(second.vo || second.text)[0] || second.text || "capacity";
  return COLD_OPEN_ARCHETYPES.map(([archetype, claim, question], i) => ({ id: `co-${i+1}`, archetype, claim: claim(n1, n2), question: question(n1, n2) }));
}
function scoreColdOpen(c, beats) {
  const wc = words(c.claim).length;
  const specific = numbers(c.claim).length ? 1 : 0.72;
  const contradiction = /but|isn't|strange|should not|more valuable|less/i.test(c.claim) ? 1 : 0.66;
  const stakes = /profit|limit|valuable|evidence|failure|economics|paying/i.test(c.claim) ? 1 : 0.72;
  const curiosity = /\?$/.test(c.question) ? 1 : 0.5;
  const visual = /room|empty|number|physical|customer|capacity|evidence/i.test(c.claim) ? 1 : 0.75;
  const brevity = clamp(1 - Math.max(0, wc - 20) / 25, 0.45, 1);
  const evidenceFit = beats[0] && (numbers(beats[0].vo).length || beats[0].text) ? 1 : 0.8;
  return Number(clamp(4*specific + 1.7*contradiction + 1.5*stakes + 1.6*curiosity + 1.2*visual + brevity + evidenceFit, 0, 10).toFixed(2));
}

// ---------------------------------------------------------------- chapters
function makeChapters(beats) {
  const chapters=[]; let start=0, lastReset=0;
  for(let i=1;i<beats.length;i++){
    const b=beats[i], semantic=contains(`${b.name} ${b.purpose}`, ["history","regulator","law","now","again","start with","chapter"]);
    if(Number(b.start)-lastReset>=100 || (semantic && i-start>=2)){
      const first=beats[start], last=beats[i-1]; chapters.push({id:`ch-${chapters.length+1}`,title:first.name||`Chapter ${chapters.length+1}`,start:first.start,end:last.end,thesis:first.reveal||first.question||"",beats:beats.slice(start,i).map(x=>x.n)}); start=i; lastReset=Number(b.start);
    }
  }
  if(start<beats.length){const first=beats[start],last=beats[beats.length-1];chapters.push({id:`ch-${chapters.length+1}`,title:first.name||`Chapter ${chapters.length+1}`,start:first.start,end:last.end,thesis:first.reveal||first.question||"",beats:beats.slice(start).map(x=>x.n)});}
  return chapters;
}

// --------------------------------------------- yt_engine long-form retention
// The corpus-calibrated ridge on sentence heat (231,061 sentences · 1,044
// videos · 21 channels). Features are z-scored with the corpus moments so a
// residual is in the model's own units: +0.07σ means "holds heat like a
// sentence 0.07σ above the average corpus sentence at the same position".
// The model sees spoken transcripts only; the staged-number credit is the
// model's own has_number effect, added when authored staging renders a
// number on screen (text row or stat/chart/investChart module).
const MODEL_JSON = process.env.YT_ENGINE_MODEL || "C:/Users/rajna/yt_engine/reports/retention_coefficients.json";
const MOMENTS_JSON = process.env.YT_ENGINE_MOMENTS || "C:/Users/rajna/yt_engine/reports/retention_moments.json";
const R_CONTRAST = /\b(but|however|yet|although|though|instead|despite|until)\b/i;
const R_CONSEQUENCE = /\b(so|therefore|because|which meant|thus|as a result|that's why)\b/i;
const R_DOLLAR = /(\$\s?[\d,.]+|\b\d[\d,.]*\s?(dollars?|bucks)\b)/i;
const R_PERCENT = /(\d+(\.\d+)?\s?%|\bpercent\b)/i;
const R_DIGITS = /\d/;
const R_SPELLED = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|trillion)\b/i;
const R_ROUND = /\b(\d+)(000|00)\b|\b(ten|hundred|thousand|million|billion)\b/i;
const R_TITLES = /\b(mr|mrs|ms|dr|ceo|founder|president|chairman|billionaire|investor)\b/i;
const R_ORG = /\b(inc|corp|corporation|company|bank|group|holdings|ventures|capital|fund|llc|ltd)\b/i;
const R_ABSTRACT = /^(the\s+)?(economy|market|value|growth|inflation|system|industry|concept|idea|problem|situation|process|strategy|business model)\b/i;
const R_PROPER = /(?<!^)(?<![.!?]\s)\b([A-Z][a-zA-Z]{2,})\b/g;
const R_STOP_CAPS = new Set(["I","The","But","And","So","It","This","That","He","She","They","We","You","In","On","At","If","When","What","Why","How","Now"]);
const R_SENT = /(?<=[.!?"])\s+/;
const R_ON_SCREEN_NUMBER = /[\d$%]|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)\b/i;
const R_FEATURES = ["has_dollar","has_number","number_specific","has_percent","is_question","is_contrast","is_consequence","names_person","names_org","new_entity","abstract_subj","sec_since_entity","sec_since_number","word_count","wpm","len_delta"];
function retentionModel(script, duration) {
  let model, moments;
  try {
    model = JSON.parse(readFileSync(MODEL_JSON, "utf8"));
    moments = JSON.parse(readFileSync(MOMENTS_JSON, "utf8")).features;
  } catch (e) {
    return { available: false, error: e.message };
  }
  const coef = new Map(model.coefficients.map((c) => [c.feature, c.effect]));
  const sentences = [];
  let lastEntityT = 0, lastNumberT = 0, prevLen = null;
  for (const b of script.beats || []) {
    const dur = durationOf(b);
    const parts = String(b.vo || "").split(R_SENT).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) continue;
    const bw = words(b.vo).length || 1;
    let cum = 0;
    for (const part of parts) {
      const wc = words(part).length;
      const tStart = Number(b.start) + dur * (cum / bw);
      cum += wc;
      const tEnd = Number(b.start) + dur * (cum / bw);
      const s = { beat: Number(b.n), text: part, t_start: tStart, t_end: tEnd, word_count: wc, wpm: (wc / Math.max(0.3, tEnd - tStart)) * 60, rel_pos: tStart / Math.max(1, duration) };
      const hasDollar = R_DOLLAR.test(part), hasNum = R_DIGITS.test(part) || R_SPELLED.test(part);
      s.has_dollar = hasDollar ? 1 : 0;
      s.has_number = hasNum ? 1 : 0;
      s.has_percent = R_PERCENT.test(part) ? 1 : 0;
      s.number_specific = hasNum && !R_ROUND.test(part) ? 1 : 0;
      s.is_question = part.trimEnd().endsWith("?") ? 1 : 0;
      s.is_contrast = R_CONTRAST.test(part) ? 1 : 0;
      s.is_consequence = R_CONSEQUENCE.test(part) ? 1 : 0;
      R_PROPER.lastIndex = 0;
      const proper = [...part.matchAll(R_PROPER)].map((x) => x[1]).filter((x) => !R_STOP_CAPS.has(x));
      s.names_person = R_TITLES.test(part) || proper.length > 0 ? 1 : 0;
      s.names_org = R_ORG.test(part) ? 1 : 0;
      s.new_entity = proper.length > 0 ? 1 : 0;
      s.abstract_subj = R_ABSTRACT.test(part) ? 1 : 0;
      s.sec_since_entity = +(tStart - lastEntityT).toFixed(2);
      s.sec_since_number = +(tStart - lastNumberT).toFixed(2);
      s.len_delta = prevLen === null ? 0 : +(wc - prevLen).toFixed(1);
      if (proper.length) lastEntityT = tStart;
      if (hasNum) lastNumberT = tStart;
      prevLen = wc;
      sentences.push(s);
    }
  }
  for (const s of sentences) {
    const residual = R_FEATURES.reduce((sum, f) => sum + (coef.get(f) ?? 0) * ((s[f] - moments[f].mean) / moments[f].std), 0);
    const bin = Math.min(49, Math.max(0, Math.floor(s.rel_pos * 50)));
    s.residual = residual;
    s.predictedHeat = model.position_curve[bin] + residual;
  }
  const stagedCredit = (coef.get("has_number") ?? 0) * ((1 - moments.has_number.mean) / moments.has_number.std);
  const byBeat = new Map();
  for (const s of sentences) {
    const b = byBeat.get(s.beat) ?? { beat: s.beat, w: 0, heat: 0 };
    b.w += s.t_end - s.t_start;
    b.heat += s.residual * (s.t_end - s.t_start);
    byBeat.set(s.beat, b);
  }
  const beatScores = [];
  for (const b of byBeat.values()) {
    const beat = (script.beats || []).find((x) => Number(x.n) === b.beat);
    const staged = Boolean(beat && (R_ON_SCREEN_NUMBER.test(beat.text || "") || ["stat","chart","investChart"].includes(String(beat.module))));
    beatScores.push({ beat: b.beat, heat: Number((b.heat / b.w).toFixed(4)), staged, score: Number((b.heat / b.w + (staged ? stagedCredit : 0)).toFixed(4)) });
  }
  beatScores.sort((a, b) => b.score - a.score);
  return {
    available: true,
    nSentences: sentences.length,
    nStaged: beatScores.filter((b) => b.staged).length,
    meanResidual: sentences.reduce((a, s) => a + s.residual, 0) / Math.max(1, sentences.length),
    worstBeat: beatScores[beatScores.length - 1],
    beatScores,
    curve: model.position_curve,
  };
}

// -------------------------------------------------------------- staging dials
// The beam varies only editorial choices — never narration, never authored
// staging. Authored rows always win; dials apply to the director's own
// decisions (camera/reveal fallbacks, internal-change geometry, transition
// flair, chapter cut placement).
const STAGING_PATTERNS = {
  spread: (d) => d >= 28 ? [.28, .52, .76] : d >= 18 ? [.35, .65] : d >= 6 ? [.55] : [],
  front:  (d) => d >= 28 ? [.18, .35, .55] : d >= 18 ? [.25, .5] : d >= 6 ? [.4] : [],
  back:   (d) => d >= 28 ? [.4, .65, .85] : d >= 18 ? [.55, .8] : d >= 6 ? [.7] : [],
  even:   (d) => d >= 28 ? [.33, .5, .66] : d >= 18 ? [.5] : d >= 6 ? [.5] : [],
};
const REVEAL_ALTERNATIVES = ["SEQUENTIAL", "COUNTER_REVEAL", "HIDDEN_THEN_REVEAL", "PROGRESSIVE"];

// ------------------------------------------------------------------ builder
export const buildPlan = (script, opts = {}) => {
  const { previousPlanPath = null, references = null, seed = 1, dials = {} } = opts;
  const staging = STAGING_PATTERNS[dials.stagingPattern] || STAGING_PATTERNS.spread;
  const cameraBias = dials.cameraBias || null;
  const revealShift = clamp(Number(dials.revealShift ?? 0), 0, 1);
  const contrastChapters = dials.contrastPolicy === "chapters";
  const jcutAdd = Math.max(0, Number(dials.jcutAdd ?? 0));
  const rng = mulberry32(seed);

  const refs = (() => { try { return JSON.parse(readFileSync(references, "utf8")); } catch { return []; } })();
  const assetSeed = (() => {
    if (!previousPlanPath || !existsSync(previousPlanPath)) return new Map();
    try {
      const p = JSON.parse(readFileSync(previousPlanPath, "utf8"));
      return new Map((p.beats || []).map(b => [Number(b.n || b.beat), b?.render?.media?.src || b?.visual?.assetPath || b?.visual?.asset || b?.visual?.footage || b?.footage || b?.assetPath || b?.asset || null]).filter(([,v]) => v));
    } catch { return new Map(); }
  })();

  const candidates = coldOpenCandidates(script.beats).map(c => ({ ...c, score: scoreColdOpen(c, script.beats) })).sort((a,b) => b.score-a.score || a.id.localeCompare(b.id));
  const winner = candidates[0];

  const beats = [...(script.beats || [])].sort((a,b) => Number(a.start)-Number(b.start));
  if (!beats.length) throw new Error("LongFormDirector: script contains no beats");
  const chapters = makeChapters(beats);
  const duration = Number(script.durationInSeconds);

  const DATA_MODULES = new Set(["stat","chart","investChart","timeline","compare","evidence"]);
  const chapterOpenerN = new Set(chapters.slice(1).map(c => Number(c.beats[0])));
  let priorModule = "", sameRun = 0, visualChanges = 0, evidenceEvents = 0;
  const directedBeats = beats.map((b, i) => {
    const beatKey = String(b.n ?? b.name ?? i);
    const reqMod = dials.evidenceOverrides?.[beatKey];
    let module = String(b.module || (b.footage ? "footage" : b.data?.length ? "chart" : b.source ? "evidence" : "evidence"));
    if (reqMod) {
      const compatible = reqMod === "footage" ? Boolean(b.footage)
        : ["chart","investChart","timeline","compare"].includes(reqMod) ? (b.data?.length ?? 0) > 0
        : reqMod === "stat" ? numbers(b.vo || "").length > 0 || (b.data?.length ?? 0) > 0
        : reqMod === "evidence" ? Boolean(b.source || b.data?.length)
        : false;
      if (compatible) module = reqMod;
    }
    sameRun = module === priorModule ? sameRun + 1 : 1; if (module !== priorModule) visualChanges++; priorModule = module;
    const evidenceRequired = ["proof","reveal","escalate"].includes(String(b.purpose || "").toLowerCase()) || numbers(b.vo).length > 0 || numbers(b.text || "").length > 0 || DATA_MODULES.has(module); if (evidenceRequired) evidenceEvents++;
    const d = durationOf(b), internalChange = staging(d).map(f => Number((d * f).toFixed(2)));
    const needed = Math.max(1, Math.ceil(d / 14) - 1);
    const fatigueRisk = d > 18 && internalChange.length < needed ? 1 : Math.max(0, (sameRun - 3) * 0.25);
    const next = beats[i + 1];
    const source = assetSeed.get(Number(b.n)) || null;
    const overrideReveal = dials.revealOverrides?.[beatKey];
    let revealMode = String(b.revealMode || overrideReveal || "IMMEDIATE");
    if (!b.revealMode && !overrideReveal && revealShift > 0 && rng() < revealShift) revealMode = REVEAL_ALTERNATIVES[Math.floor(rng() * REVEAL_ALTERNATIVES.length)];
    const camera = String(b.camera || dials.cameraOverrides?.[beatKey] || cameraBias || (d > 8 ? "push" : "hold"));
    const transition = i === 0 ? "cut" : (b.purpose === "reveal" || b.purpose === "payoff" || (contrastChapters && chapterOpenerN.has(Number(b.n)))) ? "contrast" : "cut";
    return {
      n: b.n, name: b.name || `Beat ${b.n}`, start: Number(b.start), end: Number(b.end), duration: d,
      chapterId: chapters.find(c => b.start >= c.start && b.start <= c.end)?.id || "ch-1",
      narrative: { purpose: b.purpose || "explain", question: b.question || "", reveal: b.reveal || "" },
      retention: { activeQuestion: b.question || "", nextQuestion: next?.question || (i < beats.length - 1 ? `What changes after ${b.name || "this"}?` : ""), payoff: b.reveal || "", fatigueRisk, visualResetRequired: sameRun >= 3 || fatigueRisk >= .55 },
      visual: { source: b.visual || "", module, text: b.text || "", camera, revealMode, internalChangeAt: internalChange, evidenceRequired, assetPath: source, footagePlan: b.footage || "" },
      audio: { music: b.music || "hold", silence: b.silence || "none", sfx: b.sfx || "", jcut: Number(b.jcut || 0), lcut: Number(b.lcut || 0) },
      transition,
      render: { schema: "longform-render-1", sequence: { index: i, fromSeconds: Number(b.start), durationSeconds: d }, scene: { kind: module, module, strict: true }, media: { src: source, fit: "cover", muted: true, loop: true }, typography: { text: b.text || "", enabled: Boolean(b.text) }, motion: { camera, revealMode, internalChangeAt: internalChange, deterministic: true }, audio: { music: b.music || "hold", silence: b.silence || "none", sfx: b.sfx || "", jcut: Number(b.jcut || 0), lcut: Number(b.lcut || 0) }, transition },
    };
  });
  // Extra chapter-opener cuts: only beats with neither authored cut get one,
  // in chapter order, capped at the dial's budget.
  if (jcutAdd > 0) {
    const candidates_j = chapters.slice(1).map(c => directedBeats.find(x => Number(x.n) === Number(c.beats[0]))).filter(Boolean).filter(b => !b.audio.jcut && !b.audio.lcut);
    for (const b of candidates_j.slice(0, jcutAdd)) { b.audio.jcut = 1; b.render.audio.jcut = 1; }
  }

  const visualRate = (visualChanges + directedBeats.reduce((a,b) => a + (Array.isArray(b.render.motion.internalChangeAt) ? b.render.motion.internalChangeAt.length : 0), 0)) / (duration / 60);
  const evidenceRate = evidenceEvents / (duration / 60);
  const fatigueCount = directedBeats.filter(b => b.retention.fatigueRisk >= .55).length;
  const openQuestions = directedBeats.filter(b => b.retention.nextQuestion).length;
  const jlCuts = directedBeats.filter(b => b.audio.jcut || b.audio.lcut).length;
  const moduleCounts = {}; for (const b of directedBeats) moduleCounts[b.visual.module] = (moduleCounts[b.visual.module] || 0) + 1;
  const maxModuleShare = Math.max(0, ...Object.values(moduleCounts)) / Math.max(1, directedBeats.length);
  const moduleCount = Object.keys(moduleCounts).length;
  const textCoverage = directedBeats.filter(b => b.visual.text).length / directedBeats.length;
  const cameraCoverage = directedBeats.filter(b => b.visual.camera).length / directedBeats.length;
  const revealCoverage = directedBeats.filter(b => b.visual.revealMode).length / directedBeats.length;
  const questionCoverage = directedBeats.slice(0,-1).filter(b => b.narrative.question).length / Math.max(1, directedBeats.length - 1);
  const lastBeat = directedBeats[directedBeats.length - 1];
  const loopCloses = ["payoff","reveal"].includes(lastBeat.narrative.purpose) && !lastBeat.narrative.question && Boolean(lastBeat.narrative.reveal);
  const needsMedia = directedBeats.filter(b => ["footage","evidence"].includes(b.visual.module)).length;
  const plannedMedia = directedBeats.filter(b => ["footage","evidence"].includes(b.visual.module) && (b.visual.footagePlan || b.visual.assetPath)).length;
  const gaps = []; for (let i = 1; i < directedBeats.length; i++) { const g = Number(directedBeats[i].start) - Number(directedBeats[i-1].end); if (g > 1) gaps.push(g); }
  const covered = new Set(chapters.flatMap(c => c.beats)); const chapterMisses = directedBeats.filter(b => !covered.has(Number(b.n))).length;
  const chapterBoundaryFlairMiss = chapters.slice(1).filter(c => { const b = directedBeats.find(x => Number(x.n) === Number(c.beats[0])); return b && !b.audio.jcut && !b.audio.lcut && b.transition !== "contrast"; }).length;
  const noAudioIntent = directedBeats.filter(b => !b.audio.music && !b.audio.silence).length;
  const uncoveredClaims = directedBeats.filter(b => ["proof","reveal","escalate"].includes(b.narrative.purpose) && !b.visual.evidenceRequired).length;

  const model = retentionModel(script, duration);
  const findings = [];
  const blockers = [];
  if (!model.available) {
    const message = `yt_engine retention model unavailable: ${model.error}`;
    findings.push({ severity: "FATAL", rule: "retention_model_unavailable", message, fix: "Commit yt_engine/reports/retention_coefficients.json + retention_moments.json next to the pipeline." });
    blockers.push(findings[findings.length - 1]);
  }
  const retention = model.available
    ? Number(clamp(10 - Math.max(0, 0.05 - model.meanResidual) * 40 - Math.max(0, -0.10 - model.worstBeat.score) * 20, 0, 10).toFixed(2))
    : 0;

  const hook = winner.score;
  const narrative = Number(clamp(10 - chapters.filter(c => !c.thesis).length * 1.5 - ["hook","proof","escalate","reveal","payoff"].filter(p => !directedBeats.some(b => b.narrative.purpose === p)).length * 1 - (loopCloses ? 0 : 2) - (chapters.length < 6 || chapters.length > 14 ? 1 : 0) - (revealCoverage < .9 ? 1 : 0), 0, 10).toFixed(2));
  const curiosity = Number(clamp(10 - (1 - questionCoverage) * 8 - (lastBeat.narrative.question ? 2 : 0), 0, 10).toFixed(2));
  const pacing = Number(clamp(10 - fatigueCount * .35 - directedBeats.filter(b => b.duration > 24 && b.retention.fatigueRisk >= .55).length * .25 - Math.max(0, 5 - Math.min(5, visualRate)) * .5, 0, 10).toFixed(2));
  const visualHierarchy = Number(clamp(10 - (1 - textCoverage) * 4 - (1 - cameraCoverage) * 3 - (1 - revealCoverage) * 3, 0, 10).toFixed(2));
  const visualVariety = Number(clamp(10 - Math.max(0, maxModuleShare - .30) * 12 - Math.max(0, 7 - moduleCount) * 1.2 - Math.max(0, 5 - Math.min(5, visualRate)) * 1.5 - fatigueCount * .15, 0, 10).toFixed(2));
  const evidence = Number(clamp(10 - Math.max(0, 3 - Math.min(3, evidenceRate)) * 1.5 - uncoveredClaims * .15, 0, 10).toFixed(2));
  const audio = Number(clamp(10 - noAudioIntent * 1.5, 0, 10).toFixed(2));
  const broll = Number(clamp(10 - Math.max(0, needsMedia - plannedMedia) * 10 / Math.max(1, needsMedia), 0, 10).toFixed(2));
  const transitions = Number(clamp(10 - Math.max(0, 4 - jlCuts) * 1.25 - chapterBoundaryFlairMiss * .5, 0, 10).toFixed(2));
  const payoff = Number(clamp(10 - (directedBeats.some(b => ["payoff","reveal"].includes(b.narrative.purpose)) ? 0 : 4) - (loopCloses ? 0 : 3) - (revealCoverage < .85 ? 3 : 0), 0, 10).toFixed(2));
  const continuity = Number(clamp(10 - gaps.length * 1.5 - chapterMisses * 3 - Math.abs(duration - Number(directedBeats[directedBeats.length - 1].end)) * 5, 0, 10).toFixed(2));
  const overall = Number(((hook + narrative + curiosity + pacing + visualHierarchy + visualVariety + evidence + broll + audio + transitions + payoff + continuity + retention) / 13).toFixed(2));

  const durationMin = Math.max(1, duration / 60);
  const chapterFactor = clamp(chapters.length / 8, .55, 1);
  const meaningfulEvents = directedBeats.flatMap((b, i) => [...(i > 0 ? [Number(b.start)] : []), ...(Array.isArray(b.render.motion.internalChangeAt) ? b.render.motion.internalChangeAt.map(f => Number(b.start) + f) : [])]).filter(at => at <= duration);
  const eventFactor = clamp((meaningfulEvents.length / durationMin) / 1.25, .55, 1);
  const earlyEvents = meaningfulEvents.filter(at => at <= 30).length;
  const introFactor = clamp(earlyEvents / 4, .55, 1);
  const opened = directedBeats.filter(b => b.narrative.question).length;
  const closed = chapters.filter(c => c.thesis).length + (loopCloses ? 1 : 0);
  const resolutionFactor = clamp(closed / Math.max(1, opened), .45, 1);
  const loopScore = Number(clamp(loopCloses ? 10 : 7, 0, 10).toFixed(2));
  const craft01 = clamp((hook * .24 + pacing * .24 + curiosity * .22 + visualVariety * .12 + audio * .08 + loopScore * .10) / 10, 0, 1);
  const projectedCompletion = Number(clamp(craft01 * .58 + introFactor * .10 + chapterFactor * .12 + eventFactor * .10 + resolutionFactor * .10, 0, .9).toFixed(4));

  return {
    version: "longform-1.0",
    project: { title: script.title, durationInSeconds: duration, fps: Number(script.fps), width: Number(script.width), height: Number(script.height), engine: script.engine, mode: LONGFORM_MODE },
    editorialThesis: "Every visual advances understanding, evidence, emotion, or curiosity. Long holds require staged discovery or a deliberate payoff.",
    coldOpen: { selected: winner, candidates, visualFirstSeconds: 0, evidenceStartSeconds: 0, claimTargetSeconds: 18 },
    chapters,
    beats: directedBeats,
    referencePatterns: refs,
    search: { tag: dials.tag || "baseline", seed, dials },
    qc: {
      scores: { hook, narrative, curiosity, pacing, visualHierarchy, visualVariety, evidence, broll, audio, transitions, payoff, continuity, retention },
      score: overall,
      projectedCompletion,
      findings,
      blockers,
      metrics: {
        visualChangesPerMinute: Number(visualRate.toFixed(2)), evidenceEventsPerMinute: Number(evidenceRate.toFixed(2)),
        fatigueWindows: fatigueCount, unresolvedQuestions: openQuestions, assetSeedCount: assetSeed.size,
        jlCuts, moduleCount, maxModuleShare: Number(maxModuleShare.toFixed(2)),
        retentionResidual: model.available ? Number(model.meanResidual.toFixed(3)) : null,
        retentionWorstBeat: model.available ? model.worstBeat.score : null,
        retentionSentences: model.available ? model.nSentences : null,
        retentionStagedBeats: model.available ? model.nStaged : null,
      },
      retentionBeats: model.available ? model.beatScores : [],
    },
    renderContract: {
      schema: "longform-render-1",
      project: { title: script.title, durationInSeconds: duration, fps: Number(script.fps), width: Number(script.width), height: Number(script.height), mode: LONGFORM_MODE },
      sourceOfTruth: "director-plan.json", deterministic: true, sceneCount: directedBeats.length,
      rule: "director decides; render contract records; Remotion executes",
    },
    packaging: {
      titleCandidates: ["The Company That Sells You Nothing", "Why Companies Profit When You Stop Using Them", "The Business Model That Wins When You Don't Show Up"],
      thumbnailConcepts: ["empty gym + huge member count + occupancy ratio", "subscription charges accumulating into one total", "cancellation flow with the exit path buried"],
    },
  };
};

// ---------------------------------------------------------------------- CLI
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
  const scriptPath = resolve(ROOT, arg("script", "video/src/script.json"));
  const outPath = resolve(ROOT, arg("out", "video/src/director-plan.json"));
  const referencePath = resolve(ROOT, arg("references", "yt_engine/reference-patterns.json"));
  const script = JSON.parse(readFileSync(scriptPath, "utf8"));
  assertLongformScript(script);

  const plan = buildPlan(script, { previousPlanPath: resolve(ROOT, "video/src/director-plan.json"), references: referencePath, seed: Number(arg("seed", "1")) || 1 });
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(plan, null, 2), "utf8");
  mkdirSync(resolve(ROOT, "video/out"), { recursive: true });
  writeFileSync(resolve(ROOT, "video/out/render-contract.json"), JSON.stringify(plan.renderContract, null, 2), "utf8");
  writeFileSync(resolve(ROOT, "video/out/cold-open-candidates.json"), JSON.stringify(plan.coldOpen, null, 2), "utf8");

  const { project } = plan, d = Number(project.durationInSeconds), m = plan.qc.metrics;
  console.log(`LONGFORM DIRECTOR ${project.title}`);
  console.log(`MODE ${project.mode}`);
  console.log(`DURATION ${d}s · ${plan.beats.length} beats · ${plan.chapters.length} chapters`);
  console.log(`COLD OPEN ${plan.coldOpen.selected.archetype} · ${plan.coldOpen.selected.score}/10`);
  console.log(`VISUAL ${m.visualChangesPerMinute}/min · EVIDENCE ${m.evidenceEventsPerMinute}/min · ASSETS ${m.assetSeedCount}`);
  console.log(m.retentionResidual !== null
    ? `RETENTION ${m.retentionResidual >= 0 ? "+" : ""}${m.retentionResidual}σ · worst ${m.retentionWorstBeat >= 0 ? "+" : ""}${m.retentionWorstBeat}σ · ${plan.qc.scores.retention}/10 (${m.retentionSentences} sentences)`
    : `RETENTION MODEL UNAVAILABLE`);
  console.log(`OVERALL ${plan.qc.score}/10 · COMPLETION ${(plan.qc.projectedCompletion * 100).toFixed(1)}%`);
  console.log(`WROTE ${outPath}`);
}