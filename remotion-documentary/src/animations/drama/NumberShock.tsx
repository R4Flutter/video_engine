import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeOutBack } from "../timing/easings";

export const NumberShock: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 45, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutBack(t);
  const scale = interpolate(eased, [0, 1], [1, 1.3 * intensity]);
  const flash = Math.floor(t * 6) % 2 === 0;

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: flash ? "brightness(200%)" : "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};