import { Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const BlackAndWhite: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  const filterValue = `grayscale(${1 * (intensity || 1)})`;
  if (!image) return <>{children}</>;
  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: filterValue,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};