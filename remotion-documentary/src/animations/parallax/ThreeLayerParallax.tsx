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
type ThreeLayerConfig = { layers?: ParallaxLayer[] };

const DEFAULT_LAYERS: ParallaxLayer[] = [
  { src: "", depth: 1.0 },
  { src: "", depth: 1.04 },
  { src: "", depth: 1.08 },
];

/**
 * ThreeLayerParallax — bg / mid / fg with finer depth gradient. Default [1.0, 1.04, 1.08].
 * Smoother rolloff than 2-layer. Use when you have a real mid-ground (subject between
 * backdrop and foreground) and want cinematic depth.
 */
export const ThreeLayerParallax: React.FC<BaseEffectProps & { config?: any }> = ({
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

  const cfg = (config as ThreeLayerConfig | undefined) ?? {};
  const layers: ParallaxLayer[] = (cfg.layers && cfg.layers.length >= 3
    ? cfg.layers.slice(0, 3)
    : DEFAULT_LAYERS
  ).map((l, i) => ({
    src: l.src || (i === 0 ? (typeof image === "string" ? image : "") : ""),
    depth: typeof l.depth === "number" ? l.depth : 1 + 0.04 * i,
  }));

  return (
    <AbsoluteFill style={style} className={className}>
      {layers.map((layer, i) => {
        const tStyle = useLayerTransform(layer.depth, eased, intensity);
        return (
          <Img
            key={`three-layer-${i}-${layer.src}`}
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
