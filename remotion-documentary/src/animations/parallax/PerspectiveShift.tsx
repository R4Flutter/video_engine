import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type Layer = { src: string; depth: number };
type PerspectiveConfig = {
  layers?: Layer[];
  /** CSS perspective on the parent, default 1200 */
  perspective?: number;
  /** max rotateY in degrees (split across depth range), default 5 */
  maxAngle?: number;
};

const DEFAULT_LAYERS: Layer[] = [
  { src: "", depth: 1.0 },
  { src: "", depth: 1.05 },
];

/**
 * PerspectiveShift — CSS perspective(1200px) parent + per-layer rotateY proportional
 * to depth. Min-depth layer rotates one way, max-depth the other, mid stays at 0.
 * Sells "camera looking around a corner" or "leaning past a foreground subject."
 */
export const PerspectiveShift: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 100,
  delay = 0,
  intensity = 1,
  style,
  className,
  config,
}) => {
  const frame = useCurrentFrame();
  useVideoConfig();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);

  const cfg = (config as PerspectiveConfig | undefined) ?? {};
  const perspective = typeof cfg.perspective === "number" ? cfg.perspective : 1200;
  const maxAngle = (typeof cfg.maxAngle === "number" ? cfg.maxAngle : 5) * intensity;

  const input = cfg.layers && cfg.layers.length >= 2 ? cfg.layers : DEFAULT_LAYERS;
  const layers: Layer[] = input.slice(0, 6).map((l, i) => ({
    src: l.src || (i === 0 ? (typeof image === "string" ? image : "") : ""),
    depth: typeof l.depth === "number" ? l.depth : 1 + 0.05 * i,
  }));

  const depths = layers.map((l) => l.depth);
  const minD = Math.min(...depths);
  const maxD = Math.max(...depths);
  const span = maxD - minD || 1;

  return (
    <AbsoluteFill
      style={{
        perspective: `${perspective}px`,
        perspectiveOrigin: "center center",
        ...style,
      }}
      className={className}
    >
      {layers.map((layer, i) => {
        // Normalize depth to 0..1 across the range
        const norm = span > 0 ? (layer.depth - minD) / span : 0.5;
        // Map to -maxAngle..+maxAngle, eased
        const rotateY = interpolate(eased, [0, 1], [0, (norm - 0.5) * 2 * maxAngle]);
        // Subtle translateX to reinforce the rotation
        const translateX = (norm - 0.5) * 30 * intensity * eased;
        return (
          <Img
            key={`perspective-${i}-${layer.src}`}
            src={layer.src}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `rotateY(${rotateY}deg) translateX(${translateX}px)`,
              transformOrigin: "center center",
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          />
        );
      })}
      {children}
    </AbsoluteFill>
  );
};
