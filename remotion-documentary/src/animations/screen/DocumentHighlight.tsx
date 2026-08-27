import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface DocumentHighlightProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  intensity?: number;
}

export const DocumentHighlight: React.FC<DocumentHighlightProps> = ({
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
          background: "rgba(255, 255, 0, 0.15 * intensity)",
          border: "1px dashed rgba(255, 255, 0, 0.3 * intensity)",
          borderRadius: "2px",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};