import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

/**
 * Placeholder — the "real" component for every effect whose implementation
 * hasn't been built yet. Renders a labeled cell showing the effect name,
 * its category, and a small "phase 13+" hint. Used by the Director registry
 * to keep the type surface complete (every EffectName is mapped) without
 * forcing a `null` render or a console warning.
 *
 * This is intentionally a real component, not a stub. The cell is
 * usable in the studio / showcase and visually communicates that the
 * effect is reserved for a future phase.
 */
export const Placeholder: React.FC<BaseEffectProps & { config?: any; effect?: string }> = ({
  effect,
  intensity = 1,
  style,
  className,
}) => {
  const name = effect ?? "unknown";
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, sans-serif",
        opacity: 0.4 + 0.6 * Math.min(1, intensity),
        ...style,
      }}
      className={className}
    >
      <div
        style={{
          color: "#fde047",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textAlign: "center",
        }}
      >
        {name}
      </div>
      <div
        style={{
          color: "#525252",
          fontSize: 10,
          fontFamily: "ui-monospace, monospace",
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
        }}
      >
        reserved · phase 13+
      </div>
    </AbsoluteFill>
  );
};
