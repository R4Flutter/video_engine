import { AbsoluteFill, interpolate } from "remotion";
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
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;

  const frame = useCurrentFrame();
  const totalChars = texts.reduce((t, str) => t + str.length, 0);
  const charWidth = 10;
  const scrollingWidth = totalChars * charWidth + 200;
  const progress = (frame % (scrollingWidth * speed)) / (scrollingWidth * speed);

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
            animation: `scroll-${speed}s linear infinite`,
          }}
        >
          {texts.map((t, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${i * 100}px`,
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};