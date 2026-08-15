import "./index.css";
import { Composition } from "remotion";
import { FinanceShort } from "./FinanceShort";
import { VoxShort } from "./VoxShort";
import { StickmanExplain, StickmanLab } from "./StickmanExplain";
import { Thumbnail } from "./Thumbnail";
import script from "./script.json";

// Both compositions stage the same script.json. Which one to render is the
// script's own choice: script.engine is "vox" when the script.md said so.
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
      <Composition id="VoxExplain" component={VoxShort} {...dims} />
      {/* The same film for landscape: the page, the plates and the captions
          all scale from width/height, so nothing adapts specially here. */}
      <Composition
        id="VoxWide"
        component={VoxShort}
        width={1920}
        height={1080}
        fps={dims.fps}
        durationInFrames={dims.durationInFrames}
      />
      {/* Same script, presented by a figure rather than by the page. */}
      <Composition id="StickmanExplain" component={StickmanExplain} {...dims} />
      {/* The shelf poster for the episode — a still, never rendered to video. */}
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        width={script.width}
        height={script.height}
        fps={script.fps}
        durationInFrames={1}
      />
      {/* The rig on its own, for looking at the mouth and the arms. Not an
          episode — never render this to the channel. */}
      <Composition
        id="StickmanLab"
        component={StickmanLab}
        {...dims}
        durationInFrames={Math.round(8 * dims.fps)}
      />
    </>
  );
};
