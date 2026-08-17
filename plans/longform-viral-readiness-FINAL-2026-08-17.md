# LONGFORM VIRAL-READINESS ENGINE — FINAL IMPLEMENTATION PLAN

**Date:** 2026-08-17
**Target project:** R4Flutter/video_engine
**Target episode:** The Company That Sells You Nothing — 19:14
**Mode:** `LONGFORM_DOCUMENTARY` (canonical, the only accepted value)
**Reference intelligence:** yt_engine (corpus, no copying)
**Renderer:** Remotion + Vidosy-style deterministic render contract

This file supersedes `longform-viral-readiness-engine-2026-08-17.md`. That v1 had a real architectural gap. v2 below is the merge.

---

## 0. HONEST COMPARISON — WHAT v1 GOT WRONG

My v1 plan had the right module list but the wrong architecture. Six specific failures, all corrected in v2:

| v1 failure | v2 fix |
|---|---|
| `banned.ts` as a string-name list of 10 symbols | `PipelinePolicy.ts` as a **capability manifest** with `forbidden` / `required` lists and dependency-graph validation |
| Three mode values floating around: `LONG_FORM`, `LONGFORM`, `LONGFORM_DOCUMENTARY` | One canonical enum: `LONGFORM_DOCUMENTARY`. Grep-and-replace across the entire repo before any new code lands |
| `FinanceLongform.tsx` consuming `LongformDirectorPlan` directly with no intermediate layer | A dedicated **LongFormRenderContract** module between Director and Remotion. `Director decides, Render Contract records, Remotion executes` |
| Single cold-open candidate generated, scored, returned | Multi-candidate pipeline: `generate → score → attack → rewrite → rescore → rank → select`. 8 archetypes (contradiction / mystery / consequence / recognition / evidence-first / visual-mystery / high-stakes / human-paradox) |
| B-roll as a search-query string | `LongFormBrollDirector` emits structured direction: `subject / action / location / shot / camera / continuity / query / fallback` |
| QC stops at the plan. No check on the rendered pixels. | **Rendered-pixel QC** after render: frame sampling, black-frame detection, stale-image detection, caption overlap, asset-missing, timeline mismatch |

The Vidosy insight — `Director decides, Render Contract records, Remotion executes` — is the single most important correction. Without it, the renderer is free to invent editorial choices. With it, the renderer is a pure executor of a recorded contract. That changes the determinism guarantee from "the plan was good" to "the rendered pixels match the plan."

Path A (build engine + render contract + FinanceLongform + asset migration together) is the right choice. The user is correct that building a thin renderer and migrating later creates two architectures.

---

## 1. CANONICAL ENUM — CLEAN BEFORE BUILDING

Before any new module, grep-and-replace the repo so exactly one mode value exists.

**The one value:** `LONGFORM_DOCUMENTARY`

**Files to update (every occurrence of any variant):**
```
video/src/director/longform-types.ts                  (already uses LONGFORM_DOCUMENTARY)
video/src/director/plan.ts                            (line ~46: isLongForm branch — keep as runtime check, but log mode as LONGFORM_DOCUMENTARY)
video/src/director/qc/LongFormQC.ts                   (line ~22: formatExpected — gate at durationInSeconds >= 120 AND mode === LONGFORM_DOCUMENTARY)
video/src/director/qc/LongFormQC.ts                   (line ~35: "longform-nonfinance-engine" finding)
video/src/Root.tsx                                    (Composition mode field)
video/src/FinanceShort.tsx → video/src/FinanceLongform.tsx   (rename + retarget)
package.json                                          (every script that has "short" in the name)
tools/direct.mjs → tools/direct_longform.mjs          (rename)
tools/parse-script.mjs                                (reject < 120s in finance mode)
DIRECTOR.md                                           (any reference)
prompt/AGENT.md                                       (any reference)
prompt/editing-director-19m.md                        (already LONGFORM_DOCUMENTARY — verify)
```

