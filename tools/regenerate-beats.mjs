import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = JSON.parse(readFileSync(join(root, "video/src/script.json"), "utf8"));
const overlay = JSON.parse(readFileSync(join(root, "video/src/director.overlay.json"), "utf8"));

const mmss = (s) => {
  const total = Math.max(0, Math.round(s));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const ROWS = [
  ["Audio", "vo"],
  ["Visual", null],
  ["On-screen text", "text"],
  ["Module", "module"],
  ["Purpose", "purpose"],
  ["Question", "question"],
  ["Reveal", "reveal"],
  ["Emotion", "emotion"],
  ["Hook", "hook"],
  ["Loop", "loop"],
  ["Camera", "camera"],
  ["Music", "music"],
  ["Silence", "silence"],
  ["Sfx", "sfx"],
  ["Caption mode", "captionMode"],
  ["Reveal mode", "revealMode"],
  ["J-cut", "jcut"],
  ["L-cut", "lcut"],
];

const visualFor = (b) => {
  const kind = b.module || "footage";
  const desc = {
    footage: `B-roll: ${b.name || "scene"}`,
    evidence: "Document/evidence on paper background",
    stat: "One number, paper background",
    compare: "Two-sided contradiction card",
    chart: "Trend chart, paper background",
    investChart: "Rising line chart, paper background",
    timeline: "Chronological timeline",
    icon: "Icon card",
    payoff: "Closing payoff card",
  }[kind] ?? `Scene: ${b.name || "beat"}`;
  return desc;
};

const lines = [];
lines.push(`# ${script.title}`);
lines.push(``);
lines.push(`**Style:** Documentary — faceless long-form finance`);
lines.push(``);
lines.push(`**Format:** Landscape 16:9`);
lines.push(``);

for (const b of script.beats) {
  lines.push(`### BEAT ${b.n} — ${b.name || `BEAT ${b.n}`} (${mmss(b.start)}–${mmss(b.end)})`);
  lines.push(``);
  const ov = overlay.beats?.[b.n] ?? {};
  const row = (label, value) => (value === undefined || value === null || value === "" ? null : lines.push(`| **${label}** | ${value} |`));
  row("Audio", b.vo);
  lines.push(`| **Visual** | ${visualFor(b)} |`);
  row("On-screen text", b.text);
  row("Module", b.module);
  row("Purpose", ov.purpose ?? b.purpose);
  row("Question", ov.question ?? b.question);
  row("Reveal", ov.reveal ?? b.reveal);
  row("Emotion", ov.emotion ?? b.emotion);
  row("Hook", ov.hook ?? b.hook);
  row("Loop", ov.loop ?? b.loop);
  row("Camera", ov.camera ?? b.camera);
  row("Music", ov.music ?? b.music);
  row("Silence", ov.silence ?? b.silence);
  row("Sfx", b.sfx);
  row("Caption mode", ov.captionMode ?? b.captionMode);
  row("Reveal mode", ov.revealMode ?? b.revealMode);
  row("J-cut", b.jcut);
  row("L-cut", b.lcut);
  lines.push(``);
}

const dst = join(root, "script_beats.md");
writeFileSync(dst, lines.join("\n"));
console.log(`WROTE ${dst} (${script.beats.length} beats)`);