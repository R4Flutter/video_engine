import React from "react";
import {Composition} from "remotion";
import {TestRender} from "./compositions/TestRender";
import {Showcase} from "./compositions/Showcase";
import {DocumentaryShot} from "./compositions/DocumentaryShot";
import {ProductionDocumentary, PRODUCTION_DOCUMENTARY_SPEC} from "./compositions/ProductionDocumentary";
import {DEFAULT_SCRIPT_EPISODE, ScriptEpisodeComposition} from "./compositions/ScriptEpisodeComposition";

export const RemotionRoot: React.FC = () => {
  const productionDuration = PRODUCTION_DOCUMENTARY_SPEC.shots.reduce((sum, shot) => sum + shot.durationInFrames, 0);

  return (
    <>
      <Composition id="TestRender" component={TestRender} durationInFrames={60} fps={30} width={1920} height={1080} />
      <Composition id="DocumentaryShot" component={DocumentaryShot} durationInFrames={150} fps={30} width={1920} height={1080} />
      <Composition id="Showcase" component={Showcase} durationInFrames={1500} fps={30} width={1920} height={1080} />
      <Composition
        id="ProductionDocumentary"
        component={ProductionDocumentary}
        durationInFrames={productionDuration}
        fps={PRODUCTION_DOCUMENTARY_SPEC.fps}
        width={PRODUCTION_DOCUMENTARY_SPEC.width}
        height={PRODUCTION_DOCUMENTARY_SPEC.height}
      />
      <Composition
        id="ScriptEpisode"
        component={ScriptEpisodeComposition}
        durationInFrames={DEFAULT_SCRIPT_EPISODE.scenes.reduce(
          (sum, scene) => sum + (scene.duration ?? 150),
          0,
        )}
        fps={DEFAULT_SCRIPT_EPISODE.fps ?? 30}
        width={DEFAULT_SCRIPT_EPISODE.width ?? 1920}
        height={DEFAULT_SCRIPT_EPISODE.height ?? 1080}
        defaultProps={{script: DEFAULT_SCRIPT_EPISODE}}
      />
    </>
  );
};

export default RemotionRoot;