**Forbidden strings (the preflight check will reject any file containing these):**
```
"SHORT"
"ShortsSwipeRisk"  "ShortLoopPlanner"  "ShortFrameZero"  "ShortsDerivedPlan"  "ShortRender"  "ShortsQC"
"LONG_FORM"  "LONGFORM"  "LONG_FORM_DOCUMENTARY"
"buildShortPlan"  "estimateSwipe"  "planFrameZero"  "runHookQC"  "runPacingQC"  "runCuriosityQC"  "runVisualQC"  "runAudioQC"  "runLoopQC"  "runRetentionQC"
```

The preflight is `tools/preflight_longform.mjs`. It runs before `npm run direct`. Exit code 1 if any forbidden string is reachable from the long-form import graph. Cheap (~200ms).

---

## 2. PIPELINE POLICY (CAPABILITY MANIFEST, NOT SYMBOL NAMES)

**File (new):** `video/src/director/PipelinePolicy.ts`

```ts
export type PipelineCapability =
  | "LongFormColdOpen"
  | "LongFormBeatComposer"
  | "LongFormPacing"
  | "LongFormCuriosity"
  | "LongFormEvidence"
  | "LongFormVisualHierarchy"
  | "LongFormBroll"
  | "LongFormAudio"
  | "LongFormRenderContract"
  | "LongFormQC"
  | "LongFormAutofix"
  | "LongFormPixelQC"
  | "LongFormViralScore"
  | "Remotion";

export type PolicyMode = "LONGFORM_DOCUMENTARY";

export const LONG_FORM_POLICY = {
  mode: "LONGFORM_DOCUMENTARY" as PolicyMode,
  minDurationSeconds: 120,
  maxDurationSeconds: 60 * 60,    // 1 hour ceiling
  fps: 30,
  width: 1920,
  height: 1080,
  engine: ["finance", "documentary"],

  forbidden: [
    "ShortsSwipeRisk",
    "ShortLoopPlanner",
    "ShortFrameZero",
    "ShortsDerivedPlan",
    "ShortRender",
    "ShortsQC",
    "FinanceShort",
    "VoxExplain",
    "StickmanExplain",
  ] as const,

  required: [
    "LongFormColdOpen",
    "LongFormBeatComposer",
    "LongFormPacing",
    "LongFormCuriosity",
    "LongFormEvidence",
    "LongFormVisualHierarchy",
    "LongFormBroll",
    "LongFormAudio",
    "LongFormRenderContract",
    "LongFormQC",
    "LongFormAutofix",
    "LongFormPixelQC",
    "LongFormViralScore",
  ] as const,

  retentionTarget: {
    apv0to30: 0.70,                 // 70% retention at 30s
    apvMidpoint: 0.50,              // 50% at the 50% mark
    apvFinal: 0.35,                 // 35% at the end
  },

  qcGates: {
    hook: 8.5,
    narrative: 8.0,
    curiosity: 8.0,
    pacing: 7.0,
    visualHierarchy: 8.0,
    visualVariety: 8.0,
    evidence: 8.0,
    audio: 7.0,
    transitions: 7.0,
    payoff: 8.0,
    loop: 7.0,
    maxFatal: 0,
  },

  autofix: {
    maxIterations: 3,
    minRepairRate: 0.70,            // at least 70% of eligible HIGH/MED fixed
  },
} as const;

export const validatePolicy = (currentMode: string, capabilities: Set<PipelineCapability>) => {
  if (currentMode !== "LONGFORM_DOCUMENTARY") {
    throw new Error(`PipelinePolicy: mode must be LONGFORM_DOCUMENTARY, got "${currentMode}"`);
  }
  for (const req of LONG_FORM_POLICY.required) {
    if (!capabilities.has(req)) {
      throw new Error(`PipelinePolicy: required capability "${req}" is not registered`);
    }
  }
};
```

The orchestrator (`runLongFormEngine`) calls `validatePolicy` before any planning. If anything is missing, it fails loud with the exact capability name.

---

## 3. FINAL ARCHITECTURE (THE ONE WE SHIP)

