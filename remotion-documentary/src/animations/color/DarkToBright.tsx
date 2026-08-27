import { Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const DarkToBright: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  if (!image) return <>{children}</>;
  const t = intensity || 1;
  const brightnessValue = 0.5 + t * 0.7;
  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: `brightness(${brightnessValue})`,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};