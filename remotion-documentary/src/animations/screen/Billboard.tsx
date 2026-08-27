import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface BillboardProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  text?: string;
  color?: string;
  intensity?: number;
}

export const Billboard: React.FC<BillboardProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  text = "SALE - 50% OFF TODAY ONLY!",
  color = "#FFD700",
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;

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
          background: "rgba(0, 0, 0, 0.7)",
          border: "4px solid #FFD700",
          borderRadius: "4px",
          color: color,
          fontFamily: "Georgia, serif",
          fontSize: intensity > 1 ? 28 : 18,
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: "1.4",
        }}
      >
        <div style={{ padding: 20, height: "100%" }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};