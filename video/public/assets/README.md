# PRODUCTION ASSET WORKSPACE

This folder is the **only asset workspace the renderer reads**.

## Daily workflow

```text
1. Generate assets from /prompts
2. Drop EVERYTHING into 00_INBOX
3. Run: npm run assets:organize
4. Run: npm run assets:check
5. Render
```

You do not need to manually sort files every day.

## Folder map

```text
assets/
├── 00_INBOX/          ← YOU WORK HERE
├── 01_SUBJECTS/       ← transparent people / cars / products / objects
├── 02_ARCHIVE/        ← archival photos / historical imagery / real-world stills
├── 03_EVIDENCE/       ← documents / filings / receipts / screenshots
├── 04_GRAPHICS/       ← charts / maps / diagrams / timelines / data plates
├── 05_BACKGROUNDS/    ← environments / desks / rooms / editorial plates
├── 06_BROLL/          ← supplied video clips
├── 07_LOGOS/          ← logos / marks / brand identity assets
├── 08_UI_MOCKUPS/     ← apps / dashboards / screens / device mockups
├── 09_MAPS/           ← geographic visuals
└── 90_ARCHIVE_OLD/    ← intentionally retained legacy material; NEVER render from here
```

## What the engine does

The editor chooses the visual job, asset class, shot size, composition, crop, camera movement and timing. Your assets remain the visual source of truth.

Missing assets are **not silently replaced with random stock**.

## Asset quality

Use 1080p+ imagery for normal full-frame use. Use transparent PNG/WebP for subjects and logos. Use SVG for simple charts/diagrams where practical. Keep video plates short and purposeful.

For exact naming guidance and generation prompts, use `/prompts`.

The manifest lives at `assets/manifest.json` and is rebuilt by `npm run assets:manifest`.
