// The two text tracks: the big statement up top and the narration down low.
// Both are driven entirely by script.json, both stay inside the safe area.
import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { POP, theme, usd } from "./theme";

const { color, safe } = theme;

type TextCue = { at: number; text: string; anim: string };

/** Big words shrink so a long line never leaves the safe area. */
const sizeFor = (text: string) => (text.length > 40 ? 66 : text.length > 26 ? 82 : 104);

/** Numbers and $ amounts carry the message, so they get the gold. */
const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\$[\d.,]+[kMB]?|₹[\d,]+|\d+%|\b\d+\b)/g).map((part, i) =>
      /^(\$[\d.,]+[kMB]?|₹[\d,]+|\d+%|\d+)$/.test(part) ? (
        <span key={i} style={{ color: color.gold }}>
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    )}
  </>
);

/** "10 YEARS → ₹7,00,000" or "$2,400 A YEAR" rolls its amount up from zero. */
const CountUp: React.FC<{ text: string; frame: number }> = ({ text, frame }) => {
  const m = text.match(/([$₹])([\d,]+)/);
  if (!m) return <Rich text={text} />;
  const symbol = m[1];
  const target = Number(m[2].replace(/,/g, ""));
  const t = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const rolled =
    symbol === "$"
      ? usd(target * t)
      : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
          Math.round(target * t),
        );
  return <Rich text={text.replace(m[0], `${symbol}${rolled}`)} />;
};

