# Retention Engineering Framework

Evidence-based retention engineering for programmatic video creation in Remotion, mapped to this repo's QC pipeline (`video/src/director/qc/`).

## The Formula

| Milestone | What Happens | Algorithm Signal | Fix in Remotion |
|---|---|---|---|
| **0–2s** | First frame + VO must land the contradiction. No logos, no cold opens, no "welcome to the channel". | Thumbnail/view-through; tap-away is highest in this window | Open with a `PATTERN_INTERRUPT` or `CONTRADICTION` beat at frame 0 (LongFormHookQC: `MAX_CLAIM_LATENCY` 12s, `MAX_SILENT_HOLD` 4s). Animate the claim IN with `spring` — never fade from black. |
| **2–5s** | Visual must re-confirm the promise. One shot, one idea. | Swipe decision completes ~here | Second meaningful event (`NUMBER_REVEAL` or `OBJECT_ENTRY`) by beat 2. `interpolate()` a camera push-in; keep the SAME object on screen — no cut yet. |
| **5–30s** | Curiosity gap widens; stakes escalate. Every line of VO maps to one visual. | Early retention slope (avg % viewed at 30s) | One open loop per 3–5s (`CuriosityEngine.openLoop[]`). Drive narration/overlay alignment (LongFormHookQC). VO silence allowed only in beat gaps, never mid-claim. |
| **30s–2m** | First payoff lands, second hook opens. Chapter rhythm established. | % viewed @ 30s→1m, cliff detection | First `PAYOFF` at end of chapter 1, then a fresh `QUESTION`. Use `<Sequence>` per chapter (LongFormRetention `chapterFactor` targets ≥8 chapters for long-form). |
| **2–10m** | Pacing beats per minute stay high. Visual variety prevents fatigue. | Mid-video drop-off (watch-time cliff) | ≥1.25 meaningful events/min (`eventFactor` in LongFormRetention). Rotate visual pattern: paper-cut → UI mock → archive → graphic — VisualQC flags repeated types. |
| **10m+** | Callbacks + escalating stakes. Retention loop closes, recap begins. | Average view duration (AVD) | Loop old assets: replay a chapter-1 graphic at the end (`loopFactor` 0.12). Cut the cold-open scene AGAIN as a callback — cheap, high-retention. |
| **Final 30s** | Promise is paid, next episode teased. CTA is diegetic, not begging. | Return / next-view (channel stickiness) | `LOOP` → `PAYOFF` final graphic, then a pattern-interrupt end card. No "like and subscribe" — the closing frame re-states the hook's contradiction. |

## Mapping to This Pipeline

- **Pre-render gate** — `RetentionQC.ts` routes short vs long-form and weighs `hook 0.34 / pacing 0.22 / curiosity 0.18 / visual 0.12 / audio 0.07 / loop 0.07`. The milestones above are the time-domain spec those weights measure.
- **The proxy** — `LongFormRetention.ts` scores `craft × 0.60 + openLoops × 0.12 + chapters × 0.14 + events/min × 0.14`, capped at 0.90 by design (comparative QA, not a YouTube forecast).
- **The hooks** — `LongFormHookQC` deliberately drops the shorts "full claim in 3s" rule; long-form gets a 30s designed intro window with a hard 20s claim latency. That matches the 0–2s / 5–30s rows above.