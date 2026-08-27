// Remotion 4.x entry point. The CLI auto-detects a `RemotionRoot` default
// export from this file (or `src/entrypoint.ts`). `registerRoot()` was the
// Remotion 3.x pattern; in 4.x the default export is enough.
export { default, default as RemotionRoot } from "./RemotionRoot";

export * from "./types";
export * from "./animations/timing/easings";
export * from "./animations/typography";
export * from "./animations/camera";
export * from "./animations/director";
export * from "./Root";
