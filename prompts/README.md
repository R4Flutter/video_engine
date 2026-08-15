# Asset Generation Prompts

This folder is the source-of-truth for the visual asset library used by `video_engine`.

Generate the assets yourself from these prompts, then place them under `video/public/assets/` using the IDs in `prompts/asset-manifest.template.json`.

The renderer is asset-first: supplied assets beat stock footage and generic graphics. The director chooses how to frame, crop, move and sequence an asset; it does not invent replacement media.

## Required asset families

1. `subjects/` — transparent hero objects, people, products, buildings, vehicles.
2. `archive/` — documentary-style historical/company imagery.
3. `documents/` — statements, filings, receipts, screenshots, newspaper/article-style evidence.
4. `graphics/` — maps, timelines, charts, diagrams, mechanisms.
5. `backgrounds/` — restrained texture-free plates and contextual environments.
6. `logos/` — clean transparent brand marks when legally appropriate.

## Generation rules

- Prefer 16:9 or square master images for landscape/long-form source use; create transparent PNGs only for isolated subjects.
- Keep important subject detail inside the safe area; never bake captions into the asset.
- Do not add fake statistics, fake logos, fake document text, fake signatures or fake UI unless the prompt explicitly calls for abstract placeholder evidence.
- One asset = one clear editorial job.
- Preserve consistent subject identity across variants.
- Use flat/editorial treatment only when the scene is a graphic; archival assets should look photographic and evidence-oriented.

## Naming

Use stable IDs. Examples:

`subjects/tesla-model-s-hero-right.png`
`subjects/founder-profile-right.png`
`archive/kodak-factory-1970s.jpg`
`documents/kodak-bankruptcy-filing.png`
`graphics/kodak-digital-camera-timeline.svg`

Do not rename an asset after wiring it into a script unless the manifest is updated.
