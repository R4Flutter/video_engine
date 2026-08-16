# 19-Minute Documentary Voice Performance Map

**Target episode:** The Company That Sells You Nothing
**Mode:** Finance / long-form
**Target runtime:** ~19:14
**Engine:** Chatterbox via `tools/voice.py`

## Purpose

This file is the detailed performance direction for the full 19-minute narration. Do **not** reduce the episode to five broad emotions. Voice direction must evolve beat-by-beat across the entire runtime.

The narration should feel like one continuous human investigative performance. Use subtle changes in energy, pace, emphasis, pitch movement, warmth, conversational distance, and silence. Never make the changes sound like obvious preset swaps.

The existing `tools/voice.py` maps beat modules to Chatterbox `exaggeration`, `cfg_weight`, and `holdAfter`. Preserve that architecture. Do not replace it with one global voice setting.

## Global performance rules

- Premium investigative business-documentary voice: intelligent, calm, credible, intimate, slightly skeptical, emotionally controlled.
- Not a trailer, motivational speaker, audiobook, announcer, or generic TTS voice.
- Respect the viewer's intelligence. Information creates the drama; the narrator does not manufacture it.
- Never shout. Major moments become powerful through slowing, cleaner articulation, lower background intensity, and silence.
- Avoid fake surprise, melodramatic whispers, laughs, gasps, exaggerated breaths, or forced gravitas.
- Default target is approximately 170 wpm, but allow local variation. Explanations can flow; reveals and numbers can slow.
- Preserve natural breath groups and sentence-length variation.
- Use the project's `holdAfter` mechanism for silence. Do not add punctuation hacks unless required for pronunciation.
- Numbers, legal outcomes, dates, and named mechanisms get deliberate articulation and breathing room.
- Legal allegations must remain neutral: say `FTC alleged`, `DOJ alleged`, `the court held`, or equivalent. Never perform allegations as established guilt.

## Full runtime performance map

### 0:00–0:20 — Cold open / strange observation

**Emotion:** quiet curiosity + controlled disbelief

**Performance:**
- Start almost conversationally.
- The empty gym should create the first tension; the narrator should not.
- First sentence effortless and factual.
- Separate the member count and club count with tiny spaces.
- Slightly slower than the episode average.

**Energy:** LOW → LOW/MEDIUM
**Pitch:** natural, slightly lower conversational register
**Intensity:** restrained
**Key idea:** "I am showing you something strange."

### 0:20–0:40 — First revelation

**Emotion:** curiosity → realization

**Performance:**
- Increase engagement slightly.
- Let the viewer mentally connect the numbers.
- Slow before the reveal about the non-attending member.
- `ideal customer` lands softly but firmly.

**Energy:** LOW/MEDIUM
**Pacing:** slightly faster, then slower for the reveal
**Pause before reveal:** ~0.6–1.0s
**Key idea:** "Something is backwards here."

### 0:40–1:00 — Personal recognition

**Emotion:** recognition

**Performance:**
- More conversational.
- This is where the viewer recognizes their own subscription behavior.
- Never accusatory.
- `$86` neutral; `$219` deliberate; `$133` strongest emphasis of this section.

**Energy:** MEDIUM
**Key idea:** "This is not only about a gym. You probably do this too."

### 1:00–1:35 — Open loop

**Emotion:** curiosity → anticipation

**Performance:**
- Increase forward momentum.
- `It did not begin with software` slows down.
- Final sentence clearly opens the historical question.
- Do not resolve it immediately.

**Energy:** MEDIUM
**Key idea:** "There is a larger story behind this."

### 1:35–2:05 — Breakage introduction

**Emotion:** discovery

**Performance:**
- More analytical.
- Explain the mechanism clearly.
- No drama or moral judgment.
- Sound like a journalist making a hidden economic mechanism visible.

**Energy:** MEDIUM
**Pacing:** steady

### 2:05–2:40 — Cost structure

**Emotion:** understanding

