# LONGFORM VIRAL-READINESS ENGINE — SYSTEM PLAN

**Date:** 2026-08-17
**Scope:** Long-form (≥ 2:00) finance / documentary / essay video only
**Out of scope:** Shorts, feed-vertical, < 120s
**Mode:** LONGFORM_DOCUMENTARY (the only `mode` value this pipeline accepts)
**Engine:** finance | documentary (no other engines in scope)

This file IS the build contract. It bans the short-form model from the pipeline, defines the long-form engine that replaces it, and lists every module, its contract, its file, and its implementation order.

---

## 0. BANNED — DO NOT RUN IN THIS PIPELINE

The short-form model is **banned** from the long-form pipeline. The following paths, scripts, and modules are out of scope and must not be referenced by any new code:

| Banned path / symbol | Why banned |
|---|---|
| `video/src/director/attention/HookEngine.ts` → `planFrameZero` for 6-word glanceable hook | Designed for Shorts; long-form needs a 3-layer cold open (visual-first / evidence / late claim) |
| `video/src/director/attention/SwipeRisk.ts` → `estimateSwipe` | Shorts swipe-hazard model; long-form uses LongFormCompletionProxy |
| `video/src/director/qc/HookQC.ts` | Shorts QC. Long-form uses `LongFormHookQC.ts` only |
| `video/src/director/qc/PacingQC.ts` | Shorts pacing. Long-form uses `LongFormPacingQC.ts` |
| `video/src/director/qc/CuriosityQC.ts` | Shorts curiosity. Long-form uses `LongFormCuriosityQC.ts` |
| `video/src/director/qc/VisualQC.ts` | Shorts visual. Long-form uses `LongFormVisualQC.ts` |
| `video/src/director/qc/AudioQC.ts` | Shorts audio. Long-form uses `LongFormAudioQC.ts` |
| `video/src/director/qc/LoopQC.ts` | Shorts loop. Long-form uses `LongFormLoopQC.ts` |
| `video/src/director/qc/RetentionQC.ts` | Shorts retention. Long-form uses `LongFormCompletionProxy.ts` |
| `buildShortPlan` (in `plan.ts`) | The function name itself. Long-form uses `buildLongFormPlan` |
| `npm run render:vox`, `npm run render:vox:wide`, `npm run render:stick` | These render Shorts/vertical/Stickman. Long-form uses `npm run render:finance` only |
| `npm run script:vox` | Parses `script_vox.md` (Shorts script). Long-form uses `npm run script` which parses `script.md` / `script_beats.md` |
| `npm run bench`, `npm run bench:gpu`, `npm run lab` | Bench/lab render. Out of scope |
| `package.json` field `mode: "SHORT"` in any plan artifact | Long-form plans must be `mode: "LONGFORM_DOCUMENTARY"` |
| YT_ENGINE `mode: "money"` hook generation default | Long-form uses `mode: "documentary"` in `python tools/viral.py hook` calls |

**Any new code that imports a banned symbol, calls a banned npm script, or writes a plan with `mode: "SHORT"` is a regression and must be reverted.**

The bridge `tools/viral.py` remains, but its long-form defaults change:
- `python tools/viral.py hook <topic>` → `--mode documentary` (was `money`)
- `python tools/viral.py patterns` → no change, but only finance/documentary scopes are honored
- `python tools/viral.py score <video>` → uses new `analyzer.longform_score` module

---

## 1. WHAT EXISTS TODAY (AND WHY IT'S NOT ENOUGH)

### Long-form QC stack (already implemented, just not wired into the render path)

| Module | File | Role | Status |
|---|---|---|---|
| Type system | `video/src/director/longform-types.ts` | `LongformDirectorPlan`, `LongformEditBeat`, `LongformChapter` | ✅ exists |
| Orchestrator | `video/src/director/qc/LongFormQC.ts` | 6-dim weighted QC, gates render at 120s+ | ✅ exists |
| Hook QC | `video/src/director/qc/LongFormHookQC.ts` | 3-layer cold-open rules | ✅ exists |
| Pacing QC | `video/src/director/qc/LongFormPacingQC.ts` | 15-45s pacing window | ✅ exists |
| Curiosity QC | `video/src/director/qc/LongFormCuriosityQC.ts` | open-loop tracking | ✅ exists |
| Visual QC | `video/src/director/qc/LongFormVisualQC.ts` | one-idea-per-frame | ✅ exists |
| Audio QC | `video/src/director/qc/LongFormAudioQC.ts` | music + silence + accents | ✅ exists |
| Loop QC | `video/src/director/qc/LongFormLoopQC.ts` | opening callback | ✅ exists |
| Completion proxy | `video/src/director/qc/LongFormCompletionProxy.ts` | retention projection | ✅ exists |
| Module policy | `video/src/director/visual/LongFormModulePolicy.ts` | which module for which beat | ✅ exists |

