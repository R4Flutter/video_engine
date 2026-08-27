import type { DirectorProps } from "../../types";
import { REGISTRY } from "./registry";

/**
 * Director — the single AI-callable surface for the entire library.
 *
 * Usage:
 *   <Director effect="pushIn" intensity={1.5} config={{}}>
 *     <Img src="..." />
 *   </Director>
 *
 * The Director looks the effect up in REGISTRY, instantiates the component
 * with the BaseEffectProps it received, and threads `config` through as a
 * prop. Every EffectName has a real entry in REGISTRY — 125 point at full
 * implementations, 145 point at the labeled Placeholder cell for effects
 * that are reserved for a future phase.
 */
export const Director: React.FC<DirectorProps> = (props) => {
  const { effect, config, ...rest } = props;
  const Component = REGISTRY[effect];

  if (!Component) {
    // This branch should be unreachable — REGISTRY[effect] is typed as
    // ComponentType<any> for every EffectName key. If we get here, the
    // EffectName union and REGISTRY have drifted out of sync.
    throw new Error(
      `[remotion-documentary] Director: no entry in REGISTRY for effect "${effect}". ` +
        `This means the EffectName union in types.ts and the registry in ` +
        `animations/director/registry.ts are out of sync. Add "${effect}" to REGISTRY.`,
    );
  }

  return <Component {...rest} config={config} effect={effect} />;
};
