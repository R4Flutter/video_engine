import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps, ReframeTarget } from "../../types";
import { cinema } from "../timing/easings";

const FACE_TARGET: ReframeTarget = { x: 0.5, y: 0.35, scale: 1.4 };

/**
 * FaceReframe — preset to head-height framing. Target = { x: 0.5, y: 0.35, scale: 1.4 }.
 * Use for portraits, talking heads, identity moments.
 */
export const FaceReframe: React.FC<BaseEffectProps & { config?: any }> = ({
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
    ...FACE_TARGET,
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
