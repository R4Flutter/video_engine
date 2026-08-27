import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps, ReframeTarget } from "../../types";
import { cinema } from "../timing/easings";

const DETAIL_TARGET: ReframeTarget = { x: 0.5, y: 0.5, scale: 1.8 };

/**
 * DetailReveal — aggressive push-in to dead center. Target = { x: 0.5, y: 0.5, scale: 1.8 }.
 * Use sparingly for "look at THIS" moments — phone screen, document line, tiny object detail.
 */
export const DetailReveal: React.FC<BaseEffectProps & { config?: any }> = ({
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
    ...DETAIL_TARGET,
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
