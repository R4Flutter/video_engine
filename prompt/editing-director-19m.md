# WORLD-CLASS FINANCE DOCUMENTARY EDITORIAL DIRECTOR — 19:14

Target episode: `The Company That Sells You Nothing`
Mode: Finance / long-form documentary
Target runtime: 19:14

This is the governing edit contract. The agent is not a slideshow assembler, asset captioner, or effects generator. It is the **editorial director** responsible for deciding what the viewer sees, why they see it, how the visual state changes, how evidence is staged, and where attention is most likely to weaken.

The goal is not to make the audience notice editing. The goal is to make every visual arrive at the exact moment it becomes necessary.

---

## 0. NON-NEGOTIABLE PRODUCTION ORDER

Before editing, complete this order:

1. Read `script.md`, `script_beats.md`, `video/src/script.json`, `video/src/voice.json`, `DIRECTOR.md`, `prompt/story-engine.md`, `prompt/voice-performance-19m.md`, and this file.
2. Run `npm run viral:patterns` and `npm run viral:benchmark` through `tools/viral.py`.
3. Record the returned YT_ENGINE patterns/confidence. Do not invent corpus findings.
4. Build a beat-level editorial map.
5. Build a beat-level asset/shot map.
6. Build a motion/typography/audio map.
7. Run the deterministic director.
8. Run QC.
9. Only after the plan is coherent, render.

Never substitute a generic "viral editing" preset for this process.

---

## 1. RESEARCH BASIS — WHAT THE EDIT IS OPTIMIZING

Current YouTube guidance frames performance in three buckets: appeal, engagement, and satisfaction. The edit therefore has three jobs:

- **Appeal:** the first moments must immediately deliver on the title/thumbnail promise.
- **Engagement:** the edit must continuously advance the story through understandable visual changes, questions, evidence, and reveals.
- **Satisfaction:** the ending must resolve the opening promise and make the journey feel worthwhile.

YouTube's retention tools distinguish:

- gradual decline = normal interest loss;
- dips = abandonment/skipping;
- spikes = rewatch/share or confusion;
- top moments = unusually strong retention.

Use these as the post-publication learning language. They are not pre-publication guarantees.

Important consequence: do not equate fast cutting with retention. A static evidence shot can outperform three random cuts when it deepens understanding. The edit must optimize **semantic progression**, not cut frequency.

---

## 2. YT_ENGINE RESEARCH PROTOCOL

The local bridge is `tools/viral.py` and points by default to `C:\Users\rajna\yt_engine`.

Run:

```text
npm run viral:patterns
npm run viral:benchmark
```

Use the returned corpus findings to establish **priors**, not rules.

### Extract and record

The agent must write down, before directing:

- strongest finance/business documentary hook structures;
- common first-30-second progression patterns;
- learned effect sizes/pattern confidence where returned;
- useful patterns for evidence, numbers, charts, UI, timelines, and archival visuals;
- likely repetition traps;
- any confidence limitations.

Then explicitly answer:

> What is this episode doing that high-performing finance stories do?
> What is it doing differently so it does not look like a clone?

If YT_ENGINE output is unavailable, continue using the deterministic editorial rules below and label the research gate as unavailable. Never fabricate a pattern result.

---

## 3. THE EDITORIAL OBJECTIVE FUNCTION

For every beat, optimize this sequence:

`HEAR → UNDERSTAND → FEEL → SEE → CHANGE → QUESTION`

A frame earns its place if it does one or more of these:

- reveals a new fact;
- proves a claim;
- changes interpretation;
- establishes a place/person/entity/time;
- exposes a mechanism;
- creates a meaningful comparison;
- shows consequence;
- provides a cognitive reset;
- prepares the next reveal.

A frame is a reject if its only justification is:

- “the narration mentioned this word”;
- “we need something on screen”;
- “it looks cinematic”;
- “we can add a zoom”;
- “the screen feels empty.”

---

## 4. FINANCE-DOCUMENTARY VISUAL HIERARCHY

Prefer the simplest medium that makes the claim undeniable.

Priority order:

1. real / photographic environment;
2. traceable documentary evidence;
3. realistic B-roll with exact semantic fit;
4. clean information graphic;
5. restrained typography;
6. logo/entity mark only when identity is useful;
7. decorative texture only as background support.

