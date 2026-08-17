#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VIDEO = path.join(ROOT, "video");
const manifestPath = path.join(VIDEO, "src", "shorts-manifest.json");
const voicePath = path.join(VIDEO, "src", "voice.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const voice = fs.existsSync(voicePath) ? JSON.parse(fs.readFileSync(voicePath, "utf8")) : { beats: [] };
const byN = new Map((voice.beats ?? []).map((b) => [Number(b.n), b]));

for (const short of manifest.shorts ?? []) {
  for (const beat of short.beats) {
    const v = byN.get(Number(beat.n));
    beat.audio = `audio/vo/beat-${beat.n}.wav`;
    beat.words = (v?.words ?? []).map((w) => ({
      w: String(w.w ?? ""),
      start: Number((beat.start + Number(w.start ?? 0)).toFixed(3)),
      end: Number((beat.start + Number(w.end ?? 0)).toFixed(3)),
    }));
  }
}
manifest.generatedAt = new Date().toISOString();
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`SHORTS ENGINE  enriched ${manifest.shorts?.length ?? 0} shorts with VO timing`);
