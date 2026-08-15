# The stickman

A drawn presenter with real lip sync, for a `StickmanExplain` composition that
stages the same `script.json` as the other two engines.

## The pipeline

```
script.md ──parse──> script.json ──voice.py──> beat-N.wav
                                                   │
                                          align.py │ (faster-whisper)
                                                   ▼
                                              voice.json          word timings
                                                   │
                                       lipsync.mjs │ + the wavs
                                                   ▼
                                             visemes.json    mouth cues + loudness
```

`npm run align` now runs both halves, so the mouth can never be aligned to a
take the timings no longer match.

## The files

| file | what it decides |
| --- | --- |
| `../../../tools/lipsync.mjs` | words → phonemes → 10 visemes; loudness per beat |
| `rig.ts` | proportions, two-bone IK with pole vectors, the boiling line |
| `mouth.ts` | the 10 shapes as blendable numbers, and the path built from them |
| `gestures.ts` | the pose vocabulary, and inferring which pose a phrase wants |
| `Stickman.tsx` | draws all of the above |

## Checking it

```
npm run rig     # every pose's reach and elbow swing, before rendering anything
npm run lab     # the rig alone, 8 seconds, no page around it
```

`npm run rig` exists because a pose is written as coordinates and judged as a
drawing. It fails when a hand is somewhere the arm cannot reach, which
otherwise shows up as a silently relocated hand three minutes into a render.

## Writing a gesture by hand

Inference is a guess. A `Gesture:` note in the beat's `Motion:` or `Visual:`
row overrides it:

```
Motion: Gesture: point_up @0.4
```

Time is seconds into the beat and may be omitted. The pose name has to exist in
`POSES` or the note is ignored. Hand-written cues suppress inferred ones nearby
and feed the same anti-repetition penalties, so adding one does not produce two
gestures on top of each other.

## The two things worth knowing before changing anything

**Hand distance from the shoulder is the constraint.** The arm is 196 units.
Put a hand 80 away and the solver has 116 units of bone with nowhere to go; it
foreshortens, which works, but only down to about 108. Between 122 and 186 the
arm just looks like an arm. `npm run rig` prints this per pose.

**Gesture variety is a scoring problem, not a matching problem.** A finance
script mentions a number in nearly every phrase, so the naive "phrase has a
number → count on fingers" rule fires forty times and the character loops. The
inference subtracts for having used a pose recently and subtracts heavily for
using the one currently on screen. Adding a rule without thinking about that
will quietly flatten the whole track back to one gesture.
