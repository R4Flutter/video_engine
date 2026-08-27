import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeOutQuart } from "../timing/easings";

export const DollyMove: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 60, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);
  const translate = interpolate(eased, [0, 1], [0, -200 * intensity]);
  const scale = interpolate(eased, [0, 1], [1, 1.05]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${translate}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};