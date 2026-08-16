# Worst-video adversarial case

This branch intentionally replaces `video/src/script.json` with a pathological
but schema-valid script. `main` is untouched.

The fixture is designed to produce a terrible edit while satisfying several
high-level story heuristics:

- 45 seconds of essentially one visual language (`kinetic` for every beat)
- identical `hold` camera intent on every beat
- no B-roll, footage, icons, charts, data, or meaningful visual changes
- no SFX/music declarations
- generic narration and on-screen copy that are deliberately disconnected from
  the normal episode assets
- eight beats so the story gate can still see a hook, questions, reveals,
  escalation, a turn, and a payoff
- the branch deliberately keeps the original `voice.json`, creating a
  narration/caption mismatch as an additional stress case

Run the normal checks from `video/`:

```bash
npm run story:gate
npm run qc -- --strict
```

Then render:

```bash
npm run render:vox
```

The important test is not whether rendering succeeds. It is whether a visibly
awful result can pass the pre-render gates. `VisualQC` currently marks repeated
modules as MED warnings rather than blockers, and `qc.mjs --strict` blocks only
FATAL findings. That means this branch is specifically testing whether the
system can be fooled by a bad edit that looks structurally valid on paper.
