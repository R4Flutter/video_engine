import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface TVScreenProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  intensity?: number;
}

export const TVScreen: React.FC<TVScreenProps> = ({
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
  const noise = Array.from({ length: 500 }, () => Math.random())
    .map(() => `${Math.round(Math.random() * 255)}`)
    .join(",");

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
          border: "1px solid #555",
          borderRadius: "4px",
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.5)",
          background:
            `repeating-linear-gradient(
              0deg,
              rgba(0,0,0,0.3),
              rgba(0,0,0,0.3) 2px,
              rgba(0,0,0,0.1) 2px,
              rgba(0,0,0,0.1) 4px
            )`,
          WebkitFilter: `brightness(${0.8 * intensity})`,
          filter: `brightness(${0.8 * intensity})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%22")`,
            pointerEvents: "none",
          }}
        />
      </div>
      {children}
    </AbsoluteFill>
  );
};