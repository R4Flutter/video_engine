import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type Pt = { x: number; y: number };

const DEFAULT_PATH: Pt[] = [
  { x: 0.3, y: 0.3 },
  { x: 0.7, y: 0.3 },
  { x: 0.7, y: 0.7 },
  { x: 0.3, y: 0.7 },
];

/**
 * Linearly interpolate a position along `path` at parameter `t` (0..1).
 * If `t` is out of range, the result is clamped to the path endpoints.
 */
function interpPath(path: Pt[], t: number): Pt {
  if (path.length === 0) return { x: 0.5, y: 0.5 };
  if (path.length === 1) return path[0];
  const tt = Math.max(0, Math.min(1, t));
  const segments = path.length - 1;
  const segIdx = Math.min(Math.floor(tt * segments), segments - 1);
  const segT = tt * segments - segIdx;
  const a = path[segIdx];
  const b = path[segIdx + 1];
  return {
    x: a.x + (b.x - a.x) * segT,
    y: a.y + (b.y - a.y) * segT,
  };
}

/**
 * MovingSpotlight — a bright center / dark edges overlay whose bright center
 * moves along a `config.path` (array of {x, y} in 0..1 source coordinates).
 * The overlay's opacity fades in over `durationInFrames`.
 */
export const MovingSpotlight: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 90,
  delay = 0,
  intensity = 1,
  style,
  className,
  config,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const opacity = interpolate(eased, [0, 1], [0, 0.85 * intensity]);
  const path: Pt[] = (config?.path as Pt[] | undefined) || DEFAULT_PATH;
  const target = interpPath(path, eased);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${target.x * 100}% ${target.y * 100}%, transparent 18%, rgba(0,0,0,0.9) 70%)`,
          opacity,
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
