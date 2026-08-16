// The director's contract, asserted.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const { buildShortPlan } = await import(pathToFileURL(join(root, "video/src/director/plan.ts")).href);
const parse = (name) => {
  const out = join(tmpdir(), `director-test-${process.pid}-${name.replace(/\W/g, "")}.json`);
  execFileSync(process.execPath, [join(root, "tools/parse-script.mjs"), join(root, name), out]);
  return JSON.parse(readFileSync(out, "utf8"));
};
const script = parse("script.md");
const vox = parse("script_vox.md");

const synthetic = (overrides = {}) => ({
  title: "T", engine: "finance", fps: 30, width: 1080, height: 1920, durationInSeconds: 9,
  beats: [
    { n: 1, name: "HOOK", start: 0, end: 3, vo: "Four apps cost you fourteen hundred dollars.", visual: "A coin drops.", module: "coinDrop", text: "FOUR APPS. $1,440.", ...(overrides.beat1 ?? {}) },
    { n: 2, name: "MID", start: 3, end: 6, vo: "You tapped subscribe once and never looked again.", visual: "A chart line draws.", module: "investChart", text: "ONE TAP", ...(overrides.beat2 ?? {}) },
    { n: 3, name: "END", start: 6, end: 9, vo: "Four apps. Fourteen hundred dollars. Go find yours.", visual: "The jar is full.", module: "outro", text: "FOUR APPS. $1,440.", ...(overrides.beat3 ?? {}) },
  ],
  ...overrides.script,
});

// A pathological but schema-valid script: many story beats, one visual language.
const monotone = () => ({
  ...synthetic(), durationInSeconds: 30,
  beats: Array.from({ length: 6 }, (_, i) => ({
    n: i + 1, name: `B${i + 1}`, start: i * 5, end: i * 5 + 5,
    vo: i === 0 ? "Four apps cost fourteen hundred dollars." : "The story gets worse and the next thing happens.",
    visual: "Centered text remains on the same page.", module: "kinetic", text: i === 0 ? "FOUR APPS. $1,440." : "THE SAME PAGE",
    purpose: i === 0 ? "hook" : i === 5 ? "payoff" : "escalate", question: i < 5 ? "What happens next?" : "",
  })),
});

test("the same script always produces the same plan", () => assert.equal(JSON.stringify(buildShortPlan(script).plan), JSON.stringify(buildShortPlan(script).plan)));
test("an authored Hook row beats the on-screen text", () => assert.equal(buildShortPlan(synthetic({ beat1: { hook: "WRITTEN BY HAND", text: "INFERRED" } })).plan.frameZero.text, "WRITTEN BY HAND"));
test("with no Hook row the on-screen text is used", () => assert.equal(buildShortPlan(synthetic()).plan.frameZero.text, "FOUR APPS. $1,440."));
test("missing frame-one authorship can be FATAL", () => {
  const { qc, plan } = buildShortPlan(synthetic({ beat1: { text: "", vo: "So today I want to talk about something quite interesting about money and budgeting." } }));
  assert.equal(plan.frameZero.source, "narration");
  assert.ok(qc.findings.some((f) => f.severity === "FATAL" && f.rule === "unwritten-hook"));
});
test("the complete hook is held long enough", () => {
  const { plan } = buildShortPlan(script);
  assert.ok(plan.frameZero.holdFrames >= 8);
  assert.ok(plan.frameZero.holdFrames / plan.project.fps <= plan.beats[0].end - plan.beats[0].start);
});
test("beat one never moves the camera", () => {
  for (const s of [script, vox, synthetic()]) assert.equal(buildShortPlan(s).plan.beats[0].motion.camera.intent, "hold");
});
test("beat one reveals immediately", () => {
  for (const s of [script, vox]) assert.equal(buildShortPlan(s).plan.beats[0].visual.reveal, "IMMEDIATE");
});
test("retention stays in range and cannot grow", () => {
  const { plan } = buildShortPlan(script); let prev = 1;
  for (const s of plan.swipeCurve) { assert.ok(s.risk >= 0 && s.risk <= 1); assert.ok(s.retained >= 0 && s.retained <= 1); assert.ok(s.retained <= prev + 1e-9); prev = s.retained; }
});
test("a broken hook costs more retention than a broken middle", () => {
  const badHook = buildShortPlan(synthetic({ beat1: { text: "", vo: "So anyway I wanted to mention a thing about money today, roughly." } })).plan.projectedRetention;
  const badMiddle = buildShortPlan(synthetic({ beat2: { text: "", vo: "Um." } })).plan.projectedRetention;
  assert.ok(badHook < badMiddle);
});
test("shipped script timeline validates clean", () => assert.deepEqual(buildShortPlan(script).issues, []));
test("no module runs back to back after continuity pass", () => {
  const { plan } = buildShortPlan(script);
  for (let i = 1; i < plan.beats.length - 1; i++) assert.notEqual(plan.beats[i].visual.module, plan.beats[i - 1].visual.module);
});
test("captions are never trimmed below EMPHASIS where needed", () => {
  const { plan } = buildShortPlan(script);
  for (const [i, b] of plan.beats.entries()) if (i !== 0 && b.visual.module !== "kinetic" && b.visual.module !== "outro") assert.notEqual(b.visual.captionMode, "NONE");
});
test("every sfx cue names a file in the pack", async () => {
  const { SFX_PACK } = await import(pathToFileURL(join(root, "video/src/director/audio/SFXPlanner.ts")).href);
  const { plan } = buildShortPlan(script);
  for (const b of plan.beats) for (const cue of b.audio.sfx) for (const f of cue.files) assert.ok(SFX_PACK.includes(f));
});
test("the loop closes on the shipped script", () => {
  const { plan } = buildShortPlan(script);
  assert.ok(plan.loop.closes); assert.ok(plan.loop.motif);
});
test("both engines produce a plan", () => {
  for (const s of [script, vox]) { const { plan } = buildShortPlan(s); assert.ok(plan.beats.length > 0); assert.equal(plan.version, "short-1.0"); }
});
test("hand-written overlay beats heuristics", () => {
  const { plan } = buildShortPlan(script, { beats: { 2: { camera: "hold", emotion: "relief" } } });
  assert.equal(plan.beats.find((b) => b.n === 2).motion.camera.intent, "hold");
});

test("ADVERSARIAL: visually monotone six-beat edit is blocked", () => {
  const { qc } = buildShortPlan(monotone());
  assert.ok(qc.findings.some((f) => f.severity === "FATAL" && ["module-run", "module-dominance", "low-variety"].includes(f.rule)),
    "a one-module edit must never reach the renderer");
});
