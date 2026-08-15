// AudioQC: the bed, the accents, the silence.
//
// Audio is the half of a Short nobody debugs. It is also the half that
// decides whether the video sounds like everything else in the feed or like
// something that was made on purpose.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

export const runAudioQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding) => {
    findings.push(f);
    score -= f.level === "warn" ? 1.2 : 0.4;
  };

  const dur = plan.project.durationInSeconds;

  // 1. A bed that never moves is a drone.
  const levels = plan.audioEvents.filter((e) => e.kind === "music_level");
  if (new Set(levels.map((l) => l.value)).size < 2) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "flat-music",
      message: "the music level never changes",
      reason: "a constant bed gives the ear no information about what matters.",
      fix: "add `Music: drop` before the reveal and `Music: swell` on the payoff.",
    });
  }

  // 2. No silence at all. Half a second of nothing is the cheapest pattern
  //    interrupt in a feed that is uniformly loud.
  const silences = plan.audioEvents.filter((e) => e.kind === "silence_start").length;
  if (silences === 0 && dur > 15) {
    flag({
      at: -1,
      level: "info",
      severity: "MED",
      rule: "no-silence",
      message: "no silence window anywhere in the cut",
      reason: "everything in the feed is loud, so a beat of nothing is what makes the next line land.",
      fix: "add `Silence: pre` to the beat carrying the reveal.",
    });
  }

  // 3. Accent density. None is flat; too many is a template.
  const accents = plan.audioEvents.filter((e) => e.kind === "sfx").length;
  const perTenSeconds = accents / Math.max(1, dur / 10);
  if (accents === 0) {
    flag({
      at: -1,
      level: "info",
      severity: "MED",
      rule: "no-sfx",
      message: "no sfx accents at all",
      reason: "an unaccented cut has no punctuation — every beat arrives with the same weight.",
      fix: "the director earns these from attention events; add `Reveal:` rows and they appear.",
    });
  } else if (perTenSeconds > 6) {
    flag({
      at: -1,
      level: "info",
      severity: "LOW",
      rule: "dense-sfx",
      message: `${accents} accents in ${Math.round(dur)}s`,
      reason: "past roughly six per ten seconds the accents stop punctuating and start scoring.",
      fix: "thin the `Sfx:` rows; the earned accents are usually enough.",
    });
  }

  // 4. Silence must never swallow a beat whole.
  for (const b of plan.beats) {
    const len = b.end - b.start;
    for (const s of b.audio.silence) {
      if (s.dur > len * 0.6) {
        flag({
          at: b.start,
          beat: b.n,
          level: "warn",
          severity: "MED",
          rule: "over-long-silence",
          message: `${s.kind} covers ${Math.round((s.dur / len) * 100)}% of beat ${b.n}`,
          reason: "silence that long stops reading as emphasis and starts reading as a dropout.",
          fix: "shorten the `Silence:` row on this beat.",
        });
      }
    }
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
