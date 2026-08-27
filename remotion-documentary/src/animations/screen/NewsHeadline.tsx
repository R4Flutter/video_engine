import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface NewsHeadlineProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  headline?: string;
  speed?: number;
  intensity?: number;
}

export const NewsHeadline: React.FC<NewsHeadlineProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  headline = "Market rally pushes indices higher as tech earnings beat estimates",
  speed = 60,
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
  const totalWidth = headline.length * charWidth;
  const scrollPosition = (frame % (totalWidth + 3000)) / (totalWidth + 3000);

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
          color: "#0f0",
          fontFamily: "Georgia, serif",
          fontSize: 12 * intensity,
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${totalWidth + 300}px`,
            height: "20px",
            left: `-${scrollPosition * totalWidth}px`,
            overflow: "hidden",
          }}
        >
          <span style={{ position: "absolute", left: 0, whiteSpace: "nowrap" }}>
            {headline}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};