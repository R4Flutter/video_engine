// RetentionEngineeringQC: explicit long-form retention contract derived from the
// production milestone table. This is a comparative editing gate, not a forecast
// of YouTube analytics. It turns editorial expectations into deterministic checks.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

const meaningful = new Set([
  "NUMBER_REVEAL", "OBJECT_ENTRY", "QUESTION", "REVEAL", "CONTRADICTION",
  "PAYOFF", "PATTERN_INTERRUPT", "ANNOTATION_DRAW", "TEXT_CHANGE",
]);

const firstMeaningful = (events: ShortPlan["attentionEvents"], at = 0) =>
  events.filter((e) => e.at >= at && meaningful.has(e.type)).sort((a, b) => a.at - b.at)[0];

export const runRetentionEngineeringQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (finding: QcFinding, penalty: number) => {
    findings.push(finding);
    score -= penalty;
  };

  const events = plan.attentionEvents.filter((e) => meaningful.has(e.type)).sort((a, b) => a.at - b.at);
  const first = plan.beats[0];

  // 0–2s: immediate contradiction/pattern interrupt.
  const firstEvent = firstMeaningful(events);
  if (!firstEvent || firstEvent.at > 2) {
    flag({
      at: 0, beat: first?.n, severity: "HIGH", level: "warn",
      rule: "retention-0-2-first-event",
      message: `first meaningful event lands at ${firstEvent ? firstEvent.at.toFixed(2) : "late"}s`,
      reason: "the opening must establish a contradiction or visual interruption immediately.",
      fix: "stage PATTERN_INTERRUPT, CONTRADICTION, NUMBER_REVEAL, or OBJECT_ENTRY at frame 0–2s.",
    }, 1.4);
  }

  // 2–5s: the same visual promise should advance with a second meaningful event.
  const second = events.find((e) => e.at > 2 && e.at <= 5);
  if (!second) {
    flag({
      at: 2, beat: first?.n, severity: "HIGH", level: "warn",
      rule: "retention-2-5-second-event",
      message: "no second meaningful event lands by 5s",
      reason: "the first promise needs a quick confirmation before the viewer settles into exposition.",
      fix: "add a NUMBER_REVEAL or OBJECT_ENTRY while preserving the same visual subject; use a camera push rather than an arbitrary cut.",
    }, 1.0);
  }

  // 5–30s: sustained curiosity and claim latency.
  const intro = events.filter((e) => e.at <= 30);
  const firstQuestion = intro.find((e) => e.type === "QUESTION" || e.type === "CONTRADICTION");
  if (!firstQuestion || firstQuestion.at > 5) {
    flag({
      at: 0, severity: "MED", level: "warn",
      rule: "retention-5-30-question-latency",
      message: `first question/contradiction arrives at ${firstQuestion ? firstQuestion.at.toFixed(2) : "late"}s`,
      reason: "the curiosity gap should widen early rather than waiting for explanatory exposition.",
      fix: "surface the strongest existing question or contradiction by ~5s.",
    }, 0.8);
  }

  const firstPayoff = intro.find((e) => e.type === "REVEAL" || e.type === "PAYOFF");
  const payoffAt = firstPayoff?.at ?? Infinity;
  if (payoffAt > 12) {
    flag({
      at: 0, severity: payoffAt > 20 ? "HIGH" : "MED", level: "warn",
      rule: "retention-claim-latency",
      message: `first meaningful reveal/payoff lands at ${Number.isFinite(payoffAt) ? payoffAt.toFixed(2) : "late"}s`,
      reason: "the opening promise needs a concrete visual answer before the first chapter becomes exposition.",
      fix: "stage a strong existing evidence/reveal by 12s without inventing new narration.",
    }, payoffAt > 20 ? 1.2 : 0.7);
  }

  // 30s–2m: a payoff must be followed quickly by a fresh question.
  const chapterOneEnd = Math.min(120, first ? Math.max(first.end, 60) : 120);
  const payoff = events.find((e) => e.at >= 30 && e.at < chapterOneEnd && (e.type === "PAYOFF" || e.type === "REVEAL"));
  if (!payoff) {
    flag({
      at: 30, severity: "MED", level: "warn",
      rule: "retention-chapter-one-payoff",
      message: "no chapter-one payoff/reveal in the 30s–2m window",
      reason: "the first chapter needs a concrete resolution before the next question opens.",
      fix: "mark an existing factual payoff and follow it with a fresh QUESTION event.",
    }, 0.7);
  } else {
    const nextQuestion = events.find((e) => e.at > payoff.at && e.at <= payoff.at + 8 && e.type === "QUESTION");
    if (!nextQuestion) {
      flag({
        at: payoff.at, severity: "MED", level: "warn",
        rule: "retention-payoff-without-next-question",
        message: `payoff at ${payoff.at.toFixed(1)}s is not followed by a new question within 8s`,
        reason: "resolved curiosity should immediately become the next curiosity target.",
        fix: "open a fresh question immediately after the payoff; do not add filler.",
      }, 0.5);
    }
  }

  // 2m+: use semantic events/minute as a floor. This deliberately matches the
  // retention proxy's 1.25/min event target while the rendered QC checks whether
  // those events actually changed pixels.
  if (plan.project.durationInSeconds >= 120) {
    const minutes = Math.max(1, plan.project.durationInSeconds / 60);
    const density = events.filter((e) => e.at >= 120).length / Math.max(1, minutes - 2);
    if (density < 1.25) {
      flag({
        at: 120, severity: "MED", level: "warn",
        rule: "retention-event-density",
        message: `${density.toFixed(2)} meaningful events/min after the opening 2m`,
        reason: "long-form needs recurring semantic state changes to avoid invisible pacing cliffs.",
        fix: "increase evidence reveals, questions, comparisons, object entries, or payoffs—not decorative motion.",
      }, 0.6);
    }
  }

  // 10m+: require callback material and an explicit loop close.
  if (plan.project.durationInSeconds >= 600) {
    const lateEvents = events.filter((e) => e.at >= plan.project.durationInSeconds - 120);
    const hasPayoff = lateEvents.some((e) => e.type === "PAYOFF" || e.type === "REVEAL");
    if (!hasPayoff) {
      flag({
        at: plan.project.durationInSeconds - 120, severity: "MED", level: "warn",
        rule: "retention-late-payoff",
        message: "final two minutes contain no explicit payoff/reveal event",
        reason: "late-video retention needs an earned resolution before the close.",
        fix: "bring back a central fact, graphic, scene, or consequence as an explicit payoff.",
      }, 0.5);
    }
    if (!plan.loop?.closes) {
      flag({
        at: plan.project.durationInSeconds, severity: "MED", level: "warn",
        rule: "retention-loop-not-closed",
        message: "long-form loop plan does not close",
        reason: "callbacks are strongest when the ending resolves the visual idea planted in the opening.",
        fix: "set loop metadata and replay the opening motif or scene near the end.",
      }, 0.5);
    }
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
