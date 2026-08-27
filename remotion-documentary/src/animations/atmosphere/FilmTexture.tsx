import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export const FilmTexture: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const textureOpacity = 0.15 * intensity;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          `url("data:image/svg+xml,%3Csvg%20xmlns%3D'http://www.w3.org/2000/svg'%20width%3D'256'%20height%3D'256'%3E%3C%3E%3C/svg%22")`,
        WebkitFilter: `opacity(${textureOpacity})`,
        filter: `opacity(${textureOpacity})`,
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};