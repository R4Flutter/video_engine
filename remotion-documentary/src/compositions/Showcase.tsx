import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Director } from "../animations/director";
import type { EffectName } from "../types";
import { CATEGORIES, TOTAL_EFFECTS } from "./Showcase.data";

/**
 * Showcase — the master demo composition. 1920×1080 / 30fps / 1500 frames.
 *
 * Layout: a 2×4 grid (8 cells) that pages through every effect in the
 * library, 30 frames per page. Between categories a 15-frame "section
 * divider" appears with the category name in large mono. Each cell shows
 * the effect name as a label and runs the effect via Director with a
 * 30-frame duration.
 *
 * Cells that map to a Placeholder render the placeholder's labeled cell
 * (this is how not-yet-implemented categories still show up in the
 * showcase).
 */

const COLS = 2;
const ROWS = 4;
const CELLS_PER_PAGE = COLS * ROWS; // 8
const PAGE_DURATION = 30;
const DIVIDER_DURATION = 15;
const SHOWCASE_DURATION = 1500;

type Page = {
  start: number;
  duration: number;
  type: "page" | "divider";
  category: string;
  // For "page" only
  cells?: EffectName[];
};

const buildPages = (): Page[] => {
  const pages: Page[] = [];
  let cursor = 0;
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    if (i > 0) {
      // Section divider before every category after the first
      pages.push({
        start: cursor,
        duration: DIVIDER_DURATION,
        type: "divider",
        category: cat.name,
      });
      cursor += DIVIDER_DURATION;
    }
    // Slice this category's effects into 8-cell pages
    for (let off = 0; off < cat.effects.length; off += CELLS_PER_PAGE) {
      const slice = cat.effects.slice(off, off + CELLS_PER_PAGE) as EffectName[];
      if (cursor >= SHOWCASE_DURATION) break;
      const remaining = SHOWCASE_DURATION - cursor;
      const dur = Math.min(PAGE_DURATION, remaining);
      pages.push({
        start: cursor,
        duration: dur,
        type: "page",
        category: cat.name,
        cells: slice,
      });
      cursor += dur;
    }
    if (cursor >= SHOWCASE_DURATION) break;
  }
  return pages;
};

const PAGES = buildPages();

// Section divider — full-bleed black with the category name in large mono
const Divider: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dur = DIVIDER_DURATION;
  const t = Math.min(1, frame / dur);
  const eased = t * t * (3 - 2 * t);
  const scale = interpolate(eased, [0, 1], [0.96, 1]);
  const opacity = interpolate(eased, [0, 0.3, 1], [0, 1, 1]);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity,
      }}
    >
      <div
        style={{
          color: "#525252",
          fontSize: Math.round(height * 0.022),
          fontFamily: "ui-monospace, Menlo, monospace",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          transform: `scale(${scale})`,
        }}
      >
        category
      </div>
      <div
        style={{
          color: "#fafafa",
          fontSize: Math.round(height * 0.16),
          fontWeight: 800,
          fontFamily: "ui-monospace, Menlo, monospace",
          letterSpacing: "-0.02em",
          marginTop: 8,
          transform: `scale(${scale})`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: Math.round(height * 0.06),
          color: "#404040",
          fontSize: 11,
          fontFamily: "ui-monospace, monospace",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {width}×{height} · 30fps · remotion-documentary
      </div>
    </AbsoluteFill>
  );
};

// A single effect cell in the grid
const Cell: React.FC<{
  effect: EffectName;
  category: string;
  cellIndex: number;
  durationInFrames: number;
}> = ({ effect, category, cellIndex, durationInFrames }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: `${(cellIndex % COLS) * (100 / COLS)}%`,
        top: `${Math.floor(cellIndex / COLS) * (100 / ROWS)}%`,
        width: `${100 / COLS}%`,
        height: `${100 / ROWS}%`,
        backgroundColor: "#1a1a1a",
        borderRight: cellIndex % COLS === COLS - 1 ? "none" : "1px solid #2a2a2a",
        borderBottom: Math.floor(cellIndex / COLS) === ROWS - 1 ? "none" : "1px solid #2a2a2a",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: 10,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Label bar — effect name + category badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "ui-monospace, Menlo, monospace",
          color: "#a3a3a3",
          fontSize: 10,
          letterSpacing: "0.04em",
          marginBottom: 6,
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <span style={{ color: "#d4d4d4", fontWeight: 600 }}>{effect}</span>
        <span style={{ color: "#525252", fontSize: 9, textTransform: "uppercase" }}>
          {category}
        </span>
      </div>
      {/* Effect rendering — Director call. Placeholder cells render a labeled cell. */}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <Director
          effect={effect}
          image="/sample-portrait.svg"
          text="SAMPLE"
          durationInFrames={durationInFrames}
          intensity={1}
        />
      </div>
    </div>
  );
};

export const Showcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {PAGES.map((page, i) =>
        page.type === "divider" ? (
          <Sequence
            key={`div-${i}-${page.category}`}
            from={page.start}
            durationInFrames={page.duration}
          >
            <Divider label={page.category} />
          </Sequence>
        ) : (
          <Sequence
            key={`page-${i}-${page.category}`}
            from={page.start}
            durationInFrames={page.duration}
          >
            {page.cells!.map((effect, ci) => (
              <Cell
                key={`cell-${i}-${ci}-${effect}`}
                effect={effect}
                category={page.category}
                cellIndex={ci}
                durationInFrames={page.duration}
              />
            ))}
          </Sequence>
        ),
      )}
    </AbsoluteFill>
  );
};

// Stats for the dev panel — useful in the studio overlay
export const SHOWCASE_STATS = {
  totalEffects: TOTAL_EFFECTS,
  categories: CATEGORIES.length,
  duration: SHOWCASE_DURATION,
  fps: 30,
  pageDuration: PAGE_DURATION,
  dividerDuration: DIVIDER_DURATION,
  cellsPerPage: CELLS_PER_PAGE,
};