### The gap

**The QC stack is detection, not generation.** It catches a 0.0/10 pacing plan, a 3.4/10 overall, a broken hook — but it doesn't *propose* a fix that satisfies the rules.

**The build path is contaminated.** `tools/direct.mjs` calls `buildShortPlan` even when `durationInSeconds >= 120`. The plan object that comes out has `mode: "SHORT"` in the JSON. The renderer (`FinanceShort.tsx`) is wired to consume `ShortPlan` shape, not `LongformDirectorPlan`.

**The QC orchestrator is not on the render path.** `npm run direct` → `buildShortPlan` → `runRetentionQC` (short). The long-form QC exists but nothing calls it.

**The viral score is generic.** `analyzer/score.py` doesn't know about the long-form hook structure (3-layer / late-claim), the long-form pacing window, the long-form evidence rate, or the long-form loop.

**No auto-fix.** `autofix/rewrite.mjs` exists in yt_engine but isn't called by anything in this project.

---

## 2. THE NEW LONG-FORM ENGINE

The long-form engine is one **orchestrator** (`LongFormEngine`) that owns the full editorial loop:

```
input: script.json + voice.json
  ↓
[1] LongFormColdOpenGenerator    ← 3 candidates, scored, pick best
  ↓
[2] LongFormBeatComposer         ← builds 60-beat structure w/ reasonForChange
  ↓
[3] LongFormVisualHierarchyEnforcer  ← rejects 4+ element frames
  ↓
[4] LongFormPacingOptimizer      ← splits over-length beats, adds motion FX
  ↓
[5] LongFormCuriosityInjector    ← injects open loops at retention risk
  ↓
[6] LongFormEvidenceRouter       ← assigns document/UI/chart to each claim
  ↓
[7] LongFormCompositionAssembler ← produces LongformDirectorPlan
  ↓
[8] LongFormQC                   ← gates render (FATAL/High/Med/Low)
  ↓
[9] LongFormAutofix              ← auto-fixes every QC finding < FATAL
  ↓
[10] LongFormViralScore          ← post-render 0-100 score
```

**Rule:** every step is deterministic. Same input always produces same plan.

---

## 3. NEW MODULES — SPECIFICATIONS

### 3.1 `LongFormColdOpenGenerator`

**File (new):** `video_engine/video/src/director/longform/LongFormColdOpenGenerator.ts`
**Corpus bridge:** `tools/viral.py hook --mode documentary --duration 30 --facts "..."`

**Purpose:** Given a topic and 3-5 facts, produce 3 candidate cold opens that follow the 3-layer structure. Score each. Return the highest.

**Input:**
```ts
type ColdOpenInput = {
  topic: string;
  thesis: string;
  facts: string[];                    // verified, no invention
  contract: ColdOpenContract;         // 3-layer structure
  mode: "finance" | "documentary";
};
type ColdOpenContract = {
  visualFirstMs: number;              // default 3500
  evidenceArrivesMs: number;          // default 9500
  hookClaimLandsMs: number;           // default 18000
  totalDurationMs: number;            // default 30000
  maxHookWords: number;               // default 7
};
```

**Output:**
```ts
type ColdOpenOutput = {
  selected: ColdOpenCandidate;
  runnerUp: ColdOpenCandidate;
  rejected: { candidate: ColdOpenCandidate; reason: string }[];
  corpusSignals: LearnedSignals;      // from yt_engine
  contractSatisfied: boolean;
};
type ColdOpenCandidate = {
  vo: string;                         // word-for-word narration for 0-30s
  visualStates: VisualStatePlan[];    // 4-6 sub-states w/ timings
  heroText: { at: number; text: string; support?: string }[];
  hookLever: "contradiction" | "specificity" | "curiosity_gap" | "recognition" | "negative_urgency";
  score: number;                      // 0-10
  reasonForChoice: string;
};
```

