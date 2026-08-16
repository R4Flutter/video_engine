# WORLD-CLASS LONG-FORM EDITORIAL DIRECTOR — 19:14

Target episode: `The Company That Sells You Nothing`
Mode: Finance / long-form documentary
Target runtime: 19:14

This file is the governing editorial contract for the edit. It is not an asset-captioning guide. It tells the agent exactly what the viewer should see, when it should appear, why it should change, what should stay quiet, and how to use the YouTube intelligence engine without turning the film into a template.

## 0. BEFORE DIRECTING: QUERY YT_ENGINE

Before making editorial decisions, run the project's YT_ENGINE bridge against the local corpus:

```text
npm run viral:patterns
npm run viral:benchmark
```

The bridge is `tools/viral.py` and points to `C:\Users\rajna\yt_engine` by default. It exposes learned hook patterns, effect sizes, and corpus confidence. Treat the corpus as comparative evidence, not a guarantee of virality. The engine documentation says the corpus grows through deep crawl and reports confidence honestly; do not invent findings that the query does not return.

Use the learned patterns to answer:

1. What opening structures are working in documentary/business channels?
2. How quickly do high-performing openings establish a concrete contradiction?
3. Which visual state changes correlate with sustained engagement rather than empty motion?
4. Where do successful long-form videos introduce a new entity, proof artifact, or reversal?
5. Which caption densities feel premium rather than over-edited?
6. When do graphics clarify a mechanism versus becoming decoration?
7. Which reveal styles are repeatedly effective for numbers, documents, interfaces, and timelines?
8. What pattern should this film deliberately break so it does not feel templated?

Do not copy another creator's exact layout. Extract the underlying editorial mechanism and adapt it to this story.

## 1. CORE EDITORIAL PRINCIPLE

Every frame must earn its existence.

The editor must answer:

`WHAT IS HEARD → WHAT IS UNDERSTOOD → WHAT IS FELT → WHAT IS SEEN → WHAT CHANGES → WHAT QUESTION REMAINS`

Never place an image because the narration moved to a new sentence.
Never animate a logo because the company name was spoken.
Never add text merely because there is empty space.
Never cut simply because the previous shot reached an arbitrary duration.

A visual change is justified only when it:

- reveals new information;
- changes the viewer's interpretation;
- adds credible evidence;
- creates a meaningful contrast;
- advances the chronology;
- increases/decreases tension intentionally;
- clarifies the mechanism;
- gives the viewer a cognitive reset before the next idea.

## 2. VISUAL GRAMMAR

The film should feel like a premium investigative documentary, not a social-media montage.

Preferred visual hierarchy:

1. REAL / PHOTOGRAPHIC ENVIRONMENT
2. ORIGINAL / TRACEABLE DOCUMENTARY EVIDENCE
3. REALISTIC B-ROLL
4. CLEAN INFORMATION GRAPHIC
5. TYPOGRAPHIC EMPHASIS
6. LOGO / BRAND MARK ONLY WHEN IDENTITY MATTERS

Use the simplest medium that explains the point best.

A photograph should not be replaced by a chart.
A chart should not be replaced by a paragraph of text.
A diagram should not be replaced by generic B-roll.
A logo should never be the visual argument by itself.

## 3. FRAME COMPOSITION

Long-form composition must prioritize one visual idea per frame.

Default hierarchy:

- primary subject: 55–75% visual attention
- secondary evidence: 15–30%
- typography: only enough to reinforce the central idea
- source/legal qualifier: small and quiet

Protect negative space for the narration-critical text.
Do not stack more than one HERO statement with another HERO statement.
Do not put a chart, logo, giant title, subtitle wall, and photograph at equal visual weight.

## 4. FIRST FIVE SECONDS — EXACT DIRECTION

The first five seconds are the highest-leverage section of the film. YT_ENGINE patterns must be consulted before finalizing them.

### 0:00–1.2

VISUAL:
Photorealistic empty Planet Fitness-style gym at approximately 4:00 a.m. Wide locked-off establishing frame. Machines are perfectly arranged. Fluorescent ambience. No crowd. Ideally no visible person during the first instant.

CAMERA:
HOLD. No zoom. No push. No fake parallax.

AUDIO:
Very restrained room tone / fluorescent hum. Voice starts immediately.

ON-SCREEN:
No giant title card.
No logo wall.
No subtitle karaoke.

TEXT:
A small documentary source label may live in a corner only if needed. The frame itself should do the first job.

### 1.2–2.6

NARRATION:
"Planet Fitness ended 2025 with about twenty point eight million members."

VISUAL EVENT:
A restrained `20.8M MEMBERS` evidence-style number enters in one clean move, anchored to the empty gym. It must look like an editorial statistic card, not a YouTube thumbnail.

TEXT:
HERO = `20.8M`
SUPPORT = `MEMBERS`

Do not show club count yet.

WHY:
The contradiction is the empty room versus a huge member number. Preserve cognitive simplicity so the viewer can process the paradox.

### 2.6–4.0

NARRATION:
"It had two thousand eight hundred and ninety-six clubs."

