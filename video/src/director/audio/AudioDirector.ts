// AudioDirector: the audio plan for one beat — music mood and level, silence
// windows, sfx accents, and the J/L cuts.
//
// J-cut = this beat's audio starts before its picture, so the viewer hears
// the next thing before they see it. L-cut = the audio hangs past the cut.
// In a Short the J-cut is worth more than in an essay: it removes the tiny
// dead moment at every cut where the viewer's attention is free to wander.
import type { AttentionEvent, Emotion, ScriptBeat, SilenceKind } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import { levelOf, musicMoodFor, type MusicMood } from "./MusicPlanner.ts";
import { silenceFor } from "./SilencePlanner.ts";
import { sfxFor } from "./SFXPlanner.ts";

export type BeatAudio = {
  musicLevel: number;
  musicMood: MusicMood;
  sfx: { at: number; files: string[] }[];
  silence: { at: number; dur: number; kind: SilenceKind }[];
  jCut?: number;
  lCut?: number;
};

export const cutsFor = (b: ScriptBeat, facts: BeatFacts): { jCut?: number; lCut?: number } => {
  if (b.jcut !== undefined && Number.isFinite(b.jcut)) {
    return { jCut: Math.max(0.1, Math.min(1.2, b.jcut)) };
  }
  if (b.lcut !== undefined && Number.isFinite(b.lcut)) {
    return { lCut: Math.max(0.1, Math.min(1.5, b.lcut)) };
  }
  const cuts: { jCut?: number; lCut?: number } = {};
  const dur = b.end - b.start;
  // Audio leads into a reveal or a turn; it hangs after the payoff.
  if ((facts.reveal || facts.purpose === "turn") && dur >= 2.5) cuts.jCut = 0.25;
  if (facts.purpose === "payoff") cuts.lCut = 0.4;
  return cuts;
};

export const audioFor = (
  b: ScriptBeat,
  facts: BeatFacts,
  emotion: Emotion,
  events: AttentionEvent[],
): BeatAudio => {
  const mood = musicMoodFor(b, facts, emotion);
  return {
    musicLevel: levelOf(mood),
    musicMood: mood,
    sfx: sfxFor(b, events).map((a) => ({ at: a.at, files: [a.label!] })),
    silence: silenceFor(b, facts),
    ...cutsFor(b, facts),
  };
};
