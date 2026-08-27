import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeInOutExpo } from "../timing/easings";

export const Flash: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 20, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeInOutExpo(t);
  const opacity = interpolate(eased, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "white",
          opacity,
        }}
      />
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 1 - opacity }}
      />
      {children}
    </AbsoluteFill>
  );
};