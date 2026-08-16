import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const { runLongFormQC } = await import(
  pathToFileURL(join(root, "video/src/director/qc/LongFormQC.ts")).href
);

const syntheticPlan = (duration = 120) => ({
  version: "short-1.0",
  project: {
    title: "Company Sells Nothing",
    durationInSeconds: duration,
    fps: 30,
    width: 1080,
    height: 1920,
    engine: "finance",
    mode: "SHORT",
  },
  frameZero: { text: "20.8 MILLION MEMBERS", source: "hook", words: 3, chars: 20, holdFrames: 16, size: "max", glanceable: true, audioSynced: true, hookType: "specificity", timeToClaim: 6 },
  loop: { motif: "20.8", openedAtBeat: 1, closedAtBeat: 4, closes: true, seamless: false },
  sequences: [
    { id: "a", purpose: "hook", beatRange: [1, 2], start: 0, end: 60, openQuestion: "Why?", answer: "Mechanism", emotion: "curiosity" },
    { id: "b", purpose: "explain", beatRange: [3, 4], start: 60, end: duration, openQuestion: "How?", answer: "System", emotion: "clarity" },
  ],
  beats: [
    { n: 1, name: "HOOK", start: 0, end: 20, audioStart: 0, narrative: { purpose: "hook", question: "Why is the gym empty?", reveal: "20.8M" }, attention: {}, visual: { purpose: "CLAIM", module: "footage", reveal: "IMMEDIATE", captionMode: "EMPHASIS", holdFrames: 16 }, motion: { camera: { intent: "hold" }, reveal: { mode: "IMMEDIATE", holdUntil: 16, triggers: [] }, transitionIn: { type: "hold", reason: "IMPACT", frames: 1 } }, typography: { text: "20.8 MILLION MEMBERS", emphasisWords: ["20.8"] }, audio: { musicLevel: 0.25, musicMood: "quiet", sfx: [], silence: [] }, sequenceId: "a" },
    { n: 2, name: "PROOF", start: 20, end: 60, audioStart: 20, narrative: { purpose: "proof", question: "What does that imply?", reveal: "2,896 clubs" }, attention: {}, visual: { purpose: "PROVE", module: "stat", reveal: "COUNTER_REVEAL", captionMode: "EMPHASIS", holdFrames: 0 }, motion: { camera: { intent: "settle" }, reveal: { mode: "COUNTER_REVEAL", holdUntil: 0, triggers: [] }, transitionIn: { type: "cut", reason: "NEW_IDEA", frames: 4 } }, typography: { text: "2,896 CLUBS", emphasisWords: ["2,896"] }, audio: { musicLevel: 0.2, musicMood: "hold", sfx: [], silence: [] }, sequenceId: "a" },
    { n: 3, name: "MECHANISM", start: 60, end: 90, audioStart: 60, narrative: { purpose: "explain", question: "Why does the model work?", reveal: "breakage" }, attention: {}, visual: { purpose: "EXPLAIN", module: "compare", reveal: "SEQUENTIAL", captionMode: "EMPHASIS", holdFrames: 0 }, motion: { camera: { intent: "hold" }, reveal: { mode: "SEQUENTIAL", holdUntil: 0, triggers: [] }, transitionIn: { type: "cut", reason: "NEW_IDEA", frames: 4 } }, typography: { text: "THE MECHANISM", emphasisWords: ["MECHANISM"] }, audio: { musicLevel: 0.18, musicMood: "hold", sfx: [], silence: [] }, sequenceId: "b" },
    { n: 4, name: "PAYOFF", start: 90, end: duration, audioStart: 90, narrative: { purpose: "payoff", reveal: "The system" }, attention: {}, visual: { purpose: "CLOSE", module: "payoff", reveal: "IMMEDIATE", captionMode: "EMPHASIS", holdFrames: 0 }, motion: { camera: { intent: "hold" }, reveal: { mode: "IMMEDIATE", holdUntil: 0, triggers: [] }, transitionIn: { type: "hold", reason: "LOOP_CLOSE", frames: 1 } }, typography: { text: "THE CHOICE", emphasisWords: ["CHOICE"] }, audio: { musicLevel: 0.15, musicMood: "quiet", sfx: [], silence: [] }, sequenceId: "b" },
  ],
  attentionEvents: [
    { at: 0.8, type: "TEXT_CHANGE", beat: 1, strength: 1, label: "20.8M" },
    { at: 4, type: "NUMBER_REVEAL", beat: 1, strength: 1, label: "2,896" },
    { at: 10, type: "CONTRADICTION", beat: 1, strength: 1, label: "empty gym" },
    { at: 21, type: "REVEAL", beat: 2, strength: 1, label: "clubs" },
    { at: 61, type: "QUESTION", beat: 3, strength: 0.8, label: "why" },
    { at: 91, type: "PAYOFF", beat: 4, strength: 1, label: "choice" },
  ],
  audioEvents: [
    { at: 0, kind: "music_level", value: 0.25 },
    { at: 60, kind: "music_level", value: 0.18 },
    { at: 90, kind: "music_level", value: 0.15 },
  ],
  transitions: [],
  swipeCurve: [],
  projectedRetention: 0.5,
});

const curiosity = { openLoop: [true, true, true, true], opened: [0, 2], closed: [1, 3], unresolved: [], longestFlatRun: null };

test("long-form QC returns all six dimensions", () => {
  const report = runLongFormQC(syntheticPlan(120), curiosity, "Twenty point eight million members.");
  for (const key of ["hook", "pacing", "curiosity", "visualVariety", "audio", "loop"]) assert.ok(Object.hasOwn(report.scores, key));
  assert.ok(report.projectedRetention >= 0 && report.projectedRetention <= 90);
});

test("long-form QC does not emit Shorts swipe/dead-frame rules", () => {
  const report = runLongFormQC(syntheticPlan(1154), curiosity, "Twenty point eight million members.");
  const badRules = report.findings.filter((f) => /swipe|dead-frame|slow-cut|long-short/i.test(f.rule + " " + f.message));
  assert.deepEqual(badRules, []);
});

test("the long-form gate rejects a plan that is not actually long-form", () => {
  const report = runLongFormQC(syntheticPlan(90), curiosity, "Twenty point eight million members.");
  assert.ok(report.findings.some((f) => f.rule === "longform-gate-misroute" && f.severity === "FATAL"));
});
