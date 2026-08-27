import { useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface BracketProps extends BaseEffectProps {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  color?: string;
}

export const Bracket: React.FC<BracketProps> = ({
  x = 0,
  y = 0,
  w = 20,
  h = 20,
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <path
        d={`M${x * 100},${y * 100} L${x * 100 + w * 0.3},${y * 100} L${x * 100 + w * 0.3},${y * 100 + h * 0.5} L${x * 100},${y * 100 + h * 0.5} L${x * 100},${y * 100 + h} L${x * 100 + w},${y * 100 + h} L${x * 100 + w},${y * 100 + h * 0.5} L${x * 100 + w * 0.7},${y * 100 + h * 0.5} L${x * 100 + w},${y * 100} L${x * 100 + w * 0.7},${y * 100 - h * 0.5} L${x * 100},${y * 100 - h * 0.5} Z`}
        fill={color}
      />
    </svg>
  );
};