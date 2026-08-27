import React from "react";
import {Sequence, AbsoluteFill} from "remotion";
import {ScriptEpisode} from "../engine/script/ScriptEpisode";
import type {DocumentaryScript} from "../engine/script/types";

export const DEFAULT_SCRIPT_EPISODE: DocumentaryScript = {
  fps: 30,
  width: 1920,
  height: 1080,
  scenes: [
    {
      id: "default",
      duration: 150,
      visuals: [
        {
          image: "/sample-building.svg",
          shot: "pushIn",
          duration: 150,
          focalPoint: {x: 0.5, y: 0.5},
        },
      ],
    },
  ],
};

/**
 * Root-safe composition. It deliberately does not call getInputProps() during
 * root registration or component initialization. A caller that has inputProps
 * can pass the script directly to this component.
 */
export const ScriptEpisodeComposition: React.FC<{script?: DocumentaryScript}> = ({script}) => (
  <ScriptEpisode script={script ?? DEFAULT_SCRIPT_EPISODE} />
);