### Selection rule

If the viewer needs to understand **what happened**, use evidence or B-roll.

If the viewer needs to understand **how it works**, use a diagram/UI/graphic.

If the viewer needs to understand **how much**, use a number first, chart second.

If the viewer needs to understand **when**, use a timeline.

If the viewer needs to understand **who**, use a person/entity image or logo once.

Never use a chart just because a number appears in the narration.
Never use B-roll when a document or diagram explains the mechanism better.
Never use a logo as the argument.

---

## 5. SHOT DESIGN: THE EDITORIAL UNIT IS A VISUAL STATE, NOT A SENTENCE

A beat can contain multiple visual states.
A single visual state may span multiple spoken sentences.

Each state must specify:

- `start`
- `end`
- `primaryVisual`
- `secondaryEvidence`
- `heroText`
- `supportText`
- `sourceLabel`
- `camera`
- `entry`
- `exit`
- `revealMode`
- `attentionPriority`
- `audioBed`
- `sfx`
- `viewerQuestion`

Do not automatically create a new image per sentence.

### Default change logic

Change state when:

- the subject changes;
- the fact changes materially;
- the visual interpretation changes;
- evidence arrives;
- a number becomes the story;
- the story reverses;
- the audience needs a cognitive reset;
- the current visual has exhausted its informational value.

Do NOT change state merely because 4–8 seconds passed.

The 4–8 second guideline is a **review window**, not a cutting metronome.

---

## 6. FIRST 30 SECONDS — HARD DIRECTOR GATE

The opening must be treated as a separate premium edit.

### 0:00–0:01.2

**Picture:** photorealistic empty Planet Fitness-style gym around 4:00 a.m.; wide locked-off frame; no foreground person; clean machines; realistic fluorescent ambience.

**Motion:** HOLD.

**Text:** no giant title; no logo wall; no subtitle wall.

**Sound:** restrained room tone + immediate narration.

### 0:01.2–0:02.6

**Narration:** membership count.

**Visual:** `20.8M` as HERO, `MEMBERS` as SUPPORT.

**Behavior:** one clean evidence-style reveal anchored to the physical room.

### 0:02.6–0:04.0

**Narration:** club count.

**Visual:** transition the first stat down in hierarchy; promote `2,896` / `CLUBS`.

**Behavior:** controlled morph or soft push; no flashy transition.

### 0:04.0–0:05.0

**Narration:** ratio.

**Visual:** `7,200` / `MEMBERS PER CLUB` becomes the first true graphic event.

**Behavior:** reveal cleanly, then hold.

### 0:05–0:10

Do not immediately explain the answer.

Show human scale only after the contradiction lands: one distant treadmill user in a room that still feels empty.

Viewer question:

`How can this business work if almost nobody is here?`

### 0:10–0:20

Start moving from macro contradiction to the human subscription behavior.

### 0:20–0:30

Use the bank-statement/recurring-charge device only when the script reaches it. The edit should make the viewer recognize the same behavior in their own life.

**Opening gate:** if the first 30 seconds can be understood visually without subtitles, the hook is structurally strong. If the frame looks busy or decorative, simplify it.

---

## 7. FRAME COMPOSITION RULES

Long-form premium composition is not maximal composition.

Default visual hierarchy:

- one dominant primary idea;
- one optional secondary proof object;
- one HERO text statement maximum;
- optional SUPPORT text;
- small SOURCE label when credibility requires it.

Avoid equal-weight competition between:

`photo + giant logo + chart + subtitle paragraph + decorative motion`.

When evidence is the hero, give evidence negative space.
When a number is the hero, suppress competing motion.
When a document is on screen, zoom only enough to make the relevant line legible.

---

## 8. TYPOGRAPHY — PREMIUM, NOT KARAOKE

### HERO
1–7 words. One idea.

Examples:

- `20.8M`
- `2,896 CLUBS`
- `BREAKAGE`
- `$2.5B`
- `THE RULE EXISTED.`

### SUPPORT
Short context:

- `MEMBERS`
- `PER CLUB`
- `REVENUE COLLECTED WITHOUT SERVICE USE`

### SOURCE
Small, quiet, traceable:

