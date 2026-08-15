// LoopQC: the ending, and the rewatch.
//
// A Short's last frame is not the end of the video — it is the frame before
// the first frame, because the player loops. That is free retention and most
// scripts throw it away by ending on a fade or on "follow for more".
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

export const runLoopQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding) => {
    findings.push(f);
    score -= f.level === "warn" ? 1.6 : 0.5;
  };

  const loop = plan.loop;
  const last = plan.beats[plan.beats.length - 1];

  if (!loop.closes) {
    flag({
      at: last?.start ?? -1,
      beat: last?.n,
      level: "warn",
      severity: "HIGH",
      rule: "open-loop-ending",
      message: `the ending never brings back "${loop.motif}"`,
      reason:
        "the hook planted that phrase and the ending ignores it, so the video stops rather than closing.",
      fix: "restate the hook's phrase or number in the final beat — the same words, in the new light.",
    });
  }

  if (!loop.seamless) {
    flag({
      at: last?.start ?? -1,
      beat: last?.n,
      level: "info",
      severity: "MED",
      rule: "no-seamless-loop",
      message: "the last frame does not flow into the first",
      reason:
        "the player loops. a final frame that rhymes with frame one buys a second view at no cost.",
      fix: "end on the hook's own image or phrase, or add a `Loop: true` row to the last beat.",
    });
  }

  // The final beat must not fade out. A fade tells the viewer to leave.
  if (last && last.motion.transitionIn.type !== "hold") {
    flag({
      at: last.start,
      beat: last.n,
      level: "info",
      severity: "LOW",
      rule: "final-beat-transition",
      message: `the final beat arrives on a "${last.motion.transitionIn.type}"`,
      reason: "the closing frame should settle, not cut — it has to sit still for the loop.",
      fix: "no action needed unless it reads as abrupt in the render.",
    });
  }

  // The music must not swell out at the end and then hard-cut to the hook.
  if (last && last.audio.musicMood === "swell") {
    flag({
      at: last.start,
      beat: last.n,
      level: "info",
      severity: "LOW",
      rule: "loud-loop-seam",
      message: "the bed is swelling into the final frame",
      reason: "the loop seam cuts a loud bed to the hook's bed, which is audible as a glitch.",
      fix: "add `Music: quiet` to the final beat.",
    });
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
