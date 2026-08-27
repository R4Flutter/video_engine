import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface TypingSimulationProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  text?: string;
  speed?: number;
  intensity?: number;
}

export const TypingSimulation: React.FC<TypingSimulationProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  text = "const app = new Application();\napp.launch();\napp.type(\"Hello World\");",
  speed = 50,
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
  const charsPerFrame = speed / 60;
  const totalChars = text.length;
  const charsShown = Math.min(totalChars, Math.max(0, (frame % (totalChars * 60)) / (60 / speed)));

  const shownText = text.substring(0, Math.round(charsShown));

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
          color: "#0f0",
          fontFamily: "Menlo, Consolas, monospace",
          fontSize: 12 * intensity,
        }}
      >
        <div style={{ height: "auto", padding: 8, whiteSpace: "pre" }}>
          {shownText}
        </div>
      </div>
    </AbsoluteFill>
  );
};