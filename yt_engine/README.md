# yt_engine → Editing Director

`yt_engine` supplies normalized editorial signals from finance/business/documentary references. It is a teacher, not a template.

Extract: hook structure, semantic visual-change cadence, evidence density, B-roll specificity, chapter/reset cadence, reveal placement, transition grammar, sound/silence behavior, and payoff/callback behavior.

The Director must never copy a reference video's exact wording, footage, music, graphics, sequence, or distinctive identity. Apply the underlying editorial function to the current story.

Expected input: `yt_engine/reference-patterns.json`, matching `video/src/director/longform-types.ts::ReferencePattern`.

Run:
`node tools/longform-director.mjs --script video/src/script.json --references yt_engine/reference-patterns.json`
