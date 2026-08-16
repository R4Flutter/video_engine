import "./index.css";
import { Composition } from "remotion";
import { FinanceLong } from "./FinanceLong";
import { ShortsEngine } from "./ShortsEngine";
import script from "./script.json";
import director from "./director-plan.json";
import shortsManifest from "./shorts-manifest.json";

const longDuration = Number(director?.project?.durationInSeconds || script.durationInSeconds);
const longFps = Number(director?.project?.fps || script.fps);
const shortFps = 30;
const shortDurations = (shortsManifest.shorts ?? []).map((s) => Math.max(1, Math.ceil(Number(s.duration || 1) * shortFps)));
const shortFrames = (index: number) => shortDurations[index] ?? 1;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="FinanceLong"
      component={FinanceLong}
      width={1920}
      height={1080}
      fps={longFps}
      durationInFrames={Math.max(1, Math.round(longDuration * longFps))}
    />
    <Composition id="Shorts1" component={ShortsEngine} width={1080} height={1920} fps={shortFps} durationInFrames={shortFrames(0)} defaultProps={{ index: 0 }} />
    <Composition id="Shorts2" component={ShortsEngine} width={1080} height={1920} fps={shortFps} durationInFrames={shortFrames(1)} defaultProps={{ index: 1 }} />
    <Composition id="Shorts3" component={ShortsEngine} width={1080} height={1920} fps={shortFps} durationInFrames={shortFrames(2)} defaultProps={{ index: 2 }} />
  </>
);
