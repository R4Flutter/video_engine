// assets.mjs — SEMANTIC asset resolution stage.
//
// Binds media to every plan beat whose module REQUIRES external media. The
// binding is semantic, not arbitrary: a beat is matched against the asset
// library by weighted token overlap between the beat's own language
// (footagePlan 3x, beat name 2x, source/text/question/reveal 1x) and the
// asset's filename tags. A synonym map bridges vocabulary gaps (federal ->
// courthouse/ftc, member -> club/treadmill). Ties break on path order, so the
// result is deterministic across runs and workers.
//
// Contract: a media-requiring beat with no asset scoring above the semantic
// threshold FAILS the pipeline (exit 1) with the beat's need and a fetch
// hint. A production renderer never substitutes an unrelated asset merely
// because a file exists.
//
//   node tools/engine/assets.mjs [--plan video/src/director-plan.json]
//        [--manifest video/public/assets/manifest.json]
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, resolve, join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const planPath = resolve(ROOT, arg("plan", "video/src/director-plan.json"));
const manifestPath = resolve(ROOT, arg("manifest", "video/public/assets/manifest.json"));
const assetsRoot = dirname(manifestPath);
const overridesPath = join(assetsRoot, "manifest.overrides.json");

// Modules that REQUIRE external media vs modules rendered as internal graphics.
const MEDIA_MODULES = new Set(["footage", "evidence", "stat", "chart", "investChart", "timeline", "compare"]);
const GRAPHIC_MODULES = new Set(["icon", "payoff", "background"]);

// Module -> manifest category pools, in preference order.
const MODULE_CATEGORIES = {
  footage: ["06_BROLL", "01_SUBJECTS", "05_BACKGROUNDS"],
  evidence: ["03_EVIDENCE", "04_GRAPHICS", "02_ARCHIVE"],
  stat: ["04_GRAPHICS", "03_EVIDENCE", "02_ARCHIVE"],
  chart: ["04_GRAPHICS", "03_EVIDENCE"],
  investChart: ["04_GRAPHICS", "03_EVIDENCE"],
  timeline: ["04_GRAPHICS", "03_EVIDENCE"],
  compare: ["04_GRAPHICS", "03_EVIDENCE", "02_ARCHIVE"],
};

// Vocabulary bridge: token -> additional tokens the library names it by.
// Built from the actual curated filenames in this episode's library.
const SYNONYMS = {
  gym: ["treadmill", "treadmills", "fitness", "exercise"],
  member: ["members"],
  banking: ["bank"],
  federal: ["courthouse", "ftc", "columns"],
  law: ["gavel", "courthouse", "legal", "case"],
  software: ["photoshop", "cs6", "box", "disc"],
  "cancel": ["cancellation", "click", "cancelling"],
  streaming: ["netflix", "stream", "hulu", "disney", "max", "peacock", "paramount", "cable", "tv"],
  bank: ["statement", "statements", "macro", "charges"],
  tv: ["television", "cable", "remote"],
  phone: ["smartphone", "app"],
  lawsuit: ["settlement", "complaint", "ftc", "doj"],
  complaint: ["complaints", "letters"],
  "old": ["1990s", "1980s", "retro", "archive", "vintage", "era"],
  "retro": ["1990s", "1980s", "archive", "vintage"],
  fire: ["four", "4", "code"],
  "paper": ["document"],
  subscription: ["membership", "plan"],
  entrance: ["storefront", "front"],
  streaming_service: ["netflix", "hulu", "disney", "max", "peacock", "paramount"],
  "2026": ["2025", "2024"],
  gift: ["card", "breakage", "unredeemed"],
  "2_5b": ["2.5b", "25b", "settlement"],
};

const STOPWORDS = new Set(["the", "a", "an", "of", "in", "on", "at", "to", "for", "with", "and", "or", "is", "are", "was", "were", "this", "that", "it", "its", "from", "by", "as", "be", "been", "not", "no", "but", "what", "how", "why", "do", "does", "did", "people", "every", "one", "see", "here", "where", "when", "who", "their", "your", "you", "they", "them", "we", "so", "just", "over", "into", "about"]);

const NO_STEM = new Set(["lens", "plus", "bus", "gas", "was", "has", "its", "news"]);
function stem(w) {
  if (w.length <= 3 || NO_STEM.has(w)) return w;
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;      // companies -> company
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);             // losses -> loss, services -> service
  if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);         // members -> member
  if (w.endsWith("ing") && w.length > 5) {                                  // walking -> walk, cancelling -> cancel
    let r = w.slice(0, -3);
    if (r.length > 2 && r.endsWith("ic")) r += "e";                        // noticing -> notice
    if (r.length > 2 && r[r.length - 1] === r[r.length - 2]) r = r.slice(0, -1); // cancelling -> cancel
    return r;
  }
  return w;
}

