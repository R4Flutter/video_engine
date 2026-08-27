import React from "react";
import {AbsoluteFill, Sequence, useVideoConfig} from "remotion";
import {Director, REGISTRY} from "../../animations/director";
import type {DocumentaryScript} from "./types";
import {resolveScript, toRenderContract, registerKnownEffects} from "./resolver";
import {CATEGORIES} from "../../compositions/Showcase.data";

registerKnownEffects(Object.keys(REGISTRY));

const resolveImagePath = (image: string) => image;

export const ScriptEpisode: React.FC<{script: DocumentaryScript}> = ({script}) => {
  const config = useVideoConfig();
  const resolved = React.useMemo(() => resolveScript(script), [script]);
  let cursor = 0;

  return (
    <AbsoluteFill style={{background: "#080808"}}>
      {resolved.scenes.map((scene) => {
        const sceneFrom = cursor;
        cursor += scene.duration;
        let local = 0;

        return (
          <Sequence key={scene.id} from={sceneFrom} durationInFrames={scene.duration}>
            <AbsoluteFill style={{background: "#080808"}}>
              {scene.visuals.map((visual, visualIndex) => {
                const from = local;
                local += visual.duration;
                return (
                  <Sequence key={`${scene.id}-${visualIndex}-${visual.shot}`} from={from} durationInFrames={visual.duration}>
                    <Director
                      effect={visual.shot}
                      image={resolveImagePath(visual.image)}
                      text={visual.text ?? visual.title}
                      durationInFrames={visual.duration}
                      intensity={1}
                      config={{
                        ...(visual.config ?? {}),
                        ...(visual.focalPoint ? {target: visual.focalPoint} : {}),
                      }}
                    />
                  </Sequence>
                );
              })}
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <div style={{position: "absolute", display: "none"}} data-render-fps={config.fps} />
    </AbsoluteFill>
  );
};

export const buildScriptContract = (script: DocumentaryScript) => {
  registerKnownEffects(Object.keys(REGISTRY));
  return toRenderContract(resolveScript(script));
};

export const registeredEffectCount = Object.values(CATEGORIES).reduce((sum, category) => sum + category.effects.length, 0);
