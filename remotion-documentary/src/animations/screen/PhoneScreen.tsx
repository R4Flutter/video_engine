import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface PhoneScreenProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  children?: React.ReactNode;
  intensity?: number;
}

export const PhoneScreen: React.FC<PhoneScreenProps> = ({
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
  const aspectRatio = w / h;
  const frameHeight = aspectRatio > 1.9 ? h : h * (1.9 / aspectRatio);
  const frameWidth = frameHeight * aspectRatio;
  const notchWidth = frameWidth * 0.08;
  const notchHeight = frameHeight * 0.04;

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
          borderRadius: "16px",
          background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
          border: `2px solid #007AFF`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: `calc(100% - ${notchHeight * 2}%)`,
            background: "linear-gradient(135deg, #141414 0%, #000000 100%)",
            borderRadius: "14px 14px 0 0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `calc(100% - ${notchWidth}px)`,
              height: `${notchHeight}%`,
              background: "linear-gradient(135deg, #007AFF 0%, #0055FF 100%)",
              borderRadius: "12px 12px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: `${notchWidth}px`,
              height: `${notchHeight}%`,
              background: "linear-gradient(135deg, #007AFF 0%, #0055FF 100%)",
              borderRadius: "0 0 12px 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: `${notchHeight * 0.6}%`,
              right: 0,
              width: `${notchWidth * 0.4}px`,
              height: `${notchHeight * 0.4}px`,
              background: "#FF3B30",
              borderRadius: "50%",
              top: "4px",
            }}
          />
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};