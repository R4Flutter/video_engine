import { Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const ExposureChange: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  if (!image) return <>{children}</>;
  const t = intensity || 1;
  const brightness = 1 + t * 0.5;
  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: `brightness(${brightness})`,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};