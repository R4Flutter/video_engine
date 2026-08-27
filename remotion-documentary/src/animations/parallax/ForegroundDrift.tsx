import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type DriftConfig = {
  bg?: string;
  fg?: string;
  /** percent of width to drift foreground, default 4 */
  amount?: number;
};

const DEFAULTS = { amount: 4 };

/**
 * ForegroundDrift — background anchored, foreground slides 4% to the right.
 * Classic "subject cuts free from backdrop" move. Direction is positive X
 * (rightward) by default; pass `amount: -4` to drift left.
 *
 * Accepts either `config.bg` + `config.fg` (named) or the BaseEffectProps
 * `image` prop as the background fallback.
 */
export const ForegroundDrift: React.FC<BaseEffectProps & { config?: any }> = ({
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
  const { width } = useVideoConfig();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);

  const cfg = (config as DriftConfig | undefined) ?? {};
  const amount = (typeof cfg.amount === "number" ? cfg.amount : DEFAULTS.amount) * intensity;
  const bgSrc = cfg.bg || (typeof image === "string" ? image : "");
  const fgSrc = cfg.fg || "";

  const fgTranslateX = interpolate(eased, [0, 1], [0, (amount / 100) * width]);
  // Subtle foreground scale to sell the parallax (1 → 1.04)
  const fgScale = interpolate(eased, [0, 1], [1, 1.04 * intensity]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={bgSrc}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {fgSrc ? (
        <Img
          src={fgSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translateX(${fgTranslateX}px) scale(${fgScale})`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        />
      ) : null}
      {children}
    </AbsoluteFill>
  );
};
