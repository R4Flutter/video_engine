# PHASE — HUMAN-LIKE AI VOICE DIRECTOR

Extend the Finance Shorts Engine with a production-grade expressive voice system.

The objective is NOT simply text-to-speech.

The objective is:

SCRIPT → PERFORMANCE DIRECTION → EXPRESSIVE SPEECH → TIMESTAMPS → REMOTION SYNCHRONIZATION.

The narration should sound like a human finance storyteller rather than someone reading a document.

## 1. Create VoiceDirector

Create a module responsible for analyzing narration before TTS generation.

For every narration beat determine:

* emotion
* energy
* pace
* emphasis
* pause before
* pause after
* importance
* pitch intent
* loudness intent
* delivery style

Possible delivery states:

NEUTRAL
CONVERSATIONAL
CURIOUS
CONFIDENT
SERIOUS
EXCITED
DRAMATIC
WARNING
REVEAL
REFLECTIVE
URGENT
SOFT

Do not randomly assign emotions.

Delivery must follow semantic meaning.

---

## 2. IMPORTANCE SYSTEM

Give narration beats an importance score:

0.0–1.0

Example:

Normal explanation:
0.40

Important fact:
0.65

Major number:
0.75

Contrarian statement:
0.80

Hook:
0.90

Payoff:
0.95

CTA:
0.65

Importance should influence performance but should NOT simply mean "make everything louder."

High importance may result in:

slower delivery
stronger articulation
strategic pause
slightly increased energy
visual emphasis
SFX emphasis

---

## 3. HUMAN PACING

Avoid constant speech rate.

Human narration naturally changes pace.

For example:

HOOK:
fast/confident opening

SETUP:
conversational

IMPORTANT FACT:
slightly slower

BUILD:
gradually increasing energy

REVEAL:
pause → statement

EXPLANATION:
relaxed

PAYOFF:
confident

CTA:
friendly and concise

The engine should intentionally vary pacing.

---

## 4. PAUSE DIRECTOR

Strategic silence is important.

Support:

micro pause: 80–150 ms
normal pause: 150–300 ms
dramatic pause: 300–700 ms

Example:

"You might think $100 isn't enough..."

PAUSE

"But here's what happens after 30 years."

Do not insert dramatic pauses everywhere.

---

## 5. EMPHASIS ENGINE

Detect words deserving vocal emphasis.

Especially:

currency values
percentages
time periods
contrasts
negative outcomes
positive outcomes
key finance terminology
hook keywords
reveal keywords

Example:

"It's not the $100 that matters."

Possible emphasis:

NOT
$100
MATTERS

Do not emphasize every noun.

Limit emphasis so important words actually feel important.

---

## 6. CONTRAST PERFORMANCE

Detect constructions such as:

not X — but Y

most people think X — actually Y

$100 today — $X later

before — after

problem — solution

risk — reward

The second side of the contrast should generally receive stronger delivery.

Example:

"Most people focus on how MUCH they invest..."

pause

"...when TIME can matter even more."

---

## 7. NUMBER PERFORMANCE

Finance videos contain many numbers.

Numbers should receive special treatment.

When narration contains:

$100
$10,000
7%
30 years
2×
$1 million

allow the VoiceDirector to:

slow slightly before the number
clearly articulate the number
slightly emphasize it
optionally pause afterward

Synchronize corresponding visual number animation with the spoken number.

---

## 8. HOOK PERFORMANCE

The first 1–3 seconds are critical.

The hook voice should:

begin immediately
sound confident
avoid unnecessary introductory pauses
contain clear articulation
have slightly elevated energy
create curiosity

Never use:

"Hello guys"
"Welcome back"
"Today we're going to talk about..."

Start directly with the idea.

---

## 9. REVEAL PERFORMANCE

For major reveals use a structure such as:

BUILD
↓
micro silence
↓
REVEAL
↓
impact visual/SFX

Example:

"And after thirty years..."

350 ms pause

"...that $100 a month could become..."

150 ms pause

"$X."

The actual timing should be derived from generated speech.

---

## 10. AUDIO DYNAMICS

Do NOT artificially create huge volume jumps.

Target professional controlled dynamics.

Voice should remain intelligible throughout.

Use modest gain changes for emphasis.

For example:

soft section: approximately -2 dB relative
normal: baseline
important: +1 dB
major reveal: +1–2 dB

Avoid clipping.

Apply limiting after mixing if required.

---

## 11. MUSIC DUCKING

Voice always has priority.

When narration begins:

music automatically ducks.

During strategic pauses:

music may rise slightly.

During major reveal:

music may build.

During CTA:

music may gently lift.

Example conceptual behavior:

VOICE
████████████████

MUSIC
██░░░░░░░░░░████

Never let background music compete with narration.

---

## 12. SFX SYNCHRONIZATION

Use voice timestamps to position SFX.

Example:

Voice says "$10,000"

At the exact spoken beat:

number animation lands
+
coin/chime SFX
+
camera micro-punch

Do not place SFX randomly.

SFX should correspond to meaningful visual/narrative events.

---

## 13. WORD TIMESTAMPS

The TTS pipeline should output word-level timing whenever supported.

Store:

{
"word": "$10,000",
"start": 7.31,
"end": 7.86
}

Use these timestamps for:

captions
character gestures
number reveals
chart events
camera events
SFX
scene boundaries

The voice becomes the master clock.

---

## 14. CHARACTER SYNCHRONIZATION

Character actions should respond to narration.

Examples:

QUESTION → thinking expression

IMPORTANT NUMBER → point toward number

WARNING → serious expression

REVEAL → confident expression

POSITIVE RESULT → subtle celebration

COMPARISON → gesture between two sides

Avoid random gestures.

---

## 15. VOICE PROFILE

Create a persistent voice profile derived from `character.md`.

Example:

{
"persona": "smart young finance storyteller",
"baselineEnergy": 0.68,
"baselinePace": 1.02,
"warmth": 0.65,
"authority": 0.72,
"enthusiasm": 0.58,
"dramaticIntensity": 0.45
}

Every episode should sound like the SAME presenter.

Do not randomly change narrator personality between videos.

---

## 16. TTS PROVIDER ABSTRACTION

Do not tightly couple the project to one TTS provider.

Create:

VoiceProvider

with an interface approximately like:

generateSpeech(request)
getCapabilities()
supportsWordTiming()
supportsEmotion()
supportsStyleControl()

Then individual adapters can implement different TTS engines.

This lets the project switch between:

cloud TTS
local TTS
future providers

without rewriting the video engine.

---

## 17. OUTPUT

Each episode should produce:

voice.wav
voice-plan.json
word-timestamps.json

Example voice-plan:

{
"segments": [
{
"id": "hook",
"text": "...",
"emotion": "curious",
"energy": 0.86,
"pace": 1.08,
"importance": 0.92,
"emphasis": ["..."]
}
]
}

---

## 18. FINAL AUDIO PIPELINE

Implement:

SCRIPT
↓
VoiceDirector
↓
VoiceProvider
↓
VOICE WAV
↓
TIMESTAMP EXTRACTION
↓
Remotion Timeline
↓
Music + SFX
↓
Automatic Ducking
↓
Peak Protection / Limiting
↓
FINAL AUDIO

The finished narration should contain natural variation in:

pace
energy
emphasis
silence
emotion
sentence rhythm

without becoming theatrical or artificial.

The target is a confident human finance storyteller.

Do not optimize for "maximum emotion."

Optimize for:

BELIEVABILITY
CLARITY
AUTHORITY
RETENTION
NATURAL PERFORMANCE.
