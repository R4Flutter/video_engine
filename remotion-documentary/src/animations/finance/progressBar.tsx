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
  height?: number;
  bgColor?: string;
}

type ProgressBarProps = BaseEffectProps & { config: CounterConfig };

export const progressBar: React.FC<ProgressBarProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width; void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / Math.max(1, durationInFrames)));
  const eased = easeOutQuart(t);
  const { from = 0, to = 100, height: barHeight = 8, color = "#10b981", bgColor = "#e5e7eb" } = config;
  const progress = from + (to - from) * eased;
  return <AbsoluteFill style={style} className={className}>
    <Img src={typeof image === "string" ? image : (image as any)} style={{width:"100%",height:"100%",objectFit:"cover"}} />
    <div style={{position:"absolute",bottom:0,left:0,width:"100%",height:barHeight,background:bgColor,overflow:"hidden"}}>
      <div style={{width:`${Math.max(0,Math.min(100,progress))}%`,height:"100%",background:color}} />
    </div>
    {children}
  </AbsoluteFill>;
};