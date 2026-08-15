// VisualQC: variety, competition and legibility on a small screen.
//
// A 9:16 frame is viewed at arm's length on a device the size of a hand. What
// reads as "rich" on a monitor reads as noise there, so the thresholds here
// are tighter than the essay engine's.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";
import { moduleRuns } from "../visual/VisualContinuity.ts";
import { MODULE_MOTION, CAMERA_MOTION, CAPTION_MOTION, MOTION_CEILING } from "../attention/NoveltyBudget.ts";

/** On-screen text past this cannot be read on a phone before the cut. */
const MAX_OVERLAY_CHARS = 42;

export const runVisualQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding) => {
    findings.push(f);
    score -= f.level === "warn" ? 1.2 : 0.4;
  };

  const beats = plan.beats;

  // 1. Back-to-back identical modules. In thirty seconds this reads as one
  //    long beat, and the swipe model charges for it.
  for (const run of moduleRuns(beats.map((b) => ({ n: b.n, module: b.visual.module })))) {
    if (run.beats.length >= 2) {
      flag({
        at: beats.find((b) => b.n === run.beats[0])?.start ?? 0,
        beat: run.beats[0],
        level: "warn",
        severity: "MED",
        rule: "module-run",
        message: `${run.beats.length}× "${run.module}" back to back (beats ${run.beats.join(", ")})`,
        reason: "the frame never re-languages, so two beats read as one.",
        fix: "restage one of them — change what the frame is made of, not just what it says.",
      });
    }
  }

  // 2. Domination.
  const counts: Record<string, number> = {};
  for (const b of beats) counts[b.visual.module] = (counts[b.visual.module] ?? 0) + 1;
  for (const [m, n] of Object.entries(counts)) {
    if (n / beats.length > 0.4) {
      flag({
        at: -1,
        level: "warn",
        severity: "MED",
        rule: "module-dominance",
        message: `"${m}" carries ${Math.round((n / beats.length) * 100)}% of the cut`,
        reason: "one visual language for the whole video is a template, and templates get scrolled past.",
        fix: "give two of those beats a different `Module:` row.",
      });
    }
  }

  // 3. Variety floor.
  const distinct = new Set(beats.map((b) => b.visual.module)).size;
  if (distinct < 3 && beats.length >= 5) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "low-variety",
      message: `only ${distinct} distinct modules across ${beats.length} beats`,
      reason: "novelty is the cheapest attention reset available and this cut isn't spending it.",
      fix: "vary the frame: a number, then a chart, then a mark on a photo.",
    });
  }

  // 4. Frame competition — the novelty budget, re-checked after all trims.
  for (const b of beats) {
    const load =
      (MODULE_MOTION[b.visual.module] ?? 0.5) +
      (CAMERA_MOTION[b.motion.camera.intent] ?? 0.3) +
      CAPTION_MOTION[b.visual.captionMode];
    if (load > MOTION_CEILING) {
      flag({
        at: b.start,
        beat: b.n,
        level: "info",
        severity: "MED",
        rule: "frame-competition",
        message: `"${b.visual.module}" + ${b.motion.camera.intent} camera + ${b.visual.captionMode} captions (load ${load.toFixed(2)})`,
        reason: "three things moving at once means none of them is read.",
        fix: "hold the camera or quiet the captions on this beat.",
      });
    }
  }

  // 5. Overlay legibility.
  for (const b of beats) {
    const text = b.typography.text;
    if (text.length > MAX_OVERLAY_CHARS) {
      flag({
        at: b.start,
        beat: b.n,
        level: "info",
        severity: "MED",
        rule: "overlay-too-long",
        message: `on-screen text is ${text.length} chars`,
        reason: `past ~${MAX_OVERLAY_CHARS} chars the type has to shrink, and small type on a phone is not read.`,
        fix: "cut it to the claim. the narration carries the qualifier.",
      });
    }
  }

  // 6. Every beat that states a number should show it. A spoken number the
  //    viewer cannot see is a number they cannot check, and checkability is
  //    what makes a finance claim credible.
  for (const b of beats) {
    const spokenNumber = /[$₹€£]\s?\d|\b\d[\d,]*(\.\d+)?%?\b/.test(b.name + " " + b.typography.text);
    if (b.narrative.purpose === "proof" && !spokenNumber && !b.typography.text) {
      flag({
        at: b.start,
        beat: b.n,
        level: "info",
        severity: "MED",
        rule: "unshown-number",
        message: "a proof beat with nothing on screen to check",
        reason: "a number that is only spoken is a number the viewer has to take on trust.",
        fix: "put the figure in `On-screen text` so it can be read and screenshotted.",
      });
    }
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
