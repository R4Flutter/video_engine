import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "video", "src", "script.json");
const LOG = process.argv[2] || process.env.VOICE_LOG || path.join(ROOT, "video", "voice.log");
const PORT = Number(process.env.PORT || 8123);

const total = (() => {
  try {
    const script = JSON.parse(fs.readFileSync(SCRIPT, "utf8"));
    return script.beats.filter((b) => b.vo).length;
  } catch {
    return 0;
  }
})();

const readLog = () => {
  try {
    return fs.readFileSync(LOG, "utf8");
  } catch {
    return "";
  }
};

const snapshot = () => {
  const text = readLog();
  const done = (text.match(/^\s+beat \d+\s+[\d.]+\s*s\s+(?:cached|e\d)/gm) || []).length;
  const bars = [...text.matchAll(/Sampling:\s+(\d+)%\|[^|]*\| (\d+)\/(\d+)/g)];
  const last = bars[bars.length - 1];
  const current = last ? { pct: Number(last[1]), steps: Number(last[2]), totalSteps: Number(last[3]) } : null;
  const cached = (text.match(/^\s+beat \d+\s+[\d.]+\s*s\s+cached$/gm) || []).length;
  const reads = done - cached;
  const remaining = Math.max(0, total - done);
  const minutesPerBeat = current && current.pct > 0 ? (current.steps / current.totalSteps) * 0.7 + 3.1 : 3.8;
  return {
    total,
    done,
    cached,
    reads,
    pct: total ? Math.round((100 * done) / total) : 0,
    current,
    etaMinutes: Math.round(remaining * minutesPerBeat),
    doneMinutes: Math.round(done * minutesPerBeat),
    lastLine: text.trim().split("\n").filter(Boolean).slice(-2)[0] ?? "",
  };
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>voice render</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #080808; color: #f2f2f2; font-family: "Segoe UI", system-ui, sans-serif; }
  .card { width: min(640px, 92vw); padding: 48px 40px; border: 1px solid #1c1c1c; border-radius: 20px; background: #101010; }
  h1 { margin: 0 0 4px; font-size: 15px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #8a8a8a; }
  .big { font-size: 84px; font-weight: 800; line-height: 1; margin: 14px 0 6px; font-variant-numeric: tabular-nums; }
  .big small { font-size: 30px; color: #8a8a8a; font-weight: 600; }
  .track { height: 10px; border-radius: 5px; background: #1c1c1c; overflow: hidden; margin: 22px 0 12px; }
  .fill { height: 100%; width: 0; border-radius: 5px; background: linear-gradient(90deg, #3b82f6, #22d3ee); transition: width .6s ease; }
  .meta { display: flex; justify-content: space-between; font-size: 13px; color: #8a8a8a; font-variant-numeric: tabular-nums; }
  .bar { margin-top: 20px; font-size: 13px; color: #22d3ee; font-family: ui-monospace, Consolas, monospace; white-space: pre; }
  .state { margin-top: 8px; font-size: 12px; color: #5a5a5a; font-family: ui-monospace, Consolas, monospace; white-space: pre-wrap; word-break: break-all; }
</style>
</head>
<body>
  <div class="card">
    <h1>voice render</h1>
    <div class="big"><span id="pct">0</span><small>%</small></div>
    <div class="track"><div class="fill" id="fill"></div></div>
    <div class="meta"><span id="done">0/0</span><span id="eta">eta --</span><span id="reads"></span></div>
    <div class="bar" id="bar">waiting for first sampling bar...</div>
    <div class="state" id="state"></div>
  </div>
<script>
const el = (id) => document.getElementById(id);
const fmt = (m) => (m < 60 ? m + " min" : Math.floor(m / 60) + "h " + (m % 60) + "m");
async function tick() {
  try {
    const r = await fetch("/api");
    const s = await r.json();
    el("pct").textContent = s.pct;
    el("fill").style.width = s.pct + "%";
    el("done").textContent = s.done + "/" + s.total + " beats";
    el("eta").textContent = "eta ~" + fmt(s.etaMinutes) + " · done " + fmt(s.doneMinutes);
    el("reads").textContent = s.reads + " new · " + s.cached + " cached";
    if (s.current) {
      const c = s.current;
      el("bar").textContent = "beat " + (s.done + 1) + "/" + s.total + "  sampling " + c.pct + "%  (" + c.steps + "/" + c.totalSteps + " steps)";
    }
    el("state").textContent = s.lastLine;
  } catch (e) {
    el("state").textContent = "server unreachable: " + e;
  }
}
tick();
setInterval(tick, 2000);
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/api") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(snapshot()));
    return;
  }
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`voice progress UI on http://localhost:${PORT} (${total} beats total, log: ${LOG})`);
});