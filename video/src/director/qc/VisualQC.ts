// VisualQC: judges the visual edit as an editor would, not just as an animation.
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
    score -= f.level === "warn" ? 1.2 : 0.4;
  };
  const beats = plan.beats;

  // 1. Back-to-back identical modules.
  for (const run of moduleRuns(beats.map((b) => ({ n: b.n, module: b.visual.module })))) {
    if (run.beats.length >= 2) {
      flag({ at: beats.find((b) => b.n === run.beats[0])?.start ?? 0, beat: run.beats[0], level: "warn", severity: "MED", rule: "module-run", message: `${run.beats.length}× "${run.module}" back to back (beats ${run.beats.join(", ")})`, reason: "the frame never re-languages, so two beats read as one.", fix: "change what the frame is made of, not just what it says." });
    }
  }

  // 2. Module domination.
  const counts: Record<string, number> = {};
  for (const b of beats) counts[b.visual.module] = (counts[b.visual.module] ?? 0) + 1;
  for (const [m, n] of Object.entries(counts)) {
    if (n / beats.length > 0.4) {
      flag({ at: -1, level: "warn", severity: "MED", rule: "module-dominance", message: `"${m}" carries ${Math.round((n / beats.length) * 100)}% of the cut`, reason: "one visual language for the whole video becomes a template.", fix: "vary the visual source, not merely the wording." });
    }
  }

  // 3. Asset diversity: professional documentary edits change the evidence
  // language as well as the animation language.
  const assets = beats.map((b) => b.shot?.asset).filter(Boolean);
  if (assets.length >= 5) {
    const distinctAssets = new Set(assets).size;
    if (distinctAssets < 3) {
      flag({ at: -1, level: "warn", severity: "MED", rule: "asset-variety", message: `only ${distinctAssets} asset types across ${assets.length} planned shots`, reason: "a video can have many modules and still feel like one template if the underlying evidence never changes.", fix: "mix footage/photo, documents, charts, comparison and typography where the story permits." });
    }
  }

  // 4. Composition rhythm. Repeating the same side of the frame creates a
  // subconscious static feeling even when the camera is moving.
  let sideRuns = 0;
  let lastComposition = "";
  for (const b of beats) {
    const c = b.shot?.composition ?? "center";
    if ((c === "left_focus" || c === "right_focus") && c === lastComposition) sideRuns += 1;
    else if (c === "left_focus" || c === "right_focus") sideRuns = 0;
    lastComposition = c;
  }
  if (sideRuns >= 3) {
    flag({ at: -1, level: "info", severity: "LOW", rule: "composition-run", message: "the same side-of-frame composition repeats too long", reason: "professional edits subtly reposition attention to refresh the eye.", fix: "alternate left/right focus or return to a deliberate center frame on a reveal." });
  }

  // 5. Motion budget.
  for (const b of beats) {
    const load = (MODULE_MOTION[b.visual.module] ?? 0.5) + (CAMERA_MOTION[b.motion.camera.intent] ?? 0.3) + CAPTION_MOTION[b.visual.captionMode];
    if (load > MOTION_CEILING) {
      flag({ at: b.start, beat: b.n, level: "info", severity: "MED", rule: "frame-competition", message: `"${b.visual.module}" + ${b.motion.camera.intent} camera + ${b.visual.captionMode} captions (load ${load.toFixed(2)})`, reason: "three things moving at once means none of them is read.", fix: "hold the camera or quiet the captions." });
    }
  }

  // 6. Overlay legibility.
  for (const b of beats) {
    const text = b.typography.text;
    if (text.length > MAX_OVERLAY_CHARS) {
      flag({ at: b.start, beat: b.n, level: "info", severity: "MED", rule: "overlay-too-long", message: `on-screen text is ${text.length} chars`, reason: `past ~${MAX_OVERLAY_CHARS} chars the type has to shrink on a phone.`, fix: "cut it to the claim; the narration carries the qualifier." });
    }
    const capWords = text.trim().split(/\s+/).filter(Boolean).length;
    const maxWords = b.shot?.maxCaptionWords ?? 14;
    if (capWords > maxWords && b.visual.captionMode !== "NONE") {
      flag({ at: b.start, beat: b.n, level: "info", severity: "LOW", rule: "caption-density", message: `${capWords} words exceeds the shot's ${maxWords}-word reading budget`, reason: "the shot already carries a visual argument; text must remain glanceable.", fix: "emphasize the essential phrase and leave the rest to narration." });
    }
  }

  // 7. Proof must be visible.
  for (const b of beats) {
    const spokenNumber = /[$₹€£]\s?\d|\b\d[\d,]*(\.\d+)?%?\b/.test(b.name + " " + b.typography.text);
    if (b.narrative.purpose === "proof" && !spokenNumber && !b.typography.text) {
      flag({ at: b.start, beat: b.n, level: "info", severity: "MED", rule: "unshown-number", message: "a proof beat with nothing on screen to check", reason: "checkability is central to finance credibility.", fix: "put the figure in On-screen text or route the beat to a document/chart shot." });
    }
  }

  // 8. Expensive assets are capped. This is an explicit 16 GB CPU guardrail.
  const mediumCost = beats.filter((b) => b.shot?.cpuCost === "medium").length;
  if (mediumCost > Math.ceil(beats.length * 0.65)) {
    flag({ at: -1, level: "warn", severity: "MED", rule: "cpu-asset-budget", message: `${mediumCost}/${beats.length} shots request medium-cost assets`, reason: "too many video/photo composites increase decode and memory pressure on CPU-only hardware.", fix: "reserve real footage for the beats where it changes understanding; use SVG/data graphics elsewhere." });
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