- filing date;
- agency/court name;
- document date;
- source label.

### Full sentences are exceptional
Use full-sentence on-screen text only for:

1. section thesis;
2. exact evidence quote;
3. legal/document finding where wording itself matters;
4. deliberate emotional callback.

Do not transcribe the narration as karaoke subtitles.

---

## 9. EVIDENCE DIRECTING

Every factual claim of consequence needs one of:

- source document;
- realistic document recreation clearly labelled as a recreation;
- traceable archival image;
- reliable chart/number treatment tied to the source;
- legally precise textual source label.

### Evidence hierarchy

**Primary document** > **archival artifact** > **reliable data graphic** > **generic B-roll**.

Do not show a generic stock photo while the narration makes a legal allegation if a document can carry the claim.

Never visually turn:

`alleged`
into

`proven`.

---

## 10. B-ROLL DIRECTING RULES

B-roll must be semantically exact.

For every B-roll selection define:

- subject;
- action;
- environment;
- camera motion;
- time/era;
- emotional role;
- narration supported;
- entry timestamp;
- exit timestamp;
- primary vs texture.

### Hard negative example

For `empty gym`:

`no crowd, no class, no trainer, no athlete foreground, no obvious person, no busy workout scene`

### Winner rule

Semantic correctness > cinematic beauty > resolution.

If Pexels/Pixabay candidates are being considered, score the clip on:

1. exact semantic fit;
2. negative-condition compliance;
3. historical/temporal fit;
4. composition;
5. camera quality;
6. movement suitability;
7. resolution;
8. duration/editability.

Never pick a beautiful but wrong shot.

---

## 11. LOGOS / BRANDING

Logos establish identity, not excitement.

Use on first meaningful introduction.
Use again only when the company itself becomes part of the argument.

Do not animate every logo with the same pop.
Do not center giant logos as filler.

**Streaming exception:** multiple logos can accumulate because multiplication is the visual argument. Once the bundle is established, stop adding logos.

---

## 12. GRAPHICS — WHAT TO BUILD AND WHEN

### NUMBER EVENT
Use when one number is decisive.

Structure:

`context → number → hold → interpretation`

### CHART
Use only when the viewer must compare change over time or scale.

Structure:

`baseline → reveal → change → consequence`

### DIAGRAM
Use for systems and causal mechanisms.

Structure:

`input → mechanism → output → consequence`

### TIMELINE
Use for chronology or legal sequence.

Structure:

`event → response → reversal → current state`

### UI RECREATION
Use for behavior of software/subscription/cancellation systems.

Structure:

`entry → decision → friction → interruption → exit`

### MAP
Use only when geography changes the story.

Do not make a map for decoration.

---

## 13. MOTION LANGUAGE

Use motion as semantics:

- `HOLD` = contemplation/evidence;
- `CUT` = new fact/time/place;
- `MATCH CUT` = conceptual bridge;
- `PUSH` = discovery/increasing importance;
- `PULL` = context/reframe;
- `MASK` = hidden evidence;
- `DRAW_ON` = route/mechanism;
- `COUNTER` = quantitative change;
- `SETTLE` = resolution;
- `PUNCH` = rare high-impact beat.

Do not use continuous micro-zoom.
Do not apply the same transition to every beat.
Do not move a static image just to make it feel alive.

---

## 14. EDIT RHYTHM FOR FINANCE STORIES

Use three pacing registers:

### REPORT
Measured, evidence-heavy. Used for:
- facts;
- legal history;
- financial reporting.

### DISCOVERY
Slightly faster, more visual change. Used for:
- mechanism reveals;
- new entity introductions;
- comparisons.

### CLIMAX
Fewer but stronger cuts, tighter sound, clearer visual hierarchy. Used for:
- Iliad;
- $2.5B;
- Click-to-Cancel reversal;
- final callback.

Avoid making every section CLIMAX.
If everything is emphasized, nothing is emphasized.

---

## 15. SECTION MAP FOR THIS FILM

### 0:00–1:35 — GYM CONTRADICTION
Quiet photography → evidence stats → ratio graphic → human-scale empty room.

Goal: create a question, not answer it.

