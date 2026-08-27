import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface DigitalClockProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  format?: "12h" | "24h";
  intensity?: number;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  format = "24h",
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;

  const frame = useCurrentFrame();
  const fps = 60;
  const totalFrames = fps * 60;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${top}%`,
          width: `${w}%`,
          height: `${h}%`,
          overflow: "hidden",
          background: "rgba(0, 0, 0, 0.8)",
          color: "#0f0",
          fontFamily: "Digital-7, monospace",
          fontSize: 48 * intensity,
          textAlign: "center",
        }}
      >
        {(frame % totalFrames)
          .toString()
          .padStart(6, "0")
          .replace(/(\d{2})(\d{2})(\d{2})?/, "$1:$2:$3")
          .replace("undefined:", "")}
      </div>
    </AbsoluteFill>
  );
};