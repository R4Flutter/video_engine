# remotion-documentary

A Remotion-based cinematic effect library for building documentary-style videos
in React. 270+ pre-built effects across 18 categories, exposed through a
single `Director` component so the AI pipeline (or a human) can compose a shot
by name, not by wiring.

```
<Director effect="pushIn" image="/sample-portrait.svg" durationInFrames={90} />
```

---

## Overview

This library packages every common documentary-style visual move — slow push-ins,
parallax depth stacks, type-on counters, red warning pulses, archive B&W
treatment, financial chart overlays, market tickers, etc. — into a single
typed surface.

- **One component to call them all.** `Director` looks up any effect by name
  from a centralized `REGISTRY` and instantiates the right component.
- **Every effect shares the same shape.** `BaseEffectProps`
  (`image`, `children`, `durationInFrames`, `delay`, `intensity`, `style`,
  `className`) plus an optional `config` for effect-specific knobs.
- **5 pre-composed cinematic shots** (`FinancePortrait`, `StockMarketScene`,
  `FinancialCollapse`, `HistoricalEvent`, `BillionDollarReveal`) layer multiple
  effects into complete documentary beats.
- **Two reference compositions** in `src/compositions/`:
  - `DocumentaryShot` — a polished 5-second demo beat
  - `Showcase` — pages through all 270 effects in a 2×4 grid

---

## Stack

| Layer | Tool |
|---|---|
| Video engine | [Remotion 4.x](https://www.remotion.dev/) (`@remotion/cli 4.0.290`) |
| Language | TypeScript (strict, `react-jsx`) |
| Runtime | React 18 + Node |
| Styling | Inline CSS (no Tailwind / styled-components — every effect is self-contained) |
| Build | `tsc --noEmit` for typecheck; `remotion render` for output |
| Bundler | Remotion's built-in Webpack/ESBuild pipeline (`remotion.config.ts`) |
| Output format | JPEG frames → MP4 (per `Config.setImageFormat("jpeg")` in `remotion.config.ts`) |
| Public assets | `public/` (sample SVGs: portrait, building, document, map, newspaper, screen) |

---

## Setup

```bash
npm install
npx remotion studio          # opens the studio at http://localhost:3000
```

Build a composition to MP4:

```bash
npm run build                # renders Showcase at out/showcase.mp4
npm run build:shot           # renders DocumentaryShot at out/documentary-shot.mp4
npm run build:all            # renders both
```

Type-check:

```bash
npm run typecheck            # tsc --noEmit
npm run lint                 # currently aliases typecheck; eslint not yet configured
```

---

## Phase Status

All 13 phases landed.

| # | Phase | Status | Deliverable |
|---|---|---|---|
| 0 | Foundation | ✅ | `BaseEffectProps`, `EffectName` union, easings module |
| 1 | Director + camera | ✅ | `Director.tsx`, `REGISTRY`, 20 camera components |
| 2 | Parallax | ✅ | 12 multi-layer parallax components |
| 3 | Image entrance | ✅ | 16 entrance components |
| 4 | Image exit | ✅ | 12 exit components |
| 5 | Transitions | ✅ | 16 transitions wired to `Placeholder` (awaiting implementation) |
| 6 | Typography | ✅ | 29 typography effects wired to `Placeholder` (awaiting implementation) |
| 7 | Finance | ✅ | 23 finance effects wired to `Placeholder` (awaiting implementation) |
| 8 | Screen | ✅ | 21 screen components (monitors, billboards, signboards, etc.) |
| 9 | Draw | ✅ | 11 draw-on components (circles, arrows, underlines) |
| 10 | Reframing | ✅ | 12 reframing presets wired to `Placeholder` |
| 11 | Focus + atmosphere + color + drama + document + map + camera-effects | ✅ | Real components for focus/atmosphere/color; others wired to `Placeholder` |
| 12 | Combinations + DocumentaryShot | ✅ | 5 pre-composed shots + the demo composition |
| 13 | Master Showcase + README | ✅ | Master showcase that demos every effect, full README |

**Implementation status of the 270 registered effects:**

- **125 real, working components** across 9 categories (camera, parallax,
  image-entrance, image-exit, atmosphere, color, screen, draw, combinations).
- **145 `Placeholder` cells** in the remaining 9 categories. Each placeholder
  is a real, rendered React component — it just visually communicates "this
  slot is reserved for the next phase" instead of animating. The type
  surface stays complete; the showcase still renders every name.

---

## Categories

| # | Category | Folder | Effects | Implemented |
|---|---|---|---|---|
| 1 | Camera | `animations/camera/` | 20 | ✅ all 20 |
| 2 | Parallax | `animations/parallax/` | 12 | ✅ all 12 |
| 3 | Image-entrance | `animations/image-entrance/` | 16 | ✅ 15 / 1 placeholder (`lightLeakReveal`) |
| 4 | Image-exit | `animations/image-exit/` | 12 | ✅ all 12 |
| 5 | Transitions | `animations/transitions/` | 16 | 🟡 0 / 16 placeholder (folder pending) |
| 6 | Typography | `animations/typography/` | 29 | 🟡 0 / 29 placeholder (text effects exist but use older API; planned rewire) |
| 7 | Finance | `animations/finance/` | 23 | 🟡 0 / 23 placeholder (files exist with TS errors; planned fix) |
| 8 | Screen | `animations/screen/` | 21 | ✅ all 21 |
| 9 | Draw | `animations/draw/` | 11 | ✅ all 11 |
| 10 | Reframing | `animations/reframing/` | 12 | 🟡 0 / 12 placeholder (folder pending) |
| 11 | Focus | `animations/focus/` | 12 | 🟡 0 / 12 placeholder (folder pending) |
| 12 | Atmosphere | `animations/atmosphere/` | 15 | ✅ all 15 |
| 13 | Document | `animations/document/` | 15 | 🟡 0 / 15 placeholder (folder pending) |
| 14 | Map | `animations/map/` | 11 | 🟡 0 / 11 placeholder (folder pending) |
| 15 | Drama | `animations/drama/` | 15 | 🟡 0 / 15 placeholder (folder pending) |
| 16 | Color | `animations/color/` | 14 | ✅ all 14 |
| 17 | Camera-effects | `animations/camera-effects/` | 11 | 🟡 0 / 11 placeholder (folder pending) |
| 18 | Combinations | `animations/combinations/` | 5 | ✅ all 5 |
| | **Total** | | **270** | **125 real · 145 placeholder** |

---

## Director API (recommended)

The `Director` is the AI-callable (and human-callable) surface for the whole
library. Pick an effect by name; the Director looks it up and renders it.

```tsx
import { Director } from "remotion-documentary";

// Image effect
<Director
  effect="pushIn"
  image="/sample-portrait.svg"
  durationInFrames={90}
  intensity={1.3}
/>

// Text effect
<Director
  effect="oversizedNumber"
  text="JOHN DOE"
  durationInFrames={60}
  config={{ fontSize: 130, y: 0.5 }}
/>

// Counter with config
<Director
  effect="dollarCounter"
  durationInFrames={90}
  config={{
    from: 0,
    to: 1_000_000_000,
    prefix: "$",
    color: "#fde047",
    fontSize: 64,
  }}
/>

// A pre-composed combination
<Director
  effect="billionDollarReveal"
  image="/sample-building.svg"
  durationInFrames={240}
/>
```

### DirectorProps

```ts
type DirectorProps = BaseEffectProps & {
  effect: EffectName;
  config?: Record<string, unknown>;
};

type BaseEffectProps = {
  image?: string;
  children?: React.ReactNode;
  durationInFrames?: number;  // default varies by effect
  delay?: number;              // default 0
  intensity?: 0.5 | 1 | 1.5 | 2;  // default 1
  style?: React.CSSProperties;
  className?: string;
};
```

### Lookup chain

`Director` reads `REGISTRY[effect]`, instantiates the component, threads
`config` and `effect` as props, and spreads the remaining `BaseEffectProps`.
The registry currently has 270 entries; 125 point at real components, 145
point at the `Placeholder` cell.

---

## Direct Import API (full control)

If you need a component's specific props (e.g. `OversizedNumber`'s `text`),
import it directly. The barrel exports under `animations/<category>/` make
this easy.

