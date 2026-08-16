import "./index.css";
import { Composition } from "remotion";
import { FinanceShort } from "./FinanceShort";
import { FinanceLong } from "./FinanceLong";
import { VoxShort } from "./VoxShort";
import { StickmanExplain, StickmanLab } from "./StickmanExplain";
import { Thumbnail } from "./Thumbnail";
import script from "./script.json";
import director from "./director-plan.json";

const dims = {
  width: script.width,
  height: script.height,
  fps: script.fps,
  durationInFrames: Math.round(script.durationInSeconds * script.fps),
};

const longDuration = Number(director?.project?.durationInSeconds || script.durationInSeconds);
const longFps = Number(director?.project?.fps || script.fps);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="FinanceShort" component={FinanceShort} {...dims} />
      <Composition id="FinanceLong" component={FinanceLong} width={1920} height={1080} fps={longFps} durationInFrames={Math.round(longDuration * longFps)} />
      <Composition id="VoxExplain" component={VoxShort} {...dims} />
      <Composition id="VoxWide" component={VoxShort} width={1920} height={1080} fps={dims.fps} durationInFrames={dims.durationInFrames} />
      <Composition id="StickmanExplain" component={StickmanExplain} {...dims} />
      <Composition id="Thumbnail" component={Thumbnail} width={script.width} height={script.height} fps={script.fps} durationInFrames={1} />
      <Composition id="StickmanLab" component={StickmanLab} {...dims} durationInFrames={Math.round(8 * dims.fps)} />
    </>
  );
};
