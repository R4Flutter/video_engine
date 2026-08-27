import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface MapRouteDrawProps extends BaseEffectProps {
  path: string;
  color?: string;
}

export const MapRouteDraw: React.FC<MapRouteDrawProps> = ({
  path,
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const totalLength = interpolate(
    frame % 2000,
    [0, 2000],
    [0, 1]
  );

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <path
        d={path}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={`${totalLength}`}
        strokeDashoffter={totalLength}
      />
    </svg>
  );
};