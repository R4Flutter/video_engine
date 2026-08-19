// rename-gallery2.mjs — last frame + prompt + rename for all clips.
//   node tools/rename-gallery2.mjs [port]
import { createServer } from "node:http";
import { readFileSync, readdirSync, existsSync, renameSync, statSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CLIPS = join(ROOT, "whiteboard_clips");
const FRAMES = join(CLIPS, "match_frames");
const PROMPTS = join(ROOT, "prompt_whiteboard_animations_images");
const PORT = Number(process.argv[2] ?? 8766);

// Load beat prompts (67 files, 165 prompts)
const prompts = []; // {beat, pnum, text}
for (let bn = 1; bn <= 67; bn++) {
  const file = readdirSync(PROMPTS).find(f => f.startsWith(`beat_${String(bn).padStart(2, "0")}_`) && f.endsWith(".md"));
  if (!file) continue;
  const paras = readFileSync(join(PROMPTS, file), "utf8").split(/\r?\n\r?\n/).map(s => s.trim()).filter(Boolean);
  paras.forEach((p, i) => prompts.push({ beat: bn, pnum: i + 1, text: p }));
}

const videos = readdirSync(CLIPS).filter(f => extname(f) === ".mp4").sort();

const PAGE = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Whiteboard Clip Renamer v2</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;background:#111;color:#eee;margin:0;padding:20px}
h1{font-size:20px;margin:0 0 2px}.hint{color:#999;font-size:12px;margin-bottom:14px}
.toolbar{margin-bottom:10px;display:flex;gap:10px;align-items:center;position:sticky;top:0;background:#111;padding:8px 0;z-index:5}
button{padding:6px 14px;font-size:13px;background:#2d6cdf;color:#fff;border:0;border-radius:4px;cursor:pointer}
button:hover{background:#3d7cef}.btn-ok{background:#2a8f3c}.btn-ok:hover{background:#35a649}
#status{font-size:13px;color:#8f8}
table{border-collapse:collapse;width:100%}
td{border:1px solid #333;padding:8px;vertical-align:top;background:#1a1a1a}
tr:nth-child(even) td{background:#202020}
.n{color:#888;font-weight:bold;white-space:nowrap;width:150px}
img{width:280px;display:block;background:#000;border:1px solid #444}
video{width:200px;height:112px;background:#000;display:block}
.prompt{font-size:11px;color:#bbb;max-width:400px;line-height:1.4}
input{width:190px;padding:4px;font-size:12px;background:#0d0d0d;color:#fff;border:1px solid #555;border-radius:3px}
input.done{border-color:#3a3}
.b{color:#6cf;white-space:nowrap}
.filter-bar{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
.filter-bar input{width:220px}
</style></head><body>
<h1>Whiteboard Clip Renamer v2 — last frame + prompt + rename</h1>
<div class="hint">Last frame of each video on the left. Compare it to the prompt text. Type the correct beat name, hit Rename (row turns green).</div>
<div class="filter-bar">
  <input id="filter" placeholder="Filter (e.g. gym, complaint, chart)" oninput="applyFilter(this.value)">
  <label><input type="checkbox" id="showDone" checked onchange="applyFilter(document.getElementById('filter').value)"> show done</label>
</div>
<div class="toolbar">
  <button onclick="renameAll()">Rename All (in listed order)</button>
  <span id="status"></span>
</div>
<table><tr><th style="text-align:left">File</th><th>Last frame</th><th>Video</th><th>Prompt</th><th>New name</th></tr>
${videos.map(v => {
  const base = v.replace(/\.mp4$/, "");
  const p = prompts.find(x => x.beat === Number(base.match(/beat_(\d+)/)?.[1]) && x.pnum === Number(base.match(/p(\d+)/)?.[1]));
  const currentBeat = base.match(/beat_(\d+)/)?.[1] ?? "??";
  const currentP = base.match(/p(\d+)/)?.[1] ?? "??";
  const frameFile = base + ".png";
  const promptText = p ? `${p.beat}.${p.pnum}: ${p.text}` : "(no prompt match)";
  return `<tr data-base="${base}">
<td class="n"><b>${base}</b><br><span class="b">beat_${currentBeat} p${currentP}</span></td>
<td><img loading="lazy" src="/f/${encodeURIComponent(frameFile)}"></td>
<td><video controls preload="metadata" src="/v/${encodeURIComponent(v)}"></video></td>
<td class="prompt">${promptText}</td>
<td><input id="name-${base}" value="beat_${currentBeat}_p${currentP}" spellcheck="false" onkeydown="if(event.key==='Enter')doRename('${base}')"><br><button class="btn-ok" onclick="doRename('${base}')">Rename</button></td>
</tr>`;
}).join("")}
</table>
<script>
async function doRename(base) {
  const inp = document.getElementById("name-" + base);
  let newName = inp.value.trim();
  if (!/^beat_\d{2}_p\d{2}$/.test(newName)) { alert("Use format: beat_12_p03"); return; }
  newName += ".mp4";
  const r = await fetch("/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ old: base + ".mp4", next: newName }) });
  const j = await r.json();
  if (j.ok) {
    const row = document.querySelector('tr[data-base="' + base + '"]');
    row.querySelector("video").src = "/v/" + encodeURIComponent(newName);
    row.querySelector("img").src = "/f/" + encodeURIComponent(newName.replace(/\.mp4$/, ".png")) + "?t=" + Date.now();
    document.getElementById("name-" + base).classList.add("done");
    row.dataset.base = newName.replace(/\.mp4$/, "");
    document.getElementById("name-" + base).id = "name-" + newName.replace(/\.mp4$/, "");
    document.getElementById("status").textContent = "renamed " + base + " -> " + newName;
    if (!document.getElementById("showDone").checked) row.style.display = "none";
  } else { alert("FAILED: " + j.error); }
}
async function renameAll() {
  const rows = [...document.querySelectorAll("tr[data-base]")].filter(r => r.style.display !== "none");
  for (const row of rows) await doRename(row.dataset.base);
  document.getElementById("status").textContent = "processed " + rows.length + " rows";
}
function applyFilter(q) {
  const qq = q.toLowerCase();
  document.querySelectorAll("tr[data-base]").forEach(r => {
    const text = (r.textContent || "").toLowerCase();
    const done = r.querySelector("input").classList.contains("done");
    r.style.display = (text.includes(qq) && (document.getElementById("showDone").checked || !done)) ? "" : "none";
  });
}
</script></body></html>`;

const send = (res, code, body, type = "text/html") => {
  res.writeHead(code, { "Content-Type": type });
  res.end(body);
};

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/") return send(res, 200, PAGE);
  if (url.pathname.startsWith("/f/")) {
    const f = decodeURIComponent(url.pathname.slice(3));
    const full = join(FRAMES, f);
    if (!existsSync(full)) return send(res, 404, "frame not found: " + f);
    const st = statSync(full);
    res.writeHead(200, { "Content-Type": "image/png", "Content-Length": st.size, "Cache-Control": "no-store" });
    const { createReadStream } = require("node:fs");
    createReadStream(full).pipe(res);
    return;
  }
  if (url.pathname.startsWith("/v/")) {
    const f = decodeURIComponent(url.pathname.slice(3));
    const full = join(CLIPS, f);
    if (!existsSync(full)) return send(res, 404, "video not found: " + f);
    const st = statSync(full);
    res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": st.size, "Accept-Ranges": "bytes", "Cache-Control": "no-store" });
    const { createReadStream } = require("node:fs");
    createReadStream(full).pipe(res);
    return;
  }
  if (url.pathname === "/rename" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      try {
        const { old: o, next: nw } = JSON.parse(body);
        if (!o || !nw || /[\\/:*?"<>|]/.test(nw)) return send(res, 400, JSON.stringify({ ok: false, error: "bad name" }), "application/json");
        const from = join(CLIPS, o), to = join(CLIPS, nw);
        if (!existsSync(from)) return send(res, 404, JSON.stringify({ ok: false, error: "source missing: " + o }), "application/json");
        if (existsSync(to) && from !== to) return send(res, 409, JSON.stringify({ ok: false, error: "target exists: " + nw }), "application/json");
        renameSync(from, to);
        send(res, 200, JSON.stringify({ ok: true }), "application/json");
      } catch (e) { send(res, 500, JSON.stringify({ ok: false, error: String(e) }), "application/json"); }
    });
    return;
  }
  send(res, 404, "not found");
}).listen(PORT, () => console.log(`Rename gallery v2: http://localhost:${PORT}  (${videos.length} clips)`));