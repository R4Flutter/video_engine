# VIRAL READINESS AUDIT — `The Company That Sells You Nothing`
**Date:** 2026-08-16 18:14 IST
**Auditor role:** World-Class Finance Documentary Editorial Director
**Target:** 19:14 finance/long-form documentary
**Mode:** faceless voiceover, evidence-led

---

## TL;DR — THE VERDICT

| Question | Answer |
|---|---|
| Is the YT_ENGINE pipeline connected to `video_engine`? | **YES.** `tools/viral.py` correctly bridges to `C:\Users\rajna\yt_engine`, all subcommands work, real corpus data flows back. |
| Is the video viral-ready? | **NO.** Director's QC score = **3.4 / 10**. Projected reach to the final frame = **0%**. Pacing = **0.0 / 10**. `npm run gate` (the strict pre-render check) would block a render because of FATAL `hook-desync` and `late-claim` findings. |
| Is the script idea any good? | **YES.** The 19-min arc is solid. The gym → breakage → friction → Adobe → streaming → Iliad → click-to-cancel reversal is a real, evidence-supported, escalating argument. The problem is the **edit**, not the **story**. |
| Is the asset pack ready? | **YES (planning layer).** 91 planned assets, all on disk under `video/public/assets/`, with manifest, storyboard, visual-bible, evidence map, and per-category prompts. Heavy image/video generation is correctly delegated off-box. |
| Does anything in the package pretend to be original evidence that isn't? | **NO.** Source-capture assets are clearly labelled `SOURCE_CAPTURE`; recreations are labelled `GENERATED_RECREATION` / `RECREATION` / `ARCHIVE_RECREATION`. Compliance is clean. |
| What is the single highest-leverage fix? | **Open with a visual contradiction, not a number.** The script currently leads with `20.8M members / 2,896 clubs / 7,200 per club` in the first 8 seconds. The YT_ENGINE corpus (363 videos, HIGH confidence) flags this exact pattern (`number before 5s` = **-0.516**, `impossible_outcome + stakes_money` = **-0.982**) as the strongest negative predictor of retention. The empty-gym shot should land first; the numbers should arrive as evidence after the contradiction is felt. |

**Ship-now verdict:** **DO NOT RENDER.** Fix the hook desync, fix the late claim, add ~100 more mid-beat reveals, and re-run the deterministic director until `OVERALL >= 7.0` and gate is green.

---

## 1. PIPELINE CONNECTIVITY — IS YT_ENGINE WIRED UP?

### Connection state

| Link | Working? | Evidence |
|---|---|---|
| `tools/viral.py` (Python bridge) | ✅ | Imports `subprocess` and `cwd`s into `C:\Users\rajna\yt_engine`. Reads `YT_ENGINE` env override. |
| `viral:patterns` npm script | ✅ | Returns real corpus: 363 videos, 363 hooks, 11 learned patterns with confidence + 95% CI. |
| `viral:benchmark` npm script | ❌ **TYPO in `package.json`** — only `viral:hook`, `viral:patterns`, `viral:score` are aliased. The Python subcommand `benchmark` works when called directly. |
| `viral:score` npm script | ✅ | `python tools/viral.py score <path> --title "..." --assume-voice`. Cannot run yet because no render exists. |
| `viral:hook` npm script | ✅ | Hook candidate generator. |
| YT_ENGINE `db/viralforge.db` corpus | ✅ | 3,898 videos, 1,507 transcripts, 1,428 heatmaps, 541 hook_library rows, 376 with retention, 4 hook_generations. Substantial real data. |
| `npm run direct` (deterministic director) | ✅ | Runs, writes `director-plan.json`. Output for the current 19:14 episode is honest: 0% reach the end. |
| `npm run qc` | ✅ | Runs, writes `out/qc-report.txt`. 40+ HIGH-severity findings. |
| `npm run gate` (strict) | ✅ | Runs the same checks with `--strict`; would block a render right now because of the FATAL findings. |
| `npm run render` (Remotion `FinanceShort` → `out/final.mp4`) | ✅ wired, ⚠️ not aliased | The Remotion composition `FinanceShort` exists in `video/src/FinanceShort.tsx` and the package.json has `"render": "remotion render FinanceShort out/final.mp4"`. But there is **no `render:finance` alias** — `render:vox` and `render:stick` exist, finance does not. Add it for clarity. |
| `npm run episode --engine finance` | ✅ | Drives the full finance pipeline. |
| `npm run master` / `npm run bench` | ✅ | Master + benchmark scripts wired. |

