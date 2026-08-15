// SilencePlanner: silence is a tool, not a gap.
//
// In a Short it is also a pattern interrupt. A feed is wall-to-wall loud, so
// half a second of nothing before a number lands is the cheapest way to make
// the number feel like it matters — and it costs no render time.
//
// The voice is never silenced. These windows cut the bed, not the narration.
import type { AudioEvent, ScriptBeat, SilenceKind } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import { clamp, round2 } from "../util.ts";

export const silenceFor = (
  b: ScriptBeat,
  facts: BeatFacts,
): { at: number; dur: number; kind: SilenceKind }[] => {
  const out: { at: number; dur: number; kind: SilenceKind }[] = [];
  const dur = Math.max(0.2, b.end - b.start);

  if (b.silence) {
    const s = b.silence.toLowerCase();
    if (s.includes("pre")) {
      out.push({ at: round2(b.start), dur: clamp(0.6, 0.3, dur * 0.4), kind: "PRE_REVEAL_SILENCE" });
      return out;
    }
    if (s.includes("post")) {
      out.push({ at: round2(b.end - 0.6), dur: 0.6, kind: "POST_REVEAL_SILENCE" });
      return out;
    }
    if (s.includes("drop")) {
      out.push({ at: round2(b.start), dur: Math.min(1.2, dur * 0.4), kind: "MUSIC_DROP" });
      return out;
    }
  }

  // A reveal gets the classic pre-reveal drop: the bed steps aside so the
  // line lands in the open.
  if (facts.reveal && dur >= 2.5) {
    out.push({
      at: round2(b.start + dur * 0.5),
      dur: Math.min(0.7, dur * 0.25),
      kind: "PRE_REVEAL_SILENCE",
    });
  }
  // The payoff lands and then hangs — that beat of air is the viewer's.
  if (facts.purpose === "payoff" && dur >= 2.5) {
    out.push({ at: round2(b.end - 0.7), dur: 0.7, kind: "POST_REVEAL_SILENCE" });
  }
  return out;
};

export const planSilence = (beats: ScriptBeat[], facts: BeatFacts[]): AudioEvent[] =>
  beats.flatMap((b, i) =>
    silenceFor(b, facts[i]).flatMap((s) => [
      { at: s.at, kind: "silence_start" as const, label: s.kind },
      { at: round2(s.at + s.dur), kind: "silence_end" as const, label: s.kind },
    ]),
  );
