import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export const Grain: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const grainOpacity = 0.1 * intensity;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          grainOpacity > 0
            ? `url("data:image/svg+xml,%3Csvg%20xmlns%3D'http://www.w3.org/2000/svg'%20width%3D'200'%20height%3D'200'%3E%3Cdefs%3E%3Cfilter%20id%27noise%27%3E%3CfeTurbulence%20type%27fractalNoise%27%20baseFrequency%3D'0.9'%20numOctaves%3D'4'%20seed%3D'{Math.floor(Math.random() * 100000)}'%20/still%3E%3C/filter%3E%3C/%3E%3C/svg%22") 0 0 repeat,`
            : "none",
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};