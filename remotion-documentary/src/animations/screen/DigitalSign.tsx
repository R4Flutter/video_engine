import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface DigitalSignProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  texts?: Array<string>;
  speed?: number;
  intensity?: number;
}

export const DigitalSign: React.FC<DigitalSignProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  texts = ["APPLE", "GOOGLE", "MICROSOFT", "AMAZON", "META"],
  speed = 30,
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const frame = useCurrentFrame();
  const totalChars = texts.reduce((total, text) => total + text.length, 0);
  const charWidth = 10;
  const scrollingWidth = totalChars * charWidth + 200;
  const cycleFrames = Math.max(1, scrollingWidth * Math.max(1, speed));
  const progress = (frame % cycleFrames) / cycleFrames;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: `${width}%`,
          height: `${height}%`,
          overflow: "hidden",
          background: "rgba(0, 0, 0, 0.8)",
          color: "#00FF00",
          fontFamily: "Courier New, monospace",
          fontSize: 14 * intensity,
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${scrollingWidth}px`,
            height: "20px",
            left: `-${progress * totalChars * charWidth}px`,
          }}
        >
          {texts.map((text, index) => (
            <span
              key={`${text}-${index}`}
              style={{
                position: "absolute",
                left: `${index * 100}px`,
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
      {children}
    </AbsoluteFill>
  );
};
