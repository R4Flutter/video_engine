import React from "react";
import {Composition} from "remotion";
import {HandDrawnLongForm, HAND_DRAWN_LONG_FORM_DURATION, HAND_DRAWN_LONG_FORM_SPEC} from "./compositions/HandDrawnLongForm";

/**
 * Production entry point.
 *
 * The app intentionally exposes only the hand-drawn documentary composition
 * so the default Studio/build path cannot accidentally render Showcase,
 * TestRender, sample SVGs, or any legacy/demo composition.
 */
export const RemotionRoot: React.FC = () => (
  <Composition
    id="HandDrawnLongForm"
    component={HandDrawnLongForm}
    durationInFrames={HAND_DRAWN_LONG_FORM_DURATION}
    fps={HAND_DRAWN_LONG_FORM_SPEC.fps}
    width={HAND_DRAWN_LONG_FORM_SPEC.width}
    height={HAND_DRAWN_LONG_FORM_SPEC.height}
  />
);

export default RemotionRoot;
