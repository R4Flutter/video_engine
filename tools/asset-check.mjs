import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const ASSETS = path.join(ROOT, 'video', 'public', 'assets');
const MANIFEST = path.join(ASSETS, 'manifest.json');
const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.mov']);

if (!fs.existsSync(MANIFEST)) {
  console.error('[assets] manifest.json missing');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const declared = new Set((manifest.assets ?? []).map((a) => a.path));
const buckets = Object.values(manifest.folders ?? {});
let errors = 0;

for (const rel of buckets) {
  const dir = path.join(ROOT, 'video', 'public', rel);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (!fs.statSync(abs).isFile()) continue;
    const ext = path.extname(name).toLowerCase();
    if (!allowed.has(ext)) continue;
    if (name.toLowerCase() === 'readme.md') continue;
    const publicRel = `assets/${path.relative(dir, dir).replaceAll('\\', '/')}`;
    const assetPath = path.relative(path.join(ROOT, 'video', 'public'), abs).replaceAll('\\', '/');
    if (!declared.has(assetPath)) console.warn(`[assets] unregistered: ${assetPath}`);
  }
}

for (const asset of manifest.assets ?? []) {
  const abs = path.join(ROOT, 'video', 'public', asset.path.replace(/^assets[\\/]/, ''));
  if (!fs.existsSync(abs)) {
    console.error(`[assets] missing from disk: ${asset.path}`);
    errors++;
  }
}

console.log(`[assets] check complete — ${manifest.assets?.length ?? 0} registered asset(s)`);
if (errors) process.exit(1);