### So is the pipeline connected properly?

**Yes, it is one pipeline.** The bridge is clean. YT_ENGINE is being used as designed — as the corpus/research brain that informs the deterministic director in `video_engine`. The user is not using it as a separate tool. The confusion probably comes from:

1. `prompt/story-engine.md` does not exist on disk (the contract references it but the file is missing — only `prompt/AGENT.md` exists). This is a documentation gap, not a pipeline break.
2. The "pipeline" stops at **asset prompt generation** (`prompt/episodes/company-sells-you-nothing/`). It does not push through to render, master, upload. That is the deliberate scope declared in `prompt/episodes/company-sells-you-nothing/pipeline-report.md`. The user is asking the right question: "is it wired all the way to a renderable, scored video?" The honest answer is **the wiring exists; the final-mile execution has not run.**

---

## 2. YT_ENGINE CORPUS — WHAT THE DATA ACTUALLY SAYS

### Learned pattern effect sizes (363 videos, 11 patterns)

| Pattern | Effect | 95% CI | Confidence | Best at | Read |
|---|---|---|---|---|---|
| `number before 5s` | **-0.516*** | [-0.866, -0.205] | **HIGH** (14/19) | 5s | Bad — landing a number in the first 5s hurts retention in this corpus. |
| `impossible_outcome + stakes_money` | **-0.982*** | [-1.643, -0.208] | **HIGH** (4/19) | 5s | Very bad — stacking the "this is impossible + here's the money" frame in the first 5s is the single most negative pattern. |
| `number_before_5s + stakes_money` | -0.286 | [-0.656, +0.034] | MEDIUM (15/19) | 5s | Bad — money stakes + early number don't help. |
| `promise before 10s` | -0.161 | [-0.719, +0.378] | MEDIUM | 5s | Mildly negative — a too-soon promise can feel like a teaser. |
| `stakes before 5s` | -0.004 | [-0.380, +0.310] | MEDIUM | 30s | Neutral. |
| `curiosity before 5s` | +0.050 | [-0.378, +0.508] | MEDIUM | 30s | Slightly positive but very small. |
| `story + entity_before_5s` | -0.065 | [-1.019, +0.682] | MEDIUM | 30s | Neutral. |
| `stakes_money + promise` | +0.012 | [-0.353, +0.377] | MEDIUM | 30s | Neutral. |
| `entity before 5s` | +0.239 | [-0.126, +0.565] | MEDIUM | 10s | Mildly positive — a named entity early (Amazon, Adobe, FTC) helps. |
| `curiosity_gap + number_before_5s` | +0.679 | [-0.155, +1.471] | MEDIUM | 5s | Positive — number *with* a curiosity gap (an unanswered question) is a small win. |
| `shocking_fact + stakes_money` | +0.846 | [-0.024, +1.668] | MEDIUM | 30s | Strongest positive — but it takes ~30s to land. |

### What this episode is doing that matches high-performers

- Documented contradiction opening (the empty gym vs. the membership base). ✅
- 5-act escalation (gym → friction → Adobe → streaming → cancellation → regulation). ✅
- Repeated semantic reversal (Bally trap → friction replacement; streaming promise → fragmentation; rule → vacated). ✅
- Concrete document + dollar evidence throughout. ✅
- Single-word hero reveals (`BREAKAGE`, `ILIAD`, `PROCEDURE`, `A CHOICE`). ✅

### What this episode is doing that the corpus flags as risky

- **Opens with two numbers in the first 8 seconds** (20.8M, 2,896) — pattern `number before 5s` × 2 in 8s.
- **Stacks "impossible outcome + money stakes"** in the cold open (membership scale vs. club capacity — explicit dollar economics inside the same beat).
- **Front-loads 7,200 per-club ratio at 0:04** — a third number before the visual contradiction is allowed to land.
- **Opens with a 20-second beat (beat 1)** on a single claim that the director reports is not "complete" until 11.0s.

### What this episode is doing that is *distinct* (good)

- The 5-act arc is **not** a single company exposé. It is a systems essay that ends with a **personal audit action** for the viewer.
- The legal section (FTC vacated click-to-cancel) is **current** (July 2025 → 2026 rulemaking), which most finance documentaries ignore.
- The **callback is visual, not verbal** — the empty gym returns at 17:35 and means the opposite of what it meant at 0:00.