**Logic (deterministic):**
1. Call `python tools/viral.py hook <topic> --mode documentary --duration 30 --facts <facts>` 3 times with different `facts` orderings.
2. For each candidate: validate against 3-layer contract (visual first, evidence 3.5-9.5s, claim ≥ 18s).
3. Filter candidates that violate:
   - `number before 5s` corpus warning
   - `impossible_outcome + stakes_money` corpus warning (HIGH confidence -0.982)
   - more than 7 words in the final on-screen claim
   - DEAD_OPENERS regex
4. Score remaining candidates on:
   - 3-layer contract compliance (40%)
   - corpus `entity_before_10s` alignment (20%)
   - corpus `curiosity_before_5s` alignment (20%)
   - lever diversification vs channel history (20%)
5. Return top 2 + rejection reasons.

**Banned behavior:** must never import from `attention/HookEngine.ts`. Must never call `planFrameZero` (short-form 6-word hook).

---

### 3.2 `LongFormBeatComposer`

**File (new):** `video_engine/video/src/director/longform/LongFormBeatComposer.ts`

**Purpose:** Given a 40-beat script and a verified cold open, compose the full `LongformDirectorPlan` with chapter boundaries, beat-level visual states, transitions, and a `reasonForChange` per beat.

**Input:**
```ts
{
  script: Script;                  // from parse-script.mjs
  voice: VoiceJson;                // from voice.py + align.py
  coldOpen: ColdOpenCandidate;
  chapterSpec: ChapterSpec[];      // from script_beats.md
}
```

**Output:** `LongformDirectorPlan` (matches `longform-types.ts`).

**Logic:**
1. For each script beat, build a `LongformEditBeat` with all required fields.
2. `reasonForChange` is mandatory; reject beats where it's empty, "looks cool", "dynamic", "more engaging", "needs movement".
3. No two consecutive beats can share the same `visual.kind` unless one is a callback. Enforce via `enforceVariety`.
4. `maxConsecutiveSameVisualKind` global budget = 2.
5. `minimumEvidenceEvents` = 8 for finance engine.
6. `minimumMajorVisualResets` = 3.

---

### 3.3 `LongFormVisualHierarchyEnforcer`

**File (new):** `video_engine/video/src/director/longform/LongFormVisualHierarchyEnforcer.ts`

**Purpose:** Enforce the §7 frame-composition rules from the editorial contract. Reject frames with 4+ competing elements. Propose simplification.

**Rules enforced:**
- One primary idea per frame.
- Max 1 HERO text, 1 SUPPORT text, 1 SOURCE label.
- No `photo + giant logo + chart + subtitle + decorative motion` simultaneously.
- B-roll: negative-condition compliance (empty gym = no crowd, no class, no trainer, no athlete foreground, no busy scene).
- Logo: only on first introduction or when entity becomes part of argument.

**Output:**
```ts
type HierarchyVerdict = {
  beat: number;
  elements: VisualElement[];
  passes: boolean;
  violations: { rule: string; fix: string }[];
};
```

---

### 3.4 `LongFormPacingOptimizer`

**File (new):** `video_engine/video/src/director/longform/LongFormPacingOptimizer.ts`

**Purpose:** Given a beat structure, auto-fix pacing issues:
- Beats > 30s on one claim → split into 2 with `reasonForChange: "claim was over-stretched, splitting for retention"`.
- Beats with `info-density high` → remove a number or shorten VO.
- Beats with `dead-frame` → add `Motion FX` mark.
- Beats with `module-repeated-back-to-back` → swap module family.

**Output:** new beat list, plus a diff against the input showing what changed and why.

---

### 3.5 `LongFormCuriosityInjector`

**File (new):** `video_engine/video/src/director/longform/LongFormCuriosityInjector.ts`

**Purpose:** Walk the script and inject `viewerQuestion` and `nextQuestion` rows at every beat where none exists. The 15-45s pacing window rule means a question must be open at every window. The injector proposes questions that:
- Are unanswered by the current beat.
- Are answerable by a future beat in the script.
- Don't conflict with already-asked questions.

**Output:**
```ts
type CuriosityInjection = {
  beat: number;
  proposedQuestion: string;
  resolvesAtBeat: number;
  type: "open_loop" | "anticipation" | "recognition" | "reversal";
};
```

---

