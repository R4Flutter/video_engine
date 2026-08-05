// One place for brand + layout. Components read from here, never hardcode.
export const theme = {
  color: {
    bg: "#06181C",
    bgGlow: "#0D3B42",
    gold: "#F7C948",
    goldDeep: "#B8860B",
    goldLight: "#FFE9A3",
    green: "#3DDC97",
    greenDeep: "#0E6B4B",
    text: "#EAF4F3",
    dim: "#7FA6A6",
    ink: "#041215",
  },
  // Segoe UI ships the rupee glyph and needs no network at render time.
  font: `"Segoe UI", system-ui, -apple-system, sans-serif`,
  // 1080x1920 minus the phone UI: nothing that matters lives outside this.
  safe: { top: 250, bottom: 400, side: 80 },
  stage: { top: 620, bottom: 1520, groundY: 1440 },
  overlayY: 300,
  captionY: 1560,
} as const;

export const W = 1080;
export const H = 1920;

// Overshoot used by every "arrives with weight" element.
export const POP = { damping: 12, mass: 0.6, stiffness: 180 };
export const SOFT = { damping: 200, mass: 1, stiffness: 100 };

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );
