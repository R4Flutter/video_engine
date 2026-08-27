import {registerRoot} from "remotion";
import RemotionRoot from "./RemotionRoot";

// Remotion CLI entrypoint. This file MUST call registerRoot().
// Keep library exports in dedicated modules so bundling remains predictable.
registerRoot(RemotionRoot);
