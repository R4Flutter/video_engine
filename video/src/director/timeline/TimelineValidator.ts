// TimelineValidator: the structural gate.
//
// QC is about whether a cut is good. This is about whether it is *coherent* —
// no overlaps, no negative durations, no cues outside the film, no frame-zero
// hold longer than beat one. The renderer is allowed to trust this pass.
import type { ShortPlan } from "../types.ts";

export type ValidationIssue = { at?: number; beat?: number; rule: string; message: string };

export const validateTimeline = (plan: ShortPlan): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const total = plan.project.durationInSeconds;
  const fps = plan.project.fps;

  let prevEnd = -1;
  for (const b of plan.beats) {
    if (!Number.isFinite(b.start) || !Number.isFinite(b.end)) {
      issues.push({ beat: b.n, rule: "invalid-timing", message: `beat ${b.n} has non-finite timing` });
      continue;
    }
    if (b.end <= b.start) {
      issues.push({ beat: b.n, rule: "negative-duration", message: `beat ${b.n} ends before it starts` });
    }
    if (b.start < prevEnd - 0.01) {
      issues.push({ beat: b.n, rule: "overlap", message: `beat ${b.n} overlaps the previous beat` });
    }
    if (b.start > prevEnd + 0.01 && prevEnd >= 0) {
      issues.push({
        beat: b.n,
        rule: "gap",
        message: `${(b.start - prevEnd).toFixed(2)}s gap before beat ${b.n} — it renders as nothing`,
      });
    }
    if (b.audioStart > b.start + 0.01 || b.audioStart < b.start - 1.5) {
      issues.push({ beat: b.n, rule: "jcut-range", message: `beat ${b.n} audio start ${b.audioStart} is out of range` });
    }
    prevEnd = b.end;
  }

  // The frame-zero hold cannot outlast the beat it belongs to.
  const first = plan.beats[0];
  if (first) {
    const holdSeconds = plan.frameZero.holdFrames / fps;
    if (holdSeconds > first.end - first.start) {
      issues.push({
        beat: first.n,
        rule: "hold-overruns-beat",
        message: `frame-zero hold (${holdSeconds.toFixed(2)}s) is longer than beat 1`,
      });
    }
  }

  const inRange = (t: number, what: string, beat?: number) => {
    if (!Number.isFinite(t) || t < -1.5 || t > total + 0.5) {
      issues.push({ at: t, beat, rule: "event-out-of-range", message: `${what} at ${t}s is outside the film` });
    }
  };
  for (const e of plan.attentionEvents) inRange(e.at, `attention ${e.type}`, e.beat);
  for (const e of plan.audioEvents) inRange(e.at, `audio ${e.kind} ${e.label ?? ""}`);

  for (const b of plan.beats) {
    for (const s of b.audio.silence) {
      if (s.dur <= 0) {
        issues.push({ beat: b.n, rule: "silence-duration", message: `beat ${b.n} has a non-positive silence window` });
      }
      if (s.at + s.dur > b.end + 0.3 || s.at < b.start - 0.3) {
        issues.push({ beat: b.n, rule: "silence-range", message: `beat ${b.n} silence ${s.kind} leaves the beat` });
      }
    }
    for (const cue of b.audio.sfx) {
      if (cue.at < b.start - 0.3 || cue.at > b.end + 0.3) {
        issues.push({ beat: b.n, rule: "sfx-range", message: `beat ${b.n} sfx at ${cue.at}s leaves the beat` });
      }
    }
  }

  for (const t of plan.transitions) {
    if (!plan.beats.some((b) => b.n === t.fromBeat) || !plan.beats.some((b) => b.n === t.toBeat)) {
      issues.push({ rule: "transition-ref", message: `transition ${t.fromBeat}→${t.toBeat} references a missing beat` });
    }
  }

  const last = plan.beats[plan.beats.length - 1];
  if (last && Math.abs(last.end - total) > 0.05) {
    issues.push({
      rule: "duration-mismatch",
      message: `last beat ends at ${last.end}s but the project is ${total}s`,
    });
  }

  return issues;
};
