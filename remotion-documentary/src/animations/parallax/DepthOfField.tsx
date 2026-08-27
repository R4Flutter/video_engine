import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type Layer = { src: string; depth: number };
type DoFConfig = {
  layers?: Layer[];
  /** max foreground scale, default 1.05 */
  fgScale?: number;
  /** max background blur px, default 6 */
  bgBlur?: number;
};

const DEFAULT_LAYERS: Layer[] = [
  { src: "", depth: 1.0 },
  { src: "", depth: 1.05 },
];

/**
 * DepthOfField — shallow DoF look. Foreground scale grows to fgScale, background
 * blur grows to bgBlur. Animates over the duration so it feels like the camera
 * "settles into focus" instead of just popping into the look.
 */
export const DepthOfField: React.FC<BaseEffectProps & { config?: any }> = ({
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

  const cfg = (config as DoFConfig | undefined) ?? {};
  const fgScaleMax = (typeof cfg.fgScale === "number" ? cfg.fgScale : 1.05) * intensity;
  const bgBlurMax = (typeof cfg.bgBlur === "number" ? cfg.bgBlur : 6) * intensity;

  const input = cfg.layers && cfg.layers.length >= 2 ? cfg.layers : DEFAULT_LAYERS;
  const layers: Layer[] = input.slice(0, 6).map((l, i) => ({
    src: l.src || (i === 0 ? (typeof image === "string" ? image : "") : ""),
    depth: typeof l.depth === "number" ? l.depth : 1 + 0.05 * i,
  }));

  // Foreground = highest depth; Background = lowest
  const depths = layers.map((l) => l.depth);
  const maxD = Math.max(...depths);
  const minD = Math.min(...depths);
  const span = maxD - minD || 1;

  return (
    <AbsoluteFill style={style} className={className}>
      {layers.map((layer, i) => {
        // Normalize this layer's depth to 0..1
        const norm = span > 0 ? (layer.depth - minD) / span : 0.5;
        const isForeground = layer.depth === maxD;
        const isBackground = layer.depth === minD;

        const scale = isForeground
          ? interpolate(eased, [0, 1], [1, fgScaleMax])
          : 1;
        const blur = isBackground
          ? interpolate(eased, [0, 1], [0, bgBlurMax])
          : 0;

        return (
          <Img
            key={`dof-${i}-${layer.src}`}
            src={layer.src}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              filter: `blur(${blur}px)`,
              willChange: "transform, filter",
            }}
          />
        );
      })}
      {children}
    </AbsoluteFill>
  );
};
