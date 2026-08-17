// The director's contract, asserted.
//
//   node --experimental-strip-types --test tools/tests/director.test.mjs
//
// These are the invariants the whole system leans on. If one of them breaks,
// something downstream is quietly wrong in a way a render will not reveal —
// which is exactly the class of bug that shipped a blank first frame.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

const { buildLongFormPlan } = await import(
  pathToFileURL(join(root, "video/src/director/plan.ts")).href
);

const parse = (name) => {
  const out = join(tmpdir(), `director-test-${process.pid}-${name.replace(/\W/g, "")}.json`);
  execFileSync(process.execPath, [join(root, "tools/parse-script.mjs"), join(root, name), out]);
  return JSON.parse(readFileSync(out, "utf8"));
};

// Long-form fixture: the shipped episode's parseable source. script.md is the
// raw documentary text (no BEAT blocks); script_beats.md is the source of truth
// since the beat regeneration. script_vox.md was removed in the product cleanup.
const script = parse("script_beats.md");

// A minimal script built in memory, so a test can break one thing at a time
// without a fixture file drifting away from what it was written to prove.
const synthetic = (overrides = {}) => ({
  title: "T",
  engine: "finance",
  fps: 30,
  width: 1080,
  height: 1920,
  durationInSeconds: 9,
  beats: [
    {
      n: 1,
      name: "HOOK",
      start: 0,
      end: 3,
      vo: "Four apps cost you fourteen hundred dollars.",
      visual: "A coin drops.",
      module: "coinDrop",
      text: "FOUR APPS. $1,440.",
      ...(overrides.beat1 ?? {}),
    },
    {
      n: 2,
      name: "MID",
      start: 3,
      end: 6,
      vo: "You tapped subscribe once and never looked again.",
      visual: "A chart line draws.",
      module: "investChart",
      text: "ONE TAP",
      ...(overrides.beat2 ?? {}),
    },
    {
      n: 3,
      name: "END",
      start: 6,
      end: 9,
      vo: "Four apps. Fourteen hundred dollars. Go find yours.",
      visual: "The jar is full.",
      module: "outro",
      text: "FOUR APPS. $1,440.",
      ...(overrides.beat3 ?? {}),
    },
  ],
  ...overrides.script,
});

// ---------------------------------------------------------------- determinism
test("the same script always produces the same plan", () => {
  const a = buildLongFormPlan(script).plan;
  const b = buildLongFormPlan(script).plan;
  assert.equal(
    JSON.stringify(a),
    JSON.stringify(b),
    "the director used a non-deterministic source — a plan you cannot reproduce is one you cannot debug",
  );
});

// ---------------------------------------------------------------- frame zero
test("an authored Hook row beats the on-screen text", () => {
  const s = synthetic({ beat1: { hook: "WRITTEN BY HAND", text: "INFERRED" } });
  const { plan } = buildLongFormPlan(s);
  assert.equal(plan.frameZero.text, "WRITTEN BY HAND");
  assert.equal(plan.frameZero.source, "hook");
});

test("with no Hook row the on-screen text is used, and recorded as such", () => {
  const { plan } = buildLongFormPlan(synthetic());
  assert.equal(plan.frameZero.text, "FOUR APPS. $1,440.");
  assert.equal(plan.frameZero.source, "text");
});

test("with neither, the fallback is flagged FATAL rather than silently accepted", () => {
  const s = synthetic({
    beat1: {
      text: "",
      vo: "So today I want to talk about something quite interesting about money and budgeting.",
    },
  });
  const { qc, plan } = buildLongFormPlan(s);
  assert.equal(plan.frameZero.source, "narration");
  assert.ok(
    qc.findings.some((f) => f.severity === "FATAL" && f.rule === "unwritten-hook"),
    "an unwritten hook that is too long to read must block the render",
  );
});

test("the complete hook is always held long enough to be read", () => {
  const { plan } = buildLongFormPlan(script);
  assert.ok(plan.frameZero.holdFrames >= 8, "under ~0.27s the hook cannot be read");
  const first = plan.beats[0];
  assert.ok(
    plan.frameZero.holdFrames / plan.project.fps <= first.end - first.start,
    "the hold may never outlast the beat it belongs to",
  );
});

test("beat one never moves the camera", () => {
  for (const s of [script, synthetic()]) {
    const { plan } = buildLongFormPlan(s);
    assert.equal(
      plan.beats[0].motion.camera.intent,
      "hold",
      "a moving camera competes with reading the one line the video depends on",
    );
  }
});