### 3.6 `LongFormEvidenceRouter`

**File (new):** `video_engine/video/src/director/longform/LongFormEvidenceRouter.ts`

**Purpose:** For every factual claim in the script, assign one of:
- `SOURCE_CAPTURE` (a real filing, court opinion, agency release)
- `ARCHIVE_RECREATION` (a real period artifact recreated)
- `GENERATED_RECREATION` (a clearly labelled recreation)
- `DATA_GRAPHIC` (a chart or number)
- `B_ROLL` (acceptable when claim is environmental, not specific)
- `INSUFFICIENT` (claim cannot be supported — must be re-written or cut)

Hard rule: **never** assign `B_ROLL` to a legal allegation. **Never** assign `INSUFFICIENT` to a number in `proof` or `reveal` beats. **Never** invent a source.

---

### 3.7 `LongFormCompositionAssembler`

**File (new):** `video_engine/video/src/director/longform/LongFormCompositionAssembler.ts`

**Purpose:** Take the composer output and produce a final `LongformDirectorPlan` JSON that:
- Has `mode: "LONGFORM_DOCUMENTARY"` (never `SHORT`).
- Has `version: "longform-1.0"`.
- Passes `validateTimeline(plan)`.
- Has `loop.motif` set to the opening's strongest claim.
- Has `chapters[]` defined with thesis + opening question + closing payoff.

---

### 3.8 `LongFormQC` (already exists, just wire it up)

**Action:** `tools/direct.mjs` calls `runLongFormQC(plan, curiosity, beats[0]?.vo)` instead of `runRetentionQC(plan, curiosity, firstVo)`. Add a guard: if `plan.project.engine !== "finance"` AND `plan.project.engine !== "documentary"`, REJECT.

---

### 3.9 `LongFormAutofix`

**File (new):** `video_engine/tools/autofix_longform.mjs`

**Purpose:** For every QC finding with severity < FATAL, attempt an auto-fix and rerun. Skip FATAL — those need a human.

**Loop:**
1. Run QC.
2. For each finding (sorted by severity), call the appropriate engine:
   - `sparse-reveals` → `LongFormCuriosityInjector.injectReveals()`
   - `dead-frame` → `LongFormPacingOptimizer.addMotionFX()`
   - `module-repeated` → `LongFormPacingOptimizer.alternateModule()`
   - `swipe-risk` → `LongFormPacingOptimizer.shorten()`
   - `hook-desync`, `late-claim`, `unwritten-hook` → fail loud, require human rewrite
3. Rerun composer + QC.
4. Max 3 iterations; after that, surface remaining findings to human.

---

### 3.10 `LongFormViralScore`

**File (new):** `yt_engine/analyzer/longform_score.py`

**Purpose:** Post-render 0-100 scorecard that uses long-form-specific weights.

**Score breakdown:**
- `hook` (0-10, weight 22%): 3-layer cold open compliance
- `pacing` (0-10, weight 24%): 15-45s window, no dead-frame > 2.5s, words/sec in range
- `curiosity` (0-10, weight 21%): open-loop density, longest flat run < 5s
- `visualVariety` (0-10, weight 12%): one-idea-per-frame, no module streaks > 2
- `audio` (0-10, weight 8%): music/silence/accent distribution
- `loop` (0-10, weight 13%): opening callback strength

**Output:** `out/longform-viral-score.json` with:
```json
{
  "video": "out/final.mp4",
  "title": "...",
  "overall": 0-100,
  "components": { "hook": 0-10, "pacing": 0-10, ... },
  "findings": [ {"rule": "...", "severity": "...", "fix": "..."} ],
  "topWeakMoments": [ {"at": 123.4, "why": "...", "fix": "..."} ],
  "publishRecommendation": "ship" | "fix first" | "do not publish",
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "timestamp": "ISO8601"
}
```

---

## 4. NEW ORCHESTRATOR: `LongFormEngine`

**File (new):** `video_engine/video/src/director/longform/LongFormEngine.ts`

**Single public function:**
```ts
export const runLongFormEngine = (
  scriptPath: string,
  voicePath: string,
  coldOpenFacts: string[],
  options?: { autoFix?: boolean; maxIterations?: number }
): {
  plan: LongformDirectorPlan;
  qc: QcReport;
  viralScore?: LongFormViralScore;
  iterations: number;
  autofixLog: AutofixLogEntry[];
};
```