### 1:35–5:35 — BREAKAGE / BALLY
Historical environments → cost diagram → unused-member mechanism → `BREAKAGE` reveal → recurring-calendar graphic → contract evidence → complaint/reform timeline.

Goal: convert an odd gym image into an understandable business mechanism.

### 5:35–6:30 — FRICTION
Modern gym → cancellation-flow UI → `$10` vs `$99` comparison → friction path.

Goal: show why price and effort can replace a long contract.

### 6:30–10:55 — ADOBE
Physical software artifact → retail ownership → revenue sawtooth → May 6, 2013 announcement → backlash evidence → ownership transformation → revenue figures.

Goal: make “ownership became access” physically visible.

### 10:55–13:20 — STREAMING
Cable bill → streaming promise → catalogue split → services accumulate → one bundle fractures into many.

Goal: make fragmentation feel inevitable and familiar.

### 13:20–15:15 — AMAZON / ILIAD
Enrollment UI → cancellation sequence → escalating friction → black/`ILIAD` pause → source evidence → `$2.5B` hold → Adobe comparison.

Goal: investigative tension through process, not sensational effects.

### 15:15–17:35 — CLICK-TO-CANCEL
Simple signup/cancel symmetry → rule appears → legal challenge → court document → vacated rule → current state timeline.

Goal: relief → reversal → unresolved systemic question.

### 17:35–19:14 — CALLBACK / ACTION
Exact opening gym frame → interpretation changes → bank statement → recurring audit → final cursor stop → black.

Goal: payoff and useful action without a generic CTA.

---

## 16. RETENTION CONTROL LOOP

The director must inspect every 15–45 seconds, not merely every chapter.

For each interval record:

- active viewer question;
- visual novelty status;
- current module repetition;
- information density;
- narration pace;
- current emotional register;
- strongest proof available;
- likely exit cause;
- legitimate repair.

### Legitimate repair options

1. reveal new evidence;
2. change scale;
3. change entity;
4. introduce a counterexample;
5. convert explanation into a diagram;
6. convert narration into proof;
7. create a meaningful visual contrast;
8. advance the chronology;
9. compress redundant explanation;
10. create a clean emotional reset.

Never repair a weak section with random movement.
Never manufacture fake suspense.

---

## 17. RETENTION GATES

### Gate A — first 30s
Must have:
- immediate promise delivery;
- no blank frame;
- strong contradiction;
- at least one unanswered question;
- clean visual hierarchy.

### Gate B — first 3 minutes
Must have:
- first mechanism explained;
- first major reveal;
- no repetitive visual grammar run;
- at least one evidence artifact.

### Gate C — 3–10 minutes
Must have:
- escalation beyond the original gym;
- new entity/reversal;
- meaningful visual resets;
- no long explanatory plateau.

### Gate D — 10–15 minutes
Must have:
- new scale/entity;
- stronger stakes than the opening;
- procedural/evidence climax building.

### Gate E — 15–19:14
Must have:
- reversal;
- current-state clarity;
- opening callback;
- earned payoff;
- no generic outro.

---

## 18. YT_ENGINE → EDIT DECISION MATRIX

After running `viral:patterns`, translate findings into the following decisions:

| Corpus signal | Editorial response |
|---|---|
| strong contradiction hooks | prioritize contradiction visually before explanation |
| strong concrete-number openings | use one number as an event, not a number wall |
| strong evidence moments | move evidence earlier if it does not spoil the story |
| strong visual resets | introduce new entity/evidence at natural chapter turns |
| high repetition penalty | reduce same-module streaks and generic B-roll |
| strong replay spikes | inspect whether clarity or novelty caused them; reproduce the mechanism, not the exact shot |
| weak intro pattern | rewrite the first 30s edit before touching the middle |
| strong late moment | test an earlier teaser of the same mechanism without revealing the payoff |

The YT_ENGINE result must be logged with confidence and timestamp. If it conflicts with story logic, story logic wins.

---

## 19. AUDIO + VISUAL RELATIONSHIP

Narration is the spine.
Visuals should lead, match, contrast, or reframe it.

Use:

- `J-cut` for anticipation;
- `L-cut` for continuity/reframe;
- silence before major reveal;
- reduced music during evidence reading;
- subtle accents only on earned events.

Major numbers should follow:

`setup → silence → number → hold → consequence`

