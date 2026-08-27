import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps, ReframeTarget } from "../../types";
import { cinema } from "../timing/easings";

const DEFAULT_TARGET: ReframeTarget = { x: 0.5, y: 0.4, scale: 1.2 };

/**
 * SubjectReframe — pan + zoom to a `ReframeTarget` (x, y, scale in 0..1 normalized).
 * Default target = { x: 0.5, y: 0.4, scale: 1.2 } (slight upper-third bias).
 * Override via `config={{ target: { x, y, scale } }}`.
 */
export const SubjectReframe: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 75,
  delay = 0,
  intensity = 1,
  style,
  className,
  config,
}) => {
  const target: ReframeTarget = {
    ...DEFAULT_TARGET,
    ...(config?.target as Partial<ReframeTarget> | undefined),
  };

  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const finalScale = target.scale * intensity;
  const scale = interpolate(eased, [0, 1], [1, finalScale]);
  const tx = interpolate(
    eased,
    [0, 1],
    [0, (0.5 - target.x) * finalScale * width],
  );
  const ty = interpolate(
    eased,
    [0, 1],
    [0, (0.5 - target.y) * finalScale * height],
  );

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
