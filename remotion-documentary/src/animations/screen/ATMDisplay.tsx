import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface ATMDisplayProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  amounts?: Array<{ label: string; amount: string }>;
  intensity?: number;
}

export const ATMDisplay: React.FC<ATMDisplayProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  amounts = [
    { label: "BALANCE", amount: "$1,234.56" },
    { label: "DEPOSIT", amount: "$-" },
    { label: "WITHDRAW", amount: "$-" },
  ],
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;

  const buttonH = h / (amounts.length + 1);

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
          background: "rgba(0, 0, 0, 0.9)",
          border: "2px solid #777",
          borderRadius: "4px",
        }}
      >
        <div style={{ padding: 12, height: "auto" }}>
          {amounts.map(({ label, amount }, i) => {
            const yPos = (i + 1) * 100 / (amounts.length + 1);
            return (
              <div
                key={label}
                style={{
                  marginTop: `${yPos}%`,
                  color: "#0f0",
                  fontFamily: "monospace",
                  fontSize: 14,
                  textAlign: "right",
                }}
              >
                <span style={{ fontSize: 10, opacity: 0.7 }}>{label}</span>
                <span style={{ fontSize: 24, fontWeight: "bold" }}>{amount}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};