import { AbsoluteFill, Img } from "remotion";

export const TestRender: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Img src="/planet-fitness-entrance.jpg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};