test("beat one reveals immediately — no progressive staging on the hook (Shorts path)", () => {
  const { plan } = buildLongFormPlan(synthetic());
  assert.equal(plan.beats[0].visual.reveal, "IMMEDIATE");
});

// ---------------------------------------------------------------- swipe model
test("the long-form plan carries no swipe curve — Shorts retention never enters the artifact", () => {
  const { plan } = buildLongFormPlan(script);
  assert.deepEqual(plan.swipeCurve, [], "long-form must not estimate swipe retention");
});

test("the retention curve only ever falls, and stays in range (Shorts path)", () => {
  const { plan } = buildLongFormPlan(synthetic());
  let prev = 1;
  for (const s of plan.swipeCurve) {
    assert.ok(s.risk >= 0 && s.risk <= 1, `risk ${s.risk} out of range on beat ${s.beat}`);
    assert.ok(s.retained >= 0 && s.retained <= 1, `retained ${s.retained} out of range`);
    assert.ok(s.retained <= prev + 1e-9, "an audience cannot grow mid-video");
    prev = s.retained;
  }
});

test("a broken hook costs more retention than a broken middle", () => {
  const badHook = buildLongFormPlan(
    synthetic({ beat1: { text: "", vo: "So anyway I wanted to mention a thing about money today, roughly." } }),
  ).plan.projectedRetention;
  const badMiddle = buildLongFormPlan(
    synthetic({ beat2: { text: "", vo: "Um." } }),
  ).plan.projectedRetention;
  assert.ok(
    badHook < badMiddle,
    "the model must weight beat one above everything else, or it is not a Shorts model",
  );
});

// ---------------------------------------------------------------- structure
test("the shipped script's timeline validates clean", () => {
  const { issues } = buildLongFormPlan(script);
  assert.deepEqual(issues, [], `timeline issues: ${issues.map((i) => i.message).join("; ")}`);
});

test("no Short module runs back to back after the continuity pass (Shorts path)", () => {
  // Long-form allows measured repeats by design (VisualContinuity caps them);
  // the adjacency ban is a Shorts feed contract.
  const { plan } = buildLongFormPlan(synthetic());
  for (let i = 1; i < plan.beats.length - 1; i++) {
    assert.notEqual(
      plan.beats[i].visual.module,
      plan.beats[i - 1].visual.module,
      `beats ${plan.beats[i - 1].n}/${plan.beats[i].n} share a module`,
    );
  }
});

test("captions are never trimmed below EMPHASIS on a module that needs them", () => {
  const { plan } = buildLongFormPlan(script);
  for (const [i, b] of plan.beats.entries()) {
    // Three legitimate exemptions. Beat one's text is the frame-zero card, so
    // captioning it would print the same line twice. kinetic prints the
    // narration as the frame for the same reason. The outro is a held card.
    // Everything else must keep words on screen, because a large share of the
    // feed is watched muted.
    if (i === 0 || b.visual.module === "kinetic" || b.visual.module === "outro") continue;
    assert.notEqual(
      b.visual.captionMode,
      "NONE",
      `beat ${b.n} (${b.visual.module}) lost its captions to the motion budget`,
    );
  }
});

test("every sfx cue names a file that exists in the pack", async () => {
  const { SFX_PACK } = await import(
    pathToFileURL(join(root, "video/src/director/audio/SFXPlanner.ts")).href
  );
  const { plan } = buildLongFormPlan(script);
  for (const b of plan.beats) {
    for (const cue of b.audio.sfx) {
      for (const f of cue.files) {
        assert.ok(SFX_PACK.includes(f), `beat ${b.n} schedules missing asset ${f}`);
      }
    }
  }
});

test("the loop motif is planted on the shipped long-form script", () => {
  const { plan } = buildLongFormPlan(script);
  assert.ok(plan.loop.motif, "the hook must plant something recognisable");
  // Closure for documentaries is QC-gated, not asserted here: an unclosed
  // motif is a HIGH finding (longform-open-motif) that the autofix pass closes.
});

test("both long-form and short-form inputs produce a plan without throwing", () => {
  for (const s of [script, synthetic()]) {
    const { plan } = buildLongFormPlan(s);
    assert.ok(plan.beats.length > 0);
    assert.equal(plan.version, "short-1.0");
  }
});

// ---------------------------------------------------------------- overlay
test("a hand-written overlay note beats every heuristic", () => {
  const { plan } = buildLongFormPlan(script, {
    beats: { 2: { camera: "hold", emotion: "relief" } },
  });
  const b2 = plan.beats.find((b) => b.n === 2);
  assert.equal(b2.motion.camera.intent, "hold");
});
