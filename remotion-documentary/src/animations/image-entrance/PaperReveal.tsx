import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

const paperFilter = "url(#paper)";

export const PaperReveal: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const opacity = interpolate(eased, [0, 1], [0, 1 * intensity]);
  const translateY = interpolate(eased, [0, 1], [20 * intensity, 0]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          inset: `100% 0 0 0`,
          background: `url("data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg'><defs><filter id='paper'><feTurbulence baseFrequency='0.9' numOctaves='2' /><feColorMatrix values='0 0 0 0 0.95, 0 0 0 0 0.92, 0 0 0 0 0.88, 0 0 0 0.4 0' /></filter></defs></svg>")`,
          backgroundSize: "auto",
          opacity: 0,
          transition: "opacity 0.3s ease-out",
        }}
      />
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translateY(${translateY}px)`,
          opacity,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};