**Performance:**
- Clear and precise.
- Slightly faster through lists.
- Slow at `until that member actually uses the thing they bought`.

**Energy:** MEDIUM

### 2:40–3:10 — Human behavior

**Emotion:** recognition + slight discomfort

**Performance:**
- Warmer.
- Compassionate rather than mocking.
- `People intend to go` feels familiar.
- January behavior should sound universally recognizable.

**Energy:** MEDIUM

### 3:10–3:35 — Breakage reveal

**Emotion:** discovery → surprise

**Performance:**
- Slow down.
- Introduce `Breakage` as the missing name for the mechanism.
- Pull surrounding energy down so the word itself gains weight.
- `Breakage.` is isolated and clean, followed by deliberate silence.

**Energy:** MEDIUM → LOW → HIGH EMPHASIS → SILENCE
**Pause after word:** ~1.5s or script-directed hold
**Do not:** shout the word or make it horror-like.

### 3:35–4:10 — Second-order reveal

**Emotion:** realization

**Performance:**
- Gift-card explanation calm.
- Build contrast:
  - `A gift card breaks once.`
  - pause
  - `A subscription can break next month.`
- The second sentence carries slightly more weight.

**Energy:** MEDIUM
**Key idea:** repeated psychology is more powerful than a one-time breakage event.

### 4:10–4:50 — Recurring revenue

**Emotion:** unease

**Performance:**
- Slightly darker vocal weight.
- Still documentary, never villainous.
- Repeated-month language creates a subtle rhythmic acceleration.
- Final line lands quietly.

**Energy:** MEDIUM → MEDIUM/HIGH
**Pacing:** slight acceleration

### 4:50–5:35 — Bally transition

**Emotion:** anticipation → skepticism

**Performance:**
- Introduce Bally as the imperfect first generation of the model.
- Sound like the viewer is about to learn why the obvious version failed.
- Legal language remains neutral and evidence-driven.

**Energy:** MEDIUM
**Key idea:** the old model had a visible weakness.

### 5:35–6:05 — Bally / contract

**Emotion:** investigative discovery

**Performance:**
- More serious and grounded.
- Firmer consonants, not louder volume.
- Evidence should accumulate naturally.

**Energy:** MEDIUM/HIGH
**Do not:** sound angry or prosecutorial.

### 6:05–6:30 — Contract reversal

**Emotion:** reversal

**Performance:**
- Noticeably slower.
- `The contract was the wrong tool.` gets clean emphasis.
- Pause.
- Then introduce the new model as a solution to the old model's liability.

**Energy:** controlled HIGH emphasis

### 6:30–7:00 — Adobe reset

**Emotion:** fresh curiosity

**Performance:**
- Reset intensity.
- New chapter feels like the mechanism escaping the gym.
- Return to calm investigative delivery.

**Energy:** MEDIUM

### 7:00–7:40 — Ownership

**Emotion:** recognition + nostalgia

**Performance:**
- Slight warmth.
- Physical Photoshop box should trigger familiarity.
- `you owned it` sounds natural, not ideological.

**Energy:** MEDIUM

### 7:40–8:15 — Revenue problem

**Emotion:** understanding

**Performance:**
- Analytical.
- Sawtooth revenue explanation can move slightly faster.
- Slow at `your customer has no reason to buy it again today`.

**Energy:** MEDIUM

### 8:15–8:35 — Open loop

**Emotion:** anticipation

**Performance:**
- Ask the question conversationally, not rhetorically.
- Let the viewer predict the answer.
- `What do you do when your best product becomes too good at being a one-time purchase?`
- Pause.
- Then `Adobe answered.`

**Energy:** MEDIUM → LOWER → PAUSE

### 8:35–9:10 — Adobe decision

**Emotion:** tension

**Performance:**
- Slightly slower.
- `Creative Suite was finished.` is hard and clean.
- No melodrama.

**Energy:** MEDIUM/HIGH

### 9:10–9:45 — Backlash

**Emotion:** conflict

