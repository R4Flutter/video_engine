import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export const CrackReveal: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 40, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const crackLen = interpolate(t, [0, 1], [0, 200 * intensity]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: `${crackLen}px`,
          height: "2px",
          background: "black",
          transform: "translate(-50%, -50%)",
        }}
      />
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </AbsoluteFill>
  );
};