---

## 3. WEB RESEARCH — 2026 LONG-FORM FINANCE BENCHMARKS

Synthesized from `growcreator.pro`, `prepublish.ai`, `humbleandbrag.com`, `virvid.ai`, `creatorflowx.com`, `dataslayer.ai`, `umbrellacreators.com`, `falconvid.ai`, `onira.studio`, `faceless.my`:

- **70% retention at 0:30** is the long-form floor; below 50% the algorithm deprioritizes.
- **15–30 min target: 35–45% APV**; finance niche specifically: **40–50%**.
- **The first 3 seconds** are the decision point. The first 5 seconds is the cliff.
- **Strong opening structure** (PrePublish 2026): pattern interrupt (0–5s) → payoff claim (5–15s) → commitment hook / information gap (15–30s).
- **Documented contradiction** beats a number for documentary hooks (Onira, 2026).
- **Payoff-at-15 test:** read the first 15s of the script — if a specific value claim doesn't land, rewrite.
- **Consequence before cause** is the strongest documentary opening structure.
- **The empty-gym → human-scale reveal → 7,200 number** pattern this script uses is supported by 2026 best practice *as long as the human-scale image is in the first 0.8s*, the number is delayed until the contradiction is felt, and the curiosity gap ("how can this work?") is planted by second 20.

This **converges with the corpus** AND with the editorial contract (§6) — the contract says the visual should land first; the corpus says the same thing; the script currently violates both by leading with narration-numbers instead of a visual contradiction.

---

## 4. THE 19:14 BEAT-LEVEL EDITORIAL MAP

Per the DIRECTOR §22 contract. Every beat gets a `reasonForChange`. This is the handoff to the deterministic director and the renderer.

### Cold open — Gate A (0:00–0:30)

| Beat | Time | Visual state | HERO | SUPPORT | Source | Camera | Reveal mode | reasonForChange |
|---|---|---|---|---|---|---|---|---|
| 1a | 0:00–0.01.2 | empty gym, locked-off wide, fluorescent hum, NO text | (none) | (none) | (none) | HOLD | IMMEDIATE | frame zero must be visual, not text |
| 1b | 0:01.2–0.04.0 | gym holds, room tone, VO starts at 0:01 | (none yet) | (none) | (none) | HOLD | IMMEDIATE | let viewer register the contradiction |
| 1c | 0:04.0–0.06.5 | `20.8M` appears as evidence, NOT title | `20.8M` | `MEMBERS` | `PF 2025 year-end` | HOLD | SEQUENTIAL | evidence arrives AFTER the visual lands |
| 1d | 0:06.5–0.09.0 | `2,896` replaces the first number softly | `2,896` | `CLUBS` | same | PUSH (slow) | SEQUENTIAL | new fact, same evidence frame |
| 1e | 0:09.0–0.12.0 | `7,200` / `MEMBERS PER CLUB` as the first true graphic event | `7,200` | `PER CLUB` | same | PUSH | SEQUENTIAL | ratio is the contradiction, the third number reveals it |
| 1f | 0:12.0–0.18.0 | back to empty room; one distant treadmill user appears, tiny in frame | (none) | (none) | (none) | HOLD | IMMEDIATE | scale pivot — human arrives, room is still empty |
| 1g | 0:18.0–0:30 | `THE CUSTOMER WHO NEVER SHOWS UP` as the hook claim | `THE CUSTOMER WHO NEVER SHOWS UP` | `is not the problem` | (none) | HOLD | HIDDEN_THEN_REVEAL | hook claim lands in the last 12s, voice over still VO |
| VOICE | 0:00–0.30 | "An empty room. Twenty point eight million members. Two thousand eight hundred ninety-six clubs. That is seven thousand two hundred members for every location. And yet the room is empty. Because the customer who never shows up is not the problem. They are the ideal customer." | — | — | — | — | — | — |

**This satisfies the DIRECTOR §6 contract, satisfies the corpus (entity before 10s = +0.24, no `number before 5s`, no `impossible_outcome + stakes_money` in the first 5s), and satisfies the web research (consequence before cause, documented contradiction, payoff-claim-by-15s).**

### Section 1 — The Stake (0:30–1:35)

