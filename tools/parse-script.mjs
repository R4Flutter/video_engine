// script.md -> video/src/script.json
//
//   node tools/parse-script.mjs script.md video/src/script.json
//
// Reads the three timed tracks a script already contains:
//   section 2  BEAT blocks      -> what is on screen (module + narration)
//   section 4  TEXT TIMING      -> the big overlay track
//   section 5  SOUND DESIGN     -> the sfx track
// Anything the script does not say is inferred from its own keywords, so a new
// script.md in the same shape needs zero code changes.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [src = "script.md", dst = "video/src/script.json"] = process.argv.slice(2);
const md = readFileSync(src, "utf8");

const secs = (mmss) => {
  const [m, s] = mmss.split(":").map(Number);
  return m * 60 + s;
};
const clean = (s) => s.replace(/\*\*/g, "").replace(/^["“]|["”]$/g, "").trim();

// ---------------------------------------------------------------- beats
const BEAT_RE =
  /^###\s+BEAT\s+(\d+)\s+—\s+(.+?)\s+\((\d+:\d+)[–-](\d+:\d+)\)\s*$/gm;

// First match wins, so the most specific visual goes first.
const MODULES = [
  [/thumbs up|calms|looks at the viewer/i, "outro"],
  [/climb|on top of|towers|payoff/i, "payoff"],
  [/mountain|mound|mountain grows/i, "mountain"],
  [/overflow|badge|jar fills/i, "jarFill"],
  [/chart|rising line|line draws/i, "investChart"],
  [/stack|calendar/i, "coinStack"],
  [/coin drops|empty jar/i, "coinDrop"],
];

const beats = [];
for (const m of md.matchAll(BEAT_RE)) {
  const block = md.slice(m.index + m[0].length).split(/\n### |\n## /)[0];
  const rows = {};
  for (const r of block.matchAll(/^\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*$/gm)) {
    rows[r[1].toLowerCase()] = clean(r[2]);
  }
  const visual = rows["visual"] ?? "";
  beats.push({
    n: Number(m[1]),
    name: m[2],
    start: secs(m[3]),
    end: secs(m[4]),
    vo: rows["audio"] ?? "",
    visual,
    motion: rows["motion fx"] ?? "",
    module:
      rows["module"] ??
      (MODULES.find(([re]) => re.test(visual))?.[1] ?? "coinDrop"),
  });
}
if (!beats.length) throw new Error(`no "### BEAT n — NAME (m:ss–m:ss)" blocks in ${src}`);

// ---------------------------------------------------------------- overlay text
const ANIMS = [
  [/slam|punch/i, "slam"],
  [/count.?up/i, "count"],
  [/type/i, "type"],
  [/wipe/i, "wipe"],
  [/pop/i, "pop"],
  [/fade|line by line/i, "fade"],
];

// Cells of every "| m:ss | ... |" row under a heading. Row-at-a-time because a
// single regex lets \s* swallow the newline and pair two rows into one match.
const table = (heading) => {
  const start = md.indexOf(heading);
  if (start < 0) return [];
  return md
    .slice(start)
    .split(/\n---/)[0]
    .split("\n")
    .filter((line) => /^\|\s*\d+:\d+\s*\|/.test(line))
    .map((line) =>
      line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()),
    );
};

const texts = table("## 4. TEXT TIMING TABLE").map((c) => ({
  at: secs(c[0]),
  text: clean(c[1]),
  anim: ANIMS.find(([re]) => re.test(c[2] ?? ""))?.[1] ?? "pop",
}));

// ---------------------------------------------------------------- sfx
const SOUNDS = [
  [/deep boom/i, ["boom.wav", "shimmer.wav"]],
  [/rising whoosh|rising tone/i, ["whoosh-up.wav"]],
  [/rapid coin drops|stacking/i, ["coin-soft.wav"]],
  [/notification|follow/i, ["pop.wav"]],
  [/rolling digits|chime/i, ["chime.wav"]],
  [/coin clink|clink/i, ["coin.wav"]],
  [/whoosh/i, ["whoosh.wav"]],
  [/warm|calm/i, ["chime-warm.wav"]],
];

const sfx = [];
for (const c of table("## 5. SOUND DESIGN")) {
  const at = secs(c[0]);
  const files = new Set();
  for (const part of c[1].split(/[,+]/)) {
    const hit = SOUNDS.find(([re]) => re.test(part));
    if (hit) hit[1].forEach((f) => files.add(f));
  }
  if (files.size) sfx.push({ at, files: [...files] });
}

const meta = md.match(/\*\*Caption Hook:\*\*\s*"?(.+?)"?\s*$/m);
const out = {
  source: src,
  title: (md.match(/^#\s+(.+)$/m)?.[1] ?? "video").trim(),
  fps: 30,
  width: 1080,
  height: 1920,
  durationInSeconds: Math.max(...beats.map((b) => b.end)),
  caption: meta?.[1] ?? "",
  beats,
  texts,
  sfx,
};

writeFileSync(dst, JSON.stringify(out, null, 2));

// ---------------------------------------------------------------- voice stub
// The engine reads word timings from voice.json. Until a take exists there is
// nothing to read, so write the script's own timing with the words spread
// evenly — the video still builds and still captions, it just has no narrator.
// `tools/align.py` overwrites this with what the recording actually did.
const voice = join(dirname(dst), "voice.json");
writeFileSync(
  voice,
  JSON.stringify(
    {
      total: out.durationInSeconds,
      beats: beats.map((b) => {
        const words = b.vo.split(/\s+/).filter(Boolean);
        const step = (b.end - b.start) / Math.max(1, words.length);
        return {
          n: b.n,
          file: "", // no recording yet
          start: b.start,
          dur: b.end - b.start,
          speech: b.end - b.start,
          words: words.map((w, i) => ({
            w,
            start: Number((i * step).toFixed(3)),
            end: Number(((i + 1) * step).toFixed(3)),
          })),
        };
      }),
    },
    null,
    2,
  ),
);

console.log(
  `${dst}\n  ${out.durationInSeconds}s · ${beats.length} beats · ` +
    `${texts.length} overlays · ${sfx.length} sfx cues\n  modules: ` +
    beats.map((b) => b.module).join(" → "),
);
