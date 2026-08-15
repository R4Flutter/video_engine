// SFXPlanner: sound effects punctuate, they don't score.
//
// Each accent is earned by an attention event and mapped to the pack that
// actually exists in video/public/audio. Two constraints keep it from turning
// into a carousel: one accent per event type per beat, and never more than
// three in a beat. A Short with a sound on every frame reads as a template.
import type { AttentionEvent, AudioEvent, ScriptBeat } from "../types.ts";
import { round2 } from "../util.ts";

/** What is on disk in video/public/audio. */
export const SFX_PACK = [
  "boom.wav", "shimmer.wav", "whoosh-up.wav", "whoosh.wav", "pop.wav",
  "chime.wav", "chime-warm.wav", "riser.wav", "stamp.wav", "tick.wav",
  "coin.wav", "coin-soft.wav",
];

const STING: [string, string][] = [
  ["PATTERN_INTERRUPT", "stamp.wav"], // frame zero lands like a stamp
  ["REVEAL", "boom.wav"],
  ["PAYOFF", "boom.wav"],
  ["CONTRADICTION", "whoosh.wav"],
  ["QUESTION", "whoosh-up.wav"],
  ["NUMBER_REVEAL", "chime.wav"],
  ["OBJECT_ENTRY", "pop.wav"],
  ["ANNOTATION_DRAW", "tick.wav"],
  ["CAMERA_PUNCH", "riser.wav"],
];

const MAX_PER_BEAT = 3;

export const sfxFor = (b: ScriptBeat, events: AttentionEvent[]): AudioEvent[] => {
  const out: AudioEvent[] = [];
  const usedType = new Set<string>();

  for (const e of events.filter((x) => x.beat === b.n)) {
    if (out.length >= MAX_PER_BEAT) break;
    if (e.strength < 0.6) continue;
    if (usedType.has(e.type)) continue;
    const sting = STING.find(([type]) => type === e.type);
    if (!sting) continue;
    usedType.add(e.type);
    out.push({ at: round2(e.at), kind: "sfx", label: sting[1] });
  }

  // The author's `Sfx:` row adds named accents on top.
  if (b.sfx) {
    for (const part of b.sfx.split(/[+,]/)) {
      const name = part.trim().toLowerCase();
      if (!name) continue;
      const hit = SFX_PACK.find((f) => f.replace(".wav", "") === name || f.includes(name));
      if (hit && !out.some((o) => o.label === hit)) {
        out.push({ at: round2(b.start), kind: "sfx", label: hit });
      }
    }
  }
  return out.sort((a, z) => a.at - z.at);
};

export const planSfx = (beats: ScriptBeat[], events: AttentionEvent[]): AudioEvent[] =>
  beats.flatMap((b) => sfxFor(b, events));