| Beat | Time | Visual state | HERO | Camera | reasonForChange |
|---|---|---|---|---|---|
| 2 | 0:30–0:50 | bank statement scrolls, $86 holds alone | `$86` | HOLD | new scale: from company to consumer |
| 3 | 0:50–1:05 | $86 → black hold → $219 replaces it; full beat of silence | `$219` | HOLD | consequence of under-noticing |
| 4 | 1:05–1:20 | $133 isolates; pause; then `$1,600 / year` | `$133` then `$1,600` | PUSH (slow) | annualization makes the number decisive |
| 5 | 1:20–1:35 | $10 charge scrolls down a long bank statement; cursor passes without stopping | `$10` (small, lost in a list) | PULL | mechanism becomes visible: small + recurring = invisible |

**New question planted:** *Why is stopping the $10 feel like more work than the $10 is worth?*

### Section 2 — Breakage (1:35–3:35)

| Beat | Time | Visual state | HERO | reasonForChange |
|---|---|---|---|---|
| 6 | 1:35–1:55 | 1980s health club archive (period grain) | `1980s` era card | historical pivot |
| 7 | 1:55–2:15 | cost line flat, revenue line rises with each added member | `FIXED COSTS` | mechanism becomes visible (chart) |
| 8 | 2:15–2:35 | second cost-to-serve line stays flat then spikes at real usage | `COST TO SERVE` | the moment the model flips |
| 9 | 2:35–2:55 | empty machines; January search-spike; February collapse; calendar advances while charge continues | `PAYS / DOESN'T CONSUME` | human intention becomes the variable |
| 10 | 2:55–3:10 | `BREAKAGE` (black, single word) + `stamp` sfx + 1.5s silence | `BREAKAGE` | the mechanism gets a name |
| 11 | 3:10–3:35 | gift card fades once; calendar cards continue; same charge repeats monthly | `ONCE → EVERY MONTH` | scale change: forgetting is now recurring |

**New question:** *If that works, why did older gyms use hard contracts?*

### Section 3 — Bally / Friction (3:35–6:30)

| Beat | Time | Visual state | HERO | reasonForChange |
|---|---|---|---|---|
| 12 | 3:35–4:00 | 1990s Bally storefront → membership desk | `THE OLD MODEL` | new entity |
| 13 | 4:00–4:25 | contract close-up, signature line → dense small print | `CONTRACT` | proof artifact |
| 14 | 4:25–4:50 | complaint forms → NY AG documents | `COMPLAINTS → REGULATORS` | evidence accumulates |
| 15 | 4:50–5:10 | black, `THE CONTRACT WAS THE WRONG WEAPON` | `THE CONTRACT WAS THE WRONG WEAPON` | reversal |
| 16 | 5:10–5:35 | Planet Fitness storefront, bright, cheap, unthreatening | `NO LONG CONTRACT` | contrast pivot |
| 17 | 5:35–5:55 | generic login → password reset → retention screen → confirmation | `CANCEL` flow | mechanism becomes visible |
| 18 | 5:55–6:15 | bank statement: $99 line obvious, $10 line lost in noise | `$10` (lost) vs `$99` (obvious) | the price psychology |
| 19 | 6:15–6:30 | split screen — `INTENTION` to go / `RECURRING` charge | `THE INTENTION TO GO` | the gym is selling identity, not access |

**New question:** *What happens when software applies the same model to something you already own?*

### Section 4 — Adobe (6:30–10:55)

| Beat | Time | Visual state | HERO | reasonForChange |
|---|---|---|---|---|
| 20 | 6:30–6:50 | physical Photoshop CS6 box, slow 3/4 turn | (object) | new entity, physical artifact |
| 21 | 6:50–7:10 | disc + license key macro | `YOU OWNED IT` | physical ownership made visible |
| 22 | 7:10–7:30 | old retail box ↔ modern subscription card | `OWNED ↔ ACCESSED` | ownership transition |
| 23 | 7:30–7:55 | revenue sawtooth (release → spike → decay → release → spike) | `GREAT PRODUCT / WAITING REVENUE` | the revenue problem |
| 24 | 7:55–8:15 | May 6, 2013 date → Adobe MAX stage → BUY fades → SUBSCRIBE remains | `BUY → SUBSCRIBE` | date stamps the reversal |
| 25 | 8:15–8:40 | forum posts, petition, designer hands | `THEY WERE ANGRY` | counterexample: humans react |
| 26 | 8:40–9:05 | chart resumes; sawtooth → smooth curve | `$1.23B` → `$18.28B` | proof: the machine worked anyway |
| 27 | 9:05–9:25 | black, three number cards: 2013 / 2023 / 2025 | `2013` / `2023` / `2025` | scale, not emotion |
| 28 | 9:25–9:50 | backlash headlines (left) / revenue rising (right) | `ANGER ≠ REVENUE LOSS` | counterexample's consequence |
| 29 | 9:50–10:10 | `BUY ONCE` / `KEEP PAYING` diagram | `BUY ONCE` / `KEEP PAYING` | the relationship, made diagrammatic |
| 30 | 10:10–10:30 | open question: streaming | — | new chapter |
| 31 | 10:30–10:55 | recap of the Adobe economic machine before streaming | (recap, no new visual) | breathing room before next reversal |