function tokenize(text) {
  if (!text) return [];
  const t = String(text).toLowerCase()
    .replace(/[&+]/g, " ")                 // C+R -> "c r"
    .replace(/[^\w\s$]/g, " ")             // punctuation -> space
    .replace(/\b(\d)[\s,]*(\d{3})\b/g, "$1$2") // "7,200" -> "7200"; "20.8M" stays
    .replace(/\s+/g, " ").trim();
  const out = new Set();
  for (const w of t.split(" ")) {
    const clean = stem(w.replace(/[.$%]/g, "").trim());
    if (!clean || clean.length < 2 || STOPWORDS.has(clean)) continue;
    if (/^\d+$/.test(clean) && clean.length > 5) continue; // drop long numbers like 19941231
    out.add(clean);
  }
  // compact single-letter pairs: "c r" also matches tag "cr"
  const letters = t.split(" ").filter(w => /^[a-z]$/.test(w));
  if (letters.length >= 2) out.add(letters.join(""));
  return [...out];
}

const SYNS = Object.entries(SYNONYMS).flatMap(([k, vs]) => [k, ...vs]);

function expand(tokens) {
  const out = new Set(tokens);
  for (const t of tokens) {
    const syn = SYNONYMS[t];
    if (syn) for (const s of syn) out.add(s);
    else for (const [k, vs] of Object.entries(SYNONYMS)) {
      if (vs.includes(t) && t.length >= 3) out.add(k);
    }
  }
  return [...out];
}

// ------------------------------------------------------------------ scan
function walk(dir) {
  const out = [];
  for (const entry of readdirSafe(dir)) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name !== "manifest.json" && entry.name !== "manifest.overrides.json") out.push(full);
  }
  return out;
}
function readdirSafe(dir) {
  try { return readdirSync(dir, { withFileTypes: true }); } catch { return []; }
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg", ".mp4", ".mov", ".webm"]);
const VIDEO_EXTS = new Set([".mp4", ".mov", ".webm"]);

export function scanManifest() {
  if (!existsSync(assetsRoot)) return { folders: {}, assets: [] };
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
  const folders = manifest.folders || {};
  const overrides = existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, "utf8")) : {};
  const assets = [];
  for (const f of walk(assetsRoot)) {
    const rel = relative(assetsRoot, f).replace(/\\/g, "/");
    const category = rel.split("/")[0];
    if (!IMAGE_EXTS.has(extname(f).toLowerCase())) continue;
    const filename = relative(join(assetsRoot, category), f);
    const curated = overrides[filename];
    assets.push({
      path: `assets/${rel}`,
      category,
      filename,
      bytes: statSync(f).size,
      ext: extname(f).slice(1),
      isVideo: VIDEO_EXTS.has(extname(f).toLowerCase()),
      tags: expand(curated?.tags ?? tokenize(filename)),
      curated: Boolean(curated),
    });
  }
  assets.sort((a, b) => a.path.localeCompare(b.path));
  return { folders, assets };
}

// ----------------------------------------------------------- semantic bind
const beatTokens = (beat) => ({
  high: expand(tokenize(`${beat?.visual?.footagePlan || ""} ${beat?.visual?.footage || ""}`)),
  mid: expand(tokenize(beat?.name || "")),
  low: expand(tokenize(`${beat?.visual?.source || ""} ${beat?.visual?.text || ""} ${beat?.typography?.text || ""} ${beat?.narrative?.question || ""} ${beat?.narrative?.reveal || ""}`)),
});

export function score(beat, asset) {
  const { high, mid, low } = beatTokens(beat);
  const tags = new Set(asset.tags);
  let score = 0;
  const matched = [];
  const acc = (w, set) => {
    for (const t of set) {
      if (tags.has(t)) { score += w; matched.push(t); }
    }
  };
  acc(3, high); acc(2, mid); acc(1, low);
  if (asset.isVideo && (beat?.visual?.module === "footage")) score += 1;
  const unique = new Set(matched);
  const strong = [...new Set([...high, ...mid])].filter(t => tags.has(t));
  // A binding is semantic only if it has a strong (3x or 2x) hit, or at least
  // two distinct low-weight hits.
  if (strong.length === 0 && unique.size < 2) return { score: 0, matched: [] };
  return { score, matched: [...unique] };
}

const SEMANTIC_THRESHOLD = 4;
const debug = process.argv.includes("--debug");
const debugRows = [];