**Performance:**
- More human and conversational.
- Slightly faster while explaining the backlash.
- Keep both the customer reaction and company decision understandable.
- Avoid activism tone.

**Energy:** MEDIUM/HIGH

### 9:45–10:20 — Revenue graph

**Emotion:** anticipation → proof

**Performance:**
- `$1.23B` controlled.
- `$18.28B` stronger.
- `$22.9B` strongest.
- Each number gets space around it.
- Do not make every number sound equally dramatic.

**Energy:** MEDIUM → HIGH
**Pace:** slow enough for exact comprehension

### 10:20–10:55 — Implication

**Emotion:** realization

**Performance:**
- Slow down.
- This is about the economic relationship, not Photoshop features.
- `The economic relationship changed` receives subtle emphasis.
- Final sentence launches streaming naturally.

**Energy:** MEDIUM

### 10:55–11:20 — Streaming reset

**Emotion:** fresh curiosity

**Performance:**
- Slightly lighter.
- New chapter should feel like a new investigation, not a continuation of Adobe's intensity.
- Use forward momentum without rushing.

**Energy:** MEDIUM

### 11:20–11:55 — Cable vs streaming

**Emotion:** recognition

**Performance:**
- Familiar, conversational.
- The promise list can move more quickly:
  `pay for what you want`, `cancel any time`, `no installer`, `no giant bundle`.

**Energy:** MEDIUM

### 11:55–12:25 — Streaming reversal

**Emotion:** ironic realization

**Performance:**
- `And for a while, it worked.` slows and lands.
- Brief pause.
- Introduce catalogue fragmentation.
- Each new service should feel like another small piece of the trap.

**Energy:** MEDIUM → MEDIUM/HIGH

### 12:25–12:55 — New bundle

**Emotion:** recognition → frustration

**Performance:**
- Each individual payment feels harmless.
- Then combine them mentally.
- `The bundle appears one small decision at a time.` gets emphasis.

**Energy:** MEDIUM/HIGH

### 12:55–13:20 — Midpoint question

**Emotion:** anticipation

**Performance:**
- Slow noticeably.
- `Not: will you buy?`
- Pause.
- `Will you leave?`
- Second line is the pivot.
- Leave clean silence afterward.

**Energy:** LOW → HIGH EMPHASIS

### 13:20–13:45 — Amazon intro

**Emotion:** investigative tension

**Performance:**
- Calm and serious.
- Slightly lower register.
- Feels like entering evidence territory.

**Energy:** MEDIUM/HIGH

### 13:45–14:10 — Enrollment

**Emotion:** controlled suspicion

**Performance:**
- Matter-of-fact.
- Allegations remain neutral.
- Legal terminology pronounced carefully.

**Energy:** MEDIUM

### 14:10–14:35 — Cancellation maze

**Emotion:** rising tension

**Performance:**
- Gradually increase pace as the steps accumulate.
- Each short question becomes tighter:
  `Are you sure?`
  `Here is what you will lose.`
  `Would you rather pause?`
  `How about a discount?`
  `Are you really certain?`
- Rhythm itself creates tension.

**Energy:** MEDIUM → MEDIUM/HIGH

### 14:35–14:50 — Iliad reveal

**Emotion:** surprise

**Performance:**
- Pull everything back.
- `Iliad.` is isolated.
- Long silence.
- Explain the name calmly.
- It should feel chilling because it is understated, not because it is theatrical.

**Energy:** LOW → HIGH EMPHASIS → SILENCE

### 14:50–15:15 — $2.5B

**Emotion:** gravity

**Performance:**
- Very controlled.
- Slow.
- The number should feel heavy, not exciting.
- Pause after it.

**Energy:** MEDIUM/HIGH
**Pace:** SLOW

### 15:15–15:45 — The rule

**Emotion:** expectation / relief

**Performance:**
- Audience should feel the answer has finally arrived.
- Slightly warmer, more hopeful.
- Explain click-to-cancel simply.
- Keep clarity above drama.

**Energy:** MEDIUM

