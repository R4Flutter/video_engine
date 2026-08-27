import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeInOutSine } from "../timing/easings";

type Layer = { src: string; depth: number };
type RackConfig = {
  layers?: Layer[];
  /** max blur at the extremes (fg at t=1, bg at t=0), default 6 (px) */
  maxBlur?: number;
};

const DEFAULT_LAYERS: Layer[] = [
  { src: "", depth: 1.0 },
  { src: "", depth: 1.05 },
];

/**
 * RackFocus — start with foreground sharp + background blurred, end with
 * background sharp + foreground blurred. Midway (t=0.5) both layers pass
 * through a roughly equal "transitional" blur, which sells the rack.
 *
 * Easing: easeInOutSine so the focus pull feels organic, not linear.
 *
 * Layer rule: highest depth = foreground, lowest = background. Mid-depth
 * layers (if any) interpolate their blur between the two extremes.
 */
export const RackFocus: React.FC<BaseEffectProps & { config?: any }> = ({
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
  const eased = easeInOutSine(t);

  const cfg = (config as RackConfig | undefined) ?? {};
  const maxBlur = (typeof cfg.maxBlur === "number" ? cfg.maxBlur : 6) * intensity;

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
    <AbsoluteFill style={style} className={className}>
      {layers.map((layer, i) => {
        // 0 = background, 1 = foreground
        const norm = span > 0 ? (layer.depth - minD) / span : 0.5;
        // Foreground's blur grows with t, background's blur shrinks with t.
        // Mid-depth layers split the difference.
        const fgWeight = norm; // 1 for foreground
        const bgWeight = 1 - norm; // 1 for background
        // Each layer's blur = fgWeight * (t * max) + bgWeight * ((1-t) * max)
        // At t=0: foreground 0, background max.
        // At t=1: foreground max, background 0.
        // At t=0.5: every layer sits at (norm + (1-norm)) * 0.5 * max = 0.5 * max.
        const blur = (fgWeight * eased + bgWeight * (1 - eased)) * maxBlur;
        // Subtle scale to keep blurred edges from showing
        const scale = 1 + 0.04 * (blur / Math.max(0.0001, maxBlur));
        return (
          <Img
            key={`rack-${i}-${layer.src}`}
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
