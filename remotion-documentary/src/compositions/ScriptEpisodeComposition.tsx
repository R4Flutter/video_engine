import React from "react";
import {Composition, getInputProps} from "remotion";
import {ScriptEpisode} from "../engine/script/ScriptEpisode";
import type {DocumentaryScript} from "../engine/script/types";

const getScript = (): DocumentaryScript => {
  const props = getInputProps<unknown>();
  if (!props || typeof props !== "object" || !("script" in props)) {
    throw new Error("[remotion-documentary] ScriptEpisode requires inputProps.script.");
  }
  return (props as {script: DocumentaryScript}).script;
};

export const ScriptEpisodeComposition: React.FC = () => <ScriptEpisode script={getScript()} />;

export const ScriptEpisodeCompositionConfig: React.FC = () => {
  const script = getScript();
  const fps = script.fps ?? 30;
  const width = script.width ?? 1920;
  const height = script.height ?? 1080;
  const frames = script.scenes.reduce((sum, scene) => sum + (scene.duration ?? 150), 0);
  return (
    <Composition
      id="ScriptEpisode"
      component={ScriptEpisodeComposition}
      durationInFrames={Math.max(1, frames)}
      fps={fps}
      width={width}
      height={height}
      defaultProps={{script}}
    />
  );
};