**Pipeline:**
1. `parseScript(scriptPath)` → Script
2. `loadVoice(voicePath)` → VoiceJson
3. `analyzeStory(script)` → facts
4. `runCuriosity(script, facts)` → curiosity state
5. `LongFormColdOpenGenerator.generate(topic, thesis, coldOpenFacts)` → ColdOpenCandidate
6. `LongFormBeatComposer.compose({script, voice, coldOpen, chapterSpec})` → LongformDirectorPlan
7. `LongFormVisualHierarchyEnforcer.enforce(plan)` → fix or reject
8. `LongFormPacingOptimizer.optimize(plan)` → fix
9. `LongFormCuriosityInjector.inject(plan)` → fill
10. `LongFormEvidenceRouter.route(plan)` → assign evidence per claim
11. `LongFormCompositionAssembler.assemble(plan)` → final plan
12. `runLongFormQC(plan, curiosity, firstVo)` → QcReport
13. If `autoFix && qc.findings.some(f => f.severity !== "FATAL")`: loop 9→12, max 3 iterations
14. If any FATAL remains, return `{ plan, qc, iterations, autofixLog }` and refuse to render
15. Else: write `out/longform-plan.json`, return ready-to-render plan

**Banned:** import from any of the modules in §0. If a banned import is added, the orchestrator refuses to run.

---

## 5. NEW TOOLS / SCRIPTS

### 5.1 `tools/direct_longform.mjs`

**File (new):** Replaces the current `tools/direct.mjs` as the long-form entry point.

**Logic:**
1. Detect if `script.json.durationInSeconds >= 120`.
2. If yes, call `runLongFormEngine(...)`.
3. If no, **ERROR** — short-form is banned from this pipeline. Print a clear error pointing to the short-form project.

### 5.2 `tools/viral.py` updates

**File (edit):** `C:\video_engine\tools\viral.py`

**Changes:**
- `sub.add_parser("score", ...)`: when called with `--longform`, route to `analyzer.longform_score.score`.
- `sub.add_parser("hook", ...)`: default `mode` is now `documentary` (was `money`).
- New subcommand: `full` — runs `viral:patterns` → `direct` → `qc` → `gate` → `viral:score` end-to-end.

### 5.3 `package.json` updates

```json
{
  "scripts": {
    "direct": "node --experimental-strip-types ../tools/direct_longform.mjs",
    "script": "node ../tools/check.mjs && node ../tools/parse-script.mjs ../script.md src/script.json && npm run direct",
    "render": "remotion render FinanceLongform out/final.mp4",
    "render:finance": "remotion render FinanceLongform out/final.mp4",
    "viral:longform": "python ../tools/viral.py full --longform",
    "viral:full": "python ../tools/viral.py full --longform",
    "viral:benchmark": "python -m miner.hooks benchmark",
    "viral:gate": "node --experimental-strip-types ../tools/qc_longform.mjs --strict"
  }
}
```

**Remove (or alias to error):**
- `script:vox`, `render:vox`, `render:vox:wide`, `render:stick`, `bench`, `bench:gpu`, `lab`

### 5.4 `tools/qc_longform.mjs`

**File (new):** Wraps `runLongFormQC` with the strict gate. Exits non-zero on FATAL.

---

## 6. NEW RENDERER ENTRY

**File (new):** `video_engine/video/src/FinanceLongform.tsx`

**Purpose:** Remotion composition that consumes `LongformDirectorPlan` (not `ShortPlan`).

**Differences from `FinanceShort.tsx`:**
- Reads `out/longform-plan.json` instead of `director-plan.json`.
- Resolves `chapters[]` into Remotion `Sequence` per chapter.
- For each beat, uses `visual.kind` to pick the asset family.
- Honors `transition` (cut / jcut / lcut / match / contrast / dissolve) per beat.
- Honors `audio.silenceBeforeReveal` for the long-form silence rule.
- Honors `retention.fatigueRisk` to schedule visual resets.

**Wire-up:**
```ts
// video/src/Root.tsx
<Composition
  id="FinanceLongform"
  component={FinanceLongform}
  durationInFrames={plan.project.durationInSeconds * fps}
  fps={plan.project.fps}
  width={plan.project.width}
  height={plan.project.height}
/>
```

---

## 7. DATA FLOW (END-TO-END)

