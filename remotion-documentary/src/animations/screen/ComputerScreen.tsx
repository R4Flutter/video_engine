import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface ComputerScreenProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  text?: string;
  scrollSpeed?: number;
}

export const ComputerScreen: React.FC<ComputerScreenProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  text = "const int x = 5;\nwhile(true) { print(x++); }",
  scrollSpeed = 20,
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
  const offset = (frame % (text.length * scrollSpeed)) / (text.length * scrollSpeed);

  const lines = text.split("\n");
  const scrollingLines = lines.map((line, i) => {
    const lineOffset = (offset + i * 0.1) % 1;
    return `${line.padEnd(40).substring((lineOffset * 40) % (line.length + 40))}`;
  });

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
          border: "2px solid #39FF14",
          borderRadius: "8px",
          fontFamily: "Menlo, Consolas, monospace",
          color: "#39FF14",
          fontSize: 12,
        }}
      >
        <div style={{ height: "auto", padding: 8 }}>
          {scrollingLines.map((line, i) => (
            <div key={i} style={{ whiteSpace: "pre", fontSize: 12 }}>
              {line}
            </div>
          ))}
        </div>
      </div>
      {children}
    </AbsoluteFill>
  );
};