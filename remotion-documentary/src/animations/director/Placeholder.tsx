import type {BaseEffectProps} from "../../types";
import {AdvancedEffect} from "../advanced/AdvancedEffect";

type AdvancedProps = BaseEffectProps & {config?: Record<string, unknown>; effect?: string; text?: string};

/** Compatibility dispatcher retained for registry stability. All legacy placeholder slots now render real deterministic effects. */
export const Placeholder: React.FC<AdvancedProps> = ({effect, text, config, ...rest}) => (
  <AdvancedEffect effect={effect} config={{...(config ?? {}), ...(text ? {text} : {})}} {...rest} />
);
