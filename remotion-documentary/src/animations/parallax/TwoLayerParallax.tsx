import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

/**
 * Depth-driven transform helper used across the parallax category.
 * depth 1.0 = background (sits at scale 1.0, no offset).
 * depth 1.05+ = foreground (moves faster, scales slightly larger).
 * intensity scales the overall parallax strength.
 */
const useLayerTransform = (depth: number, t: number, intensity: number) => {
  const scale = 1 + (depth - 1) * intensity * t;
  const translateX = (depth - 1) * 20 * intensity * t; // px offset
  return {
    transform: `scale(${scale}) translateX(${translateX}px)`,
    transformOrigin: "center center",
  };
};

type ParallaxLayer = { src: string; depth: number };
type TwoLayerConfig = { layers?: ParallaxLayer[] };

const DEFAULT_LAYERS: ParallaxLayer[] = [
  { src: "", depth: 1.0 },
  { src: "", depth: 1.06 },
];

/**
 * TwoLayerParallax — classic bg/fg parallax. Two layers, default depth [1.0, 1.06].
 * Background anchors; foreground drifts slightly right + grows a hair to fake depth.
 * Use for split photo composites (city + skyline, person + background scene).
 */
export const TwoLayerParallax: React.FC<BaseEffectProps & { config?: any }> = ({
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
  useVideoConfig();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);

  const cfg = (config as TwoLayerConfig | undefined) ?? {};
  const layers: ParallaxLayer[] = (cfg.layers && cfg.layers.length >= 2
    ? cfg.layers.slice(0, 2)
    : DEFAULT_LAYERS
  ).map((l, i) => ({
    src: l.src || (i === 0 ? (typeof image === "string" ? image : "") : ""),
    depth: typeof l.depth === "number" ? l.depth : 1 + 0.06 * i,
  }));

  return (
    <AbsoluteFill style={style} className={className}>
      {layers.map((layer, i) => {
        const tStyle = useLayerTransform(layer.depth, eased, intensity);
        return (
          <Img
            key={`two-layer-${i}-${layer.src}`}
            src={layer.src}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              willChange: "transform",
              ...tStyle,
            }}
          />
        );
      })}
      {children}
    </AbsoluteFill>
  );
};
