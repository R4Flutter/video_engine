// rename-gallery.mjs — look at video + prompt, then rename files.
//   node tools/rename-gallery.mjs [port]
// Opens http://localhost:8765 — each row shows the video, its prompt,
// the current filename, and an editable new name. Renames on disk.
import { createServer } from "node:http";
import { readFileSync, readdirSync, existsSync, renameSync, statSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CLIPS = join(ROOT, "whiteboard_clips");
const FRAMES = join(CLIPS, "frames");
const CSV = join(CLIPS, "clip_mapping.csv");
const PORT = Number(process.argv[2] ?? 8765);

const prompts = new Map();
if (existsSync(CSV)) {
  const lines = readFileSync(CSV, "utf8").split(/\r?\n/).slice(1);
  for (const line of lines) {
    const m = line.match(/^"?(clip_\d{3})"?,?"?(beat_\d{2}_p\d{2}\.mp4)"?,?"?(\d+)"?,?"?(\d+)"?,?"?(.*)"?$/);
    if (m) prompts.set(m[1], { file: m[2], beat: m[3], pnum: m[4], prompt: m[5] });
  }
}

const videos = readdirSync(CLIPS)
  .filter(f => extname(f) === ".mp4")
  .sort((a, b) => {
    const ca = a.match(/(\d+)/)?.[1] ?? 0, cb = b.match(/(\d+)/)?.[1] ?? 0;
    return Number(ca) - Number(cb);
  });

const PAGE = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Whiteboard Clip Renamer</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;background:#141414;color:#eee;margin:0;padding:24px}
h1{font-size:20px;margin:0 0 4px}.hint{color:#999;font-size:12px;margin-bottom:16px}
.toolbar{margin-bottom:12px;display:flex;gap:10px;align-items:center}
#status{font-size:13px;color:#8f8}
table{border-collapse:collapse;width:100%;table-layout:fixed}
td{border:1px solid #333;padding:8px;vertical-align:top;background:#1d1d1d}
tr:nth-child(even) td{background:#232323}
.n{color:#888;font-weight:bold;white-space:nowrap;width:70px}
.b{color:#6cf;white-space:nowrap;width:110px}
.p{font-size:11px;color:#bbb;width:340px;max-height:120px;overflow:auto}
video{width:200px;height:112px;background:#000;display:block}
input{width:180px;padding:4px;font-size:12px;background:#0d0d0d;color:#fff;border:1px solid #555;border-radius:3px}
input.done{border-color:#3a3}
button{padding:6px 14px;font-size:13px;background:#2d6cdf;color:#fff;border:0;border-radius:4px;cursor:pointer}
button:hover{background:#3d7cef}
</style></head><body>
<h1>Whiteboard Clip Renamer</h1>
<div class="hint">Play each video, check it against its prompt, edit the new name, hit Rename. Row turns green when renamed.</div>
<div class="toolbar"><button onclick="renameAll()">Rename All</button> <span id="status"></span></div>
<table><tr><td class="n">#</td><td>Video</td><td class="p">Prompt</td><td class="b">Current → New name</td></tr>
${videos.map(v => {
  const m = v.match(/^(\d+)/);
  const clip = m ? "clip_" + String(m[1]).padStart(3, "0") : v.replace(/\.mp4$/, "");
  const p = prompts.get(clip);
  return `<tr id="row-${clip}">
<td class="n">${clip}</td>
<td><video controls preload="metadata" src="/v/${encodeURIComponent(v)}"></video></td>
<td class="p">${p ? p.prompt : "(no prompt in CSV)"}</td>
<td class="b"><input id="name-${clip}" value="${v.replace(/\.mp4$/, "")}" spellcheck="false"><br><button onclick="doRename('${clip}')">Rename</button></td>
</tr>`;
}).join("")}
</table>
<script>
async function doRename(clip) {
  const inp = document.getElementById("name-" + clip);
  const newName = inp.value.trim() + ".mp4";
  const oldName = document.getElementById("row-" + clip).querySelector("video").src.split("/").pop();
  const r = await fetch("/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ old: oldName, new: newName }) });
  const j = await r.json();
  if (j.ok) {
    document.getElementById("row-" + clip).querySelector("video").src = "/v/" + encodeURIComponent(newName);
    document.getElementById("name-" + clip).classList.add("done");
    document.getElementById("status").textContent = "renamed " + oldName + " → " + newName;
  } else { alert("FAILED: " + j.error); }
}
async function renameAll() {
  let n = 0;
  for (const clip of document.querySelectorAll("[id^=name-]")) {
    await doRename(clip.id.replace("name-", ""));
    n++;
  }
  document.getElementById("status").textContent = "processed " + n + " clips";
}
</script></body></html>`;

const send = (res, code, body, type = "text/html") => {
  res.writeHead(code, { "Content-Type": type });
  res.end(body);
};

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/" || url.pathname === "/index.html") return send(res, 200, PAGE);

  if (url.pathname.startsWith("/v/")) {
    const f = decodeURIComponent(url.pathname.slice(3));
    const full = join(CLIPS, f);
    if (!existsSync(full)) return send(res, 404, "not found");
    const st = statSync(full);
    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Length": st.size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    });
    const { createReadStream } = require("node:fs");
    createReadStream(full).pipe(res);
    return;
  }

  if (url.pathname === "/rename" && req.method === "POST") {
    let body = "";
    req.on("data", c => (body += c));
    req.on("end", () => {
      try {
        const { old: o, new: nw } = JSON.parse(body);
        if (!o || !nw || /[\\/:*?"<>|]/.test(nw)) return send(res, 400, JSON.stringify({ ok: false, error: "bad name" }), "application/json");
        const from = join(CLIPS, o), to = join(CLIPS, nw);
        if (!existsSync(from)) return send(res, 404, JSON.stringify({ ok: false, error: "source missing" }), "application/json");
        if (existsSync(to) && from !== to) return send(res, 409, JSON.stringify({ ok: false, error: "target exists" }), "application/json");
        renameSync(from, to);
        send(res, 200, JSON.stringify({ ok: true }), "application/json");
      } catch (e) { send(res, 500, JSON.stringify({ ok: false, error: String(e) }), "application/json"); }
    });
    return;
  }

  send(res, 404, "not found");
}).listen(PORT, () => console.log(`Rename gallery: http://localhost:${PORT}  (clips: ${videos.length})`));