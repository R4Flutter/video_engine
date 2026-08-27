import React from "react";
import { Composition } from "remotion";
import { TestRender } from "./compositions/TestRender";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TestRender"
        component={TestRender}
        durationInFrames={60}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

export default RemotionRoot;