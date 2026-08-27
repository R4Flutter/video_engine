import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

export const DipToWhite: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const dipOpacity = interpolate(eased, [0, 1], [0, 1]);
  const imgOpacity = interpolate(eased, [0, 1], [1, 0]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "white",
          opacity: dipOpacity,
        }}
      />
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: imgOpacity,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};