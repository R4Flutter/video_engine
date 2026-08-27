import { Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const WarmToCold: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  if (!image) return <>{children}</>;
  const hueRotate = -30 * (intensity || 1);
  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: `hue-rotate(${hueRotate}deg)`,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};