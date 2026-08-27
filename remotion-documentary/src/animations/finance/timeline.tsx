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
  data?: number[];
  height?: number;
}

type TimelineProps = BaseEffectProps & { config: CounterConfig };

export const timeline: React.FC<TimelineProps> = ({ image, children, durationInFrames = 120, delay = 0, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width; void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / Math.max(1, durationInFrames)));
  const eased = easeOutQuart(t);
  const {data = [0, 50, 100, 75, 100], height: chartHeight = 50, color = "#3b82f6"} = config;
  const maxValue = Math.max(...data, 1);
  return <AbsoluteFill style={style} className={className}>
    <Img src={typeof image === "string" ? image : (image as any)} style={{width:"100%",height:"100%",objectFit:"cover"}} />
    <svg width="100%" height={chartHeight} style={{position:"absolute",bottom:0,left:0}}>
      <path fill="none" stroke={color} strokeWidth={2} d={data.map((val: number, i: number) => { const x = data.length === 1 ? 0 : (i / (data.length - 1)) * 100; const y = interpolate(val, [0, maxValue], [chartHeight, 0]); return i === 0 ? `M${x} ${y}` : `L${x} ${y}`; }).join(" ")} opacity={0.72 + eased * 0.28} />
    </svg>
    {children}
  </AbsoluteFill>;
};