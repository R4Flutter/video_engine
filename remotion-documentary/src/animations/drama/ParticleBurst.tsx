import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export const ParticleBurst: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 45, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const particleCount = 30;

  return (
    <AbsoluteFill style={style} className={className}>
      {[...Array(particleCount)].map((_, i) => {
        const baseX = (i / particleCount) * 100;
        const velocity = Math.random() * 200 * intensity;
        const dx = (Math.random() - 0.5) * 100;
        const dy = (Math.random() - 0.5) * 100 * intensity;
        const alpha = interpolate(t, [0, 1], [1, 0]);

        return /*#__PURE__*/ (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${baseX}%`,
              width: "8px",
              height: "8px",
              background: "white",
              borderRadius: "50%",
              opacity: alpha,
              transform: `translate(${dx * t}px, ${dy * t}px)`,
            }}
          />
        );
      })}
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </AbsoluteFill>
  );
};