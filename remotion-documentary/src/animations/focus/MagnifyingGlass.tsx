import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type Pt = { x: number; y: number };

const DEFAULT_TARGET: Pt = { x: 0.5, y: 0.5 };
const DEFAULT_PATH: Pt[] = [
  { x: 0.3, y: 0.4 },
  { x: 0.7, y: 0.5 },
  { x: 0.5, y: 0.7 },
];

function interpPath(path: Pt[], t: number): Pt {
  if (path.length === 0) return DEFAULT_TARGET;
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
 * MagnifyingGlass — a circular bubble that follows either a static
 * `config.target` ({x, y} in 0..1) or a `config.path` (array of {x, y}).
 * Inside the bubble, the image is shown at 2× magnification, centered on the
 * target point. The bubble itself is sized as a fraction of the viewport.
 */
export const MagnifyingGlass: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 60,
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
  const opacity = interpolate(eased, [0, 1], [0, 1 * intensity]);
  const popScale = interpolate(eased, [0, 1], [0.6, 1]);

  // Resolve target: path > static target > default center.
  const path = config?.path as Pt[] | undefined;
  const staticTarget = config?.target as Pt | undefined;
  const target: Pt = path
    ? interpPath(path, eased)
    : staticTarget ?? DEFAULT_TARGET;

  const imgSrc = typeof image === "string" ? image : "";
  // Background-size 200% (2x zoom). Background-position centers the target
  // point: with image at 2x, the target sits at (target.x*200, target.y*200)
  // of the background; we want it at (50, 50) of the magnifier, so shift the
  // top-left by (50 - target.x*200, 50 - target.y*200) percent.
  const bgX = (0.5 - target.x) * 200 + 50;
  const bgY = (0.5 - target.y) * 200 + 50;

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
          left: `${target.x * 100}%`,
          top: `${target.y * 100}%`,
          width: "26%",
          aspectRatio: "1 / 1",
          transform: `translate(-50%, -50%) scale(${popScale})`,
          borderRadius: "50%",
          overflow: "hidden",
          border: "4px solid white",
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.4)",
          opacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${imgSrc})`,
            backgroundSize: "200% 200%",
            backgroundPosition: `${bgX}% ${bgY}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
      {children}
    </AbsoluteFill>
  );
};