```
                     script.md
                        │
                        ▼
                 parse + alignment
                        │
                        ▼
              ┌─────────────────────┐
              │ LongForm Cold Open  │  ← 8 archetype candidates
              │    Generator        │  ← score-attack-rewrite-rescore-rank
              └──────────┬──────────┘
                        │
              candidate hooks/cold opens
                        │
                        ▼
                      yt_engine
            reference intelligence (NOT scripts)
                        │
                        ▼
                 hook scoring/ranking
                        │
                        ▼
              ┌─────────────────────┐
              │ LongForm Beat       │  ← HOOK / ORIENT / CONTRADICTION /
              │ Composer            │     MECHANISM / PROOF / ESCALATION /
              └──────────┬──────────┘     REVERSAL / CONSEQUENCE / REVEAL /
                        │                  PAYOFF / CALLBACK
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
     pacing           curiosity         evidence
        │                 │                 │
        └─────────────────┼─────────────────┘
                        ▼
              Visual Hierarchy Director
                        │
                        ▼
              B-roll Director (structured)
                        │
                        ▼
              Audio / Camera Director
                        │
                        ▼
              LongForm Director Plan
                        │
                        ▼
                   LongForm QC
                        │
              ┌─────────┴─────────┐
              │                   │
            FAIL                 PASS
              │                   │
              ▼                   │
          Autofix ≤3              │
              │                   │
              └─────────┐         │
                        ▼         ▼
                  Render Contract   ← Vidosy-style deterministic
                        │
                        ▼
                  FinanceLongform
                        │
                        ▼
                      Remotion
                        │
                        ▼
                     final.mp4
                        │
                        ▼
                  Pixel QC          ← post-render frame check
                        │
                        ▼
                  yt_engine score
                        │
                        ▼
                  Feedback loop
```

---

## 4. RENDER CONTRACT (THE PIECE v1 MISSED)

**File (new):** `video/src/render/LongFormRenderContract.ts`
**Companion modules:** `RenderScene.ts`, `RenderMedia.ts`, `RenderTypography.ts`, `RenderMotion.ts`, `RenderAudio.ts`, `RenderTransition.ts`

The Render Contract is a **recorded instruction set** for Remotion. It contains every value the renderer needs to produce a frame. The Director computes it; the Renderer reads it; nothing is invented at render time.

**Schema (`render-contract-1.0`):**
```ts
type RenderContract = {
  schema: "longform-render-1";
  project: { title: string; durationInSeconds: number; fps: number; width: number; height: number; mode: "LONGFORM_DOCUMENTARY" };
  sequence: SequenceNode[];        // chapter → beat → scene tree
  scene: Record<string, SceneSpec>; // scene id → composition
  media: Record<string, MediaRef>;  // media id → asset path + crop + trim
  typography: Record<string, TypographySpec>;
  motion: Record<string, MotionSpec>;
  audio: Record<string, AudioSpec>;
  transition: Record<string, TransitionSpec>;
  asset: Record<string, AssetBinding>; // beat id → required asset ids
  timing: Record<string, TimingSpec>;  // beat id → in/out frames
  proofs: Record<string, EvidenceProof>; // claim id → source URL / file
};
```

**The rule, written on the wall above the renderer:**
> Director decides. Render Contract records. Remotion executes.

`FinanceLongform.tsx` reads `RenderContract` and only `RenderContract`. It does not call `buildShortPlan`, does not import any banned symbol, does not compute any editorial decision. If a new visual treatment is needed, the Director must add a new entry to the contract; the Renderer cannot invent one.

---

## 5. NEW MODULES — FILE-BY-FILE

### 5.1 Pipeline Policy & Preflight

| File | Role |
|---|---|
| `video/src/director/PipelinePolicy.ts` (new) | Capability manifest, gates, retention targets |
| `tools/preflight_longform.mjs` (new) | Grep-and-reject forbidden strings; check capability registration; exit 1 on failure |

### 5.2 Long-Form Schema (extends existing)

| File | Role |
|---|---|
| `video/src/director/longform/types.ts` (new, replaces `longform-types.ts`) | One canonical type file. Exports `LongFormDirectorPlan`, `LongFormBeat`, `LongFormChapter`, `LongFormQCReport`, `LongFormReferencePattern` |
| `video/src/director/longform/longform-types.ts` (delete) | Replaced |

### 5.3 Cold-Open Generator (the heart)