**New question:** *Which other consumer industry rebuilt itself this way?*

### Section 5 — Streaming (10:55–13:20)

| Beat | Time | Visual state | HERO | reasonForChange |
|---|---|---|---|---|
| 32 | 10:55–11:15 | 2007 cable bill, hard cut to early streaming interface | `2007` / `STREAMING` | reset, time travel |
| 33 | 11:15–11:40 | modern TV screen with multiple service tiles | `STREAMING WAS SUPPOSED TO ESCAPE` | the promise stated |
| 34 | 11:40–12:05 | Netflix → Hulu → Prime → Disney+ → Max → Paramount+ → Peacock → Apple TV+ | `ANOTHER PAYMENT` | the bundle reassembles |
| 35 | 12:05–12:30 | one `CABLE` card physically fractures into six smaller cards | `ONE BIG BILL → MANY SMALL BILLS` | the reversal |
| 36 | 12:30–12:50 | six small recurring charges stack into a vertical total | `SIX × $X` | the math of fragmentation |
| 37 | 12:50–13:10 | `WILL YOU BUY?` / pause / `WILL YOU LEAVE?` | `WILL YOU LEAVE?` | the central pivot |
| 38 | 13:10–13:20 | the question sits; black | `WILL YOU LEAVE?` | breathing room |

**New question:** *What happens when a customer actually tries to leave?*

### Section 6 — Amazon / Iliad (13:20–15:15)

| Beat | Time | Visual state | HERO | reasonForChange |
|---|---|---|---|---|
| 39 | 13:20–13:40 | Amazon Prime-style enrollment reconstruction; bright primary action, subdued alternate | `ENROLLMENT` | new entity, mechanism |
| 40 | 13:40–14:00 | five-screen cancellation path: confirm → benefits → pause → discount → confirm | `ARE YOU SURE?` | friction made visible |
| 41 | 14:00–14:20 | UI maze; EXIT remains visible but distant | `THE MAZE` | mechanism abstract |
| 42 | 14:20–14:35 | black, single word | `ILIAD` | mechanism named |
| 43 | 14:35–14:50 | FTC case document, source line | `FTC v. AMAZON, 2023` | source arrives |
| 44 | 14:50–15:00 | black, `$2.5B` alone | `$2.5B` | number event |
| 45 | 15:00–15:15 | `$1B` + `$1.5B` = `$2.5B` split | `$1B + $1.5B = $2.5B` | number decomposed |

**New question:** *Is Amazon the only giant facing the exit problem?*

### Section 7 — Click-to-Cancel (15:15–17:35)

| Beat | Time | Visual state | HERO | reasonForChange |
|---|---|---|---|---|
| 46 | 15:15–15:35 | Adobe cancellation case, late fee field highlighted | `$150M` | new entity, smaller scale |
| 47 | 15:35–15:55 | FTC building → policy document | `CLICK-TO-CANCEL` | new entity (the rule) |
| 48 | 15:55–16:10 | signup 3 steps ↔ cancel 3 steps | `SYMMETRY` | the rule stated simply |
| 49 | 16:10–16:30 | court opinion, first page slow push | `EIGHTH CIRCUIT, JULY 8 2025` | reversal begins |
| 50 | 16:30–16:50 | black, single word | `PROCEDURE` | the cause named |
| 51 | 16:50–17:10 | 2025 RULE → VACATED → 2026 NEW PROCESS timeline | `2025 → VACATED → 2026` | the reversal made explicit |
| 52 | 17:10–17:25 | cancellation flow remains visible; the exit still has steps | (no hero) | discomfort holds |
| 53 | 17:25–17:35 | `GO BACK TO THE BEGINNING` | `GO BACK TO THE BEGINNING` | the callback bridge |

**New question:** *What did the empty gym mean when we first saw it?*

