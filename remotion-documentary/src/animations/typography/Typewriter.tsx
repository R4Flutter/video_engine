import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";

/**
 * Typewriter — text appears character-by-character, with a blinking cursor at the end.
 * Default speed: 1 character per 2 frames (~15 cps at 30fps). Tunable via `config.cps`.
 * Cursor blinks on a 0.5s cycle.
 */
export const Typewriter: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cfg = (props as TextEffectProps & { config?: { cps?: number } }).config;
  const cps = cfg?.cps ?? 15; // characters per second
  const elapsed = Math.max(0, frame - (delay ?? 0));
  const charsShown = Math.min(text.length, Math.floor((elapsed / fps) * cps));

  // Cursor: blink twice a second.
  const cursorVisible = Math.floor((elapsed / fps) * 2) % 2 === 0;
  const cursorChar = cursorVisible ? "|" : " ";

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "left")}>
      <span style={baseTextStyle(props)}>
        {text.slice(0, charsShown)}
        <span style={{ opacity: charsShown < text.length ? 1 : 0 }}>{cursorChar}</span>
      </span>
    </div>
  );
};
