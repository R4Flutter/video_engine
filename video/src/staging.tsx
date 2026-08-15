// The parts of a composition that don't care what the visual language is:
// music that gets out of the way of the voice, the sfx track, the narration
// takes, and a per-module camera move. FinanceShort and VoxShort both stage
// script.json — they differ in what they draw, not in how they sound.
import React from "react";
import {
  Audio,
  Easing,
  getInputProps,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import script from "./script.json";
import voice from "./voice.json";
import { bedLevel, cameraMove, SFX_CUES } from "./plan";

/** Music sits under the voice: a bed that lifts for the payoff, ducked to a
 *  murmur whenever someone is speaking. */
const BED = 0.4;
const SWELL = 0.58;
const DUCK = 0.34;

const ramp = (x: number, from: [number, number], to: [number, number]) =>
  interpolate(x, from, to, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Beats with a recorded take. Empty until tools/voice.py has run, and then the
 *  video simply has no narrator — nothing else changes. */
export const NARRATION = voice.beats.filter((b) => b.file && b.words.length > 0);

/** When someone is speaking — used to duck the music out of the way. */
const SPEECH = NARRATION.map(
  (b) => [b.start, b.start + b.words[b.words.length - 1].end] as const,
);

/** Whether the director gave us a bed curve to obey. */
const PLANNED_BED = SFX_CUES.length > 0 || bedLevel(0) !== 0.4 || bedLevel(1) !== bedLevel(0);

/**
 * The moment the episode lands on. Cued off a spoken word inside a named beat
 * rather than off a frame number, so it stays on the beat when the read
 * changes. Falls back to `frac` through the beat when the word isn't said.
 */
export const impactAt = (module: string, word: RegExp, frac = 0.6) => {
  const beat = script.beats.find((b) => b.module === module);
  if (!beat) {
    const last = script.beats[script.beats.length - 1];
    return last ? last.start : 0;
  }
  const take = voice.beats.find((b) => b.n === beat.n);
  const hit = take?.words.find((w) => word.test(w.w));
  if (!take) return beat.start + (beat.end - beat.start) * frac;
  return take.start + (hit ? hit.start : (beat.end - beat.start) * frac);
};

/**
 * Push or pull per module, plus one impact shake. `table` is the vocabulary's
 * own move list — a finance payoff punches, a vox page drifts.
 */
export const useCamera = (
  table: Record<string, [number, number]>,
  impact: number,
  strength = 1.1,
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat =
    script.beats.find((b) => frame >= b.start * fps && frame < b.end * fps) ??
    script.beats[script.beats.length - 1];
  const [from, to] = table[beat.module] ?? [1, 1];
  const scale = interpolate(frame, [beat.start * fps, beat.end * fps], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const hit = frame - Math.round(impact * fps);
  const shake =
    strength > 0 && hit > 0 && hit < 14 ? Math.sin(hit * 2.4) * (14 - hit) * strength : 0;
  return { scale, shake };
};

/**
 * The director's camera. Same shape as `useCamera`, but the move comes from
 * the plan's semantic intent rather than a table keyed on the module — so a
 * beat marked `Camera: hold` holds, and beat one always holds because the
 * director will not let it do anything else.
 *
 * Falls back to a still frame when the plan has nothing to say, which is the
 * correct failure: a camera that does not move is never wrong, it is only
 * unambitious.
 */
export const usePlanCamera = (impact: number, strength = 1.1) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat =
    script.beats.find((b) => frame >= b.start * fps && frame < b.end * fps) ??
    script.beats[script.beats.length - 1];
  const [from, to] = cameraMove(beat.n);
  const scale = interpolate(frame, [beat.start * fps, beat.end * fps], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const hit = frame - Math.round(impact * fps);
  const shake =
    strength > 0 && hit > 0 && hit < 14 ? Math.sin(hit * 2.4) * (14 - hit) * strength : 0;
  return { scale, shake };
};

/** Narration takes, the ducking music bed and the sfx accents. */
export const Soundtrack: React.FC<{ impact: number }> = ({ impact }) => {
  const { fps } = useVideoConfig();
  const total = script.durationInSeconds;
  /** The mastering pass. tools/loudness.py measures the mixed render and
   *  reports the gain that brings it to platform target (-14 LUFS, -1.5 dBTP).
   *  Baking it into the mix here means the final render *is* the upload file —
   *  the master is one number, not a remux. No props = the mix is untouched. */
  const master = (() => {
    const db = Number(getInputProps().MASTER_GAIN_DB);
    return Number.isFinite(db) && db !== 0 ? Math.pow(10, db / 20) : 1;
  })();
  return (
    <>
      {NARRATION.map((beat) => (
        <Sequence key={`vo${beat.n}`} from={Math.round(beat.start * fps)}>
          <Audio src={staticFile(`audio/${beat.file}`)} volume={master} />
        </Sequence>
      ))}

      <Audio
        src={staticFile("audio/music.mp3")}
        loop // the episode runs as long as the read does, the bed has to keep up
        volume={(f) => {
          const t = f / fps;
          // The director's level curve when there is one — it already carries
          // the swell into the payoff and the drops before each reveal. The
          // old ramp is the fallback for a script with no plan.
          const bed = PLANNED_BED ? bedLevel(t) : ramp(t, [impact - 1, impact], [BED, SWELL]);
          // No fade-in. An essay can spend two seconds arriving; a Short that
          // does it sounds like it has not started yet during the only second
          // that decides anything.
          const edges = ramp(t, [0, 0.15], [0, 1]) * ramp(t, [total - 1.2, total], [1, 0]);
          // Under speech, and easing back out of the way either side of it.
          const duck = Math.min(
            1,
            ...SPEECH.map(([a, b]) =>
              t < a ? ramp(t, [a - 0.3, a], [1, DUCK])
              : t > b ? ramp(t, [b, b + 0.45], [DUCK, 1])
              : DUCK,
            ),
          );
          return bed * edges * duck * master;
        }}
      />
      {/* The director's accents when it scheduled any — each one is earned by
          an attention event rather than by a row in a table. The script's own
          sound-design table is the fallback. */}
      {(SFX_CUES.length ? SFX_CUES : script.sfx).flatMap((cue) =>
        cue.files.map((file) => (
          <Sequence key={`${cue.at}-${file}`} from={Math.round(cue.at * fps)}>
            {/* accents, not events — the voice is the loudest thing here */}
            <Audio src={staticFile(`audio/${file}`)} volume={() => 0.5 * master} />
          </Sequence>
        )),
      )}
    </>
  );
};