const Typed: React.FC<{ text: string; frame: number }> = ({ text, frame }) => {
  const n = Math.round(interpolate(frame, [2, 2 + text.length * 1.4], [0, text.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  return (
    <>
      <Rich text={text.slice(0, n)} />
      {n < text.length ? <span style={{ color: color.gold }}>▌</span> : null}
    </>
  );
};

const Lines: React.FC<{ text: string; frame: number }> = ({ text, frame }) => (
  <>
    {text.split(/(?<=\.)\s+/).map((line, i) => (
      <div
        key={i}
        style={{
          opacity: interpolate(frame - i * 12, [0, 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Rich text={line} />
      </div>
    ))}
  </>
);

const Cue: React.FC<{ cue: TextCue; frame: number; life: number }> = ({ cue, frame, life }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: POP, durationInFrames: 20 });
  const out = interpolate(frame, [life - 8, life], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isFollow = /^FOLLOW/.test(cue.text);

  let transform = "";
  let clip: string | undefined;
  let opacity = out;

  if (cue.anim === "slam") {
    const shake = frame < 12 ? Math.sin(frame * 2.1) * (12 - frame) * 1.6 : 0;
    transform = `scale(${interpolate(pop, [0, 1], [1.9, 1])}) translate(${shake}px, ${shake * 0.4}px)`;
    opacity *= interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" });
  } else if (cue.anim === "wipe") {
    const p = interpolate(frame, [0, 16], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    clip = `inset(-20% ${(1 - p) * 100}% -20% 0)`;
    transform = `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`;
  } else if (cue.anim === "pop" || cue.anim === "count") {
    transform = `scale(${interpolate(pop, [0, 1], [0.72, 1])})`;
    opacity *= Math.min(1, pop * 2);
  } else if (cue.anim === "fade") {
    transform = `translateY(${interpolate(frame, [0, 20], [26, 0], { extrapolateRight: "clamp" })}px)`;
  }

  const body = isFollow ? (
    cue.text // gold-on-gold would vanish inside the pill
  ) : cue.anim === "count" ? (
      <CountUp text={cue.text} frame={frame} />
    ) : cue.anim === "type" ? (
      <Typed text={cue.text} frame={frame} />
    ) : cue.anim === "fade" ? (
      <Lines text={cue.text} frame={frame} />
    ) : (
      <Rich text={cue.text} />
    );

  return (
    <div
      style={{
        position: "absolute",
        top: theme.overlayY,
        left: safe.side,
        width: 1080 - safe.side * 2,
        textAlign: "center",
        fontFamily: theme.font,
        fontWeight: 900,
        fontSize: isFollow ? 40 : sizeFor(cue.text),
        whiteSpace: isFollow ? "nowrap" : undefined,
        lineHeight: 1.08,
        letterSpacing: -2,
        color: isFollow ? color.ink : color.text,
        textShadow: isFollow ? "none" : "0 10px 40px rgba(0,0,0,.65)",
        opacity,
        transform,
        clipPath: clip,
        ...(isFollow
          ? {
              background: `linear-gradient(180deg, ${color.goldLight}, ${color.gold})`,
              borderRadius: 999,
              padding: "24px 44px",
              width: "auto",
              left: "50%",
              marginLeft: 0,
              transformOrigin: "50% 50%",
              translate: "-50%",
              boxShadow: `0 20px 60px ${color.gold}44`,
            }
          : {}),
      }}
    >
      {body}
    </div>
  );
};

export const TextTrack: React.FC<{ cues: TextCue[]; total: number }> = ({ cues, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = cues
    .map((cue, i) => ({
      cue,
      from: Math.round(cue.at * fps),
      life: Math.round(((cues[i + 1]?.at ?? total) - cue.at) * fps),
    }))
    .find(({ from, life }) => frame >= from && frame < from + life);
  if (!active) return null;
  return <Cue cue={active.cue} frame={frame - active.from} life={active.life} />;
};

export type VoiceBeat = {
  n: number;
  start: number;
  words: { w: string; start: number; end: number }[];
};

/** A caption holds 3–4 words, or fewer when the sentence ends first. */
const chunk = (words: VoiceBeat["words"]) => {
  const groups: VoiceBeat["words"][] = [];
  for (const word of words) {
    const last = groups[groups.length - 1];
    if (!last || last.length >= 4 || /[.?!,]$/.test(last[last.length - 1].w)) {
      groups.push([word]);
    } else {
      last.push(word);
    }
  }
  return groups;
};

/**
 * Narration captions, timed by the recording. The word being said is the only
 * one that lights up, which is what keeps the eye on the line.
 */
export const CaptionTrack: React.FC<{
  beats: VoiceBeat[];
  skip: (n: number) => boolean;
}> = ({ beats, skip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const groups = React.useMemo(
    () => new Map(beats.map((b) => [b.n, chunk(b.words)])),
    [beats],
  );

  // Beat 1 speaks the hook and the outro speaks the CTA — both are already on
  // screen in full size, so a caption there is the same words twice.
  const beat = beats.find(
    (b) =>
      !skip(b.n) &&
      b.words.length > 0 &&
      t >= b.start &&
      t < b.start + b.words[b.words.length - 1].end,
  );
  if (!beat) return null;

  const local = t - beat.start;
  const group = groups.get(beat.n)!.find((g) => local < g[g.length - 1].end);
  if (!group) return null;

  const enter = (local - group[0].start) * fps;

  return (
    <div
      style={{
        position: "absolute",
        top: theme.captionY,
        left: safe.side,
        width: 1080 - safe.side * 2,
        textAlign: "center",
        fontFamily: theme.font,
        fontWeight: 800,
        fontSize: 52,
        lineHeight: 1.25,
        color: color.text,
        textShadow: "0 6px 24px rgba(0,0,0,.8)",
        opacity: interpolate(enter, [0, 4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${interpolate(enter, [0, 8], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
      }}
    >
      {group.map((word, i) => {
        const on = local >= word.start;
        const hit = interpolate(
          (local - word.start) * fps,
          [0, 4],
          [1.14, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 9px",
              color: on ? color.gold : color.text,
              opacity: on ? 1 : 0.55,
              transform: `scale(${on ? hit : 1})`,
            }}
          >
            {word.w}
          </span>
        );
      })}
    </div>
  );
};
