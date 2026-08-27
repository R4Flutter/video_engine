import { Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const FilmLook: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  if (!image) return <>{children}</>;
  const sepiaAmount = 0.4 * intensity;
  const contrastAmount = 1.1 * intensity;
  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: `sepia(${sepiaAmount}) contrast(${contrastAmount})`,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};