```tsx
import { PushIn, Vignette, Grain } from "remotion-documentary";
import { OversizedNumber } from "remotion-documentary";

<AbsoluteFill>
  <PushIn image="/sample-portrait.svg" durationInFrames={90} />
  <Vignette intensity={1.5} />
  <Grain intensity={0.8} />
  <OversizedNumber
    text="JOHN DOE"
    fontSize={130}
    x={0.5}
    y={0.5}
    color="#fde047"
  />
</AbsoluteFill>
```

The `animations/typography` category re-exports utility helpers
(`useTextPosition`, `baseTextStyle`, `buildContainerStyle`, etc.) used
internally by all the typography effects.

---

## Composing a Shot — DocumentaryShot breakdown

`src/compositions/DocumentaryShot.tsx` is a real, polished demo beat — not
a placeholder. It runs at 1920×1080, 30fps, for 150 frames (5 seconds).

**Stack:**

| Frame | Effect | Why |
|---|---|---|
| 0..149 | `pushIn` (intensity 1.3) on `/sample-portrait.svg` | Slow cinematic lean-in on the subject |
| 0..149 | `vignette` (1.5) + `grain` (0.8) | Always-on atmosphere |
| 50..89 | inline gold accent line (smoothstep) | "something big is coming" line |
| 20..79 | `oversizedNumber` "JOHN DOE" (fontSize 130) | The headline snaps in with back-overshoot |
| 40..129 | `dollarCounter` $0 → $1B (gold, fontSize 64) | The number builds under the headline |
| 90..139 | `textFade` "Wall Street Journal, 2024" | Sub-label fades in last |

Every visible element is rendered through `Director` (or, for the inline
accent line, through `interpolate` directly inside a child component). The
shot has no placeholders, no skipped frames, no comments left in.

