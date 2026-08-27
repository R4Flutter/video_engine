import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutBack, easeOutQuart } from "../timing/easings";

/**
 * OversizedNumber — the entire text is treated as a hero number. Scales up huge,
 * snaps in with a back-overshoot, then does a subtle breath loop.
 *
 * Default font-size: 360 (caller can override). Renders at viewport-relative scale.
 * Tints with a vertical gradient (top: accent, bottom: text color).
 */
const ACCENT_TOP = "#FFD400";
const ACCENT_BOTTOM = "#FF6B00";

export const OversizedNumber: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, color, fontSize } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  const cfg = (props as TextEffectProps & {
    config?: { pulse?: boolean };
  }).config;
  const start = delay ?? 0;
  const dur = 32;
  const size = fontSize ?? Math.round(height * 0.45);

  const t = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeOutBack(t);

  // Subtle breath loop after entrance.
  const breath =
    cfg?.pulse === false
      ? 1
      : 1 + 0.015 * Math.sin((Math.max(0, frame - start - dur) * Math.PI) / 30);

  const scale = Math.max(0.001, eased) * breath;

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <span
        style={{
          ...baseTextStyle(props),
          fontSize: size,
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: "-0.04em",
          background: `linear-gradient(180deg, ${ACCENT_TOP} 0%, ${ACCENT_BOTTOM} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          display: "inline-block",
          opacity: t,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {text}
      </span>
    </div>
  );
};
