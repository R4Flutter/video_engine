import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface MonitorNumbersProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  value?: number | string;
  prefix?: string;
  suffix?: string;
  intensity?: number;
}

export const MonitorNumbers: React.FC<MonitorNumbersProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  value = 34567.89,
  prefix = "$",
  suffix = "",
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
  const numStr = value !== undefined ? `${prefix}${value}${suffix}` : "0";
  const blink = (frame / 500) % 2 > 1 ? "" : numStr;

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
          background: "rgba(0, 0, 0, 0.6)",
          color: "#00FFCE",
          fontFamily: "Roboto, sans-serif",
          fontSize: intensity > 1 ? 32 : 24,
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: "1.2",
        }}
      >
        <div style={{ height: "100%" }}>
          <span style={{ display: "block", width: "100%", height: "100%", opacity: blink ? 1 : 0.3 }}>
            {blink || "0"}
          </span>
        </div>
      </div>
      {children}
    </AbsoluteFill>
  );
};