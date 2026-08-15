// A third engine: the same script.json, presented by someone.
//
// FinanceShort and VoxShort both stage a page. This one stages a person, and
// gives the page the other half of the frame. The reason is not novelty — a
// talking figure holds attention through a beat where the visual has nothing
// new to say, which in a 40-second explainer is most of the middle.
//
// It reuses the vox vocabulary wholesale. The stickman is an addition to that
// engine's page, not a replacement for it, so the type, the paper and the
// hand-drawn marks are all the ones already in vox/elements.tsx.

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import script from "./script.json";
import voice from "./voice.json";
import visemes from "./visemes.json";
import { Soundtrack, usePlanCamera } from "./staging";
import { theme } from "./theme";
import { KineticText, Kicker, LineIcon, PaperBG } from "./vox/elements";
import { IMPACT_AT } from "./plan";
import { Stickman } from "./stickman/Stickman";
import type { AnimationName, ExpressionCue, GestureCue } from "./stickman";
import { plan } from "./stickman/gestures";
import type { Cue } from "./stickman/mouth";

const vox = theme.vox;
const BEATS = script.beats;

/** The gesture track for the whole episode, computed once at module load.
 *  It depends only on JSON that is fixed at build time, so recomputing it per
 *  frame would be 1100 wasted regex passes a second. */
const GESTURES = plan(BEATS, voice.beats);

/** Beat number -> its viseme track, same reasoning. */
const LIPS = new Map(
  visemes.beats.map((b) => [b.n, b as { n: number; start: number; cues: Cue[]; env: number[] }]),
);

/** Where the character stands, and how tall, per orientation.
 *
 *  In 9:16 he owns the lower third and the type sits above him — the phone is
 *  held so the bottom of the frame is nearest the thumb and furthest from the
 *  eye, which is where a presenter belongs and where text does not.
 *  In 16:9 he takes the left third and the page runs beside him.
 *
 *  The text column clears the figure in both: `textBottom` (portrait) ends a
 *  beat's headroom above the top of his head, and in landscape the column
 *  starts where his box ends. */
function staging(width: number, height: number) {
  const portrait = height > width;
  return portrait
    ? {
        height: height * 0.42,
        x: 0.5,
        y: 0.9,
        // Head top sits at ~0.48 of the height; the type stops at 0.44.
        textTop: 0.12,
        textBottom: 0.44,
        textLeft: 0.07,
        textRight: 0.93,
        centered: true,
      }
    : {
        height: height * 0.72,
        x: 0.22,
        y: 0.97,
        textTop: 0.16,
        textBottom: 0.84,
        textLeft: 0.44,
        textRight: 0.93,
        centered: false,
      };
}

/**
 * The page beside the presenter: kicker, headline, and the narration.
 *
 * Deliberately less than a vox beat carries. The figure is the thing being
 * watched now, and a full kinetic treatment next to a moving character is two
 * things competing for one pair of eyes.
 */
