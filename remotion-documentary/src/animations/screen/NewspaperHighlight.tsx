import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface NewspaperHighlightProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  intensity?: number;
}

export const NewspaperHighlight: React.FC<NewspaperHighlightProps> = ({
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

  const frame = useCurrentFrame();
  const pulse = (Math.sin((frame % 2000) / 1000 * Math.PI) + 1) / 2;

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
          background: "rgba(255, 255, 0, 0.3 * pulse * intensity)",
          border: "1px solid rgba(255, 255, 0, 0.5 * intensity)",
          borderRadius: "2px",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};