```
script_beats.md
  ↓ parse-script.mjs
video/src/script.json
  ↓ voice.py
video/src/voice.json
  ↓ align.py + lipsync.mjs
video/src/voice.json (with word timings)
  ↓ tools/viral.py hook --mode documentary
3 cold-open candidates from yt_engine
  ↓ LongFormColdOpenGenerator
selected cold open
  ↓ runLongFormEngine
out/longform-plan.json
  ↓ runLongFormQC + autofix loop
gate green
  ↓ npm run render (Remotion → FinanceLongform)
out/final.mp4
  ↓ npm run viral:score
out/longform-viral-score.json
  ↓ publish
YouTube retention data (48h later)
  ↓ feedback/analytics_pull.py + calibrate.py
yt_engine pattern refresh
  ↓ next episode's priors
```

---

## 8. IMPLEMENTATION ORDER (TIME-ESTIMATED)

| # | Module | Where | Time | Depends on |
|---|---|---|---|---|
| 1 | `LongFormColdOpenGenerator` + bridge to `tools/viral.py hook --mode documentary` | video_engine | 2h | — |
| 2 | `LongFormBeatComposer` | video_engine | 3h | 1 |
| 3 | `LongFormVisualHierarchyEnforcer` | video_engine | 1.5h | 2 |
| 4 | `LongFormPacingOptimizer` | video_engine | 1.5h | 2 |
| 5 | `LongFormCuriosityInjector` | video_engine | 1h | 2 |
| 6 | `LongFormEvidenceRouter` | video_engine | 2h | 2 |
| 7 | `LongFormCompositionAssembler` | video_engine | 1h | 2-6 |
| 8 | `LongFormEngine` orchestrator | video_engine | 1.5h | 1-7 |
| 9 | `LongFormAutofix` loop | video_engine | 2h | 8 |
| 10 | `tools/direct_longform.mjs` (bans short-form) | video_engine | 30m | 8 |
| 11 | `tools/qc_longform.mjs` | video_engine | 30m | — (uses existing LongFormQC) |
| 12 | `package.json` updates + remove short-form scripts | video_engine | 15m | 10, 11 |
| 13 | `FinanceLongform.tsx` Remotion composition | video_engine | 4h | 8 |
| 14 | `analyzer/longform_score.py` | yt_engine | 2h | — |
| 15 | `tools/viral.py` updates (longform subcommand, default mode) | video_engine | 30m | 14 |
| 16 | `autofix/rewrite_longform.mjs` (yt_engine side) | yt_engine | 2h | 14 |
| 17 | Integration test: re-run on `company-sells-you-nothing` | both | 1h | 1-16 |
| **Total** | | | **~24h dev** | |

After dev: every new long-form episode ships in **30-60 min** end-to-end (script → scored render).

---

## 9. ACCEPTANCE CRITERIA

The new system is done when:

1. `npm run direct` produces a `longform-plan.json` with `mode: "LONGFORM_DOCUMENTARY"`. Never `SHORT`.
2. `npm run direct` errors loudly if `script.json.durationInSeconds < 120`.
3. `npm run direct` errors loudly if any import in the long-form path matches a banned symbol.
4. `npm run qc` (renamed to `npm run viral:gate`) uses `LongFormQC` only.
5. `npm run gate` is green when:
   - `hook` score ≥ 9.0 (3-layer cold open passes)
   - `pacing` score ≥ 4.0 (no swipe-risk on every beat)
   - `curiosity` score ≥ 7.0
   - `visualVariety` score ≥ 8.0
   - `audio` score ≥ 7.0
   - `loop` score ≥ 7.0
   - No `FATAL` findings
6. `npm run render` produces `out/final.mp4` via `FinanceLongform.tsx`.
7. `npm run viral:score -- out/final.mp4 --title "..."` produces a 0-100 long-form scorecard.
8. Re-running on the current `company-sells-you-nothing` episode, the deterministic engine produces a plan that the director scores **OVERALL ≥ 7.0** (vs the current 3.4 from the short-form path).
9. The cold-open beat 1 the engine produces for any new long-form script satisfies:
   - Visual first (≥ 3.5s of empty-room / pure visual)
   - First number ≥ 4.5s (corpus: no `number before 5s`)
   - Hook claim lands ≥ 18s (corpus: payoff by 5s for the visual layer, claim by 18-30s for the contradiction)
   - `number before 5s` corpus effect avoided
   - `impossible_outcome + stakes_money` corpus effect avoided (HIGH -0.982)
   - ≤ 7 words in the final on-screen claim
   - `entity_before_10s` corpus alignment (+0.239 MEDIUM)
   - 0.8s hold, no camera move, no title
