import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface ScrollingWebpageProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  content?: string;
  speed?: number;
  intensity?: number;
}

export const ScrollingWebpage: React.FC<ScrollingWebpageProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  content =
    "<h1>Article Title</h1>\n<p>This is a long scrolling webpage simulation. " +
    "It contains multiple paragraphs of text that scroll vertically within the region. " +
    "The content can be customized via the content prop.</p>\n<p>More scrolling text to fill the space.</p>",
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
  const scrollAmount = (frame % (1000 * speed)) / 1000;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${top}%`,
          width: `${w}%`,
          height: `${h}%`,
          overflow: "auto",
          background: "rgba(255, 255, 255, 0.9)",
          color: "#333",
          fontFamily: "Georgia, serif",
          fontSize: 14 * intensity,
        }}
      >
        <div
          style={{
            height: "auto",
            width: "100%",
            transform: `translateY(${scrollAmount * 100}%)`,
            padding: 20,
          }}
        >
          {content}
        </div>
      </div>
    </AbsoluteFill>
  );
};