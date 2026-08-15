// MusicPlanner: the bed is an editorial instrument, not a constant drone.
// Its level curve carries the cut — quiet under the mechanism, dropping out
// before a reveal, swelling into the payoff. The renderer turns these level
// events into a piecewise bed(t).
//
// One Shorts-specific note: the bed comes up at full immediately. An essay
// can fade its music in over two seconds. A Short that does that spends its
// most valuable second sounding like it has not started yet.
import type { AudioEvent, Emotion, ScriptBeat } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import { round2 } from "../util.ts";

export type MusicMood = "hold" | "swell" | "drop" | "quiet";

const LEVEL: Record<MusicMood, number> = { hold: 0.4, swell: 0.6, drop: 0.22, quiet: 0.28 };

export const musicMoodFor = (
  b: ScriptBeat,
  facts: BeatFacts,
  emotion: Emotion,
): MusicMood => {
  if (b.music) {
    const m = b.music.toLowerCase();
    if (m.includes("swell") || m.includes("rise")) return "swell";
    if (m.includes("drop") || m.includes("out")) return "drop";
    if (m.includes("quiet") || m.includes("low")) return "quiet";
    return "hold";
  }
  if (facts.purpose === "hook" || facts.purpose === "payoff") return "swell";
  if (facts.reveal || emotion === "surprise") return "drop";
  if (emotion === "tension") return "quiet";
  if (facts.purpose === "cta") return "quiet";
  return "hold";
};

export const levelOf = (mood: MusicMood) => LEVEL[mood];

export const planMusic = (
  beats: ScriptBeat[],
  facts: BeatFacts[],
  emotions: Emotion[],
): AudioEvent[] =>
  beats.flatMap((b, i) => {
    const level = LEVEL[musicMoodFor(b, facts[i], emotions[i])];
    return [
      { at: round2(b.start), kind: "music_level" as const, value: level },
      { at: round2(b.end), kind: "music_level" as const, value: level },
    ];
  });
