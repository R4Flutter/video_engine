import { Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export const SharpToBlur: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  if (!image) return <>{children}</>;
  const blur = interpolate(intensity || 1, [0, 1], [0, 20]);
  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: `blur(${blur}px)`,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};