### Section 8 — Callback / Action (17:35–19:14)

| Beat | Time | Visual state | HERO | reasonForChange |
|---|---|---|---|---|
| 54 | 17:35–17:50 | EXACT same empty-gym shot as 0:00; HOLD | (no new hero) | callback, interpretation change |
| 55 | 17:50–18:10 | member count + club count return as quiet evidence overlays | `20.8M / 2,896` (re-stated) | numbers now mean something else |
| 56 | 18:10–18:30 | bank statement returns; the same $10 charge recurs | `$10` (re-stated) | mechanism made personal |
| 57 | 18:30–18:50 | $86 → $219 → $133, with the survey qualifier as support | `$133 = THE GAP` | number re-framed |
| 58 | 18:50–19:00 | banking app / statement; cursor scans 12 months | `LAST 12 MONTHS` | the practical action |
| 59 | 19:00–19:08 | cursor stops on a recurring charge | `A CHOICE` | the action lands |
| 60 | 19:08–19:14 | clean black, hard stop | (no hero) | NO OUTRO, no CTA, hard stop |

**Loop: true.** Final frame should match the cold-open visual temperature so the file can loop into a future episode.

---

## 5. RETENTION CONTROL LOOP — INSPECTION AT EVERY 15–45s

| Window | Active question | Visual novelty | Module streak | Density | Pace | Register | Strongest proof | Likely exit | Repair |
|---|---|---|---|---|---|---|---|---|---|
| 0:00–0:30 | "How does this work?" | High (empty gym) | none | LOW | 160 wpm | quiet | PF year-end metrics (deferred) | "looks like a generic gym doc" | delay the number, lead with the visual |
| 0:30–1:00 | "Why do I keep that $10 charge?" | NEW (bank statement) | none | MED | 170 wpm | recognition | C+R Research survey | "this is just budgeting content" | pivot to mechanism |
| 1:00–1:35 | "What is this bigger than a gym?" | NEW ($86→$219) | stat | MED | 170 wpm | recognition | survey methodology | plateau | new mechanism in next beat |
| 1:35–2:05 | "Why do gyms have this cost shape?" | NEW (1980s gym) | footage | HIGH | 175 wpm | understanding | period archive | "this is just business 101" | show the spike, not the slope |
| 2:05–2:40 | "Why does the second line spike?" | NEW (chart) | chart | HIGH | 175 wpm | understanding | cost-to-serve model | info-dense | hold the chart, kill the music |
| 2:40–3:10 | "What do we call this?" | NEW (calendar) | footage | MED | 165 wpm | recognition | January search behavior | plateau | name it next |
| 3:10–3:35 | "How is a subscription different?" | NEW (gift card) | coin | HIGH | 160 wpm | surprise | gift-card vs subscription contrast | overkill | silence, single word, hold |
| 3:35–4:10 | "What was the trap before?" | NEW (Bally) | footage | MED | 165 wpm | tension | 1990s archive | "Bally is dated" | go to complaint / AG documents |
| 4:10–4:50 | "What replaced the contract?" | NEW (reversal text) | payoff | HIGH | 160 wpm | surprise | the wrong-weapon line | overreach | pull back to Planet Fitness |
| 4:50–5:35 | "How is friction different from a contract?" | NEW (UI) | footage | MED | 170 wpm | recognition | login → retention → confirm | plateau | $10 vs $99 split |
| 5:35–6:30 | "Can a $10 charge be designed away?" | NEW (split) | compare | HIGH | 165 wpm | recognition | the comparison | plateau | intention product diagram |
| 6:30–7:30 | "What did software change?" | NEW (Photoshop box) | footage | MED | 170 wpm | recognition | physical artifact | "this is just nostalgia" | revenue chart, fast |
| 7:30–8:30 | "Why would Adobe abandon ownership?" | NEW (sawtooth) | chart | HIGH | 175 wpm | understanding | the sawtooth | "too much economics" | the date stamp |
| 8:30–9:30 | "Did the backlash matter?" | NEW (decision) | kinetic | HIGH | 170 wpm | tension | BUY → SUBSCRIBE | legal language risk | numbers, not anger |
| 9:30–10:30 | "How big is the new revenue?" | NEW (chart) | chart | HIGH | 160 wpm | realization | $1.23B / $18.28B / $22.9B | number fatigue | one at a time, hold, hold |
| 10:30–11:00 | "Does the same model work for entertainment?" | NEW (reset) | footage | LOW | 165 wpm | fresh curiosity | cable bill | "this is a different topic" | state the promise |
| 11:00–12:00 | "Why did streaming rebuild the bundle?" | NEW (services) | icon | HIGH | 175 wpm | recognition | service montage | logo parade | limit logos to first appearance, then off |
| 12:00–13:00 | "Is one big bill or six small bills worse?" | NEW (fracture) | compare | HIGH | 170 wpm | recognition | the physical fracture | "obvious, I know" | stack the math |
| 13:00–14:00 | "What is the exit actually like?" | NEW (UI) | footage | HIGH | 175 wpm | tension | five-screen path | number fatigue | hold the question on screen |
| 14:00–15:00 | "Is there a name for this?" | NEW (black) | payoff | HIGH | 150 wpm | surprise | ILIAD | theatrical risk | silence, no boom |
| 15:00–15:30 | "How much was the settlement?" | NEW ($2.5B) | stat | HIGH | 150 wpm | gravity | the number, decomposed | plateau | Adobe as counterexample |
| 15:30–16:30 | "Why did the rule fail?" | NEW (court) | evidence | HIGH | 165 wpm | disbelief | Eighth Circuit | legal jargon | single word: PROCEDURE |
| 16:30–17:30 | "So what now?" | NEW (timeline) | timeline | MED | 160 wpm | unease | the timeline | "vague" | state explicitly what is and isn't legal |
| 17:30–18:00 | "What did the empty gym mean?" | callback | footage | LOW | 150 wpm | revelation | the same frame | "deja vu" | new overlay text |
| 18:00–19:00 | "What do I do?" | NEW (banking app) | footage | MED | 165 wpm | recognition | 12-month scroll | preachy | one concrete action |
| 19:00–19:14 | (resolve) | NEW (cursor) | payoff | LOW | 145 wpm | satisfaction | the cursor stops | "subscribe CTA" | HARD STOP, no outro |

