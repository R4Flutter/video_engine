import "./index.css";
import { Composition } from "remotion";
import { FinanceShort } from "./FinanceShort";
import { LongFormDocumentary } from "./LongFormDocumentary";
import { StickmanExplain, StickmanLab } from "./StickmanExplain";
import { Thumbnail } from "./Thumbnail";
import script from "./script.json";

const dims = {
  width: script.width,
  height: script.height,
  fps: script.fps,
  durationInFrames: Math.round(script.durationInSeconds * script.fps),
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="FinanceShort" component={FinanceShort} {...dims} />
      <Composition
        id="LongFormDocumentary"
        component={LongFormDocumentary}
        width={1920}
        height={1080}
        fps={dims.fps}
        durationInFrames={dims.durationInFrames}
      />
      <Composition id="StickmanExplain" component={StickmanExplain} {...dims} />
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        width={script.width}
        height={script.height}
        fps={script.fps}
        durationInFrames={1}
      />
      <Composition
        id="StickmanLab"
        component={StickmanLab}
        {...dims}
        durationInFrames={Math.round(8 * dims.fps)}
      />
    </>
  );
};
