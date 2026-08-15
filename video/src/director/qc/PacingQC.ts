// PacingQC: where the cut goes quiet.
//
// The swipe model already produced a per-beat risk. This turns the worst
// entries into findings an author can act on, and adds the structural pacing
// rules the model does not express directly: dead frames, overlong beats,
// read speed, and the shape of the runtime itself.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

/** A beat that leaks more than this deserves a named finding. */
const RISK_WARN = 0.14;
const RISK_INFO = 0.09;

/** Seconds of screen time with nothing changing before it reads as frozen. */
const DEAD_FRAME = 2.6;

export const runPacingQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding) => {
    findings.push(f);
    score -= f.level === "warn" ? 1.2 : 0.4;
  };

  const dur = plan.project.durationInSeconds;

  // 1. The leakiest beats, named with the reason the model charged them.
  for (const s of plan.swipeCurve) {
    if (s.risk < RISK_INFO) continue;
    // Beat one always carries the highest baseline risk in any Short; the
    // hook rules already judge it, so don't double-report it here.
    if (s.beat === plan.beats[0]?.n) continue;
    flag({
      at: s.at,
      beat: s.beat,
      level: s.risk >= RISK_WARN ? "warn" : "info",
      severity: s.risk >= RISK_WARN ? "HIGH" : "MED",
      rule: "swipe-risk",
      message: `beat ${s.beat} leaks ~${Math.round(s.risk * 100)}% of the audience still watching`,
      reason: s.drivers.length ? s.drivers.join("; ") : "baseline attrition for this point in the video",
      fix: "shorten it, put a number on screen, or open a question it doesn't answer.",
    });
  }

  // 2. Dead frames: stretches with no attention event at all.
  const times = [0, ...plan.attentionEvents.map((e) => e.at), dur];
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1];
    if (gap > DEAD_FRAME) {
      flag({
        at: times[i - 1],
        level: "warn",
        severity: "HIGH",
        rule: "dead-frame",
        message: `${gap.toFixed(1)}s with nothing changing on screen`,
        reason: "a static frame past ~2.5s in a Short reads as a stall, and a stall reads as over.",
        fix: "add a `Motion FX` mark, a staged reveal, or cut the beat shorter.",
      });
    }
  }

  // 3. Overlong beats without staged reveals.
  for (const b of plan.beats) {
    const len = b.end - b.start;
    if (len > 6 && b.motion.reveal.triggers.length === 0) {
      flag({
        at: b.start,
        beat: b.n,
        level: "warn",
        severity: "HIGH",
        rule: "unstaged-long-beat",
        message: `${len.toFixed(1)}s on "${b.visual.module}" with nothing staged inside it`,
        reason: "one idea held for six seconds is five seconds of the viewer waiting to be surprised.",
        fix: "split the beat, or give it a `Reveal:` row so the director stages a turn inside it.",
      });
    }
  }

  // 4. Runtime. Under 15s there is no room to earn a payoff; past ~50s a
  //    finance explainer is fighting the format rather than using it.
  if (dur < 15) {
    flag({
      at: -1,
      level: "info",
      severity: "LOW",
      rule: "very-short",
      message: `${dur.toFixed(0)}s total`,
      reason: "loops well, but there is little room to build a payoff worth staying for.",
      fix: "fine if the single idea is strong; otherwise add a proof beat.",
    });
  } else if (dur > 50) {
    flag({
      at: -1,
      level: "info",
      severity: "MED",
      rule: "long-short",
      message: `${dur.toFixed(0)}s total`,
      reason: "every extra second is another chance to leave, and completion rate is the metric that compounds.",
      fix: "cut the weakest explain beat. the mechanism usually survives losing one.",
    });
  }

  // 5. Beat count vs runtime — the average shot length.
  const avg = dur / Math.max(1, plan.beats.length);
  if (avg > 6) {
    flag({
      at: -1,
      level: "warn",
      severity: "HIGH",
      rule: "slow-cut",
      message: `average beat is ${avg.toFixed(1)}s`,
      reason: "the feed's baseline is roughly one change every two to four seconds; slower than that reads as a different, older format.",
      fix: "split the longest beats. same script, more cuts.",
    });
  }

  // 6. Projected retention, as a headline finding — with the actual worst
  //    beat named, rather than a generic "fix the hook". When the hook is
  //    already clean, telling an author to fix it is worse than saying
  //    nothing: it sends them to the one part that is working.
  const pct = Math.round(plan.projectedRetention * 100);
  const worst = [...plan.swipeCurve]
    .slice(1)
    .sort((a, z) => z.risk - a.risk)[0];
  const first = plan.swipeCurve[0];
  const hookIsTheProblem = first && first.drivers.length > 0;
  flag({
    at: -1,
    level: pct >= 45 ? "good" : pct >= 30 ? "info" : "warn",
    severity: pct >= 45 ? "LOW" : pct >= 30 ? "MED" : "HIGH",
    rule: "projected-retention",
    message: `~${pct}% projected to reach the final frame`,
    reason:
      "internal heuristic over the plan — it ranks two cuts of this script against each other, it does not predict YouTube.",
    fix:
      pct >= 45
        ? ""
        : hookIsTheProblem
          ? `beat 1 is the largest single term and it is being charged for: ${first.drivers[0]}.`
          : worst
            ? `the hook is clean — the largest remaining loss is beat ${worst.beat} at ${worst.at}s.`
            : "",
  });

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
