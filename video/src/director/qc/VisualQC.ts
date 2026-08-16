// VisualQC: variety, competition and legibility on a small screen.
// A render must not merely be structurally valid; it must contain enough
// independent visual changes to be a real edit.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";
import { moduleRuns } from "../visual/VisualContinuity.ts";
import { MODULE_MOTION, CAMERA_MOTION, CAPTION_MOTION, MOTION_CEILING } from "../attention/NoveltyBudget.ts";

const MAX_OVERLAY_CHARS = 42;

export const runVisualQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding) => {
    findings.push(f);
    score -= f.severity === "FATAL" ? 5 : f.level === "warn" ? 1.2 : 0.4;
  };

  const beats = plan.beats;
  if (!beats.length) {
    flag({ at: 0, level: "warn", severity: "FATAL", rule: "no-beats", message: "the plan contains no visual beats", reason: "there is nothing to edit or evaluate.", fix: "provide at least one substantive beat." });
    return { findings, score: 0 };
  }

  // 1. Back-to-back identical modules. One isolated repeat can be intentional;
  //    a run of two is suspicious, and a run covering most of the cut is fatal.
  for (const run of moduleRuns(beats.map((b) => ({ n: b.n, module: b.visual.module })))) {
    if (run.beats.length >= 2) {
      const share = run.beats.length / beats.length;
      flag({
        at: beats.find((b) => b.n === run.beats[0])?.start ?? 0,
        beat: run.beats[0],
        level: "warn",
        severity: share >= 0.5 ? "FATAL" : "MED",
        rule: "module-run",
        message: `${run.beats.length}× "${run.module}" back to back (beats ${run.beats.join(", ")})`,
        reason: share >= 0.5 ? "at least half of the edit uses one visual language; changing copy is not a visual edit." : "the frame does not re-language between beats.",
        fix: "restage at least one beat with a genuinely different visual module.",
      });
    }
  }

  // 2. Domination. A single visual language over half the cut is a hard stop.
  const counts: Record<string, number> = {};
  for (const b of beats) counts[b.visual.module] = (counts[b.visual.module] ?? 0) + 1;
  for (const [m, n] of Object.entries(counts)) {
    const share = n / beats.length;
    if (share > 0.4) {
      flag({
        at: -1,
        level: "warn",
        severity: share > 0.5 ? "FATAL" : "MED",
        rule: "module-dominance",
        message: `"${m}" carries ${Math.round(share * 100)}% of the cut`,
        reason: share > 0.5 ? "one visual language dominates the majority of the video." : "one visual language is becoming a template.",
        fix: "give multiple beats a different Module row and verify the rendered frames are actually different.",
      });
    }
  }

  // 3. Variety floor. Five or more beats need at least three visual languages.
  const distinct = new Set(beats.map((b) => b.visual.module)).size;
  if (distinct < 3 && beats.length >= 5) {
    flag({
      at: -1, level: "warn", severity: "FATAL", rule: "low-variety",
      message: `only ${distinct} distinct modules across ${beats.length} beats`,
      reason: "the timeline is structurally segmented but visually repetitive.",
      fix: "use at least three independent visual languages across the edit.",
    });
  }

  // 4. Camera diversity. A long cut with one camera intent is another easy bypass.
  const cameras = new Set(beats.map((b) => b.motion.camera.intent));
  if (beats.length >= 6 && cameras.size < 2) {
    flag({ at: -1, level: "warn", severity: "HIGH", rule: "camera-monotony", message: "one camera intent is used across the entire cut", reason: "changing only text while the framing never changes is not meaningful motion variety.", fix: "use at least two camera intents where the story warrants it." });
  }

  // 5. Frame competition — re-checked after all trims.
  for (const b of beats) {
    const load = (MODULE_MOTION[b.visual.module] ?? 0.5) + (CAMERA_MOTION[b.motion.camera.intent] ?? 0.3) + CAPTION_MOTION[b.visual.captionMode];
    if (load > MOTION_CEILING) {
      flag({ at: b.start, beat: b.n, level: "info", severity: "MED", rule: "frame-competition", message: `"${b.visual.module}" + ${b.motion.camera.intent} camera + ${b.visual.captionMode} captions (load ${load.toFixed(2)})`, reason: "three things moving at once means none of them is read.", fix: "hold the camera or quiet the captions on this beat." });
    }
  }

  // 6. Overlay legibility.
  for (const b of beats) {
    const text = b.typography.text;
    if (text.length > MAX_OVERLAY_CHARS) {
      flag({ at: b.start, beat: b.n, level: "info", severity: "MED", rule: "overlay-too-long", message: `on-screen text is ${text.length} chars`, reason: `past ~${MAX_OVERLAY_CHARS} chars the type has to shrink on a phone.`, fix: "cut it to the claim; narration carries the qualifier." });
    }
  }

  // 7. Proof claims should have visible evidence.
  for (const b of beats) {
    const spokenNumber = /[$₹€£]\s?\d|\b\d[\d,]*(\.\d+)?%?\b/.test(b.name + " " + b.typography.text);
    if (b.narrative.purpose === "proof" && !spokenNumber && !b.typography.text) {
      flag({ at: b.start, beat: b.n, level: "info", severity: "MED", rule: "unshown-number", message: "a proof beat with nothing on screen to check", reason: "a claim that is only spoken is harder to verify.", fix: "put the figure in On-screen text." });
    }
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
