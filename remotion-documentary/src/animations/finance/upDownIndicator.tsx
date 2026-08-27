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

type UpDownIndicatorProps = BaseEffectProps & { config: CounterConfig };

export const upDownIndicator: React.FC<UpDownIndicatorProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);
  const { upColor = "#10b981", downColor = "#ef4444", size = 24 } = config;
  const change = Math.random() > 0.5 ? 1 : -1;
  const formatted = `${change > 0 ? "+" : "-"}${(Math.random() * 10).toFixed(1)}%`;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: size * intensity,
          color: change > 0 ? upColor : downColor,
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