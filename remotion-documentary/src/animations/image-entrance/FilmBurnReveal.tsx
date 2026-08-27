import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

export const FilmBurnReveal: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const scale = interpolate(eased, [0, 1], [1, 4 * intensity]);
  const opacity = interpolate(eased, [0, 1], [1, 0]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at center, #ff6b35 0%, #f7c84b 100%)",
          opacity: 0.6 * intensity,
          mixBlendMode: "screen",
          transform: `scale(${1 / intensity})`,
          transformOrigin: "center center",
        }}
      />
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          opacity,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};