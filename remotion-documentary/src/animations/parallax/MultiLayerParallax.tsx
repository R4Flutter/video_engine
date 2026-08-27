import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

const useLayerTransform = (depth: number, t: number, intensity: number) => {
  const scale = 1 + (depth - 1) * intensity * t;
  const translateX = (depth - 1) * 20 * intensity * t;
  return {
    transform: `scale(${scale}) translateX(${translateX}px)`,
    transformOrigin: "center center",
  };
};

type ParallaxLayer = { src: string; depth: number };
type MultiLayerConfig = { layers?: ParallaxLayer[] };

/**
 * Normalize any input to a valid 2-6 layer stack with monotonically increasing depth.
 * Missing depths are interpolated evenly between 1.0 and a default max of 1.12.
 */
const buildLayers = (
  input: ParallaxLayer[] | undefined,
  fallbackSrc: string,
): ParallaxLayer[] => {
  const raw = input && input.length >= 2 ? input.slice(0, 6) : [];
  const count = Math.max(2, Math.min(6, raw.length || 4));
  const maxDepth = 1.12;
  return Array.from({ length: count }, (_, i) => {
    const r = raw[i];
    const depth =
      typeof r?.depth === "number"
        ? r.depth
        : 1 + (i / Math.max(1, count - 1)) * (maxDepth - 1);
    return {
      src: r?.src || (i === 0 ? fallbackSrc : ""),
      depth,
    };
  });
};

/**
 * MultiLayerParallax — flexible 2-6 layer depth stack. Each layer animates independently.
 * Default 4 layers with evenly spaced depths. Use when you've got a rich photo
 * composite (sky → skyline → midground → subject) and want each plane to feel real.
 */
export const MultiLayerParallax: React.FC<BaseEffectProps & { config?: any }> = ({
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

  const cfg = (config as MultiLayerConfig | undefined) ?? {};
  const layers = buildLayers(
    cfg.layers,
    typeof image === "string" ? image : "",
  );

  return (
    <AbsoluteFill style={style} className={className}>
      {layers.map((layer, i) => {
        const tStyle = useLayerTransform(layer.depth, eased, intensity);
        return (
          <Img
            key={`multi-layer-${i}-${layer.src || "empty"}-${layer.depth}`}
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