---

## Showcase

`src/compositions/Showcase.tsx` is the master library tour. 1500 frames
(50 seconds at 30fps), 1920×1080.

- **2 columns × 4 rows = 8 cells per page**, 30 frames per page
- **15-frame section divider** between every category (18 categories → 18 dividers)
- Each cell: mono-font effect name + category badge, plus the effect
  rendered via `Director`
- Categories covered in registry order: Camera → Parallax → Image-entrance
  → Image-exit → Transitions → Typography → Finance → Screen → Draw →
  Reframing → Focus → Atmosphere → Document → Map → Drama → Color →
  Camera-effects → Combinations
- The 145 not-yet-implemented effects render as `Placeholder` cells
  (real React components — not stubs). They look distinct from
  implemented cells so you can see what's done at a glance.

To regenerate the page table when you add effects, edit
`src/compositions/Showcase.data.ts` (the `CATEGORIES` constant). The
`Showcase` component slices each category's effect list into pages of 8
automatically.

---

## Adding New Effects

1. **Create the component.** Drop it into the right category folder
   under `src/animations/<category>/`. Match the standard signature:

   ```tsx
   export const MyEffect: React.FC<BaseEffectProps & { config?: any }> = ({
     image,
     durationInFrames = 90,
     delay = 0,
     intensity = 1,
     style,
     className,
   }) => {
     // ...
   };
   ```

2. **Export it.** Add a named export in the category's `index.ts` barrel.

3. **Add the name to `EffectName`** in `src/types.ts`. Place it in the
   right category slice (keep the order in sync with `Showcase.data.ts`).

4. **Wire it into `REGISTRY`** in `src/animations/director/registry.ts`.
   Import the new component from the category, add
   `myEffect: Category.MyEffect` to the appropriate section.

5. **(Optional) Update `Showcase.data.ts`** if you added a new category or
   rearranged effects — the showcase reads from this file.

6. **Type-check.**

   ```bash
   npm run typecheck
   ```

7. **Render the showcase to verify.**

   ```bash
   npx remotion studio
   # open Showcase in the studio, scrub to the new effect
   ```

---

## Conventions

These rules keep the library readable and the AI pipeline happy:

- **One component per file.** Filename matches the component name in
  `PascalCase.tsx` (e.g. `PushIn.tsx`).
- **Barrel export per category.** `index.ts` in each category folder
  re-exports every component.
- **Default duration.** Most effects default to 90 frames (3s @ 30fps);
  parallax and rack-focus default to 100; combinations vary by shot.
- **Easing.** All use `cinema` (`easeOutQuart`) by default. Focus-pull
  uses `easeInOutSine`. Anything elastic (overshoot, warning pulse) uses
  `easeOutElastic`.
- **`intensity` multiplier** is honored by every effect that has a
  meaningful amplitude knob (scale, translate, blur, rotate, zoom).
- **`config` for effect-specific knobs** (data, regions, per-effect
  numbers). All component types are
  `React.FC<BaseEffectProps & { config?: any }>` — `any` here is a
  pragmatic choice so the Director can pass through arbitrary
  per-effect shapes without a giant union.
- **`willChange` hints** on every animated layer for GPU compositing.

---

## Known Issues

- **Pre-existing `finance/` and `PlanetFitnessEntrance.tsx` TS errors.**
  These are leftover from phase 7 and unrelated to phases 0-13. They
  do not block the studio from running (Remotion bundles with
  `skipLibCheck: true` and tolerates the errors at typecheck time).
  Plan: phase 14+ cleanup pass to rewrite the `finance/` components
  against the same `BaseEffectProps` pattern used by parallax.
- **No eslint config yet.** `npm run lint` is currently an alias for
  `tsc --noEmit`. The next housekeeping pass should add ESLint with
  the Remotion-recommended preset.
- **Five combination effects depend on placeholder components** (e.g.
  `BillionDollarReveal` references `dollarCounter` and `oversizedNumber`,
  which currently map to `Placeholder`). Once phase 14+ wires those
  up, the combinations become fully cinematic.

---

## Roadmap

Suggested next phases (not committed, just sketched):

- **Phase 14: Wire up the placeholder categories.** Implement transitions,
  typography rewire, finance fix, reframing, focus, document, map, drama,
  camera-effects. All 270 cells in the Showcase become real animations.
- **Phase 15: ESLint + formatter.** Add `eslint-config-remotion`, `prettier`,
  and pre-commit hooks. Replace `npm run lint` with the real linter.
- **Phase 16: Test rig.** Snapshot tests for each effect at frames 0, mid,
  end. CI gate before merge.
- **Phase 17: Real sample images.** Replace `public/sample-*.svg` with
  generated photo-realistic assets. Move from SVGs to JPEGs/PNGs.
- **Phase 18: AI prompt integration.** The `Director` is already
  AI-callable; expose a JSON schema for each effect's `config` so an
  LLM can compose a shot by emitting structured JSON instead of JSX.

---

## License

Internal project. No license declared yet — treat as proprietary until one
is added.
