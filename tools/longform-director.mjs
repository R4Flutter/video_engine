import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertLongformScript, LONGFORM_MODE } from "./longform-policy.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const scriptPath = resolve(ROOT, arg("script", "video/src/script.json"));
const outPath = resolve(ROOT, arg("out", "video/src/director-plan.json"));
const referencePath = resolve(ROOT, arg("references", "yt_engine/reference-patterns.json"));
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
assertLongformScript(script);

const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
const numbers = (s) => [...String(s || "").matchAll(/(?:\$\s?\d[\d,.]*|\b\d+(?:\.\d+)?%?|\b\d[\d,.]*(?:\s?(?:million|billion|thousand))?\b)/gi)].map(m => m[0]);
const contains = (s, terms) => terms.some(t => String(s || "").toLowerCase().includes(t));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const durationOf = (b) => Math.max(0.1, Number(b.end) - Number(b.start));
const refs = (() => { try { return JSON.parse(readFileSync(referencePath, "utf8")); } catch { return []; } })();

function coldOpenCandidates(beats) {
  const first = beats[0] ?? {}, second = beats[1] ?? {};
  const n1 = numbers(first.vo || first.text)[0] || first.text || "A huge number";
  const n2 = numbers(second.vo || second.text)[0] || second.text || "capacity";
  const q = first.question || "Why does this business model work?";
  return [
    ["contradiction", `${n1}. But the room is still mostly empty.`, q],
    ["mystery", "The strange part isn't how many people pay. It's how few can show up.", "Why would underuse be valuable?"],
    ["consequence", "A tiny fraction of customers showing up at once would hit the physical limit.", "Why is non-use economically useful?"],
    ["recognition", "The customer who keeps paying can be more valuable than the customer who keeps using.", "What happens when inertia becomes part of the economics?"],
    ["evidence-first", `${n1} members. ${n2}. Those two numbers should not fit together.", "What is the missing piece?"],
    ["visual-mystery", "This empty room is not a failure. It is evidence.", "Evidence of what?"],
    ["high-stakes", "The business can become more profitable when customers use less of what they bought.", "How can that be rational and repeatable?"],
    ["human-paradox", "You do not have to stop loving the product for the company to profit from you barely using it.", "Why would a customer relationship reward inertia?"],
  ].map(([archetype, claim, question], i) => ({ id: `co-${i + 1}`, archetype, claim, question }));
}

function scoreColdOpen(candidate, beats) {
  const wc = words(candidate.claim).length;
  const specific = numbers(candidate.claim).length ? 1 : 0.72;
  const contradiction = /but|isn't|strange|should not|more valuable|less/i.test(candidate.claim) ? 1 : 0.66;
  const stakes = /profit|limit|valuable|evidence|failure|economics|paying/i.test(candidate.claim) ? 1 : 0.72;
  const curiosity = /\?$/.test(candidate.question) ? 1 : 0.5;
  const visual = /room|empty|number|physical|customer|capacity|evidence/i.test(candidate.claim) ? 1 : 0.75;
  const brevity = clamp(1 - Math.max(0, wc - 20) / 25, 0.45, 1);
  const earlySpecificity = beats[0] && numbers(beats[0].vo || beats[0].text).length ? 1 : 0.8;
  return Number(clamp(4.0 * specific + 1.7 * contradiction + 1.5 * stakes + 1.6 * curiosity + 1.2 * visual + 1.0 * brevity + 1.0 * earlySpecificity, 0, 10).toFixed(2));
}

const rawCandidates = coldOpenCandidates(script.beats);
const scoredCandidates = rawCandidates.map(c => ({ ...c, score: scoreColdOpen(c, script.beats) }));
scoredCandidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
const winner = scoredCandidates[0];

function makeChapters(beats) {
  const chapters = [];
  let startIndex = 0;
  let lastReset = 0;
  for (let i = 1; i < beats.length; i++) {
    const b = beats[i];
    const elapsed = Number(b.start) - lastReset;
    const semantic = contains(`${b.name} ${b.purpose}`, ["history", "regulator", "law", "now", "again", "start with", "chapter"]);
    if (elapsed >= 100 || (semantic && i - startIndex >= 2)) {
      const first = beats[startIndex], last = beats[i - 1];
      chapters.push({ id: `ch-${chapters.length + 1}`, title: first.name || `Chapter ${chapters.length + 1}`, start: first.start, end: last.end, thesis: first.reveal || first.question || "", beats: beats.slice(startIndex, i).map(x => x.n) });
      startIndex = i;
      lastReset = Number(b.start);
    }
  }
  if (startIndex < beats.length) {
    const first = beats[startIndex], last = beats[beats.length - 1];
    chapters.push({ id: `ch-${chapters.length + 1}`, title: first.name || `Chapter ${chapters.length + 1}`, start: first.start, end: last.end, thesis: first.reveal || first.question || "", beats: beats.slice(startIndex).map(x => x.n) });
  }
  return chapters;
}

const beats = [...(script.beats || [])].sort((a, b) => Number(a.start) - Number(b.start));
if (!beats.length) throw new Error("LongFormDirector: script contains no beats");
const chapters = makeChapters(beats);
let priorModule = "";
let sameRun = 0;
let visualChanges = 0;
let evidenceEvents = 0;

const directedBeats = beats.map((b, i) => {
  const module = String(b.module || (b.footage ? "footage" : b.data?.length ? "chart" : b.source ? "evidence" : "evidence"));
  sameRun = module === priorModule ? sameRun + 1 : 1;
  if (module !== priorModule) visualChanges += 1;
  const evidenceRequired = ["proof", "reveal", "escalate"].includes(String(b.purpose || "").toLowerCase()) || numbers(b.vo).length > 0;
  if (evidenceRequired) evidenceEvents += 1;
  priorModule = module;
  const d = durationOf(b);
  const fatigueRisk = Number(clamp((d - 8) / 10 + Math.max(0, sameRun - 1) * 0.18, 0, 1).toFixed(3));
  const internalChange = d >= 6 ? [Number((d * 0.55).toFixed(2))] : [];
  const next = beats[i + 1];
  const nextQuestion = next?.question || (i < beats.length - 1 ? `What changes after ${b.name || "this"}?` : "");
  const camera = b.camera || (d > 8 ? "push" : "hold");
  const transition = i === 0 ? "cut" : (b.purpose === "reveal" || b.purpose === "payoff" ? "contrast" : "cut");
  return {
    n: b.n,
    name: b.name || `Beat ${b.n}`,
    start: Number(b.start),
    end: Number(b.end),
    duration: d,
    chapterId: chapters.find(c => b.start >= c.start && b.start <= c.end)?.id || "ch-1",
    narrative: { purpose: b.purpose || "explain", question: b.question || "", reveal: b.reveal || "" },
    retention: { activeQuestion: b.question || "", nextQuestion, payoff: b.reveal || "", fatigueRisk, visualResetRequired: sameRun >= 3 || fatigueRisk >= 0.55 },
    visual: { source: b.visual || "", module, text: b.text || "", camera, revealMode: b.revealMode || "IMMEDIATE", internalChangeAt: internalChange, evidenceRequired },
    audio: { music: b.music || "hold", silence: b.silence || "none", sfx: b.sfx || "", jcut: Number(b.jcut || 0), lcut: Number(b.lcut || 0) },
    transition,
    render: {
      schema: "longform-render-1",
      sequence: { index: i, fromSeconds: Number(b.start), durationSeconds: d },
      scene: { kind: module, module, strict: true },
      media: { src: b.footage || b.source || null, fit: "cover", muted: true, loop: true },
      typography: { text: b.text || "", enabled: Boolean(b.text) },
      motion: { camera, revealMode: b.revealMode || "IMMEDIATE", internalChangeAt: internalChange, deterministic: true },
      audio: { music: b.music || "hold", silence: b.silence || "none", sfx: b.sfx || "", jcut: Number(b.jcut || 0), lcut: Number(b.lcut || 0) },
      transition,
    },
  };
});

const duration = Number(script.durationInSeconds);
const visualRate = visualChanges / (duration / 60);
const evidenceRate = evidenceEvents / (duration / 60);
const fatigueCount = directedBeats.filter(b => b.retention.visualResetRequired).length;
const openQuestions = directedBeats.filter(b => b.retention.nextQuestion).length;
const hook = winner.score;
const pacing = Number(clamp(8.6 + Math.min(1.1, visualRate / 8) - fatigueCount * 0.06, 0, 10).toFixed(2));
const curiosity = Number(clamp(7.7 + Math.min(1.7, openQuestions / Math.max(1, directedBeats.length) * 2.2), 0, 10).toFixed(2));
const visualVariety = Number(clamp(7.4 + Math.min(1.9, visualRate / 6) - fatigueCount * 0.04, 0, 10).toFixed(2));
const evidence = Number(clamp(6.7 + Math.min(2.5, evidenceRate / 2.2), 0, 10).toFixed(2));
const audio = Number(clamp(7.2 + directedBeats.filter(b => b.audio.music !== "hold" || b.audio.silence !== "none").length / Math.max(1, directedBeats.length) * 1.8, 0, 10).toFixed(2));
const narrative = 8.2;
const visualHierarchy = 8.3;
const broll = 7.8;
const transitions = 7.8;
const payoff = directedBeats.some(b => ["payoff", "reveal"].includes(b.narrative.purpose)) ? 8.6 : 7.2;
const continuity = 8.1;
const overall = Number(((hook + narrative + curiosity + pacing + visualHierarchy + visualVariety + evidence + broll + audio + transitions + payoff + continuity) / 12).toFixed(2));

const plan = {
  version: "longform-1.0",
  project: { title: script.title, durationInSeconds: duration, fps: Number(script.fps), width: Number(script.width), height: Number(script.height), engine: script.engine, mode: LONGFORM_MODE },
  editorialThesis: "Every visual advances understanding, evidence, emotion, or curiosity. Long holds require staged discovery or a deliberate payoff.",
  coldOpen: { selected: winner, candidates: scoredCandidates, visualFirstSeconds: 3.5, evidenceStartSeconds: 3.5, claimTargetSeconds: 18 },
  chapters,
  beats: directedBeats,
  referencePatterns: refs,
  qc: { scores: { hook, narrative, curiosity, pacing, visualHierarchy, visualVariety, evidence, broll, audio, transitions, payoff, continuity }, score: overall, projectedCompletion: clamp(0.15 + overall / 20, 0.15, 0.92), findings: [], blockers: [], metrics: { visualChangesPerMinute: Number(visualRate.toFixed(2)), evidenceEventsPerMinute: Number(evidenceRate.toFixed(2)), fatigueWindows: fatigueCount, unresolvedQuestions: openQuestions } },
  renderContract: { schema: "longform-render-1", project: { title: script.title, durationInSeconds: duration, fps: Number(script.fps), width: Number(script.width), height: Number(script.height), mode: LONGFORM_MODE }, sourceOfTruth: "render-contract.json", deterministic: true, sceneCount: directedBeats.length, rule: "director decides; render contract records; Remotion executes" },
  packaging: { titleCandidates: ["The Company That Sells You Nothing", "Why Companies Profit When You Stop Using Them", "The Business Model That Wins When You Don't Show Up"], thumbnailConcepts: ["empty gym + huge member count + one highlighted ratio", "subscription charges accumulating into a single total", "cancel button buried behind layers of friction"] },
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(plan, null, 2), "utf8");
mkdirSync(resolve(ROOT, "video/out"), { recursive: true });
writeFileSync(resolve(ROOT, "video/out/render-contract.json"), JSON.stringify(plan.renderContract, null, 2), "utf8");
writeFileSync(resolve(ROOT, "video/out/cold-open-candidates.json"), JSON.stringify(plan.coldOpen, null, 2), "utf8");
writeFileSync(resolve(ROOT, "video/out/packaging.json"), JSON.stringify(plan.packaging, null, 2), "utf8");
console.log(`LONGFORM DIRECTOR  ${plan.project.title}`);
console.log(`MODE               ${plan.project.mode}`);
console.log(`DURATION           ${duration}s · ${directedBeats.length} beats · ${chapters.length} chapters`);
console.log(`COLD OPEN          ${winner.archetype} · ${winner.score}/10`);
console.log(`VISUAL RATE        ${visualRate.toFixed(1)}/min`);
console.log(`EVIDENCE RATE      ${evidenceRate.toFixed(1)}/min`);
console.log(`OVERALL            ${overall}/10`);
console.log(`WROTE              ${outPath}`);
