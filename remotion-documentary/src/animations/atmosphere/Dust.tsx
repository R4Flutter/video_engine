import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";

const DUST_COUNT = 30;

export const Dust: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;

  const dots: React.ReactElement[] = [];
  for (let i = 0; i < DUST_COUNT; i++) {
    const speed = 0.1 + Math.random() * 0.05;
    const amplitude = 20 + Math.random() * 30;
    const phase = Math.random() * Math.PI * 2;
    const x = 50 + Math.sin(frame * speed + phase) * amplitude * 0.01;
    const y = 50 + Math.cos(frame * speed * 0.8 + phase) * amplitude * 0.01;

    dots.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: `2px`,
          height: `2px`,
          background: "white",
          opacity: 0.3 * intensity,
          borderRadius: "50%",
        }}
      />
    );
  }

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        overflow: "hidden",
        ...style,
      }}
    >
      {dots}
      {children}
    </AbsoluteFill>
  );
};