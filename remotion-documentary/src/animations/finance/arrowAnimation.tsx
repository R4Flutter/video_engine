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
  size?: number;
}

type ArrowAnimationProps = BaseEffectProps & { config: CounterConfig };

export const arrowAnimation: React.FC<ArrowAnimationProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);
  const { color = "#10b981", size = 32 } = config;
  void eased;

  return (
    <AbsoluteFill style={style} className={className}>
      <div style={{position: "absolute", top: 0, left: 0, width: 0, height: 0, borderLeft: `${size * intensity}px solid transparent`, borderRight: `${size * intensity}px solid transparent`, borderBottom: `${size * intensity * 1.5}px solid ${color}`, marginTop: `-${size * intensity / 2}px`}} />
      <Img src={typeof image === "string" ? image : (image as any)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      {children}
    </AbsoluteFill>
  );
};