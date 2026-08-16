// The parts of a composition that don't care what the visual language is:
// music, narration, SFX and the director camera. Long-form finance gets one
// intentional exception: Beat 1 VO waits until the visual contradiction has
// landed, so the renderer can honor a true visual-first documentary opener.
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

const BED = 0.4;
const SWELL = 0.58;
const DUCK = 0.34;
const LONGFORM_HOOK_VO_DELAY = 3.5;

const ramp = (x: number, from: [number, number], to: [number, number]) =>
  interpolate(x, from, to, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const NARRATION = voice.beats.filter((b) => b.file && b.words.length > 0);

const SPEECH = NARRATION.map((b) => [b.start, b.start + b.words[b.words.length - 1].end] as const);

const PLANNED_BED = SFX_CUES.length > 0 || bedLevel(0) !== 0.4 || bedLevel(1) !== bedLevel(0);

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
  const shake = strength > 0 && hit > 0 && hit < 14 ? Math.sin(hit * 2.4) * (14 - hit) * strength : 0;
  return { scale, shake };
};

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
  const shake = strength > 0 && hit > 0 && hit < 14 ? Math.sin(hit * 2.4) * (14 - hit) * strength : 0;
  return { scale, shake };
};

/** Narration, music bed and SFX. In long-form mode Beat 1 begins after the
 * visual-first opening hold; all later takes retain their original timings. */
export const Soundtrack: React.FC<{ impact: number; longForm?: boolean }> = ({ impact, longForm = false }) => {
  const { fps } = useVideoConfig();
  const total = script.durationInSeconds;
  const master = (() => {
    const db = Number(getInputProps().MASTER_GAIN_DB);
    return Number.isFinite(db) && db !== 0 ? Math.pow(10, db / 20) : 1;
  })();

  const speech = NARRATION.map((b) => {
    const start = longForm && b.n === 1 ? LONGFORM_HOOK_VO_DELAY : b.start;
    return { beat: b, start };
  });
  const speechWindows = speech.map((x) => [x.start, x.start + x.beat.words[x.beat.words.length - 1].end] as const);

  return (
    <>
      {speech.map(({ beat, start }) => (
        <Sequence key={`vo${beat.n}`} from={Math.round(start * fps)}>
          <Audio src={staticFile(`audio/${beat.file}`)} volume={master} />
        </Sequence>
      ))}

      <Audio
        src={staticFile("audio/music.mp3")}
        loop
        volume={(f) => {
          const t = f / fps;
          const bed = PLANNED_BED ? bedLevel(t) : ramp(t, [impact - 1, impact], [BED, SWELL]);
          const edges = ramp(t, [0, 0.15], [0, 1]) * ramp(t, [total - 1.2, total], [1, 0]);
          const duck = Math.min(
            1,
            ...speechWindows.map(([a, b]) =>
              t < a ? ramp(t, [a - 0.3, a], [1, DUCK])
              : t > b ? ramp(t, [b, b + 0.45], [DUCK, 1])
              : DUCK,
            ),
          );
          return bed * edges * duck * master;
        }}
      />

      {(SFX_CUES.length ? SFX_CUES : script.sfx).flatMap((cue) =>
        cue.files.map((file) => (
          <Sequence key={`${cue.at}-${file}`} from={Math.round(cue.at * fps)}>
            <Audio src={staticFile(`audio/${file}`)} volume={() => 0.5 * master} />
          </Sequence>
        )),
      )}
    </>
  );
};
