// LongFormAudioQC: production audio QA for narrated documentaries.
//
// This is not a loudness meter; it audits the director's timing plan. It checks
// whether narration is given room to breathe, whether music evolves with
// chapters, whether silence is purposeful, and whether SFX are punctuation
// rather than a constant score.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

const MIN_MUSIC_STATES = 3;
const MAX_SFX_PER_MINUTE = 6;
const HIGH_SFX_PER_MINUTE = 10;
const MAX_SILENCE_SHARE = 0.45;

export const runLongFormAudioQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  const duration = Math.max(1, plan.project.durationInSeconds);
  const levels = plan.audioEvents.filter((e) => e.kind === "music_level");
  const moods = plan.beats.map((b) => b.audio.musicMood);
  const distinctMusicStates = new Set(levels.map((e) => e.value)).size;
  const distinctMoods = new Set(moods).size;

  if (distinctMusicStates < MIN_MUSIC_STATES && distinctMoods < 3 && duration > 300) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "longform-flat-bed",
      message: "music language barely changes across the documentary",
      reason: "a two- or twenty-minute narration benefits from subtle chapter-level sonic resets.",
      fix: "use quiet/hold/drop/swell changes at genuine narrative transitions; do not add music changes to every beat.",
    }, 0.7);
  }

  const sfx = plan.audioEvents.filter((e) => e.kind === "sfx").length;
  const sfxPerMinute = sfx / (duration / 60);
  if (sfxPerMinute > HIGH_SFX_PER_MINUTE) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "longform-sfx-overdrive",
      message: `${sfxPerMinute.toFixed(1)} SFX/minute`,
      reason: "frequent accents flatten the hierarchy and make evidence beats feel gamified.",
      fix: "reserve SFX for reveals, transitions, concrete UI actions, or deliberate punctuation.",
    }, 0.65);
  } else if (sfxPerMinute > MAX_SFX_PER_MINUTE) {
    flag({
      at: -1,
      level: "info",
      severity: "LOW",
      rule: "longform-sfx-dense",
      message: `${sfxPerMinute.toFixed(1)} SFX/minute`,
      reason: "review whether every accent is earning its place in a serious documentary mix.",
      fix: "thin non-semantic accents first.",
    }, 0.2);
  }

  for (const b of plan.beats) {
    const len = b.end - b.start;
    const silence = b.audio.silence.reduce((sum, s) => sum + s.dur, 0);
    if (len > 0 && silence / len > MAX_SILENCE_SHARE) {
      flag({
        at: b.start,
        beat: b.n,
        level: "warn",
        severity: "MED",
        rule: "longform-silence-overhang",
        message: `${Math.round((silence / len) * 100)}% of beat ${b.n} is planned silence`,
        reason: "extended silence can be powerful, but beyond a large share of a narrated beat it risks sounding like a missing track.",
        fix: "shorten the silence or explicitly use it as a structural reset before the next line.",
      }, 0.35);
    }
  }

  const audioEvents = [...plan.audioEvents].sort((a, b) => a.at - b.at);
  let longestMusicGap = 0;
  let previousMusic = 0;
  for (const e of audioEvents.filter((e) => e.kind === "music_level")) {
    longestMusicGap = Math.max(longestMusicGap, e.at - previousMusic);
    previousMusic = e.at;
  }
  if (duration > 600 && longestMusicGap > 240) {
    flag({
      at: previousMusic,
      level: "info",
      severity: "LOW",
      rule: "longform-sonic-reset-gap",
      message: `${longestMusicGap.toFixed(0)}s between music-state events`,
      reason: "a long uninterrupted bed can become perceptually invisible; a chapter reset can restore a sense of progression.",
      fix: "add a musical state change at a real chapter boundary, not a random beat.",
    }, 0.2);
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