| File | Role |
|---|---|
| `video/src/director/longform/LongFormColdOpenGenerator.ts` (new) | Generates 8 candidates, scores, attacks, rewrites, re-scores, ranks, selects |
| `video/src/director/longform/ColdOpenScorer.ts` (new) | Deterministic scorer for the 10 dimensions: specificity, curiosity, stakes, clarity, novelty, emotional tension, visual potential, evidence potential, claim latency, information density, payoff potential |
| `video/src/director/longform/ColdOpenVariants.ts` (new) | The 8 archetype templates: contradiction, mystery, consequence, recognition, evidence-first, visual-mystery, high-stakes, human-paradox |

### 5.4 Reference Intelligence Bridge

| File | Role |
|---|---|
| `yt_engine/reference-patterns.json` (new) | Stable, versioned export of learned reference signals (no scripts, no music, no creator-specific identity) |
| `video/src/director/longform/YtReferenceBridge.ts` (new) | Reads the JSON, returns a `LongFormReferencePattern` object the Director consumes |
| `tools/viral.py` (edit) | Add `reference-patterns` subcommand: `python tools/viral.py reference-patterns --out yt_engine/reference-patterns.json` |

### 5.5 Beat Composer

| File | Role |
|---|---|
| `video/src/director/longform/LongFormBeatComposer.ts` (new) | Maps the script to 40-60 documentary beats with narrative jobs (HOOK / ORIENT / CONTRADICTION / MECHANISM / PROOF / ESCALATION / REVERSAL / CONSEQUENCE / REVEAL / PAYOFF / CALLBACK) |
| `video/src/director/longform/LongFormPacingOptimizer.ts` (new) | Detects long static explanation, repeated visual grammar, information plateau, evidence drought, visual wallpaper. Plans meaningful changes, not arbitrary cuts |
| `video/src/director/longform/LongFormCuriosityInjector.ts` (new) | Tracks an active question stack (Q1/Q2/Q3/Q4) and ensures: open → delay → advance evidence → partially answer → open stronger question → payoff |

### 5.6 Visual + Evidence + B-roll

| File | Role |
|---|---|
| `video/src/director/longform/LongFormVisualHierarchyEnforcer.ts` (new) | One-idea-per-frame. PRIMARY / SECONDARY / TEXTURE only. Reject 3+ equally loud elements |
| `video/src/director/longform/LongFormEvidenceRouter.ts` (new) | Maps every claim → document / screenshot-UI / number / chart / archival / logo / B-roll / recreation / diagram. Flags CLAIM WITH NO VISUAL PROOF |
| `video/src/director/longform/LongFormBrollDirector.ts` (new) | Emits structured direction: subject / action / location / shot / camera / continuity-group / query / fallback-query. Feeds `tools/fetch-footage.py` |

### 5.7 Audio

| File | Role |
|---|---|
| `video/src/director/longform/LongFormAudioDirector.ts` (new) | Music arc, silence as editorial tool, J/L cuts, SFX only on earned events, chapter transitions, voice/music balance. No whoosh-every-5-seconds |

### 5.8 Render Contract

| File | Role |
|---|---|
| `video/src/render/LongFormRenderContract.ts` (new) | The recorded instruction set for Remotion |
| `video/src/render/RenderScene.ts` (new) | Scene composition (subject + content + position) |
| `video/src/render/RenderMedia.ts` (new) | Media binding (asset id → file path + crop + trim) |
| `video/src/render/RenderTypography.ts` (new) | Typography spec (font, size, role: hero/support/source) |
| `video/src/render/RenderMotion.ts` (new) | Motion spec (camera intent, transition, FX) |
| `video/src/render/RenderAudio.ts` (new) | Audio spec (bed, silence, accents) |
| `video/src/render/RenderTransition.ts` (new) | Transition spec (cut / jcut / lcut / match / contrast / dissolve) |

### 5.9 Renderer

| File | Role |
|---|---|
| `video/src/FinanceLongform.tsx` (new) | Remotion composition that consumes ONLY `LongFormRenderContract`. No editorial logic |
| `video/src/FinanceShort.tsx` (keep, but unreachable from the long-form path) | Legacy. Shorts-only product. Stays in the repo for that other product |
| `video/src/Root.tsx` (edit) | Register `FinanceLongform` composition |

### 5.10 QC

