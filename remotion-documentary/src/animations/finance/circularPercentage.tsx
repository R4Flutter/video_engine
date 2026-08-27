import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
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
  size?: number;
  strokeWidth?: number;
  trailColor?: string;
}

type CircularPercentageProps = BaseEffectProps & { config: CounterConfig };

export const circularPercentage: React.FC<CircularPercentageProps> = ({ image, children, durationInFrames = 45, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);
  const { from = 0, to = 100, strokeWidth = 10, color = "#3b82f6", trailColor = "#e5e7eb" } = config;
  const progress = interpolate(eased, [0, 1], [from, to]);
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <AbsoluteFill style={style} className={className}>
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke={trailColor} strokeWidth={strokeWidth} strokeOpacity="0.1" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeOpacity="1" strokeDasharray={circumference} strokeDashoffset={dashOffset} transform="rotate(-90 50 50)" />
      </svg>
      <Img src={typeof image === "string" ? image : (image as any)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {children}
    </AbsoluteFill>
  );
};