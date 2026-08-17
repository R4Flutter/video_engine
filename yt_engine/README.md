# yt_engine → Editing Director contract

`yt_engine` is the reference-analysis layer, not the editor. It must never copy a creator's footage, script, wording, or proprietary style. It extracts reusable editorial patterns from finance/business/documentary references.

## Required output

Write `yt_engine/reference-patterns.json` as an array of records matching `video/src/director/longform-types.ts::ReferencePattern`.

Each reference should contain only normalized signals:

- hook type and time-to-first-concrete-idea
- semantic visual-change cadence
- evidence density
- B-roll specificity
- chapter/reset cadence
- reveal placement
- transition grammar
- music/silence behavior
- payoff/callback behavior

## Director usage

Run:

```text
node tools/longform-director.mjs --script video/src/script.json --references yt_engine/reference-patterns.json
```

The director uses reference patterns as **priors**, never as commands. The story, evidence, available assets, and hand-written editorial direction always outrank reference averages.

## Non-negotiable anti-copy rule

Do not reproduce a reference video's exact sequence, wording, shots, music, graphics, or distinctive visual identity. Extract the underlying editorial function and apply it to the current story.

## Production principle

The useful signal is not "this video cuts every 2.7 seconds." The useful signal is "the editor changes the viewer's information state approximately every few seconds, and longer holds contain staged discovery." That distinction prevents the engine from becoming a template generator.
