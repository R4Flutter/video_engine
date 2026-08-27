// Minimal Remotion runtime entrypoint.
// Keep the root bundle small and deterministic. Library APIs are exported from
// their own modules and do not need to be re-exported from the Remotion entry.
export {default} from "./Root";
export {default as RemotionRoot} from "./Root";