VISUAL EVENT:
The gym remains. The composition changes through a controlled evidence transformation: `20.8M MEMBERS` moves/subdues; `2,896 CLUBS` becomes the new focal information.

TEXT:
HERO = `2,896`
SUPPORT = `CLUBS`

Use a soft push or typography morph, not a hard flashy transition.

### 4.0–5.0

NARRATION:
"That is roughly seven thousand two hundred members for every location."

VISUAL EVENT:
The first true graphic reveal happens here.

Center a simple ratio:

`7,200`
`MEMBERS / CLUB`

Use a visual scale cue or restrained dot field that suggests many members against one location without becoming an infographic wall.

At the exact moment the ratio becomes legible, hold.

A subtle bass/low impact may land, but no trailer boom.

WHY:
The viewer has now received:

`huge member base → limited physical capacity → impossible-looking ratio`

The next question is naturally created by the contradiction.

## 5.0–10.0 SECOND FOLLOW-THROUGH

Do not immediately explain the answer.

Let the empty gym remain visible long enough for the viewer to ask:

`How can this business possibly work?`

Then move from macro scale into human behavior.

Use a tiny distant treadmill user only after the paradox has landed.

This produces the pattern:

`CONTRADICTION → HUMAN SCALE → QUESTION`

## 6. TEXT SYSTEM

Use three tiers only:

### HERO
1–7 words. The single most important idea.

Examples:
- `20.8M`
- `2,896 CLUBS`
- `BREAKAGE`
- `ONE-TIME PURCHASE`
- `$2.5B`
- `THE RULE EXISTED.`

### SUPPORT
Short qualifier/context.

Examples:
- `MEMBERS`
- `PER CLUB`
- `REVENUE COLLECTED WITHOUT SERVICE USE`

### SOURCE
Small factual/legal qualification.

Examples:
- `Planet Fitness FY2025 filing`
- `FTC complaint, 2023`
- `Eighth Circuit, July 8, 2025`

Do not turn the 19-minute film into karaoke captions.
The voice carries the prose. Typography carries the thesis.

## 7. WHEN TO SHOW FULL SENTENCES

Full-sentence on-screen text is reserved for one of four cases:

1. the central thesis of a section;
2. a quote that is itself evidence;
3. a legal/document finding that benefits from exact wording;
4. a deliberate emotional callback.

Otherwise use phrases, numbers, labels, or visual proof.

## 8. IMAGE ENTRANCE RULES

An image should normally enter by one of these meanings:

CUT = new fact / new place / new time
MATCH CUT = conceptual connection between two entities
PUSH = discovery / increasing significance
PULL = context / reframe
MASK REVEAL = hidden evidence becoming visible
DRAW-ON = mechanism / route / relationship
COUNTER = quantitative change
HOLD = evidence needs contemplation
SETTLE = emotional resolution

Do not use FADE for every scene.
Do not use PUSH for every photograph.
Do not use fake camera movement to hide weak assets.

## 9. B-ROLL RULES

B-roll must depict the exact semantic action or environment being discussed.

For every B-roll shot, specify:

- subject;
- action;
- environment;
- camera behavior;
- emotional purpose;
- exact narration supported;
- entry point;
- exit point;
- whether it is a primary visual or texture.

For an `empty gym` requirement, hard negatives are mandatory:
`no crowd, no trainer, no workout class, no athlete, no obvious person in foreground`.

Do not accept a generic gym merely because it has high resolution.
Semantic fit outranks resolution.

## 10. LOGO RULES

A logo is evidence of entity identity, not entertainment.

Use a logo when:
- introducing a company for the first time;
- comparing named entities where identity itself matters;
- showing a documented company artifact.

Do not:
- repeatedly center giant logos;
- animate every logo with the same pop;
- use logo cards as filler.

Streaming section exception:
A sequence of logos can be used only when the multiplication of services is the argument. Accumulate them progressively, then collapse them into the bundle concept.

## 11. GRAPHIC RULES

Every graphic needs a semantic purpose.

### NUMBER
Use for:
- money;
- membership counts;
- decisive percentages;
- one decisive statistic.

### CHART
Use for:
- time series;
- before/after trends;
- scale or trajectory.

### DIAGRAM
Use for:
- cost mechanism;
- recurring-payment system;
- cancellation friction;
- cause/effect.

### TIMELINE
Use for:
- historical sequence;
- regulatory sequence;
- launch → response → reversal.

### UI RECREATION
Use for:
- enrollment flow;
- cancellation maze;
- subscription interface behavior.

Never use a chart when a number alone is clearer.
Never use a chart just because the subject contains numbers.

## 12. INFORMATION STAGING

Preferred sequence:

`ORIENT → FOCUS → PROVE → INTERPRET → CONSEQUENCE → RELEASE`

Example:

1. Show empty gym.
2. Show `20.8M`.
3. Show `2,896`.
4. Reveal `7,200 / club`.
5. Explain why that ratio matters.
6. Move to the unused-member mechanism.

Do not show all six pieces at once.