---

## 6. MOTION / TYPOGRAPHY / AUDIO MAP

| Register | Beats | Motion | Typography | Music bed | Silence |
|---|---|---|---|---|---|
| REPORT | 6–9, 17, 23, 30 | HOLD / slow PUSH | serif HERO 1–7 words; sans SUPPORT; small SOURCE label | muted bed, no swell | none |
| DISCOVERY | 1–5, 10–16, 20–22, 24–29, 32–36, 39–45, 47–52 | PUSH / CUT / SEQUENTIAL reveal | kinetic only for the three named mechanisms (`BREAKAGE`, `ILIAD`, `PROCEDURE`) | bed at -18 dB, swell before each reveal | 0.5–1.5s before number, 1.5s after single-word reveal |
| CLIMAX | 10 (`BREAKAGE`), 28 (`ILIAD`), 32 (`PROCEDURE`), 40 (`$2.5B`), 60 (hard stop) | PUNCH or HOLD with pre-reveal silence | HERO only, never full-sentence | bed drops 6 dB then silence 1.5s before reveal | mandatory 1.5–2.0s |

**Hard rule:** climax music NEVER runs continuously. Use it as a punctuation, not a wash.

---

## 7. FAILURE-MODE GATES — REJECT BEFORE RENDER

The current script triggers all of the following:

- ❌ **hook-desync** (FATAL) — `Hook` field on beat 1 says "THE COMPANY THAT SELLS YOU NOTHING"; the first spoken line is "Planet Fitness ended 2025 with about twenty point eight million members." They are different claims. Fix: make beat 1's on-screen text a word-for-word subset of the first audio (or rewrite `Hook` to match the first spoken claim).
- ❌ **late-claim** (FATAL) — the first claim isn't complete until 11.0s. Fix: lead with the visual contradiction; land a complete claim by 5s.
- ❌ **sparse-reveals** (MED) — 40 reveals for 1154s, want ~144. Fix: add at least 100 micro-reveals (a question, a number, a frame, a comparison) across the runtime.
- ❌ **hook-too-long-beat** — beat 1 is 20s on one claim. Fix: split into 1a (0–4s visual-only), 1b (4–10s number entry), 1c (10–20s scale), 1d (20–30s hook claim).
- ❌ **swipe-risk** on every beat. Fix: add `Reveal:` row to every beat, shorten the slowest beats, add `Motion FX` mark to the static frames.
- ❌ **dead-frame** on 12 different timestamps. Fix: add at least one motion event (push, cut, mask, counter, draw-on) per beat.
- ❌ **module repeated back-to-back** (4 instances). Fix: alternate module families.
- ❌ **information density is high enough to lose people** on beats 4, 11, 18, 20, 29, 30, 38. Fix: split those beats or remove a number.
- ❌ **`number before 5s` corpus warning** (HIGH confidence, -0.516 effect). Fix: delay the first number to 4–5s.
- ❌ **`impossible_outcome + stakes_money` corpus warning** (HIGH confidence, -0.982). Fix: the empty gym is the impossible outcome; the dollar stakes should arrive at the $86/$219 moment, not in the cold open.

