// The composition. It reads script.json and stages it — no episode-specific
// JSX lives here, so a new script.md renders without touching this file.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop } from "./elements";
import { CaptionTrack, TextTrack } from "./Overlays";
import script from "./script.json";
import voice from "./voice.json";
import { MODULES } from "./scenes";

/** Music sits under the voice: a bed that lifts for the payoff, ducked to a
 *  murmur whenever someone is speaking. */
const BED = 0.4;
const SWELL = 0.58;
const DUCK = 0.34;

const ramp = (x: number, from: [number, number], to: [number, number]) =>
  interpolate(x, from, to, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Camera per module: subtle by default, and only loud on the payoff. */
const CAMERA: Record<string, [number, number]> = {
  coinDrop: [1.07, 1.0],
  coinStack: [1.0, 1.04],
  investChart: [1.03, 1.0],
  jarFill: [1.0, 1.06],
  mountain: [1.04, 1.0],
  payoff: [1.0, 1.1],
  outro: [1.12, 1.0],
};

const payoff = script.beats.find((b) => b.module === "payoff");
const payoffVoice = voice.beats.find((b) => b.n === payoff?.n);
/** The gold flash and the shake are cued off the spoken word, not off a frame
 *  number, so they stay on the beat when the read changes. */
const IMPACT =
  payoffVoice && payoff
    ? payoffVoice.start +
      (payoffVoice.words.find((w) => /crore/i.test(w.w))?.start ??
        (payoff.end - payoff.start) * 0.6)
    : (payoff?.start ?? 0) + 2.5;

/** Beats with a recorded take. Empty until tools/voice.py has run, and then the
 *  video simply has no narrator — nothing else changes. */
const NARRATION = voice.beats.filter((b) => b.file && b.words.length > 0);

/** When someone is speaking — used to duck the music out of the way. */
const SPEECH = NARRATION.map(
  (b) => [b.start, b.start + b.words[b.words.length - 1].end] as const,
);

const useCamera = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat =
    script.beats.find((b) => frame >= b.start * fps && frame < b.end * fps) ??
    script.beats[script.beats.length - 1];
  const [from, to] = CAMERA[beat.module] ?? [1, 1];
  const scale = interpolate(frame, [beat.start * fps, beat.end * fps], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  // One impact shake, landing on the word "crore" rather than on a guessed frame.
  const hit = frame - Math.round(IMPACT * fps);
  const shake = hit > 0 && hit < 14 ? Math.sin(hit * 2.4) * (14 - hit) * 1.1 : 0;
  return { scale, shake };
};

export const FinanceShort: React.FC = () => {
  const { fps } = useVideoConfig();
  const { scale, shake } = useCamera();
  const total = script.durationInSeconds;

  return (
    <AbsoluteFill style={{ backgroundColor: "#06181C" }}>
      <Backdrop />
      <AbsoluteFill
        style={{ transform: `scale(${scale}) translate(${shake}px, ${shake * 0.5}px)` }}
      >
        {script.beats.map((beat) => {
          const Scene = MODULES[beat.module] ?? MODULES.coinDrop;
          const dur = Math.round((beat.end - beat.start) * fps);
          return (
            <Sequence
              key={beat.n}
              name={`${beat.n}. ${beat.name}`}
              from={Math.round(beat.start * fps)}
              durationInFrames={dur}
            >
              <Scene dur={dur} />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <TextTrack cues={script.texts} total={total} />
      <CaptionTrack
        beats={voice.beats}
        skip={(n) => n === 1 || script.beats.find((b) => b.n === n)?.module === "outro"}
      />

      {NARRATION.map((beat) => (
        <Sequence key={`vo${beat.n}`} from={Math.round(beat.start * fps)}>
          <Audio src={staticFile(`audio/${beat.file}`)} />
        </Sequence>
      ))}

      <Audio
        src={staticFile("audio/music.wav")}
        loop // the episode runs as long as the read does, the bed has to keep up
        volume={(f) => {
          const t = f / fps;
          const bed = ramp(t, [IMPACT - 1, IMPACT], [BED, SWELL]);
          const edges = ramp(t, [0, 1.5], [0, 1]) * ramp(t, [total - 1.2, total], [1, 0]);
          // Under speech, and easing back out of the way either side of it.
          const duck = Math.min(
            1,
            ...SPEECH.map(([a, b]) =>
              t < a ? ramp(t, [a - 0.3, a], [1, DUCK])
              : t > b ? ramp(t, [b, b + 0.45], [DUCK, 1])
              : DUCK,
            ),
          );
          return bed * edges * duck;
        }}
      />
      {script.sfx.flatMap((cue) =>
        cue.files.map((file) => (
          <Sequence key={`${cue.at}-${file}`} from={Math.round(cue.at * fps)}>
            {/* accents, not events — the voice is the loudest thing here */}
            <Audio src={staticFile(`audio/${file}`)} volume={0.5} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};