| File | Role |
|---|---|
| `video/src/director/longform/LongFormQC.ts` (new — replaces `qc/LongFormQC.ts`) | 12-dimension scorer: HOOK / NARRATIVE / CURIOSITY / PACING / VISUAL_HIERARCHY / VISUAL_VARIETY / EVIDENCE / BROLL / AUDIO / TRANSITIONS / PAYOFF / CONTINUITY. Gates render |
| `video/src/director/longform/LongFormAutofix.ts` (new) | Max 3 iterations. Auto-repairs timing / visual / B-roll / camera / reveal / typography / evidence / transition / music / silence / cold-open structure. **Forbidden to touch script wording, facts, sources, claims, thesis, evidence** |
| `video/src/director/longform/LongFormPixelQC.ts` (new) | Post-render: frame sampling, black-frame detection, stale-image detection, caption overlap, asset-missing, timeline mismatch |
| `tools/qc_longform.mjs` (new) | Wraps LongFormQC + LongFormPixelQC. Exits 1 on FATAL or pixel mismatch |

### 5.11 Viral Score

| File | Role |
|---|---|
| `yt_engine/analyzer/longform_score.py` (new) | Post-render 0-100 scorecard using long-form weights (hook / visual novelty / question cadence / payoff density / evidence density / semantic change rate / chapter transitions / visual fatigue / audio rhythm) |
| `tools/viral.py` (edit) | Default mode → `documentary`. New subcommand `full` runs the entire pipeline end-to-end |

### 5.12 Single Entry Point

| File | Role |
|---|---|
| `tools/episode.mjs` (edit) | New long-form chain replaces the old short chain. See section 8 below |
| `package.json` (edit) | New `npm run episode` orchestrator. Remove the short-form-only scripts (or alias them to error) |

---

## 6. CANONICAL ENUM — REPLACEMENT MAP

| Old | New |
|---|---|
| `SHORT` | (delete — never appears in long-form path) |
| `ShortsSwipeRisk` | (delete) |
| `LONG_FORM` | `LONGFORM_DOCUMENTARY` |
| `LONGFORM` | `LONGFORM_DOCUMENTARY` |
| `LONG_FORM_DOCUMENTARY` | `LONGFORM_DOCUMENTARY` |
| `buildShortPlan` | `buildLongFormPlan` |
| `planFrameZero` | (delete — replaced by ColdOpenGenerator) |
| `estimateSwipe` | (delete — replaced by LongFormCompletionProxy) |
| `runHookQC` | `runLongFormHookQC` (already exists) |
| `runPacingQC` | `runLongFormPacingQC` (already exists) |
| `runCuriosityQC` | `runLongFormCuriosityQC` (already exists) |
| `runVisualQC` | `runLongFormVisualQC` (already exists) |
| `runAudioQC` | `runLongFormAudioQC` (already exists) |
| `runLoopQC` | `runLongFormLoopQC` (already exists) |
| `runRetentionQC` | (delete — replaced by LongFormCompletionProxy) |
| `FinanceShort.tsx` | `FinanceLongform.tsx` |
| `npm run render:vox` | `npm run render` (long-form is the default) |
| `npm run script:vox` | `npm run script` (long-form is the default) |
| `npm run bench`, `bench:gpu`, `lab` | (delete) |

---

## 7. THE 22-PHASE IMPLEMENTATION ORDER

Use this order. Each phase is a mergeable unit. Don't build all 13 modules in one sitting.

