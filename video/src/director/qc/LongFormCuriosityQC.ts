// LongFormCuriosityQC: chapter-aware curiosity and payoff QA for documentaries.
//
// Long-form retention is not a loop every few seconds. The useful unit is the
// narrative question: open it, develop it, answer it, and replace it with the
// next question before the viewer feels finished.
import type { QcFinding, ShortPlan } from "../types.ts";
import type { CuriosityState } from "../attention/CuriosityEngine.ts";
import { clamp } from "../util.ts";

const MIN_REVEAL_INTERVAL = 18;
const REVIEW_REVEAL_INTERVAL = 30;
const MAX_OPEN_CHAPTERS_WITHOUT_TURN = 2;

const runLength = (values: number[]) => {
  let best = 0;
  let current = 0;
  for (const v of values) {
    current = v ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
};

export const runLongFormCuriosityQC = (
  plan: ShortPlan,
  curiosity: CuriosityState,
): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  const chapters = plan.sequences;
  const revealEvents = plan.attentionEvents
    .filter((e) => ["REVEAL", "CONTRADICTION", "QUESTION", "NUMBER_REVEAL", "PAYOFF"].includes(e.type))
    .sort((a, b) => a.at - b.at);

  if (curiosity.unresolved.length) {
    const open = curiosity.unresolved[0];
    flag({
      at: plan.beats.find((b) => b.n === open.atBeat)?.start ?? -1,
      beat: open.atBeat,
      level: "warn",
      severity: "HIGH",
      rule: "longform-unresolved-ending-question",
      message: `ending leaves "${open.question.slice(0, 72)}" unresolved`,
      reason: "a documentary can leave ambiguity, but an unanswered narrative promise should be deliberate rather than accidental.",
      fix: "resolve the question, explicitly refract it into the final thesis, or remove the promise.",
    }, 1.4);
  }

  const flat = curiosity.longestFlatRun;
  if (flat && flat.seconds >= 45) {
    flag({
      at: plan.beats.find((b) => b.n === flat.from)?.start ?? -1,
      beat: flat.from,
      level: "warn",
      severity: "MED",
      rule: "longform-flat-curiosity",
      message: `${flat.seconds.toFixed(1)}s with no active narrative question`,
      reason: "long-form explanations can breathe, but a long stretch with no pending question tends to feel finished.",
      fix: "carry forward a meaningful question or introduce the next chapter's tension earlier.",
    }, 0.7);
  } else if (flat && flat.seconds >= 30) {
    flag({
      at: plan.beats.find((b) => b.n === flat.from)?.start ?? -1,
      beat: flat.from,
      level: "info",
      severity: "LOW",
      rule: "longform-curiosity-review",
      message: `${flat.seconds.toFixed(1)}s without an active narrative question`,
      reason: "review only; evidence-heavy passages can remain compelling without an explicit question.",
      fix: "keep if the evidence itself is carrying anticipation.",
    }, 0.2);
  }

  let previousReveal = 0;
  for (const e of revealEvents) {
    const gap = e.at - previousReveal;
    if (gap >= MIN_REVEAL_INTERVAL) {
      flag({
        at: previousReveal,
        level: gap >= REVIEW_REVEAL_INTERVAL ? "warn" : "info",
        severity: gap >= REVIEW_REVEAL_INTERVAL ? "MED" : "LOW",
        rule: "longform-reveal-cadence",
        message: `${gap.toFixed(1)}s since the previous major curiosity/reveal event`,
        reason: "long-form does not need constant reveals, but major narrative turns should not disappear for too long.",
        fix: "bring forward an existing proof, contradiction, question, or consequence; do not add decorative text.",
      }, gap >= REVIEW_REVEAL_INTERVAL ? 0.55 : 0.15);
    }
    previousReveal = e.at;
  }

  const chapterOpens = chapters.filter((s) => Boolean(s.openQuestion));
  const chapterAnswers = chapters.filter((s) => Boolean(s.answer));
  if (chapters.length >= 5 && chapterOpens.length / chapters.length < 0.5) {
    flag({
      at: -1,
      level: "info",
      severity: "MED",
      rule: "weak-chapter-questions",
      message: `${chapterOpens.length}/${chapters.length} sequences have an explicit open question`,
      reason: "chapter-level questions make long-form structure easier to feel without resorting to constant cuts.",
      fix: "where the narrative genuinely turns, carry an explicit question into the next sequence.",
    }, 0.35);
  }
  if (chapterAnswers.length < Math.max(3, Math.floor(chapters.length * 0.5))) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "weak-chapter-resolution",
      message: `${chapterAnswers.length}/${chapters.length} sequences have an explicit answer/payoff`,
      reason: "a documentary should periodically cash the question it opened before escalating the next one.",
      fix: "mark genuine chapter conclusions as answers/payoffs; do not manufacture closure.",
    }, 0.45);
  }

  const openFlags = curiosity.openLoop.map((o) => (o ? 1 : 0));
  if (runLength(openFlags) >= Math.max(MAX_OPEN_CHAPTERS_WITHOUT_TURN, 4)) {
    // This is informational: a long chain of open loops is often exactly right,
    // but it should contain at least one answer inside the chain.
    const chained = openFlags.filter(Boolean).length;
    if (chained / Math.max(1, openFlags.length) > 0.9) {
      flag({
        at: -1,
        level: "info",
        severity: "LOW",
        rule: "loop-overhang-review",
        message: "curiosity remains open across most of the documentary",
        reason: "near-continuous unresolved tension can become exhausting unless chapters periodically resolve and reframe it.",
        fix: "allow decisive chapter payoffs so the next question feels earned.",
      }, 0.2);
    }
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
