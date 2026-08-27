import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const CORNER_OFFSETS: Record<Corner, { x: number; y: number }> = {
  topLeft: { x: -0.2, y: -0.2 },
  topRight: { x: 0.2, y: -0.2 },
  bottomLeft: { x: -0.2, y: 0.2 },
  bottomRight: { x: 0.2, y: 0.2 },
};

/**
 * DetailShot — scale 1 → 2.5, with translate pushing the chosen corner into
 * the center of the frame. Default corner = topRight.
 *
 * config.corner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" (default "topRight")
 */
export const DetailShot: React.FC<BaseEffectProps & { config?: any }> = ({
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
  const { width, height } = useVideoConfig();
  const corner: Corner = (config?.corner as Corner) ?? "topRight";
  const offset = CORNER_OFFSETS[corner];
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const scale = interpolate(eased, [0, 1], [1, 2.5 * intensity]);
  const tx = interpolate(eased, [0, 1], [0, -offset.x * width * intensity]);
  const ty = interpolate(eased, [0, 1], [0, -offset.y * height * intensity]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
          transformOrigin: "center center",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
