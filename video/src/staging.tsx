// The parts of a composition that don't care about the visual language:
// narration, SFX and the director camera. Music was removed from the long-form
// mix by request — VO and SFX carry the audio, silence is intentional.
import React from "react";
import {
  Audio,
  Easing,
  getInputProps,
  interpolate,
  Loop,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import script from "./script.json";
import voice from "./voice.json";
import { bedLevel, cameraMove, SFX_CUES } from "./plan";
import type { LongFormBeat } from "./LongFormScenes";

type LongFormBeatLike = LongFormBeat | { n: number };

const LONGFORM_HOOK_VO_DELAY = 3.5;

export const NARRATION = voice.beats.filter((b) => b.file && b.words.length > 0);

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

export const Soundtrack: React.FC<{ impact?: number; longForm?: boolean }> = ({ longForm = false }) => {
  const { fps } = useVideoConfig();
  const master = (() => {
    const db = Number(getInputProps().MASTER_GAIN_DB);
    return Number.isFinite(db) && db !== 0 ? Math.pow(10, db / 20) : 1;
  })();

  const speech = NARRATION.map((b) => ({
    beat: b,
    start: longForm && b.n === 1 ? LONGFORM_HOOK_VO_DELAY : b.start,
  }));

  return (
    <>
      {speech.map(({ beat, start }) => (
        <Sequence key={`vo${beat.n}`} from={Math.round(start * fps)}>
          <Audio src={staticFile(`audio/${beat.file}`)} volume={master} />
        </Sequence>
      ))}

      {(SFX_CUES.length ? SFX_CUES : script.sfx)
        .filter((cue) => !longForm || cue.at >= LONGFORM_HOOK_VO_DELAY)
        .flatMap((cue) =>
          cue.files.map((file: string) => (
            <Sequence key={`${cue.at}-${file}`} from={Math.round(cue.at * fps)}>
              <Audio src={staticFile(`audio/${file}`)} volume={() => 0.5 * master} />
            </Sequence>
          )),
        )}
    </>
  );
};

/** MagnatesMedia-style number hit: a short boom landing on the word that says
 * the figure (the plan's `impact` or the first numeric word of the beat). */
export const NumberHitSFX: React.FC<{ beat: LongFormBeatLike; offset?: number }> = ({ beat, offset = 0 }) => {
  const { fps } = useVideoConfig();
  const voiceBeat = voice.beats.find((b) => b.n === beat.n);
  const hit = voiceBeat?.words?.find((w) => /million|billion|thousand|\d[\d,.]*/.test(w.w));
  if (!hit || !voiceBeat) return null;
  const at = (voiceBeat.start + hit.start + offset) * fps;
  return (
    <Sequence from={Math.round(at)}>
      <Audio src={staticFile("audio/boom.wav")} volume={() => 0.7} />
      <Audio src={staticFile("audio/tick.wav")} volume={() => 0.5} />
    </Sequence>
  );
};

/** The MagnatesMedia bed: looping music with ducking, plus risers into the
 * big beats and booms on the numbers. Only active in long-form (the shorts
 * keep their existing mix). */
export const MagnatesBed: React.FC<{ impact?: number }> = ({ impact }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = frame / fps;
  const bed = bedLevel(t) * 0.55;
  const MUSIC_LOOP_FRAMES = Math.round(27.5 * fps);
  return (
    <>
      <Sequence layout="none" name="music-bed">
        <Loop durationInFrames={MUSIC_LOOP_FRAMES}>
          <Audio src={staticFile("audio/music.mp3")} volume={bed} />
        </Loop>
      </Sequence>
      {impact !== undefined && Math.abs(t - impact) < 0.12 ? (
        <Audio src={staticFile("audio/boom.wav")} volume={0.8} />
      ) : null}
      {Math.abs(t - (impact ?? 0) - 2.2) < 0.12 ? (
        <Audio src={staticFile("audio/riser.wav")} volume={0.5} />
      ) : null}
      {durationInFrames > 0 && t > durationInFrames / fps - 2.4 && t < durationInFrames / fps - 2.2 ? (
        <Audio src={staticFile("audio/riser.wav")} volume={0.6} />
      ) : null}
    </>
  );
};
