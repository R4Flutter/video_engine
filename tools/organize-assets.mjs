import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const VIDEO = path.join(ROOT, 'video');
const ASSETS = path.join(VIDEO, 'public', 'assets');
const INBOX = path.join(ASSETS, '00_INBOX');
const MANIFEST = path.join(ASSETS, 'manifest.json');

const buckets = {
  subject: '01_SUBJECTS',
  subjects: '01_SUBJECTS',
  person: '01_SUBJECTS',
  object: '01_SUBJECTS',
  archive: '02_ARCHIVE',
  archival: '02_ARCHIVE',
  evidence: '03_EVIDENCE',
  document: '03_EVIDENCE',
  screenshot: '03_EVIDENCE',
  graphic: '04_GRAPHICS',
  chart: '04_GRAPHICS',
  timeline: '04_GRAPHICS',
  background: '05_BACKGROUNDS',
  broll: '06_BROLL',
  footage: '06_BROLL',
  video: '06_BROLL',
  logo: '07_LOGOS',
  brand: '07_LOGOS',
  ui: '08_UI_MOCKUPS',
  mockup: '08_UI_MOCKUPS',
  map: '09_MAPS',
};

const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.mov']);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function classify(name) {
  const lower = name.toLowerCase();
  for (const [key, folder] of Object.entries(buckets)) {
    if (lower.includes(key)) return folder;
  }
  if (['.mp4', '.mov'].includes(path.extname(name).toLowerCase())) return '06_BROLL';
  return '02_ARCHIVE';
}

function uniqueDestination(folder, original) {
  const ext = path.extname(original).toLowerCase();
  const base = slug(path.basename(original, ext)) || 'asset';
  let candidate = `${base}${ext}`;
  let n = 2;
  while (fs.existsSync(path.join(ASSETS, folder, candidate))) candidate = `${base}_${n++}${ext}`;
  return candidate;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(p);
    return [p];
  });
}

for (const folder of Object.values(buckets)) fs.mkdirSync(path.join(ASSETS, folder), { recursive: true });
fs.mkdirSync(INBOX, { recursive: true });

const files = walk(INBOX).filter((p) => allowed.has(path.extname(p).toLowerCase()));
const moved = [];
for (const source of files) {
  const original = path.basename(source);
  const folder = classify(original);
  const filename = uniqueDestination(folder, original);
  const destination = path.join(ASSETS, folder, filename);
  fs.renameSync(source, destination);
  moved.push({
    id: path.basename(filename, path.extname(filename)),
    type: folder,
    path: `assets/${folder}/${filename}`,
    originalName: original,
  });
}

let manifest = { version: 1, policy: 'asset-first', generated: false, folders: {}, assets: [] };
if (fs.existsSync(MANIFEST)) {
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch {}
}
manifest.generated = false;
for (const a of moved) manifest.assets.push(a);
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`[assets] organized ${moved.length} file(s)`);
for (const a of moved) console.log(`  ${a.originalName} -> ${a.path}`);
console.log(`[assets] manifest: ${path.relative(VIDEO, MANIFEST)}`);