Legal reveal should follow:

`setup → source → finding → consequence`

Do not use a trailer boom for every number.

---

## 20. PREMIUM AUDIOVISUAL MIX RULES

- voice must remain intelligible and emotionally stable;
- music must not compete with legal/evidence narration;
- ambience can establish place but must not become a distraction;
- SFX density should decrease during explanatory evidence passages;
- climax sections can become denser, then should release into quieter payoff.

---

## 21. FAILURE MODES — AUTOMATIC REJECTION

Reject an edit if it contains:

- blank first frame;
- unrelated B-roll;
- same module repeated excessively;
- logo parade;
- chart for every number;
- captioning every spoken word;
- random zooms;
- repeated whoosh transitions;
- decorative particles covering evidence;
- legal allegation presented as proven fact;
- fake documentary evidence without a clear recreation treatment;
- identical visual treatment for every company;
- visually busy major-number frames;
- climax music running continuously;
- outro that delays the final payoff.

---

## 22. DIRECTOR OUTPUT CONTRACT

The agent must create/assemble a plan that contains, for every beat:

```text
beat
start/end
storyRole
viewerQuestion
exitRisk
primaryVisual
secondaryEvidence
assetType
sourceRequirement
heroText
supportText
sourceText
entry
hold
exit
camera
revealMode
motionFX
musicState
silenceState
sfx
captionMode
jCut
lCut
reasonForChange
nextQuestion
```

The field `reasonForChange` is mandatory.

Valid examples:

- `new evidence arrives`
- `scale changes from company to consumer`
- `new entity introduced`
- `mechanism becomes visible`
- `reversal`
- `viewer needs cognitive reset`

Invalid:

- `looks cool`
- `dynamic`
- `more engaging`
- `needs movement`

---

## 23. FINAL PRE-RENDER CHECKLIST

Before render:

1. YT_ENGINE patterns queried and confidence recorded.
2. First 30 seconds manually reviewed as a separate sequence.
3. Every beat has a primary visual decision.
4. Every evidence-heavy claim has a proof strategy.
5. Every B-roll shot is semantically exact.
6. Every logo has a reason.
7. Every graphic has a relationship to explain.
8. Every text element has a hierarchy role.
9. Every visual state change has a reason.
10. No long repetitive module streak.
11. Major numbers are isolated.
12. Legal language is neutral and sourced.
13. The Adobe/streaming/Amazon sections each have distinct visual grammar.
14. The opening gym frame returns at the end.
15. The final action resolves the thesis.
16. No generic outro.
17. `npm run direct` passes without fatal timeline problems.
18. `npm run gate` passes.
19. `npm run lint` passes.
20. Post-render `npm run viral:score` is run with the actual final video.

---

## 24. POST-RENDER LEARNING LOOP

After rendering:

1. Run `npm run viral:score -- <video> --title "The Company That Sells You Nothing" --assume-voice`.
2. Save the score and component findings.
3. Compare the score against the pre-render director assessment.
4. Identify the top three weak moments.
5. If the video is not strong enough, fix the **highest-leverage editorial defect first**, not random visuals.
6. After publication, use YouTube retention data to classify:
   - dips;
   - spikes;
   - top moments;
   - intro retention.
7. Feed those findings back into the next episode's director priors.

Never claim the numerical score guarantees views. The score is a QA/comparison instrument; real audience behavior is the ground truth.

---

## 25. PROFESSIONAL DIRECTOR STANDARD

A world-class finance documentary should feel:

- researched;
- evidence-led;
- visually economical;
- rhythmically alive;
- emotionally controlled;
- easy to understand without oversimplifying;
- distinctive without being flashy;
- premium without feeling over-produced;
- authored rather than templated.

The final test is:

> If the viewer turns off the audio, does the visual sequence still communicate the story?
> If the viewer looks away for two seconds, does the next visual re-orient them without repeating the previous point?
> If a graphic disappears, is the story actually worse?
> If the editor removed half the effects, would the film become better?

If the answer reveals unnecessary motion, simplify.

The target is not “more editing.”

The target is **better editorial causality**:

`QUESTION → EVIDENCE → REVEAL → CONSEQUENCE → NEXT QUESTION`

That is the production standard for this 19:14 film.