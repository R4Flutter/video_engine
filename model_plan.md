# MASTER BUILD PROMPT — WORLD-CLASS AUTOMATED FINANCE SHORTS ENGINE

You are a principal software architect, senior React/Remotion engineer, motion designer, short-form video editor, audio designer, retention strategist, and automated media-pipeline engineer.

Your task is to build a production-grade system that automatically converts:

1. `character.md`
2. `scripts.md`
3. finance topic/research
4. reusable brand assets
5. audio/SFX/music assets

into highly polished vertical finance videos using React + Remotion.

The goal is NOT to make a generic slideshow generator.

The goal is to build a reusable **Finance Video Engine** capable of producing professional 20–60 second YouTube Shorts / Instagram Reels / TikTok-style videos every day with minimal manual intervention.

The output should feel intentionally edited by a skilled motion designer and short-form editor.

---

# 1. CORE PHILOSOPHY

Do NOT generate an entirely new React video implementation for every episode.

Build two layers:

## Layer A — Permanent Video Engine

Reusable React/Remotion components responsible for:

* typography
* captions
* character animation
* layouts
* transitions
* charts
* graphs
* financial visualizations
* number animations
* icons
* backgrounds
* camera movement
* SFX
* music
* voiceover synchronization
* CTA sequences
* hooks
* progress indicators
* emphasis effects
* asset management
* scene transitions
* rendering

## Layer B — Episode Director

For each daily video, generate structured JSON describing:

* topic
* hook
* narration
* scenes
* timings
* captions
* visual hierarchy
* character actions
* charts
* numbers
* icons
* B-roll/assets
* transitions
* camera motion
* SFX
* music behavior
* CTA
* retention events

The Remotion engine interprets this JSON.

Architecture:

FINANCE DATA / RESEARCH
↓
SCRIPT ENGINE
↓
RETENTION ENGINE
↓
DIRECTOR ENGINE
↓
episode.json
↓
REMOTION VIDEO ENGINE
↓
AUDIO MIX
↓
QUALITY CONTROL
↓
FINAL MP4

---

# 2. INPUT FILES

The system must consume:

`character.md`

This contains the identity and behavior of the recurring character/presenter.

Parse information such as:

* personality
* appearance
* colors
* clothing
* expressions
* poses
* speaking personality
* allowed actions
* prohibited actions
* brand identity

The character must remain visually and behaviorally consistent across episodes.

---

`scripts.md`

This defines the editorial/script framework.

Parse:

* hook rules
* storytelling style
* target audience
* vocabulary
* sentence length
* pacing
* CTA rules
* finance niche
* prohibited claims
* tone
* content pillars

Never silently override these rules.

---

# 3. TARGET FORMAT

Primary output:

1080 × 1920
9:16
30 FPS

Support approximately:

20 sec
30 sec
45 sec
60 sec

All important information must remain inside mobile-safe regions.

Design primarily for phone viewing.

---

# 4. CONTENT PILLARS

Build the architecture so episodes can support multiple finance formats.

Examples:

Personal finance

* compound interest
* saving
* budgeting
* emergency funds
* debt
* credit cards
* inflation
* lifestyle inflation

Investing education

* stocks
* ETFs
* diversification
* market capitalization
* valuation
* dividends
* index funds
* risk/reward

Business finance

* margins
* revenue
* profit
* cash flow
* unit economics
* business models

Financial psychology

* FOMO
* loss aversion
* sunk cost
* lifestyle creep
* herd behavior

Finance stories

* company stories
* bubbles
* crashes
* famous investments
* financial mistakes
* business failures

The architecture must NOT be locked to one content format.

---

# 5. FINANCE SAFETY + FACTUALITY LAYER

Finance content requires strict factual controls.

Never invent:

* stock prices
* market returns
* earnings
* company financials
* interest rates
* inflation statistics
* economic statistics
* historical returns
* dates
* market capitalization
* quotes

Every externally sourced factual claim should support:

source
source URL
retrieval timestamp
data timestamp
confidence

For time-sensitive information, label freshness.

Example:

{
"value": 184.52,
"asOf": "2026-08-05T...",
"source": "...",
"verified": true
}

Separate:

FACT
OPINION
EXAMPLE
ESTIMATE

Never present an estimate as fact.

Do not generate personalized financial advice.

---

# 6. RETENTION ENGINE

Create a dedicated retention-planning module.

Every video should be intentionally paced.

A default structure could resemble:

0–2 sec → hook
2–5 sec → curiosity expansion
5–12 sec → setup
12–25 sec → explanation
25–40 sec → payoff
final seconds → CTA

But DO NOT force identical timing on every episode.

The director should adapt pacing to the script.

---

# 7. HOOK ENGINE

Create multiple hook archetypes.

Examples:

CONTRARIAN

“Saving more isn't always the fastest way to build wealth.”

NUMBER

“$100 a month can become much bigger than you think.”

CURIOSITY

“There is a reason wealthy people think differently about this number.”

MISTAKE

“This tiny money mistake can follow you for years.”

QUESTION

“What actually happens when inflation stays high?”

STORY

“In 2008, one assumption cost investors billions.”

COMPARISON

“$100 invested vs $100 sitting in cash.”

Generate multiple candidate hooks.

Score each for:

clarity
curiosity
specificity
visual potential
credibility
audience relevance
payoff potential

Choose the strongest candidate.

Do NOT use dishonest clickbait.

The video must actually deliver the promised payoff.

---

# 8. PATTERN INTERRUPTS

Long periods of visual sameness are prohibited.

Create controlled pattern interrupts.

Possible interrupts:

* camera punch
* character expression
* chart reveal
* number counter
* typography transformation
* icon entrance
* sound accent
* background shift
* comparison split
* timeline movement
* object entrance
* diagram build
* caption emphasis
* brief pause
* scene composition change

Pattern interrupts should support comprehension rather than create random chaos.

The director should explicitly schedule them.

Example:

{
"time": 4.2,
"type": "number_punch",
"intensity": 0.65
}

Avoid repeating the exact same interrupt consecutively.

---

# 9. SCENE DIRECTOR

Break narration into semantic beats.

Each scene needs a reason to exist.

Example schema:

{
"id": "scene_04",
"start": 8.4,
"end": 12.8,
"purpose": "explain_compounding",
"narration": "...",
"visualFocus": "compound_chart",
"layout": "character_chart",
"camera": {},
"character": {},
"captions": [],
"graphics": [],
"sfx": [],
"transitionOut": {}
}

Scene duration should follow narration, not arbitrary fixed blocks.

---

# 10. VISUAL GRAMMAR

Create a reusable visual language specifically for finance.

Required components should include concepts such as:

MoneyCounter
PercentageCounter
CurrencyTicker
CompoundGrowthChart
LineChart
BarChart
DonutChart
AllocationChart
ComparisonCard
ProfitLossCard
StockCard
CompanyCard
MetricCard
Timeline
CashFlowDiagram
MoneyFlow
DebtVisualizer
InterestVisualizer
InflationVisualizer
PortfolioVisualizer
RiskRewardScale
CalculatorScene
QuoteCard
HeadlineCard
BigNumber
StatReveal

Charts must animate progressively.

Never simply display a static chart when animation can communicate the concept.

---

# 11. CHARACTER SYSTEM

The recurring character should function as a presenter and storytelling device.

Build reusable actions:

idle
talk
pointLeft
pointRight
pointUp
lookAtChart
lookAtNumber
thinking
surprised
concerned
confident
celebrate
warning
explain

Character movement should have purpose.

Examples:

When chart appears:
character looks toward chart.

When an important number appears:
character points toward number.

When explaining a mistake:
character changes to concerned expression.

When revealing payoff:
character becomes confident/excited.

Avoid random animation.

---

# 12. CHARACTER STAGE POSITIONS

Create reusable anchors:

LEFT
CENTER
RIGHT
LOWER_LEFT
LOWER_RIGHT
OFFSCREEN_LEFT
OFFSCREEN_RIGHT

The director can move the character depending on available information density.

Do not allow the character to cover important captions or charts.

---

# 13. CAPTION ENGINE

Captions are a major part of the visual design.

Do NOT simply place subtitles at the bottom.

Support word-level or phrase-level timing.

Example:

{
"text": "Compound interest changes everything.",
"words": [
{"word":"Compound","start":0.0,"end":0.31},
{"word":"interest","start":0.31,"end":0.62}
]
}

Support:

active-word emphasis
keyword enlargement
number emphasis
currency emphasis
positive/negative emphasis
phrase grouping
controlled bounce
scale emphasis
opacity emphasis

Keep captions readable.

Avoid excessive animation on every word.

---

# 14. KINETIC TYPOGRAPHY

Create components such as:

HookText
BigStatement
BigNumber
KeywordPunch
QuestionText
ComparisonText
CounterText
CTAHeadline

Use typography as part of storytelling.

Important words can:

scale
slide
mask
reveal
track
compress
expand

Do NOT animate every word independently without reason.

---

# 15. MOTION DESIGN

Animations must be frame-driven and deterministic.

Use Remotion primitives such as:

useCurrentFrame()
interpolate()
spring()

Create reusable animation primitives:

fadeIn
fadeOut
slideIn
slideOut
pop
bounce
overshoot
counter
maskReveal
stagger
cameraPush
cameraPull
shake
float
parallax

Centralize motion constants.

Do not scatter arbitrary timing constants throughout components.

---

# 16. CAMERA SYSTEM

Implement a virtual camera abstraction.

Support:

pushIn
pullOut
panLeft
panRight
panUp
panDown
microZoom
focusShift
shake
static

Camera motion must be subtle unless intentionally used as an impact event.

Example:

{
"type": "pushIn",
"from": 1.0,
"to": 1.06,
"durationFrames": 35
}

---

# 17. FINANCIAL NUMBER ANIMATION

Numbers are critical in finance content.

Build polished counters for:

currency
percentages
multipliers
large values
profit/loss
growth
years

Examples:

$0 → $10,000

0% → 8%

1× → 12×

Use easing and formatting.

Support:

$12,450
$2.4M
$1.3B
7.4%
-12.8%

Numbers should be visually dominant when they are the narrative focus.

---

# 18. CHART ENGINE

Charts must be reusable and data-driven.

Support:

line
area
bar
stacked bar
donut
comparison
allocation
timeline
compound growth

Charts should have staged reveals:

axes
labels
line/bar animation
important point
annotation
payoff

Example:

chart draws →
important point appears →
camera pushes in →
value pops →
SFX accent.

---

# 19. TRANSITION SYSTEM

Build reusable transitions:

cut
whip
push
slide
zoom
mask
numberMatch
chartMatch
objectMatch
blur
wipe

Default to clean cuts and motivated transitions.

Fancy transitions should be rare.

Do not use random transitions merely because they exist.

---

# 20. AUDIO ARCHITECTURE

Treat audio as a first-class system.

Layers:

VOICE
MUSIC
SFX
AMBIENCE

VOICE should always dominate.

Create an audio mixer abstraction.

Example target philosophy:

voice = primary
music = supportive
SFX = accents

Implement automatic music ducking under speech.

Do not let SFX overpower narration.

---

# 21. SFX ENGINE

Build a semantic SFX registry.

Examples:

whoosh
softWhoosh
pop
click
tick
cash
coin
impact
rise
drop
warning
success
transition
typing
chartTick

The director requests semantic sounds instead of hardcoded filenames.

Example:

{
"type": "impact",
"time": 3.7,
"gain": 0.45
}

The registry resolves the actual asset.

Avoid SFX spam.

---

# 22. MUSIC ENGINE

Music should support pacing.

Define musical states:

HOOK
BUILD
EXPLANATION
TENSION
PAYOFF
CTA

Allow automation of:

volume
ducking
fade
energy
section selection

Do not restart the song on every scene.

Maintain continuity.

---

# 23. VOICEOVER PIPELINE

Create:

script
↓
voice generation
↓
word timestamps
↓
scene timing
↓
caption timing
↓
SFX timing
↓
animation timing

The actual voice timing should drive the video.

Do not guess durations from text length if timestamps are available.

---

# 24. ASSET SYSTEM

Create an asset manifest.

Example:

assets/
character/
icons/
logos/
finance/
backgrounds/
textures/
music/
sfx/
fonts/

Create:

assetManifest.ts

Never scatter arbitrary file paths across components.

Validate missing assets before rendering.

---

# 25. ASSET SELECTION

The director should describe semantic intent.

Bad:

"assets/icons/green-arrow-12.png"

Better:

{
"assetIntent": "growth_arrow"
}

The engine maps intent → approved asset.

This makes episodes portable and consistent.

---

# 26. BRAND SYSTEM

Create one central theme:

theme.ts

Include:

colors
fonts
font sizes
spacing
radius
shadows
caption styling
chart styling
character scale
safe zones
animation timing
motion intensity

Never hardcode branding repeatedly.

---

# 27. SCENE TEMPLATE LIBRARY

Build reusable compositions such as:

HookScene
CharacterExplainScene
BigNumberScene
ChartScene
ComparisonScene
StoryScene
TimelineScene
ProblemScene
SolutionScene
CalculationScene
QuoteScene
HeadlineScene
PayoffScene
CTAScene

The director selects the correct scene rather than generating arbitrary JSX.

---

# 28. RETENTION SCORE

Before rendering, calculate an episode retention score.

Evaluate:

hook strength
first visual impact
scene variety
visual clarity
caption readability
information density
pattern interrupts
payoff
CTA
audio variation

Return warnings.

Example:

Retention Score: 87/100

Warnings:

* 7.2 seconds without visual change
* CTA too long
* scene 5 contains excessive text
* payoff appears too late

Allow auto-repair where safe.

---

# 29. VISUAL DENSITY RULES

Avoid clutter.

At any moment, identify ONE primary visual focus.

Possible primary focus:

character
number
chart
headline
comparison
diagram

Secondary elements should support it.

Never make:

character + huge caption + graph + icons + ticker + CTA

all compete simultaneously.

---

# 30. CTA ENGINE

Do not use the same generic CTA every day.

CTA should depend on episode intent.

Examples:

FOLLOW:
“Follow for finance explained without the jargon.”

COMMENT:
“Which one surprised you?”

SAVE:
“Save this before your next budget reset.”

SERIES:
“Part 2 breaks down what happens after year 10.”

CTA should be short.

Ideally integrate CTA into the final payoff instead of abruptly stopping the story.

---

# 31. LOOP ENGINE

Where appropriate, create seamless conceptual loops.

Example:

Opening:
“Why does your first $100K feel so difficult?”

Ending:
“And that's exactly why your first $100K…”

→ loops naturally back into opening.

Do not force loops when they damage clarity.

---

# 32. EPISODE JSON

Create a strict TypeScript/Zod schema.

Example high-level structure:

{
"metadata": {},
"research": {},
"script": {},
"voice": {},
"scenes": [],
"audio": {},
"retention": {},
"cta": {},
"sources": []
}

Reject malformed episode plans before rendering.

---

# 33. DIRECTORY ARCHITECTURE

Design approximately:

src/
engine/
Director/
Timeline/
Audio/
Camera/
Captions/
Motion/
Assets/
Validation/

components/
character/
typography/
charts/
finance/
captions/
transitions/
ui/

scenes/
HookScene/
CharacterScene/
ChartScene/
NumberScene/
ComparisonScene/
TimelineScene/
CalculationScene/
PayoffScene/
CTAScene/

data/
schemas/
themes/
manifests/

compositions/
FinanceShort.tsx

episodes/
YYYY-MM-DD-topic/
research.json
episode.json
narration.wav
captions.json
sources.json
final.mp4

scripts/
generate-episode.ts
validate-episode.ts
render-episode.ts
quality-check.ts

public/
assets/
character/
icons/
finance/
sfx/
music/

---

# 34. QUALITY CONTROL

Before rendering validate:

JSON schema
scene overlap
scene gaps
caption overflow
safe zones
missing assets
audio files
chart data
source metadata
voice timestamps
duration
CTA
frame boundaries

After rendering perform automated checks where practical:

black frames
silent voice track
clipped audio
missing captions
text overflow
empty scenes
invalid frame count
render failures

---

# 35. DESIGN QUALITY

The output should NOT resemble:

* PowerPoint
* Canva slideshow
* generic AI video
* template spam
* random stock footage compilation

Aim for:

premium financial media
modern editorial motion graphics
clean fintech design
high information clarity
strong typography
intentional animation
professional sound design

---

# 36. VARIATION ENGINE

Daily episodes must feel consistent but not identical.

Create deterministic variation presets:

EDITORIAL
DATA_HEAVY
STORY
FAST_EXPLAINER
COMPARISON
MINIMAL
DRAMATIC

Variation can affect:

layouts
camera intensity
caption style
scene length
chart prominence
character presence
transition frequency

But branding remains consistent.

Use a seeded random system when controlled variation is needed.

The same episode + same seed must render identically.

---

# 37. PERFORMANCE

Optimize Remotion rendering.

Avoid:

unnecessary re-renders
huge images
runtime network requests
non-deterministic animations
expensive frame-by-frame calculations

Preprocess heavy assets.

Cache derived data.

All external research/assets should be downloaded BEFORE rendering.

Rendering should work offline once episode assets are prepared.

---

# 38. ABSOLUTE RULES

NEVER:

Generate arbitrary JSX for every episode.

Invent financial statistics.

Depend on network requests during render.

Use random animations without deterministic seeds.

Spam transitions.

Spam SFX.

Cover important information with captions.

Put important text outside safe zones.

Animate purely for decoration when it hurts comprehension.

Make every scene visually identical.

Use a static character for the entire video.

Use the same CTA every episode.

Use excessively long captions.

Use fake urgency or misleading financial claims.

---

# 39. DEVELOPMENT PHASES

DO NOT attempt to implement the entire system in one uncontrolled pass.

Work phase-by-phase.

PHASE 1
Repository audit + architecture.

PHASE 2
Episode JSON schema + validation.

PHASE 3
Theme + asset system.

PHASE 4
Timeline/director engine.

PHASE 5
Core scene templates.

PHASE 6
Character system.

PHASE 7
Caption engine.

PHASE 8
Motion + camera system.

PHASE 9
Finance visualization components.

PHASE 10
Audio/SFX/music architecture.

PHASE 11
Voice synchronization.

PHASE 12
Retention engine.

PHASE 13
CTA + loop engine.

PHASE 14
Automated episode generation.

PHASE 15
Quality-control pipeline.

PHASE 16
Performance/render optimization.

PHASE 17
Create reference-quality demonstration episode.

PHASE 18
Production hardening.

At the end of every phase:

1. run tests
2. run TypeScript checks
3. verify existing functionality
4. document what changed
5. commit only after the phase is stable

Do not move to the next phase when the current phase is broken.

---

# 40. TESTING

Create tests for:

schema validation
timeline calculation
scene boundaries
caption timing
number formatting
asset resolution
audio scheduling
retention analysis
safe zones
deterministic rendering configuration

Test edge cases:

very short narration
long narration
missing character
missing SFX
missing chart data
long currency values
negative percentages
long captions
no CTA
single scene
60-second episode

---

# 41. FIRST REFERENCE EPISODE

Once infrastructure works, create ONE extremely polished reference episode.

Topic:

“Why compound interest becomes powerful over time.”

The episode should demonstrate:

strong hook
character
animated captions
currency animation
compound-growth chart
camera movement
pattern interrupts
SFX
background music
visual explanation
payoff
CTA

Do NOT generate dozens of mediocre examples.

Make one reference episode excellent first.

Use it as the visual quality benchmark for subsequent episodes.

---

# 42. DAILY PIPELINE

Eventually I want to execute something similar to:

npm run episode -- --topic="compound interest"

And receive:

research.json
script.json
episode.json
narration.wav
captions.json
sources.json
preview.mp4
final.mp4
report.json

The report should include:

duration
resolution
render time
scene count
retention score
validation results
sources
warnings

---

# 43. DEFINITION OF DONE

The project is complete when:

I can provide a finance topic.

The system can research/receive verified information.

It generates a compelling script.

It creates narration.

It obtains word-level timing.

It converts narration into scenes.

It creates a structured director plan.

The Remotion engine renders those instructions.

The video contains intentional character performance.

Captions synchronize accurately.

Financial numbers/charts animate correctly.

Music supports the edit.

SFX emphasize meaningful moments.

Pattern interrupts maintain visual interest.

The CTA feels integrated.

The system validates factual information.

The render passes automated quality checks.

And I receive a polished 1080×1920 MP4 requiring little or no manual editing.

---

# FINAL ENGINEERING PRINCIPLE

Treat this project as a VIDEO ENGINE, not a video template.

The AI is the:

RESEARCHER
SCRIPTWRITER
RETENTION STRATEGIST
DIRECTOR
EDITORIAL PLANNER

Remotion is the:

RENDERER
ANIMATION ENGINE
TIMELINE ENGINE
AUDIO ENGINE
VISUAL SYSTEM

Structured JSON is the contract connecting them.

Before writing significant code:

1. Inspect the entire existing repository.
2. Read `character.md`.
3. Read `scripts.md`.
4. Identify existing Remotion components and dependencies.
5. Identify reusable assets.
6. Produce a proposed architecture.
7. Produce a file-by-file implementation plan.
8. Identify what should be reused, modified, created, or deleted.
9. Identify technical risks.
10. Only then begin Phase 1.

Do not replace working code unnecessarily.

Do not create duplicate systems when an existing abstraction can be extended.

Build production-quality TypeScript.

Favor modularity, deterministic behavior, testability, maintainability, and visual quality over shortcuts.