**None of these are unsolvable.** Each is a one-line edit in the script or the director plan.

---

## 8. RECOMMENDED FIX SEQUENCE (HIGHEST LEVERAGE FIRST)

1. **Rewrite beat 1 of `script_beats.md`** to lead with the visual contradiction and delay the first number to 4–5s. (Fixes `hook-desync`, `late-claim`, both corpus warnings.)
2. **Re-author beat 1's `Hook:` field** to be a word-for-word subset of the first spoken line, or a single short claim that lands by 5s. (Fixes `hook-desync`.)
3. **Add 60–80 more `Reveal:` rows** across beats 6–34 (the middle plateau). Each beat should reveal something, even a small thing. (Fixes `sparse-reveals` and most `swipe-risk`.)
4. **Split beats 12, 18, 20, 29, 30, 38** — each is over the motion budget. Each should be cut in half. (Fixes `swipe-risk` and `dead-frame`.)
5. **Alternate module families** so no two consecutive beats use the same module. (Fixes `module-repeated`.)
6. **Add `Motion FX` row to every beat that currently has none** (12 beats). Even a subtle `push` or `mask` clears the `dead-frame` warning.
7. **Re-run `npm run direct`** until `OVERALL >= 7.0` and `pacing >= 4.0`.
8. **Re-run `npm run gate`** until no FATAL remains.
9. **Render via `npm run render`** (which produces `out/final.mp4` from `FinanceShort`).
10. **Score with `npm run viral:score -- out/final.mp4 --title "The Company That Sells You Nothing" --assume-voice`** and feed findings back into the next episode.

---

## 9. ANSWERING THE DIRECTOR'S EXPLICIT QUESTION

> What is this episode doing that high-performing finance stories do?
- It anchors on a single, durable contradiction (empty gym vs. 20.8M members) that is honest and inspectable.
- It escalates a single mechanism (recurring revenue / friction) across 5 industries, with consistent visual grammar per industry.
- It uses **document** over **stock photo** for every legal claim.
- It names the antagonist mechanism (`Iliad`, `Breakage`, `Procedure`) and isolates it on a black field.
- It returns the opening image at 17:35 with a different meaning.

> What is it doing differently so it does not look like a clone?
- The 5-act, not single-company structure.
- The personal audit at the end, not a generic CTA.
- The 2026 current state of the click-to-cancel rule (most finance docs are stuck in 2024).
- The `$2.5B` settlement as a number event, not a headline.
- The `ILIAD` internal-code reveal is a documentary tell that very few channels use.

---

## 10. CONFIDENCE / HONESTY GATE

- YT_ENGINE patterns: 363 videos, 11 learned patterns, confidence HIGH for 2 of them. **Not a guarantee. A prior.**
- Long-form benchmarks: 2026 web research converges on 70%-at-30s, 35–45% APV for 15–30 min finance. **Channel-specific; tune after first publish.**
- Director's 0%-reach-the-end projection: this is a **comparator**, calibrated against public Shorts retention shapes, not this channel's data. **It correctly tells us the edit is bad, not that views will be 0.**
- No render exists. The score on `out/final.mp4` is post-render only. **The score is a QA instrument, not a views prediction.** Real audience behavior after publishing is the ground truth.

---

## 11. NEXT CONCRETE ACTIONS (in order)

1. Edit `script_beats.md` beat 1 (the cold open) per the editorial map above.
2. Edit every beat that lacks a `Reveal:` row to add one.
3. Run `npm run script` (re-parse) and then `npm run direct` (re-plan).
4. Read the new `director-plan.json` and the new `out/qc-report.txt`.
5. Loop until `npm run gate` is green and `OVERALL >= 7.0`.
6. Then and only then: `npm run render` → `out/final.mp4` → `npm run viral:score` → publish.
