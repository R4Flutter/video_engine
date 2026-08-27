import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type DriftConfig = {
  bg?: string;
  fg?: string;
  /** percent of width the background drifts, default 4 (negative = leftward) */
  amount?: number;
};

const DEFAULTS = { amount: -4 };

/**
 * BackgroundDrift — foreground anchored, background slides 4% to the left.
 * Perceived as "camera pushing past the subject, world receding behind them."
 * Negative sign on the default amount keeps the bg moving opposite of the
 * foreground-drift sibling for that "deeper" cinematic feel.
 */
export const BackgroundDrift: React.FC<BaseEffectProps & { config?: any }> = ({
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

  const bgTranslateX = interpolate(eased, [0, 1], [0, (amount / 100) * width]);
  // Tiny bg scale-up to mask the edges as it slides
  const bgScale = interpolate(eased, [0, 1], [1, 1.05 * intensity]);

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
          transform: `translateX(${bgTranslateX}px) scale(${bgScale})`,
          transformOrigin: "center center",
          willChange: "transform",
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
          }}
        />
      ) : null}
      {children}
    </AbsoluteFill>
  );
};