| # | Phase | Output | Time | Depends on |
|---|---|---|---|---|
| 01 | PipelinePolicy + preflight | `PipelinePolicy.ts`, `preflight_longform.mjs`, forbidden-string grep | 1h | — |
| 02 | Canonical enum sweep | All `LONG_FORM` / `LONGFORM` / `SHORT` references replaced with `LONGFORM_DOCUMENTARY` or deleted | 1h | 01 |
| 03 | LongForm schema | `longform/types.ts` consolidates all long-form types; `longform-types.ts` deleted | 1h | 02 |
| 04 | ColdOpenGenerator | 8 archetype templates, multi-candidate pipeline, score-attack-rewrite-rescore-rank | 4h | 03 |
| 05 | yt_engine reference bridge | `reference-patterns.json`, `YtReferenceBridge.ts`, `viral.py reference-patterns` | 2h | 03 |
| 06 | BeatComposer | Narrative jobs, viewer-question tracking, chapter boundaries | 3h | 04, 05 |
| 07 | Visual + Pacing + Curiosity | Three directors that operate on the composer output | 4h | 06 |
| 08 | Evidence + B-roll | EvidenceRouter, BrollDirector with structured direction | 3h | 06 |
| 09 | Audio direction | LongFormAudioDirector | 2h | 06 |
| 10 | Render Contract | `LongFormRenderContract.ts` + 6 companion modules | 4h | 07, 08, 09 |
| 11 | FinanceLongform renderer | Pure executor of RenderContract. No editorial logic | 4h | 10 |
| 12 | LongFormQC | 12-dimension scorer, gates per PipelinePolicy | 3h | 06 |
| 13 | Autofix | Max 3 iterations, restricted to non-content fields | 2h | 12 |
| 14 | Pixel QC | Frame sampling, black-frame, stale-image, caption overlap, asset-missing, timeline | 3h | 11 |
| 15 | Viral Score | `analyzer/longform_score.py`, weighted long-form scorecard | 2h | 11, 14 |
| 16 | Single `npm run episode` | Replaces the multi-command chain | 1h | 12, 13, 14, 15 |
| 17 | 91-asset migration | Existing 91 assets re-bound to the new RenderContract shape | 4h | 10, 11 |
| 18 | Golden-plan test | Snapshot test: same input → same plan JSON, byte-for-byte | 1h | 16 |
| 19 | Unit tests | One per director. ≥ 10 tests per module | 4h | 06-15 |
| 20 | Integration test: 19:14 episode | `npm run episode` produces final.mp4 + score ≥ 8.5 | 2h | 17, 18, 19 |
| 21 | Pixel-QC test | Rendered video passes pixel QC. No black frames, no stale images, no missing assets | 1h | 14, 20 |
| 22 | Post-publish learning loop | `feedback/analytics_pull.py` pulls retention from YouTube; `feedback/calibrate.py` updates reference patterns | 2h | 15, 20 |
| **Total** | | | **~50h dev** | |

After dev: every new 19-min episode ships end-to-end in **30–60 min** (script → scored render → pixel-clean mp4).

---

## 8. THE NEW `npm run episode`

The full long-form chain is one command. The user never types twenty commands.

```
npm run episode
  → 01 preflight_longform    (forbidden-string grep; capability registration)
  → 02 parse                 (script_beats.md → script.json)
  → 03 voice                 (Chatterbox TTS → voice.json, 1154s target)
  → 04 align                 (Whisper alignment → word timings)
  → 05 longform-direct       (ColdOpenGenerator → Composer → 6 directors → Plan)
  → 06 longform-QC           (12-dim scorer)
  → 07 autofix ≤3            (if QC has eligible findings)
  → 08 longform-QC again     (verify autofix)
  → 09 render-preflight      (RenderContract validation)
  → 10 render-contract       (Director → Contract)
  → 11 render                (Remotion → FinanceLongform → out/final.mp4)
  → 12 pixel-QC              (frame-sample → black/stale/overlap/missing/timeline)
  → 13 viral-score           (yt_engine → out/longform-viral-score.json)
  → 14 final-report          (one summary; exit 0 on ship, 1 on fix-first)
```

---

## 9. FINAL OUTPUT (WHAT THE USER SEES)

```
video/out/
  final.mp4
  longform-plan.json
  render-contract.json
  qc-report.json
  pixel-qc-report.json
  longform-viral-score.json
  timings.txt
  autofix-report.json
```

Terminal summary on a healthy run:

```
════════ LONGFORM PRODUCTION ════════

Episode:        The Company That Sells You Nothing
Duration:       19:14
Mode:           LONGFORM_DOCUMENTARY
Engine:         finance

HOOK            9.2
NARRATIVE       8.7
CURIOSITY       8.9
PACING          8.1
VISUAL          8.8
EVIDENCE        9.0
AUDIO           8.0
PAYOFF          8.6

OVERALL         8.7 / 10

Autofix passes  2
FATAL           0
HIGH            0

Pixel QC        PASS
YT Engine       87 / 100

RENDER: READY
```

---

## 10. ACCEPTANCE CRITERIA (THE GATE THAT PROVES IT WORKS)

