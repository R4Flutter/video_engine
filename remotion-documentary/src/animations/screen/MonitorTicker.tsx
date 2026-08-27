import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface MonitorTickerProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  text?: string;
  speed?: number;
}

export const MonitorTicker: React.FC<MonitorTickerProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  text = "BREAKING: Markets are experiencing high volatility today as tech stocks tumble.",
  speed = 50,
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
  const charWidth = 8;
  const totalWidth = text.length * charWidth;
  const scrollPosition = (frame % (totalWidth + 2000)) / (totalWidth + 2000);

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
          color: "#00FF00",
          fontFamily: "Arial, sans-serif",
          fontSize: 14,
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${totalWidth + 200}px`,
            height: "20px",
            left: `-${scrollPosition * totalWidth}px`,
          }}
        >
          <span style={{ position: "absolute", left: 0 }}>{text}</span>
        </div>
      </div>
      {children}
    </AbsoluteFill>
  );
};