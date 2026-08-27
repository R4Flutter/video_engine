import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeInOutExpo } from "../timing/easings";

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

type CountdownProps = BaseEffectProps & { config: CounterConfig };

export const countdown: React.FC<CountdownProps> = ({ image, children, durationInFrames = 60, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeInOutExpo(t);
  const { from = 3600, to = 0, prefix = "", suffix = "", fontSize = 24, color = "#ef4444" } = config;
  const remaining = Math.max(0, Math.floor(interpolate(t, [0, 1], [from, to])));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

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