const Page: React.FC<{
  beat: (typeof BEATS)[number];
  words: { w: string; start: number; end: number }[];
  t: number;
  dur: number;
}> = ({ beat, words, t, dur }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const s = staging(width, height);
  const io = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const enter = interpolate(frame, [0, 10], [0, 1], {
    ...io,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const out = interpolate(frame, [dur - 6, dur], [1, 0], io);

  const headline = beat.text || beat.hook || "";

  return (
    <div
      style={{
        position: "absolute",
        left: width * s.textLeft,
        right: width * (1 - s.textRight),
        top: height * s.textTop,
        bottom: height * (1 - s.textBottom),
        opacity: enter * out,
        transform: `translateY(${(1 - enter) * height * 0.02}px)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: height * 0.02,
        alignItems: s.centered ? "center" : "flex-start",
        textAlign: s.centered ? "center" : "left",
      }}
    >
      <Kicker text={beat.name} enter={frame} />
      {headline ? (
        <div
          style={{
            fontFamily: vox.font,
            fontWeight: 800,
            fontSize: width * (headline.length > 26 ? 0.072 : 0.095),
            lineHeight: 0.96,
            letterSpacing: -width * 0.002,
            color: vox.ink,
            textTransform: "uppercase",
            textWrap: "balance",
          }}
        >
          {headline}
        </div>
      ) : null}
      {/* The narration, word-lit. Under the headline rather than at the foot of
          the frame: down there it would be behind the presenter. */}
      {words.length ? (
        <div style={{ marginTop: height * 0.006 }}>
          <KineticText words={words} t={t} mode="caption" align={s.centered ? "center" : "left"} />
        </div>
      ) : null}
      {/* The beat's icon cards, laid one at a time like cards being dealt. They
          carry the rule beats — the mechanism is a list of three, and the cards
          are that list made visible. */}
      {beat.icons && beat.icons.length ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: s.centered ? "center" : "flex-start",
            gap: height * 0.012,
            marginTop: height * 0.012,
          }}
        >
          {beat.icons.map((chip, i) => {
            const dealt = spring({
              frame: frame - 10 - i * 7,
              fps,
              config: { damping: 200, mass: 0.6, stiffness: 190 },
              durationInFrames: 12,
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: width * 0.014,
                  padding: `${width * 0.016}px ${width * 0.026}px`,
                  background: vox.paper,
                  border: `${width * 0.0035}px solid ${vox.rule}`,
                  boxShadow: `0 ${width * 0.012}px ${width * 0.03}px rgba(26,26,26,.10)`,
                  clipPath: `inset(0 ${Math.max(0, (1 - dealt) * 100)}% 0 0)`,
                  transform: `translateY(${interpolate(dealt, [0, 1], [width * 0.014, 0])}px)`,
                }}
              >
                <LineIcon name={chip.icon} size={width * 0.052} color={vox.accent} />
                <span
                  style={{
                    fontFamily: vox.font,
                    fontWeight: 700,
                    fontSize: width * 0.033,
                    letterSpacing: -width * 0.0004,
                    color: vox.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  {chip.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const IMPACT = IMPACT_AT || (BEATS.length ? BEATS[BEATS.length - 1].start : 0);

/**
 * The impact word: a big accent-red word that slams into the frame on its hit,
 * full-width and centred so it owns the text zone for the beat.
 *
 * It starts huge and slightly cocked — 2.2×, −4° — and settles to 1×/0° on a
 * spring, which is the difference between a word appearing and a word landing.
 * Opacity snaps on in two frames so the eye is on the shape, not the fade.
 */
const Slam: React.FC<{ word: string; at: number }> = ({ word, at }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const hit = frame - Math.round(at * fps);
  const tSec = hit / fps;
  const s = spring({
    frame: Math.max(0, hit),
    fps,
    config: { damping: 12, mass: 0.6, stiffness: 180 },
  });
  const scale = interpolate(s, [0, 1], [2.2, 1]);
  const rotate = interpolate(s, [0, 1], [-4, 0]);
  // A slam is a hit, not a sign: it owns the frame for exactly one second,
  // then gets out of the way of the line that follows.
  const out = interpolate(tSec, [1, 1.14], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = hit < 0 ? 0 : hit < 2 ? hit / 2 : out;
  const exitScale = interpolate(tSec, [1, 1.14], [1, 0.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const size = width * (word.length > 7 ? 0.13 : 0.17);
  if (out <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: height * 0.29,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: vox.font,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: -width * 0.007,
          color: vox.accent,
          textTransform: "uppercase",
          transform: `rotate(${rotate}deg) scale(${scale * exitScale})`,
          textShadow: `0 ${width * 0.01}px 0 rgba(26,26,26,.16)`,
        }}
      >
        {word}
      </div>
    </div>
  );
};

export const StickmanExplain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const { scale } = usePlanCamera(IMPACT, 0);
  const s = staging(width, height);

  // The scene punches on each slam hit: a 3.5% kick that decays over nine
  // frames, so the word lands at the same moment the page jumps under it.
  const slamming = BEATS.find(
    (b) =>
      frame >= b.start * fps &&
      frame < b.end * fps &&
      (b as { slam?: { word: string; at: number } }).slam,
  );
  const punch = !slamming
    ? 1
    : Math.max(
        1,
        1 +
          0.035 *
            (1 -
              Math.min(
                9,
                Math.max(0, frame - (slamming.start + (slamming as { slam: { at: number } }).slam.at) * fps),
              ) /
                9),
      );

  // Which take is sounding right now. The mouth follows the audio, not the
  // beat boundaries: a take that runs a few frames past its beat should keep
  // moving the lips rather than snapping shut on a scene change.
  const take = voice.beats.find(
    (b) =>
      b.words.length > 0 &&
      t >= b.start - 0.1 &&
      t < b.start + b.words[b.words.length - 1].end + 0.35,
  );
  const lips = take ? LIPS.get(take.n) : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: vox.paper }}>
      <PaperBG />

      {/* The page is inside the camera, the presenter is not. A camera push on
          the type is a page being leaned into; the same push on the figure is
          him growing, which is a different and much worse idea. */}
      <AbsoluteFill style={{ transform: `scale(${scale * punch})` }}>
        {BEATS.map((beat) => {
          const dur = Math.round((beat.end - beat.start) * fps);
          const b = voice.beats.find((x) => x.n === beat.n);
          return (
            <Sequence
              key={beat.n}
              name={`${beat.n}. ${beat.name}`}
              from={Math.round(beat.start * fps)}
              durationInFrames={dur}
            >
              <Page beat={beat} words={b?.words ?? []} t={t - beat.start} dur={dur} />
              <AmbientIcons beat={beat} />
              {(beat as { slam?: { word: string; at: number } }).slam ? (
                <Slam
                  word={(beat as { slam: { word: string; at: number } }).slam.word}
                  at={(beat as { slam: { word: string; at: number } }).slam.at}
                />
              ) : null}
            </Sequence>
          );
        })}
      </AbsoluteFill>

      {/* A ground line, so he is standing on the page rather than floating over
          it. One stroke; the shadow in Stickman does the rest. */}
      <div
        style={{
          position: "absolute",
          left: width * 0.06,
          right: width * 0.06,
          top: height * s.y,
          height: 3,
          background: vox.rule,
          opacity: 0.55,
        }}
      />

      <Stickman
        t={t}
        cues={lips?.cues}
        env={lips?.env}
        envHz={visemes.envHz}
        beatT={take ? t - take.start : 0}
        gestures={GESTURES}
        height={s.height}
        x={s.x}
        y={s.y}
      />

      <Soundtrack impact={IMPACT} />
    </AbsoluteFill>
  );
};

/** Icons that drift down the side gutters while a beat plays — the motion
 *  graphics layer. They sit beside the presenter, never under the type, and
 *  stay faint enough that they read as atmosphere rather than content.
 *  The rule beats float their own icon set; the rest pick from a rotation. */
const AMBIENT_ICONS = [
  "Coins", "TrendingUp", "PiggyBank", "Wallet", "Repeat2",
  "Timer", "ListChecks", "CircleDollarSign", "ArrowUpRight", "LineChart",
];

const AmbientIcons: React.FC<{ beat: (typeof BEATS)[number] }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const names = beat.icons?.length
    ? beat.icons.map((c) => c.icon)
    : [0, 1, 2].map((i) => AMBIENT_ICONS[(beat.n * 3 + i) % AMBIENT_ICONS.length]);
  const spots = [
    { x: 0.04, y: 0.5 },
    { x: 0.95, y: 0.62 },
    { x: 0.045, y: 0.78 },
  ];
  const enter = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {names.slice(0, 3).map((name, i) => {
        const bob = Math.sin(frame / 26 + i * 2.1) * height * 0.004;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: width * spots[i].x,
              top: height * spots[i].y,
              transform: `translateY(${bob}px) rotate(${i % 2 ? 9 : -7}deg)`,
              opacity: 0.16 * enter,
            }}
          >
            <LineIcon name={name} size={width * 0.048} color={vox.ink} stroke={1.3} />
          </div>
        );
      })}
    </>
  );
};

/**
 * A rig test. Not part of any episode — it exists so the pose library, the
 * expressions and the animation layers can be looked at without rendering a
 * whole read, which is the difference between fixing a gesture in a minute and
 * fixing it in twenty.
 *
 * The main figure walks a scripted track: pose, expression and behaviour cues
 * that the rig blends between, the same way an episode would drive them. The
 * small figure at the top runs the lip-sync track so the mouth can be checked
 * against the voice.
 */
export const StickmanLab: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const dur = Math.round(8 * fps);
  // Empty until tools/lipsync.mjs has run. The lab is the first thing anyone
  // opens on a fresh clone, and crashing there is a bad introduction.
  const first = (visemes.beats[0] ?? { cues: [], env: [], start: 0 }) as {
    cues: Cue[];
    env: number[];
    start: number;
  };

  // A scripted showcase: every ~1.4s the track hands the rig a new pose,
  // expression and behaviour. The rig blends between them; the labels at the
  // top say what is on screen so each one can be judged on its own.
  const gestures: GestureCue[] = [
    { t: 0.1, pose: "point_right", hold: 1.4 },
    { t: 1.55, pose: "explaining", hold: 1.3 },
    { t: 2.9, pose: "arms_crossed", hold: 1.35 },
    { t: 4.3, pose: "shocked", hold: 1.0 },
    { t: 5.35, pose: "holding_money", hold: 1.2 },
    { t: 6.6, pose: "celebrating", hold: 1.3 },
  ];
  const expressions: ExpressionCue[] = [
    { t: 0.1, expression: "confident", hold: 1.4 },
    { t: 1.55, expression: "happy", hold: 1.3 },
    { t: 2.9, expression: "thinking", hold: 1.35 },
    { t: 4.3, expression: "shocked", hold: 1.0 },
    { t: 5.35, expression: "excited", hold: 1.2 },
    { t: 6.6, expression: "laughing", hold: 1.3 },
  ];

  // Behaviour windows: react at the shock, celebrate at the payoff, and drift
  // into idle elsewhere. "talking" is on through the middle so the arms have
  // the explaining micro-motion even without an audio take.
  const animation: AnimationName =
    t >= 4.3 && t < 5.35 ? "reacting"
    : t >= 6.6 ? "celebrating"
    : t >= 1.55 && t < 4.3 ? "talking"
    : "idle";

  // What is on screen right now, for the label.
  const active = (cues: { t: number; pose?: string; expression?: string; hold: number }[]) => {
    let name = "neutral";
    for (const c of cues) {
      if (c.t > t) break;
      name = (c.pose ?? c.expression) ?? name;
    }
    return name;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: vox.paper }}>
      <PaperBG />
      <Stickman
        t={t}
        gestures={gestures}
        expressions={expressions}
        animation={animation}
        lookAt={t >= 0.1 && t < 1.55 ? { x: width * 0.72, y: height * 0.55 } : null}
        height={height * 0.72}
        x={0.5}
        y={0.97}
        enter="slideIn"
        exit="fadeOut"
        dur={dur}
      />

      {/* The lip-sync check figure: same rig, voice track driving the mouth. */}
      <Stickman
        t={t}
        cues={first.cues as Cue[]}
        env={first.env}
        envHz={visemes.envHz}
        beatT={t}
        height={height * 0.24}
        x={0.5}
        y={0.2}
        opacity={0.85}
      />

      <div
        style={{
          position: "absolute",
          left: width * 0.06,
          top: height * 0.03,
          fontFamily: vox.font,
          fontSize: width * 0.028,
          color: vox.muted,
          lineHeight: 1.6,
        }}
      >
        {t.toFixed(2)}s · frame {frame}
        <br />
        pose {active(gestures)} · anim {animation}
      </div>
    </AbsoluteFill>
  );
};