### 15:45–16:15 — Reversal

**Emotion:** disbelief

**Performance:**
- Begin calm.
- `And then the twist.`
- Pause.
- `The rule existed.`
- `It was coming.`
- `And then it was gone.`
- Each sentence progressively stronger.

**Energy:** MEDIUM → HIGH

### 16:15–16:45 — Procedure

**Emotion:** disbelief → realization

**Performance:**
- Slow.
- `It was defeated by the process used to write it.` gets controlled weight.
- Absurdity comes from understatement.

**Energy:** MEDIUM/HIGH

### 16:45–17:15 — Current state

**Emotion:** unease

**Performance:**
- Calm, factual.
- Explain current legal status without overstating.
- Build toward the final conceptual takeaway.

**Energy:** MEDIUM

### 17:15–17:35 — Final escalation

**Emotion:** anticipation

**Performance:**
- Slow down.
- Do not summarize everything.
- Make the callback feel inevitable.

**Energy:** LOW/MEDIUM

### 17:35–18:00 — Empty gym callback

**Emotion:** revelation

**Performance:**
- Quiet.
- Same family of voice as the opening, but more informed.
- The image should now mean something completely different.
- `The first time we saw this room...` is deliberate.

**Energy:** LOW

### 18:00–18:25 — The system

**Emotion:** clarity

**Performance:**
- Calm, philosophical explanation.
- No sermon.
- Make the idea feel obvious only after the viewer has earned it.

**Energy:** MEDIUM

### 18:25–18:45 — The $133 reframe

**Emotion:** recognition

**Performance:**
- Return to the opening number.
- Not fear, guilt, or alarm.
- The audience should understand why the number matters.

**Energy:** MEDIUM

### 18:45–19:05 — Practical action

**Emotion:** calm usefulness

**Performance:**
- Warm slightly.
- Speak directly to the viewer.
- Instructions should be easy to follow.
- No sales energy.
- No generic CTA.

**Energy:** MEDIUM/LOW

### 19:05–19:14 — Final payoff

**Emotion:** quiet realization

**Performance:**
- Slowest delivery in the video.
- Intimate and conversational.
- Final thought should feel earned, not announced as an ending.

Final idea:
`The point is that it should remain a choice.`
`Not a forgotten decision that keeps making itself.`

First sentence: calm.
Second sentence: slower.
Final word: do not punch it.

After the final word: clean silence and hard stop.

## Beat-level direction rules for the agent

1. Do not apply one mood to an entire chapter.
2. Within every 20–45 seconds, vary at least one of pace, pause length, emphasis, vocal warmth, intensity, pitch movement, or conversational distance.
3. Keep those changes subtle enough to feel like a single human performance.
4. Never increase emotion beyond what the story justifies.
5. Hooks, reveals, numbers, reversals, legal outcomes, and the callback should receive differentiated treatment.
6. Preserve the existing `tools/voice.py` cache/fingerprint behavior, deterministic seed, and reference-voice cloning.
7. Do not replace the existing Chatterbox implementation with another TTS engine.
8. Do not globally override `exaggeration` or `cfg_weight` for the full episode unless explicitly testing a controlled alternative.
9. Use `holdAfter` for planned silence after beats.
10. The voice is the guide; the information is the drama.

## Quality checkpoints

Before accepting the generated voice, inspect at least:

- 0:00–0:40
- 0:40–1:35
- 3:10–3:35
- 5:00–6:30
- 6:30–8:35
- 9:45–10:55
- 10:55–13:20
- 13:20–15:15
- 15:15–17:35
- 17:35–19:14

Reject/re-read any section that is:

- uniformly expressive
- obviously preset-driven
- rushed around numbers
- theatrical during factual/legal passages
- flat during a reveal
- missing the intended silence after a major beat
- inconsistent with the voice identity established at the beginning

## Pipeline command order

The intended Finance-mode voice path is:

`script.md → story:gate → voice → align`

Only after the voice passes inspection should the episode continue to `direct → gate → lint → render`.
