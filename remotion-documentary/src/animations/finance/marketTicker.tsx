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
  speed?: number;
}

type MarketTickerProps = BaseEffectProps & { config: CounterConfig };

export const marketTicker: React.FC<MarketTickerProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);
  const { prefix = "$", suffix = "/hr", fontSize = 20, color = "#10b981", speed = 1 } = config;
  const value = interpolate(eased, [0, 1], [0, 1000 * speed]);
  const formatted = `${prefix}${value.toFixed(0)}${suffix}`;
  return <AbsoluteFill style={style} className={className}>
    <Img src={typeof image === "string" ? image : (image as any)} style={{width:"100%",height:"100%",objectFit:"cover"}} />
    <div style={{position:"absolute",top:0,left:0,fontSize:fontSize*intensity,color}}>{formatted}</div>
    {children}
  </AbsoluteFill>;
};