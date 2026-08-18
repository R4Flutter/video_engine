// assets.mjs — production asset resolution stage.
//
// Scans video/public/assets/** into the asset manifest, then binds the best
// matching media to every plan beat whose module REQUIRES external media.
// Binding is deterministic (stable hash of beat number into the sorted pool)
// so every re-run and every worker agrees. Graphical modules (icon, payoff,
// backgrounds) need no external media and are left untouched.
//
// Hard contract: a beat with a media-requiring module MUST end up with a
// resolvable src. If any cannot be satisfied, this stage exits 1 before the
// renderer can run — a hollow scene can never silently pass.
//
//   node tools/engine/assets.mjs [--plan video/src/director-plan.json]
//        [--manifest video/public/assets/manifest.json]
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const planPath = resolve(ROOT, arg("plan", "video/src/director-plan.json"));
const manifestPath = resolve(ROOT, arg("manifest", "video/public/assets/manifest.json"));
const assetsRoot = dirname(manifestPath);

// Modules that REQUIRE external media vs modules rendered as internal graphics.
const MEDIA_MODULES = new Set(["footage", "evidence", "stat", "chart", "investChart", "timeline", "compare"]);
const GRAPHIC_MODULES = new Set(["icon", "payoff", "background"]);

// Module -> manifest category pools, in preference order.
const MODULE_CATEGORIES = {
  footage: ["06_BROLL", "01_SUBJECTS", "05_BACKGROUNDS"],
  evidence: ["03_EVIDENCE", "06_BROLL", "04_GRAPHICS"],
  stat: ["03_EVIDENCE", "04_GRAPHICS"],
  chart: ["03_EVIDENCE", "04_GRAPHICS"],
  investChart: ["03_EVIDENCE", "04_GRAPHICS"],
  timeline: ["03_EVIDENCE", "04_GRAPHICS"],
  compare: ["03_EVIDENCE", "04_GRAPHICS"],
};

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name !== "manifest.json") out.push(full);
  }
  return out;
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg", ".mp4", ".mov", ".webm"]);

export function scanManifest() {
  if (!existsSync(assetsRoot)) return { folders: {}, assets: [] };
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
  const folders = manifest.folders || {};
  const assets = [];
  for (const f of walk(assetsRoot)) {
    const rel = relative(assetsRoot, f).replace(/\\/g, "/");
    const category = rel.split("/")[0];
    if (!IMAGE_EXTS.has(extname(f).toLowerCase())) continue;
    assets.push({ path: `assets/${rel}`, category, filename: relative(join(assetsRoot, category), f), bytes: statSync(f).size, ext: extname(f).slice(1) });
  }
  assets.sort((a, b) => a.path.localeCompare(b.path));
  return { folders, assets };
}

const hash = n => (Math.imul(Number(n) * 2654435761, 2654435761) >>> 0);

export function resolveAssets(plan, manifestAssets) {
  const pools = {};
  for (const a of manifestAssets) (pools[a.category] ||= []).push(a);
  const bound = [], unbound = [];
  for (const beat of plan.beats || []) {
    const module = String(beat?.visual?.module || "");
    if (!MEDIA_MODULES.has(module)) continue;
    const existing = beat?.render?.media?.src || beat?.visual?.assetPath || beat?.visual?.asset;
    if (existing) { bound.push(beat.n); continue; }
    const cats = MODULE_CATEGORIES[module] || [];
    const pool = cats.flatMap(c => pools[c] || []).filter(a => a.path.endsWith(".jpg") || a.path.endsWith(".jpeg") || a.path.endsWith(".png") || a.path.endsWith(".webp") || a.path.endsWith(".mp4") || a.path.endsWith(".webm") || a.path.endsWith(".mov"));
    if (!pool.length) { unbound.push(beat.n); continue; }
    const pick = pool[hash(beat.n) % pool.length];
    if (beat.visual) beat.visual.assetPath = pick.path;
    if (beat.render?.media) beat.render.media.src = pick.path;
    bound.push(beat.n);
  }
  return { bound, unbound };
}

// -------------------------------------------------------------------- CLI
const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replaceAll("\\", "/")}`).href;
if (isMain) {
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const { folders, assets } = scanManifest();
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify({ version: 1, policy: "asset-first", generated: true, generated_at: new Date().toISOString(), folders, assets }, null, 2), "utf8");
  const { bound, unbound } = resolveAssets(plan, assets);
  const required = (plan.beats || []).filter(b => MEDIA_MODULES.has(String(b?.visual?.module || ""))).length;
  console.log(`ASSET RESOLVER  ${assets.length} files in manifest · ${bound.length}/${required} media beats bound`);
  const byModule = {};
  for (const b of plan.beats || []) { const m = String(b?.visual?.module || ""); if (MEDIA_MODULES.has(m)) byModule[m] = (byModule[m] || 0) + 1; }
  for (const [m, n] of Object.entries(byModule)) console.log(`  ${m.padEnd(11)} ${n} beats`);
  if (unbound.length) {
    console.error(`  UNBOUND media beats: ${unbound.join(", ")}`);
    console.error("  run tools/fetch-footage.py / tools/fetch-imagebed.py to fill the pools, then re-run");
    process.exit(1);
  }
  writeFileSync(planPath, JSON.stringify(plan, null, 2), "utf8");
  console.log(`WROTE ${manifestPath}`);
  console.log(`WROTE ${planPath} (media bound)`);
}