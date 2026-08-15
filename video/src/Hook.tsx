// The frame-zero card.
//
// This is the fix for the one measured failure in the last upload: frame one
// was a blank page while the hook typed itself in underneath, and the complete
// claim did not exist until second five. A thumb decides in roughly four
// tenths of a second, so the video was judged on an empty rectangle.
//
// The card sits above everything carrying the complete hook at the largest type
// in the video, and then lifts.
//
// ---------------------------------------------------------------------------
// Second pass. The card originally lifted after a fixed 19 frames — 0.63s —
// on the theory that the module underneath would have assembled the claim by
// then. It had not. The narrator needs 2.96s to say "$96,000 becomes
// $525,000", and the kinetic layer is locked to the narrator, so at the moment
// the card cleared the page held only the words "$96,000". The viewer read the
// finished claim, watched it get taken away, and then watched it be rebuilt one
// word at a time. Three seconds of the most expensive real estate in the video
// spent repeating something already understood.
//
// So the card now holds for as long as the claim is being *spoken*, and clears
// on the first word that belongs to the next thought. The claim is stated once.
//
// Stillness for three seconds is its own risk, so the hold is not inert: each
// number takes the accent colour at the instant it is said, and the page drifts
// almost imperceptibly closer. The motion is tied to the read rather than
// decorating it — which is the only kind of motion a hook can afford.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { HOOK } from "./plan";
import voice from "./voice.json";

/** Frames the card takes to clear. Short: it is getting out of the way, not
 *  performing an exit. The background goes first and the type follows, so the
 *  line appears to settle into the overlay position rather than cross-fading
 *  with a smaller copy of itself — the same words at two sizes on the same
 *  frame reads as a mistake. */
const LIFT = 5;
const SETTLE = 9;

/** The spoken words the card is standing in for: the leading words of the first
 *  recorded take, as many as the director says the hook text accounts for. */
export const HOOK_WORDS = (() => {
  const first = voice.beats.find((b) => b.words.length > 0);
  if (!first || !HOOK.words) return [];
  return first.words.slice(0, HOOK.words);
})();

/**
 * When the card gets out of the way: the moment the *next* thought starts being
 * spoken, so the page is never between two ideas with nothing on it. Falls back
 * to the director's fixed hold when there is no recorded voice to follow.
 */
export const HOOK_CLEAR_SEC = (() => {
  const first = voice.beats.find((b) => b.words.length > 0);
  if (!first || !HOOK_WORDS.length) return HOOK.holdFrames / 30;
  const next = first.words[HOOK_WORDS.length];
  const lastSpoken = HOOK_WORDS[HOOK_WORDS.length - 1].end;
  // Hand over on the next word's attack. The lift and that word's arrival
  // overlap by a few frames, which reads as the claim making way for what
  // follows rather than as two separate events.
  return next ? next.start : lastSpoken + 0.2;
})();

/** Type size from length. The hook is always the largest type in the video,
 *  so this scales down only as far as it must to fit three lines. */
const sizeFor = (chars: number) =>
  chars <= 16 ? 172 : chars <= 26 ? 146 : chars <= 34 ? 124 : chars <= 46 ? 104 : 88;

export const FrameZeroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const hold = Math.max(HOOK.holdFrames, Math.round(HOOK_CLEAR_SEC * fps));

  if (!HOOK.text || hold <= 0 || frame > hold + SETTLE) return null;

  const vox = HOOK.engine === "vox";
  const paper = vox ? theme.vox.paper : theme.color.bg;
  const ink = vox ? theme.vox.ink : theme.color.text;
  const accent = vox ? theme.vox.accent : theme.color.gold;
  const font = vox ? theme.vox.font : theme.font;

  const io = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const out = Easing.bezier(0.32, 0, 0.24, 1);

  // No entrance animation. Frame one is the point, and an entrance is a frame
  // the viewer cannot read.
  const bg = interpolate(frame, [hold, hold + LIFT], [1, 0], { ...io, easing: Easing.linear });
  const settle = interpolate(frame, [hold, hold + SETTLE], [0, 1], { ...io, easing: out });

  const size = sizeFor(HOOK.text.length) * (width / 1080);
  // The overlay track draws this same line near the top of the frame at a
  // smaller size. The card lands on that mark as it goes, so the type appears
  // to take its place rather than dissolve into a duplicate.
  const target = theme.overlayY * (height / 1920);
  const rest = height / 2;

  // A page that sits perfectly still for three seconds reads as a freeze. This
  // is well under the threshold of noticing and well over the threshold of
  // feeling — the frame is alive without anything happening on it.
  const drift = interpolate(frame, [0, hold], [1, 1.025], { ...io, easing: Easing.linear });

  // Each token lights as it is said. Only when the card's words line up with the
  // read one-for-one — otherwise the whole line is plain ink, which is correct
  // and never wrong.
  const tokens = HOOK.text.split(/\s+/).filter(Boolean);
  const timed = tokens.length === HOOK_WORDS.length;
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ backgroundColor: paper, opacity: bg }} />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${width * 0.07}px`,
          transform: `translateY(${(target - rest) * settle * 0.9}px) scale(${
            drift * (1 - settle * 0.34)
          })`,
          opacity: 1 - settle,
        }}
      >
        <div
          style={{
            fontFamily: font,
            fontSize: size,
            fontWeight: 900,
            lineHeight: 0.94,
            letterSpacing: "-0.025em",
            color: ink,
            textAlign: "center",
            textWrap: "balance",
          }}
        >
          {timed
            ? tokens.map((tok, i) => {
                const said = t >= HOOK_WORDS[i].start;
                // The digits are the claim; the connecting word is not. Lighting
                // every token would just be a colour change sweeping the line.
                const carries = /[\d$%]/.test(tok);
                return (
                  <span
                    key={i}
                    // No CSS transition here: the colour is recomputed per frame
                    // from useCurrentFrame, and a wall-clock transition on top
                    // of that would flicker under a distributed render.
                    style={{ color: said && carries ? accent : ink }}
                  >
                    {tok}
                    {i < tokens.length - 1 ? " " : ""}
                  </span>
                );
              })
            : HOOK.text}
        </div>
      </AbsoluteFill>

      {/* One rule under the line. It gives the eye somewhere to stop, and it
          is the only decoration frame one can afford. It goes with the
          background, not with the type. */}
      <div
        style={{
          position: "absolute",
          bottom: "31%",
          left: "50%",
          transform: "translateX(-50%)",
          width: width * 0.16,
          height: Math.max(6, width * 0.009),
          backgroundColor: accent,
          opacity: bg,
        }}
      />
    </AbsoluteFill>
  );
};
