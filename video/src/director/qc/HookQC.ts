// HookQC: the first three seconds, checked as hard as everything else put
// together — because they matter more than everything else put together.
//
// Every rule here maps to a specific way a Short dies in the feed. They are
// counting rules with thresholds, not taste. The FATAL ones mean: do not
// render this, you will waste the upload slot.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";
import { DEAD_OPENERS } from "../attention/HookEngine.ts";

export const runHookQC = (
  plan: ShortPlan,
  firstVo: string,
): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding) => {
    findings.push(f);
    score -= f.severity === "FATAL" ? 4 : f.level === "warn" ? 1.4 : 0.4;
  };

  const fz = plan.frameZero;
  const first = plan.beats[0];

  // 1. Frame zero must have ink on it, and that ink must have been *written*.
  //    This is the bug that killed the last upload: a blank page while the
  //    hook typed itself in underneath.
  if (!fz.text.trim()) {
    flag({
      at: 0,
      level: "warn",
      severity: "FATAL",
      rule: "blank-frame-zero",
      message: "frame one has no on-screen text",
      reason:
        "a thumb decides in roughly 0.4s. an empty frame is judged as an empty video, and no title or tag can recover it.",
      fix: "add a `Hook:` or `On-screen text` row to beat 1 carrying the complete claim.",
    });
  } else if (fz.source === "narration") {
    // The director fell back to the opening sentence. That keeps the render
    // from being blank, but a spoken sentence is not a designed frame — and
    // when it is too long to read, the fallback is worse than nothing because
    // it looks like a decision somebody made.
    flag({
      at: 0,
      level: "warn",
      severity: fz.glanceable ? "HIGH" : "FATAL",
      rule: "unwritten-hook",
      message: `frame one is falling back to the first spoken sentence (${fz.chars} chars)`,
      reason:
        "nobody wrote a frame-one line, so the most important frame in the video is whatever the narration happened to start with.",
      fix: "add a `Hook:` row to beat 1 with the complete claim in six words or fewer.",
    });
  }

  // 2. The complete hook must be held still long enough to read.
  if (fz.text.trim() && fz.holdFrames < 8) {
    flag({
      at: 0,
      level: "warn",
      severity: "HIGH",
      rule: "hook-not-held",
      message: `the complete hook is held for only ${fz.holdFrames} frames`,
      reason: "text that is still assembling cannot be read, so the beat is spent without landing.",
      fix: "lengthen beat 1, or shorten the hook so it can be read faster.",
    });
  }

  // 3. Glanceability. Past roughly six words the hook is a paragraph.
  if (fz.text.trim() && !fz.glanceable) {
    flag({
      at: 0,
      level: "warn",
      severity: "HIGH",
      rule: "hook-too-long",
      message: `hook is ${fz.words} words / ${fz.chars} chars`,
      reason: "past ~6 words / ~30 chars it cannot be taken in at a glance at Shorts type size.",
      fix: "cut it to the claim. the setup belongs in beat 2.",
    });
  }

  // 4. Hook sync — the strongest signal available, and free.
  if (!fz.audioSynced) {
    flag({
      at: 0,
      level: "warn",
      severity: "HIGH",
      rule: "hook-desync",
      message: "on-screen hook and the first spoken line are different claims",
      reason:
        "when the viewer reads and hears the same words, the claim lands twice in the same half second. when they differ, both compete.",
      fix: "make beat 1's `On-screen text` a word-for-word subset of its `Audio` row.",
    });
  }

  // 5. The claim has to be complete early.
  if (fz.timeToClaim > 3) {
    flag({
      at: 0,
      level: "warn",
      severity: "HIGH",
      rule: "late-claim",
      message: `the claim is not complete until ${fz.timeToClaim.toFixed(1)}s`,
      reason: "most of the audience that will leave has already left by 3s.",
      fix: "lead with the contradiction. move the qualifier after it.",
    });
  }

  // 6. Dead openers.
  const opener = DEAD_OPENERS.exec(firstVo.trim());
  if (opener) {
    flag({
      at: 0,
      level: "warn",
      severity: "HIGH",
      rule: "dead-opener",
      message: `narration opens on "${opener[1]}"`,
      reason: "a greeting or a framing phrase carries no information and signals that this will take a while.",
      fix: "delete it. start on the claim.",
    });
  }

  // 7. Hook lever — named so a channel doesn't pull the same one every time.
  if (fz.hookType === "unknown") {
    flag({
      at: 0,
      level: "info",
      severity: "MED",
      rule: "unclassified-hook",
      message: "the hook does not use a recognisable lever",
      reason:
        "contradiction, specificity, negative urgency, curiosity gap and recognition are the levers that reliably stop a scroll. a hook using none of them is usually a topic sentence.",
      fix: "state what the viewer believes and then deny it, or lead with a checkable number.",
    });
  }

  // 8. Beat one must not move.
  if (first && first.motion.camera.intent !== "hold") {
    flag({
      at: 0,
      beat: first.n,
      level: "info",
      severity: "MED",
      rule: "hook-camera-move",
      message: `beat 1 camera is "${first.motion.camera.intent}"`,
      reason: "a moving camera competes with reading the one line the whole video depends on.",
      fix: "set `Camera: hold` on beat 1.",
    });
  }

  // 9. Beat one length. Under ~1.8s the hook cannot be read and heard; past
  //    ~5s the video has made one point in a sixth of its runtime.
  if (first) {
    const dur = first.end - first.start;
    if (dur < 1.8) {
      flag({
        at: 0,
        beat: first.n,
        level: "info",
        severity: "MED",
        rule: "hook-too-short",
        message: `beat 1 runs ${dur.toFixed(1)}s`,
        reason: "there is not enough time to read the hook and hear it.",
        fix: "give beat 1 at least 2s.",
      });
    } else if (dur > 5) {
      flag({
        at: 0,
        beat: first.n,
        level: "info",
        severity: "LOW",
        rule: "hook-too-long-beat",
        message: `beat 1 runs ${dur.toFixed(1)}s on one claim`,
        reason: "the hook has landed by 3s; the rest is the viewer waiting.",
        fix: "cut beat 1 and let beat 2 arrive sooner.",
      });
    }
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
