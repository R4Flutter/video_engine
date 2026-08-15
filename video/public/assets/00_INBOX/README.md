# 00_INBOX — DAILY DROP ZONE

This is the only folder you should need to touch every day.

Drop the generated images / videos for the current episode here.

Do not rename files while generating them. The organizer can normalize names and move assets into the production library.

Daily workflow:

1. Generate assets from `/prompts`.
2. Put everything into `00_INBOX`.
3. Run `npm run assets:organize` from `video/`.
4. The organizer moves files into the correct library bucket and writes the manifest.
5. The renderer uses only the production asset library.

Accepted: `.png`, `.jpg`, `.jpeg`, `.webp`, `.mp4`, `.mov`.
