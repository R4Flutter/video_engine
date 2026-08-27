import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface LaptopScreenProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  children?: React.ReactNode;
  intensity?: number;
}

export const LaptopScreen: React.FC<LaptopScreenProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;
  const screenRatio = 16 / 9;
  const screenW = Math.min(w, h * screenRatio * 0.8);
  const screenH = screenW / screenRatio;
  const screenLeft = (w - screenW) / 2;
  const screenTop = (h - screenH) / 2 + h * 0.05;

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
          border: "2px solid #555",
          borderRadius: "8px",
        }}
      >
        {/* Lid */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(30, 30, 30, 0.9)",
            borderRadius: "8px",
          }}
        >
          {/* Screen */}
          <div
            style={{
              position: "absolute",
              left: `${screenLeft}%`,
              top: `${screenTop}%`,
              width: `${screenW}%`,
              height: `${screenH}%`,
              background: "rgba(0, 0, 0, 0.8)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            {children}
          </div>
          {/* Top bezel */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: screenTop > 0 ? screenTop * 100 + "%" : "0%",
              background: "rgba(30, 30, 30, 0.8)",
            }}
          />
          {/* Bottom bezel */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height:
                100 - screenTop * 100 - screenH > 0
                  ? (100 - screenTop * 100 - screenH) + "%"
                  : "0%",
              background: "rgba(30, 30, 30, 0.8)",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};