import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type Layer = { src: string; depth: number };
type BlurConfig = {
  layers?: Layer[];
  /** max blur on foreground, default 6 (px) */
  amount?: number;
};

const DEFAULT_LAYERS: Layer[] = [
  { src: "", depth: 1.0 },
  { src: "", depth: 1.05 },
];

/**
 * ForegroundBlur — background stays tack-sharp, foreground blurs 0 → amount over
 * the duration. Reads as "camera pulls focus to the background" or "subject in
 * front falls out of focus as we reveal what's behind it."
 */
export const ForegroundBlur: React.FC<BaseEffectProps & { config?: any }> = ({
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

  const cfg = (config as BlurConfig | undefined) ?? {};
  const amount = (typeof cfg.amount === "number" ? cfg.amount : 6) * intensity;

  const input = cfg.layers && cfg.layers.length >= 2 ? cfg.layers : DEFAULT_LAYERS;
  const layers: Layer[] = input.slice(0, 6).map((l, i) => ({
    src: l.src || (i === 0 ? (typeof image === "string" ? image : "") : ""),
    depth: typeof l.depth === "number" ? l.depth : 1 + 0.05 * i,
  }));

  const maxD = Math.max(...layers.map((l) => l.depth));

  return (
    <AbsoluteFill style={style} className={className}>
      {layers.map((layer, i) => {
        const isForeground = layer.depth === maxD;
        // Tiny scale-up on the foreground while it blurs to mask edge artifacts
        const scale = isForeground ? interpolate(eased, [0, 1], [1, 1.03]) : 1;
        const blur = isForeground ? interpolate(eased, [0, 1], [0, amount]) : 0;
        return (
          <Img
            key={`fg-blur-${i}-${layer.src}`}
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
