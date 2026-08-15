// Reusable visual vocabulary: everything a finance scene is built from.
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { H, POP, theme, W } from "./theme";

const { color } = theme;

/** Dark teal stage: glow, vignette, dot grid. Drifts so no frame is static. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 120) * 18;
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 45% at 50% ${42 + drift / 12}%, ${color.bgGlow} 0%, transparent 70%)`,
        }}
      />
      <svg width={W} height={H} style={{ position: "absolute", opacity: 0.22 }}>
        <defs>
          <pattern id="dots" width={56} height={56} patternUnits="userSpaceOnUse">
            <circle cx={2} cy={2} r={2} fill={color.dim} />
          </pattern>
        </defs>
        <rect
          x={-56}
          y={-56}
          width={W + 112}
          height={H + 112}
          fill="url(#dots)"
          transform={`translate(${drift} ${-drift})`}
        />
      </svg>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, transparent 35%, ${color.ink} 100%)`,
          opacity: 0.85,
        }}
      />
    </AbsoluteFill>
  );
};

/** Soft contact shadow so objects sit on the floor instead of floating. */
export const Ground: React.FC<{ x: number; y: number; w: number; o?: number }> = ({
  x,
  y,
  w,
  o = 0.5,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - w / 12,
      width: w,
      height: w / 6,
      borderRadius: "50%",
      background: `radial-gradient(ellipse at center, rgba(0,0,0,${o}) 0%, transparent 70%)`,
    }}
  />
);

export const Coin: React.FC<{
  x: number;
  y: number;
  size: number;
  rot?: number;
  tilt?: number;
  opacity?: number;
}> = ({ x, y, size, rot = 0, tilt = 1, opacity = 1 }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      opacity,
      transform: `rotate(${rot}deg) scaleX(${tilt})`,
      filter: `drop-shadow(0 ${size / 14}px ${size / 8}px rgba(0,0,0,.45))`,
    }}
  >
    <defs>
      <radialGradient id="cg" cx="35%" cy="30%">
        <stop offset="0%" stopColor={color.goldLight} />
        <stop offset="55%" stopColor={color.gold} />
        <stop offset="100%" stopColor={color.goldDeep} />
      </radialGradient>
    </defs>
    <circle cx={50} cy={50} r={48} fill="url(#cg)" />
    <circle cx={50} cy={50} r={39} fill="none" stroke={color.goldDeep} strokeWidth={3} opacity={0.55} />
    <text
      x={50}
      y={68}
      textAnchor="middle"
      fontFamily={theme.font}
      fontWeight={800}
      fontSize={52}
      fill={color.goldDeep}
    >
      $
    </text>
  </svg>
);

/** Glass jar. `fill` 0..1 raises the gold level; >1 spills over the rim. */
export const Jar: React.FC<{
  x: number;
  bottom: number;
  h: number;
  fill: number;
}> = ({ x, bottom, h, fill }) => {
  const w = h * 0.8;
  const level = Math.min(fill, 1);
  return (
    <svg
      viewBox="0 0 200 240"
      width={w}
      height={h}
      style={{ position: "absolute", left: x - w / 2, top: bottom - h }}
    >
      <defs>
        <linearGradient id="gold" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color.goldDeep} />
          <stop offset="100%" stopColor={color.gold} />
        </linearGradient>
        <clipPath id="jarClip">
          <path d="M22 48 h156 a10 10 0 0 1 10 10 v160 a14 14 0 0 1 -14 14 h-148 a14 14 0 0 1 -14 -14 v-160 a10 10 0 0 1 10 -10 z" />
        </clipPath>
      </defs>
      <g clipPath="url(#jarClip)">
        <rect x={0} y={0} width={200} height={240} fill="rgba(255,255,255,.05)" />
        <rect x={0} y={232 - level * 184} width={200} height={240} fill="url(#gold)" />
        <ellipse
          cx={100}
          cy={232 - level * 184}
          rx={92}
          ry={9}
          fill={color.goldLight}
          opacity={level > 0.02 ? 0.9 : 0}
        />
      </g>
      <path
        d="M22 48 h156 a10 10 0 0 1 10 10 v160 a14 14 0 0 1 -14 14 h-148 a14 14 0 0 1 -14 -14 v-160 a10 10 0 0 1 10 -10 z"
        fill="none"
        stroke={color.text}
        strokeWidth={5}
        opacity={0.45}
      />
      <rect x={8} y={20} width={184} height={30} rx={14} fill="none" stroke={color.text} strokeWidth={5} opacity={0.55} />
      <rect x={44} y={70} width={12} height={120} rx={6} fill={color.text} opacity={0.13} />
    </svg>
  );
};

