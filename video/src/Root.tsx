import "./index.css";
import { Composition } from "remotion";
import { FinanceShort } from "./FinanceShort";
import script from "./script.json";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="FinanceShort"
      component={FinanceShort}
      width={script.width}
      height={script.height}
      fps={script.fps}
      durationInFrames={Math.round(script.durationInSeconds * script.fps)}
    />
  );
};
