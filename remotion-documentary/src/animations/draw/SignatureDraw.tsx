import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface SignatureDrawProps extends BaseEffectProps {
  signature: string;
  color?: string;
}

export const SignatureDraw: React.FC<SignatureDrawProps> = ({
  signature,
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const totalLength = 500;

  const t = interpolate(frame % 2000, [0, 2000], [0, 1]);
  const dashOffset = totalLength * (1 - t);

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <path
        d={signature}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};