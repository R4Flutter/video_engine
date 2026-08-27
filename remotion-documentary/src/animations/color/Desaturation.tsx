import { Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const Desaturation: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  const saturateAmount = 1 - intensity;
  const filterValue = `saturate(${saturateAmount})`;
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