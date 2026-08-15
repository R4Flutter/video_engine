/**
 * Checks the pose table against the arm it has to be performed by.
 *
 *     npm run rig            # every pose, with its reach and elbow swing
 *     npm run rig -- --plan  # the gesture track this episode would get
 *
 * A pose is written as two hand positions and looked at as a drawing, and the
 * gap between those two things is where the bugs live. A hand 80 units from a
 * shoulder with 300 units of arm attached is a perfectly reasonable pair of
 * numbers and an unusable picture. This prints the numbers that decide which
 * it is, so a pose can be rejected before a render rather than after one.
 *
 * Reads the TypeScript sources directly by regex rather than importing them —
 * a check that needs a bundler to run is a check nobody runs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "video/src/stickman");

const rigSrc = fs.readFileSync(path.join(SRC, "constants.ts"), "utf8");
const num = (re, fallback) => {
  const m = rigSrc.match(re);
  return m ? Number(m[1]) : fallback;
};

const SHOULDER_SPAN = num(/shoulderSpan:\s*(\d+)/, 80);
const CHEST_X = num(/chest:\s*\{\s*x:\s*(\d+)/, 310);
const CHEST_Y = num(/chest:\s*\{\s*x:\s*\d+,\s*y:\s*(\d+)/, 245);
const UPPER = num(/arm:\s*\{\s*upper:\s*(\d+)/, 152);
const FORE = num(/arm:\s*\{\s*upper:\s*\d+,\s*fore:\s*(\d+)/, 148);
const BOX_W = num(/box:\s*\{\s*w:\s*(\d+)/, 620);
const HIP_Y = num(/hip:\s*\{\s*x:\s*\d+,\s*y:\s*(\d+)/, 539);

const TOTAL = UPPER + FORE;
/** Below this the solver foreshortens; past REACH it gives up and pulls the
 *  hand in, which silently moves a pose away from where it was written. */
const COMFORT = TOTAL * 0.62;
const REACH = TOTAL * 0.995;

const shoulders = {
  L: { x: CHEST_X - SHOULDER_SPAN, y: CHEST_Y },
  R: { x: CHEST_X + SHOULDER_SPAN, y: CHEST_Y },
};

/** How far off the straight shoulder-hand line the elbow ends up. */
function swing(d) {
  const total = TOTAL;
  const comfort = total * 0.62;
  const squash = d < comfort ? Math.max(0.55, d / comfort) : 1;
  const u = UPPER * squash;
  const f = FORE * squash;
  const reach = Math.min(d, (u + f) * 0.995);
  const a = (u * u - f * f + reach * reach) / (2 * reach);
  return { swing: Math.sqrt(Math.max(0, u * u - a * a)), squash };
}

const poseSrc = fs.readFileSync(path.join(SRC, "poses.ts"), "utf8");
const block = poseSrc.slice(poseSrc.indexOf("const SPECS"));
const re = /(\w+):\s*\{([^}]*?)handL:\s*v\((-?[\d.]+),\s*(-?[\d.]+)\)[^}]*?handR:\s*v\((-?[\d.]+),\s*(-?[\d.]+)\)/g;

let m;
let bad = 0;
const rows = [];
while ((m = re.exec(block)) !== null) {
  const [, name, , lx, ly, rx, ry] = m;
  for (const [side, hx, hy] of [["L", +lx, +ly], ["R", +rx, +ry]]) {
    const s = shoulders[side];
    const d = Math.hypot(hx - s.x, hy - s.y);
    const { swing: sw, squash } = swing(d);
    // Only two things make a pose unusable: a hand the arm cannot get to, and
    // a hand off the canvas. The rest is worth knowing and not worth failing
    // over — a wide elbow is sometimes exactly the drawing you wanted.
    const notes = [];
    let fatal = false;
    if (d > REACH) {
      notes.push(`out of reach by ${(d - REACH).toFixed(0)} — hand gets pulled in`);
      fatal = true;
    }
    if (hx < 6 || hx > BOX_W - 6) {
      notes.push("hand outside the box");
      fatal = true;
    }
    if (sw < 10) notes.push("straight, elbow invisible");
    if (sw > 80) notes.push("wide elbow");
    if (squash < 0.98) notes.push(`foreshortened x${squash.toFixed(2)}`);
    if (hy > HIP_Y + 60) notes.push("hand below the hip");
    if (fatal) bad += 1;
    rows.push({ name, side, d, sw, notes });
  }
}

if (process.argv.includes("--plan")) {
  const voice = JSON.parse(fs.readFileSync(path.join(ROOT, "video/src/voice.json"), "utf8"));
  const spoken = voice.beats.filter((b) => b.words?.length);
  const total = spoken.reduce(
    (s, b) => Math.max(s, b.start + b.words[b.words.length - 1].end),
    0,
  );
  console.log(
    `\n${spoken.length} takes, ${total.toFixed(1)}s of read.\n` +
      `Run the composition to see the plan; this flag only reports the read it\n` +
      `would be planned against.\n`,
  );
}

const w = Math.max(...rows.map((r) => r.name.length));
let last = "";
for (const r of rows) {
  const head = r.name === last ? "".padEnd(w) : r.name.padEnd(w);
  last = r.name;
  console.log(
    `${head} ${r.side}  reach ${r.d.toFixed(0).padStart(3)}/${TOTAL}` +
      `  elbow ${r.sw.toFixed(0).padStart(2)}` +
      (r.notes.length ? `   ${r.notes.join(", ")}` : ""),
  );
}
console.log(
  `\ncomfortable reach ${COMFORT.toFixed(0)}–${(TOTAL * 0.95).toFixed(0)}` +
    `, ${rows.length / 2} poses, ${bad} unusable`,
);
process.exit(bad ? 1 : 0);
