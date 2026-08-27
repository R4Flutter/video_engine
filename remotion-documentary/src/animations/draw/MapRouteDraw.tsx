import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface MapRouteDrawProps extends BaseEffectProps {
  path: string;
  color?: string;
}

export const MapRouteDraw: React.FC<MapRouteDrawProps> = ({path, color = "#0f0", intensity = 1, style, className}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame % 2000, [0, 2000], [0, 1]);
  const dash = Math.max(0.001, 1 - progress) * 2000;
  return <svg width="100%" height="100%" style={{position:"absolute",top:0,left:0,...style}} className={className}>
    <path d={path} stroke={color} strokeWidth={2 * intensity} fill="none" strokeDasharray="2000" strokeDashoffset={dash} />
  </svg>;
};