The system is done when **all** of these are true:

**Architecture**
- [ ] `npm run episode` never enters a Short-only director path
- [ ] `npm run preflight_longform` passes; the preflight is also run inside `episode` as step 01
- [ ] `render-contract.json` is the only artifact the renderer reads (besides media files)
- [ ] `FinanceLongform.tsx` does not call any director function — it only reads the contract

**Mode**
- [ ] `plan.project.mode === "LONGFORM_DOCUMENTARY"` for every long-form episode
- [ ] A < 120s finance script is rejected by the parser with a clear error
- [ ] A non-finance, non-documentary engine is rejected with a clear error

**Cold Open**
- [ ] ColdOpenGenerator produces 8 candidates (one per archetype)
- [ ] Each candidate goes through score → attack → rewrite → rescore → rank
- [ ] The winner is selected algorithmically, not by the user
- [ ] The selected cold open satisfies: visual first ≥ 3.5s, first number ≥ 4.5s, hook claim ≥ 18s, no `number before 5s` corpus warning, no `impossible_outcome + stakes_money` corpus warning, ≤ 7 words in the final claim

**QC**
- [ ] HOOK ≥ 8.5, NARRATIVE ≥ 8.0, CURIOSITY ≥ 8.0, PACING ≥ 7.0, VISUAL_HIERARCHY ≥ 8.0, VISUAL_VARIETY ≥ 8.0, EVIDENCE ≥ 8.0, AUDIO ≥ 7.0, TRANSITIONS ≥ 7.0, PAYOFF ≥ 8.0, LOOP ≥ 7.0
- [ ] No FATAL findings
- [ ] At least 70% of eligible HIGH/MED findings are auto-repaired in the test suite
- [ ] A 9.5 hook does NOT compensate for a 4/10 middle — gating is per-dimension with no "overall" pass

**Pixel QC**
- [ ] No black frames > 1s
- [ ] No stale images (frame repeated > 5s without visual change)
- [ ] No caption overlap with critical on-screen text
- [ ] No missing assets
- [ ] No timeline mismatch (frame 0 of contract = frame 0 of render)

**Viral Score**
- [ ] Score reproducible: same input → same output
- [ ] Score correlates with actual YouTube retention after 5+ uploads (recalibrated)

**19:14 Episode Regression**
- [ ] `npm run episode` on the current script produces: final.mp4 + render-contract.json + qc-report.json + pixel-qc-report.json + longform-viral-score.json
- [ ] All QC scores pass the gates
- [ ] YT Engine score ≥ 80
- [ ] No manual editing required

**Short Isolation**
- [ ] `preflight_longform` rejects any file containing `buildShortPlan`, `estimateSwipe`, `planFrameZero`, `runHookQC`, etc.
- [ ] `npm run script:vox`, `render:vox`, `render:vox:wide`, `render:stick`, `bench`, `bench:gpu`, `lab` either do not exist or error with "long-form pipeline does not support this script"

---

## 11. WHAT THIS PLAN DOES NOT DO

- It does not invent footage. The 91-asset pack is on disk; the engine consumes it
- It does not invent numbers. The cold-open generator takes `facts` from the user
- It does not invent sources. The EvidenceRouter fails loud on `INSUFFICIENT`
- It does not copy scripts, music, transitions, or creator-specific identity from yt_engine
- It does not pretend to know views. The viral score is a comparative optimization metric; real retention is the ground truth
- It does not touch the existing Remotion Shorts compositions. They stay in the repo for legacy compatibility but are unreachable from the long-form render path

---

## 12. IMMEDIATE NEXT STEPS

If you say go, I execute in this order:

1. Create the worktree `feature/longform-viral-engine` per the project's worktree rule
2. Phase 01: PipelinePolicy + preflight
3. Phase 02: canonical enum sweep
4. Phase 03: LongForm schema
5. Phase 04: ColdOpenGenerator (the highest-leverage module)
6. Re-run the deterministic engine on `company-sells-you-nothing` after Phase 04 to verify the cold open now hits 9+ on the hook score
7. Continue with phases 05-22, each as a separate mergeable unit

You'll get a diff to review at the end of each phase. Total dev: ~50h, broken into 22 reviewable chunks.

Say go.