/** Compounding curve, drawn left to right with a glowing head. */
export const GrowthChart: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  progress: number;
}> = ({ x, y, w, h, progress }) => {
  const curve = (t: number) => (Math.pow(12, t) - 1) / 11; // 0..1, compounding
  const pts = Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    return [t * w, h - curve(t) * h] as const;
  });
  const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${px} ${py}`).join(" ");
  const head = [progress * w, h - curve(progress) * h] as const;
  return (
    <svg
      width={w}
      height={h + 40}
      style={{ position: "absolute", left: x, top: y, overflow: "visible" }}
    >
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color.green} stopOpacity={0.42} />
          <stop offset="100%" stopColor={color.green} stopOpacity={0} />
        </linearGradient>
        <clipPath id="reveal">
          <rect x={0} y={-40} width={progress * w} height={h + 80} />
        </clipPath>
      </defs>
      <line x1={0} y1={h} x2={w} y2={h} stroke={color.dim} strokeWidth={3} opacity={0.5} />
      <g clipPath="url(#reveal)">
        <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#area)" />
        <path
          d={d}
          fill="none"
          stroke={color.green}
          strokeWidth={10}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 18px ${color.green})` }}
        />
      </g>
      {progress > 0.01 && progress < 0.999 ? (
        <circle cx={head[0]} cy={head[1]} r={14} fill={color.text} style={{ filter: `drop-shadow(0 0 22px ${color.green})` }} />
      ) : null}
    </svg>
  );
};

/**
 * A deterministic pile of coins in a triangle. `grow` 0..1 raises it out of the
 * floor; the same seed always lays the coins down in the same place.
 */
export const CoinPile: React.FC<{
  x: number;
  baseY: number;
  w: number;
  h: number;
  grow: number;
  count?: number;
  seed?: string;
}> = ({ x, baseY, w, h, grow, count = 90, seed = "pile" }) => {
  const coins = Array.from({ length: count }, (_, i) => {
    const t = random(`${seed}y${i}`) ** 0.62; // denser at the base
    const rowW = w * (1 - t * 0.88);
    return {
      dx: (random(`${seed}x${i}`) - 0.5) * rowW,
      dy: -t * h,
      size: w * (0.085 + random(`${seed}s${i}`) * 0.02),
      rot: random(`${seed}r${i}`) * 60 - 30,
      t,
    };
  }).sort((a, b) => a.dy - b.dy);
  return (
    <>
      <Ground x={x} y={baseY + 6} w={w * 1.15} o={0.55} />
      {coins.map((c, i) =>
        c.t <= grow ? (
          <Coin
            key={i}
            x={x + c.dx}
            y={baseY + c.dy}
            size={c.size}
            rot={c.rot}
            opacity={interpolate(grow - c.t, [0, 0.04], [0, 1], { extrapolateRight: "clamp" })}
          />
        ) : null,
      )}
    </>
  );
};

/** Stamped gold badge with a ring ripple. */
export const Badge: React.FC<{
  x: number;
  y: number;
  size: number;
  label: string;
  enter: number;
}> = ({ x, y, size, label, enter }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: enter, fps, config: POP, durationInFrames: 22 });
  const ripple = interpolate(enter, [0, 26], [0.9, 2.1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        transform: `scale(${interpolate(s, [0, 1], [2.4, 1])})`,
        opacity: s,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `4px solid ${color.gold}`,
          transform: `scale(${ripple})`,
          opacity: interpolate(enter, [0, 26], [0.7, 0], { extrapolateRight: "clamp" }),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 34% 28%, ${color.goldLight}, ${color.gold} 55%, ${color.goldDeep})`,
          border: `${size * 0.03}px solid ${color.goldLight}`,
          outline: `${size * 0.02}px solid ${color.goldDeep}`,
          outlineOffset: -size * 0.09,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.font,
          fontWeight: 900,
          fontSize: size * 0.2,
          color: color.ink,
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: -1,
          boxShadow: `0 0 60px ${color.gold}55`,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const Sparkles: React.FC<{
  x: number;
  y: number;
  spread: number;
  frame: number;
  count?: number;
  seed?: string;
}> = ({ x, y, spread, frame, count = 26, seed = "sp" }) => (
  <>
    {Array.from({ length: count }, (_, i) => {
      const life = 30 + random(`${seed}l${i}`) * 26;
      const t = ((frame + random(`${seed}o${i}`) * life) % life) / life;
      const a = random(`${seed}a${i}`) * Math.PI * 2;
      const r = spread * (0.25 + random(`${seed}r${i}`) * 0.75) * t;
      const s = 6 + random(`${seed}s${i}`) * 12;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x + Math.cos(a) * r,
            top: y + Math.sin(a) * r - t * 60,
            width: s,
            height: s,
            borderRadius: "50%",
            background: color.goldLight,
            opacity: Math.sin(t * Math.PI) * 0.9,
            boxShadow: `0 0 ${s * 2}px ${color.gold}`,
          }}
        />
      );
    })}
  </>
);

/**
 * The presenter. One cutout, moved with intent: `h` is his height in px, `y`
 * his feet. Poses come from stage position, facing and the beat-synced hop.
 */
export const Character: React.FC<{
  x: number;
  y: number;
  h: number;
  face?: "left" | "right";
  hop?: number;
  lean?: number;
  opacity?: number;
}> = ({ x, y, h, face = "right", hop = 0, lean = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const w = h * (249 / 659);
  const bob = Math.sin(frame / 14) * h * 0.006;
  return (
    <>
      <Ground x={x} y={y} w={w * 1.5} o={0.45 * opacity} />
      <Img
        src={staticFile("character.png")}
        style={{
          position: "absolute",
          left: x - w / 2,
          top: y - h - hop + bob,
          width: w,
          height: h,
          opacity,
          transform: `scaleX(${face === "left" ? -1 : 1}) rotate(${lean}deg)`,
          transformOrigin: "50% 100%",
          filter: "drop-shadow(0 24px 40px rgba(0,0,0,.5))",
        }}
      />
    </>
  );
};
