import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const ASSETS = path.join(ROOT, 'video', 'public', 'assets');
const MANIFEST = path.join(ASSETS, 'manifest.json');
const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.mov']);

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { version: 1, policy: 'asset-first', generated: false, folders: {}, assets: [] };
const seen = new Map((manifest.assets ?? []).map((a) => [a.path, a]));
const folders = Object.values(manifest.folders ?? {});

for (const rel of folders) {
  const dir = path.join(ROOT, 'video', 'public', rel);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (!fs.statSync(abs).isFile() || !allowed.has(path.extname(name).toLowerCase())) continue;
    const assetPath = path.relative(path.join(ROOT, 'video', 'public'), abs).replaceAll('\\', '/');
    if (!seen.has(assetPath)) seen.set(assetPath, {
      id: path.basename(name, path.extname(name)),
      type: path.basename(rel),
      path: assetPath,
      originalName: name,
    });
  }
}

manifest.generated = false;
manifest.assets = [...seen.values()].sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`[assets] manifest rebuilt: ${manifest.assets.length} asset(s)`);