10. The autofix loop handles ≥ 70% of HIGH and MED findings without human intervention.
11. The viral score from `analyzer/longform_score.py` is reproducible (same input = same output) and correlates (after 5+ uploads) with actual YouTube retention.

---

## 10. THE BANNED MANIFESTO (in code)

Add a single `banned.ts` at `video_engine/video/src/director/longform/banned.ts`:

```ts
// This file exists to make the ban physical. The orchestrator imports it
// and refuses to run if any of these symbols are present in the call graph.

export const BANNED_SHORT_FORM_SYMBOLS = [
  "planFrameZero",          // HookEngine.ts
  "estimateSwipe",          // SwipeRisk.ts
  "runHookQC",              // HookQC.ts (short)
  "runPacingQC",            // PacingQC.ts (short)
  "runCuriosityQC",         // CuriosityQC.ts (short)
  "runVisualQC",            // VisualQC.ts (short)
  "runAudioQC",             // AudioQC.ts (short)
  "runLoopQC",              // LoopQC.ts (short)
  "runRetentionQC",         // RetentionQC.ts (short)
  "buildShortPlan",         // plan.ts
] as const;

export const BANNED_NPM_SCRIPTS = [
  "script:vox",
  "render:vox",
  "render:vox:wide",
  "render:stick",
  "bench",
  "bench:gpu",
  "lab",
] as const;

export const assertNoShortFormInCallGraph = () => {
  // In dev mode, walk the require/import stack. In prod, trust the orchestrator.
  // The orchestrator's only entry point is runLongFormEngine — anything else
  // is by definition short-form.
};
```

---

## 11. WHAT THIS PLAN DOES NOT DO

- It does not invent footage. The 91-asset pack is on disk; the engine consumes it.
- It does not invent numbers. The cold-open generator takes `facts` from the user.
- It does not invent sources. The EvidenceRouter fails loud on `INSUFFICIENT`.
- It does not pretend to know views. The viral score is a QA instrument; real retention is the ground truth.
- It does not touch the existing Remotion Shorts compositions. They stay in the repo for legacy compatibility but are not on the long-form render path.

---

## 12. FILES THIS PLAN TOUCHES

**New files (video_engine):**
```
video/src/director/longform/LongFormColdOpenGenerator.ts
video/src/director/longform/LongFormBeatComposer.ts
video/src/director/longform/LongFormVisualHierarchyEnforcer.ts
video/src/director/longform/LongFormPacingOptimizer.ts
video/src/director/longform/LongFormCuriosityInjector.ts
video/src/director/longform/LongFormEvidenceRouter.ts
video/src/director/longform/LongFormCompositionAssembler.ts
video/src/director/longform/LongFormEngine.ts
video/src/director/longform/banned.ts
tools/direct_longform.mjs
tools/qc_longform.mjs
tools/autofix_longform.mjs
video/src/FinanceLongform.tsx
plans/longform-viral-readiness-engine-2026-08-17.md (this file)
```

**Edited files (video_engine):**
```
package.json                                  (script changes)
tools/viral.py                                (longform subcommand, mode default)
video/src/Root.tsx                            (register FinanceLongform)
```

**New files (yt_engine):**
```
analyzer/longform_score.py
autofix/rewrite_longform.mjs
miner/hook_patterns_longform.py               (extends hook_gen.py for documentary mode)
```

**Edited files (yt_engine):**
```
miner/hook_gen.py                             (add longform mode weights)
```

---

## 13. IMMEDIATE NEXT STEPS

If you say go, I'll execute in this order:
1. Create the worktree `feature/longform-viral-engine` per the project's worktree rule.
2. Write the `banned.ts` and `LongFormEngine` orchestrator shell.
3. Wire `tools/direct_longform.mjs` to call the orchestrator.
4. Edit `package.json` to remove the short-form scripts and add the long-form ones.
5. Re-run the engine on `company-sells-you-nothing` to verify the gate is green with the new cold open.
6. If gate is green, run the render.
7. Score the render.
8. Report.

Say go.
