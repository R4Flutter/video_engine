import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeOutQuart } from "../timing/easings";

interface CounterConfig {
  from: number;
  to: number;
  durationInFrames?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
}

type NumberRollingProps = BaseEffectProps & { config: CounterConfig };

export const numberRolling: React.FC<NumberRollingProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);
  const { from = 0, to = 1234567890, prefix = "", suffix = "", fontSize = 24, color = "#6b7280" } = config;
  const part1 = Math.floor(t * 100000000) % 100000000;
  const part2 = Math.floor(t * 100000) % 100000;
  const formatted = `${prefix}${part1.toString().padStart(9, "0")}-${part2.toString().padStart(5, "0")}${suffix}`;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: fontSize * intensity,
          color,
        }}
      >
        {formatted}
      </div>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </AbsoluteFill>
  );
};