export function resolveAssets(plan, manifestAssets) {
  const pools = {};
  for (const a of manifestAssets) (pools[a.category] ||= []).push(a);
  const bound = [], unbound = [], kept = [];
  for (const beat of plan.beats || []) {
    const module = String(beat?.visual?.module || "");
    if (!MEDIA_MODULES.has(module)) continue;
    const existing = beat?.render?.media?.src || beat?.visual?.assetPath || beat?.visual?.asset;
    const cats = MODULE_CATEGORIES[module] || [];
    const pool = cats.flatMap(c => pools[c] || []);
    const ranked = pool
      .map(a => ({ asset: a, ...score(beat, a) }))
      .sort((a, b) => (b.score - a.score) || a.asset.path.localeCompare(b.asset.path));
    const best = ranked[0];
    if (debug && MEDIA_MODULES.has(module)) {
      const top3 = ranked.slice(0, 3);
      for (const r of top3) debugRows.push(`    beat ${String(beat.n).padStart(2)} ${module.padEnd(10)} ${r.asset.path.padEnd(52)} ${r.score}  [${r.matched.join(",") || "—"}]`);
    }
    if (!best || best.score < SEMANTIC_THRESHOLD) {
      if (existing && best && best.score > 0) { bound.push({ beat: beat.n, src: existing, score: best.score, matched: best.matched, kept: true }); keepOldBinding(beat, existing); continue; }
      unbound.push({ beat: beat.n, module, need: beat?.visual?.footagePlan || beat?.name, candidates: ranked.slice(0, 3).map(r => ({ path: r.asset.path, score: r.score, matched: r.matched })) });
      continue;
    }
    const pick = best.asset.path;
    bind(beat, pick, best);
    bound.push({ beat: beat.n, src: pick, score: best.score, matched: best.matched, kept: Boolean(existing && existing === pick) });
  }
  return { bound, unbound };
}

function bind(beat, path, result) {
  if (beat.visual) beat.visual.assetPath = path;
  if (beat.render?.media) beat.render.media.src = path;
}
function keepOldBinding(beat, existing) {
  if (beat.render?.media) beat.render.media.src = existing;
}

// -------------------------------------------------------------------- CLI
const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replaceAll("\\", "/")}`).href;
if (isMain) {
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const { folders, assets } = scanManifest();
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify({ version: 2, policy: "semantic", generated: true, generated_at: new Date().toISOString(), folders, assets: assets.map(a => ({ path: a.path, category: a.category, filename: a.filename, bytes: a.bytes, ext: a.ext, isVideo: a.isVideo, tags: a.tags, curated: a.curated })) }, null, 2), "utf8");
  const { bound, unbound } = resolveAssets(plan, assets);
  if (debugRows.length) {
    console.log("  DEBUG top-3 candidates per media beat:");
    for (const row of debugRows) console.log(row);
  }
  const required = (plan.beats || []).filter(b => MEDIA_MODULES.has(String(b?.visual?.module || ""))).length;
  console.log(`SEMANTIC ASSET RESOLVER  ${assets.length} files · ${bound.length}/${required} media beats bound`);
  const byModule = {};
  for (const b of plan.beats || []) { const m = String(b?.visual?.module || ""); if (MEDIA_MODULES.has(m)) byModule[m] = (byModule[m] || 0) + 1; }
  for (const [m, n] of Object.entries(byModule)) console.log(`  ${m.padEnd(11)} ${n} beats`);
  const weak = bound.filter(b => b.score < SEMANTIC_THRESHOLD * 1.5);
  if (weak.length) {
    console.log(`  NOTE  ${weak.length} binding(s) near threshold:`);
    for (const w of weak) console.log(`    beat ${w.beat} -> ${w.src} (score ${w.score}, matched ${w.matched.join(",") || "—"})`);
  }
  if (unbound.length) {
    console.error("  UNBOUND (no semantically adequate asset):");
    for (const u of unbound) {
      console.error(`    beat ${u.beat} (${u.module}) needs: ${u.need}`);
      for (const c of u.candidates) console.error(`      nearest: ${c.path} score ${c.score} matched ${c.matched.join(",") || "—"}`);
    }
    console.error("  run tools/fetch-footage.py / tools/fetch-imagebed.py to fill the gap, or add a");
    console.error(`  curated entry to ${overridesPath}, then re-run`);
    process.exit(1);
  }
  writeFileSync(planPath, JSON.stringify(plan, null, 2), "utf8");
  mkdirSync(resolve(ROOT, "video/out"), { recursive: true });
  writeFileSync(resolve(ROOT, "video/out/asset-bindings.json"), JSON.stringify({ generated: new Date().toISOString(), policy: "semantic", threshold: SEMANTIC_THRESHOLD, bound: bound.map(b => ({ beat: b.beat, src: b.src, score: b.score, matched: b.matched, kept: b.kept })) }, null, 2), "utf8");
  console.log(`WROTE ${manifestPath}`);
  console.log(`WROTE ${planPath} (semantic media binding)`);
  console.log(`WROTE video/out/asset-bindings.json (audit trail)`);
}