## 13. MAJOR SECTION EDITORIAL MAP

### 0:00–1:35 — GYM CONTRADICTION
Visual language: quiet, photographic, statistical.
Purpose: establish the impossible ratio without explaining everything.

### 1:35–5:35 — BREAKAGE / BALLY
Visual language: real environments + physical documents + simple economics graphics.
Purpose: make the business mechanism visible and show why the old contract-heavy version created complaints.

### 5:35–6:30 — PLANET FITNESS / FRICTION
Visual language: modern gym + generic account/cancellation UI recreation.
Purpose: show that low price + friction can replace long contracts.

### 6:30–10:55 — ADOBE
Visual language: physical software artifact → revenue chart → ownership transformation → documented backlash → revenue evidence.
Purpose: make the ownership-to-subscription reversal feel tangible.

### 10:55–13:20 — STREAMING
Visual language: cable bill → clean streaming promise → service fragmentation → bundle reconstruction.
Purpose: make one large bill becoming many smaller bills visually obvious.

### 13:20–15:15 — AMAZON / ILIAD
Visual language: realistic UI recreation + legal/source evidence.
Purpose: this is the investigation's procedural climax. Build tension through the increasing cancellation steps, not scary effects.

### 15:15–17:35 — CLICK-TO-CANCEL REVERSAL
Visual language: policy document, side-by-side symmetry, court document, timeline.
Purpose: relief → rule → reversal → current legal state.

### 17:35–19:14 — EMPTY GYM CALLBACK / ACTION
Visual language: exact opening frame → bank statement → recurring charges → final cursor stop → black.
Purpose: reframe the opening and convert the insight into one useful action.

## 14. RETENTION RHYTHM

Do not target a fixed cut every N seconds.

Target a meaningful state change when one of these occurs:

- new claim;
- new entity;
- new evidence;
- new question;
- reversal;
- consequence;
- number event;
- emotional reset;
- visual fatigue.

A 6-second static evidence hold can be better than a 2-second random stock clip.
A 2-second cut can be necessary when the narrative has moved.

The test is semantic progression, not edit speed.

## 15. VISUAL DENSITY LIMITS

For a premium frame:

- one HERO idea;
- at most one SUPPORT relationship;
- optional small SOURCE label;
- one dominant image/evidence object;
- no more than one high-attention motion event at the same instant.

If a chart is appearing, do not simultaneously animate a giant logo and three text cards.
If a document is the evidence, let the document breathe.
If a major number is landing, suppress competing motion.

## 16. SILENCE / SOUND DESIGN

Use silence as an information delimiter.

Major numbers:
`lead-in → clean number → hold → interpretation`

Legal reveal:
`setup → silence → source → finding → consequence`

Do not use a trailer boom for every major number.

The most premium moments often become quieter.

## 17. LEGAL / EVIDENCE STYLE

Legal claims must be visually sourced and verbally precise.

Use distinct treatments:

- allegation = complaint/document excerpt + neutral source label;
- settlement = settlement/agency evidence + exact amount;
- court ruling = actual court document/reliable reproduction + date;
- current status = timeline/label showing what is actually in force.

Never turn an allegation into a visual verdict.
Never use fake "CONFIRMED GUILTY" styling.

## 18. PREMIUM RULES

Avoid:

- constant zoom-in/zoom-out;
- random whooshes;
- giant logos every section;
- generic stock footage unrelated to the claim;
- full karaoke captions;
- ten unrelated graphics in one frame;
- identical transitions for every beat;
- fake glitch effects;
- thumbnail-style text on every scene;
- excessive color changes;
- fake cinematic lens effects on documentary evidence.

Prefer:

- precise typography;
- clean evidence captures;
- restrained movement;
- deliberate negative space;
- realistic textures;
- controlled contrast;
- strong photographic composition;
- visual callbacks;
- purposeful silence.

## 19. FINAL REVIEW QUESTIONS

Before render, inspect every beat and answer:

1. What is the single strongest visual for this sentence/idea?
2. Why is the current visual better than B-roll?
3. If it is B-roll, why is this exact shot semantically correct?
4. What should the viewer notice first?
5. What should they notice second?
6. What changes during this beat?
7. What question remains alive afterward?
8. Could a viewer understand the visual without reading subtitles?
9. Is this frame too dense?
10. Is this frame too empty for the information being delivered?
11. Is the motion meaningful?
12. Is the typography necessary?
13. Is the logo necessary?
14. Is there a better proof artifact?
15. Is this visual repeating a previous visual grammar too soon?
16. What is the likely exit risk here?
17. What legitimate editorial device keeps the viewer moving?

## 20. FINAL DIRECTOR STANDARD

The goal is not to make the viewer notice the editing.

The goal is to make the viewer feel that every visual arrived exactly when it became necessary.

A premium frame should create:

`UNDERSTANDING + CURIOSITY + TRUST`

A premium sequence should create:

`QUESTION → EVIDENCE → REVEAL → CONSEQUENCE → NEXT QUESTION`

The final film should feel authored by a world-class documentary editor, not generated by a slideshow engine.
