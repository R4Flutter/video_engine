#!/usr/bin/env node
/**
 * Derive three standalone Shorts from the current long-form director plan.
 * Selection/reframing only: no synthetic story facts and no arbitrary crop of
 * the entire film. The selected beats retain enough visual metadata for the
 * dedicated vertical renderer to reproduce the long-form visual language.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const VIDEO = path.join(ROOT, "video");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const plan = readJson(path.join(VIDEO, "src", "director-plan.json"));
const script = readJson(path.join(VIDEO, "src", "script.json"));

const project = plan.project ?? {};
if (project.mode !== "LONG_FORM" || Number(project.durationInSeconds) < 120) {
  throw new Error("Shorts extraction requires a current LONG_FORM director plan (>=120s). Run npm run direct first.");
}
if (script.engine !== "finance") throw new Error(`Shorts extraction expected finance source, got ${script.engine}`);

const rawBeats = plan.beats ?? plan.timeline?.beats ?? script.beats ?? [];
const beats = rawBeats.map((b, i) => ({
  n: Number(b.n ?? b.id ?? i + 1),
  name: String(b.name ?? b.title ?? `Beat ${i + 1}`),
  start: Number(b.start ?? b.startTime ?? 0),
  end: Number(b.end ?? b.endTime ?? 0),
  module: String(b.module ?? b.visual?.module ?? b.visual?.sourceMode ?? "footage"),
  text: String(b.text ?? b.typography?.text ?? b.visual?.text ?? ""),
  hook: String(b.hook ?? b.attention?.hook ?? b.narrative?.question ?? ""),
  payoff: String(b.payoff ?? b.attention?.payoff ?? b.narrative?.reveal ?? ""),
  reason: String(b.reasonForChange ?? b.visual?.reasonForChange ?? ""),
  reveal: String(b.reveal ?? b.attention?.reveal ?? b.narrative?.reveal ?? ""),
  raw: b,
})).filter(b => b.end > b.start);

if (beats.length < 6) throw new Error("Need at least 6 timed beats to derive Shorts.");

const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
const textOf = (b) => [b.hook, b.text, b.reveal, b.payoff, b.name].filter(Boolean).join(" ");
const scoreBeat = (b, idx) => {
  const t = textOf(b).toLowerCase();
  let score = 0;
  if (/(why|but|never|secret|problem|trap|impossible|actually|hidden|mistake|cost|million|billion|%|\$)/i.test(t)) score += 3;
  if (b.hook) score += 4;
  if (b.payoff) score += 3;
  if (b.reveal) score += 2;
  if (/(payoff|compare|stat|chart|investchart|evidence|footage|timeline)/i.test(b.module)) score += 1;
  if (words(t) >= 5 && words(t) <= 45) score += 1;
  if (idx === 0) score += 2;
  return score;
};

const candidates = [];
for (let i = 0; i < beats.length; i++) {
  for (let j = i + 2; j < beats.length; j++) {
    const start = beats[i].start;
    const end = beats[j].end;
    const dur = end - start;
    if (dur < 22 || dur > 58) continue;
    const window = beats.slice(i, j + 1);
    const score = window.reduce((s, b, k) => s + scoreBeat(b, i + k), 0)
      + (window.some(b => b.hook) ? 5 : 0)
      + (window.some(b => b.payoff) ? 5 : 0)
      + (window.length >= 3 ? 2 : 0);
    candidates.push({ i, j, start, end, dur, score, window });
  }
}

candidates.sort((a, b) => b.score - a.score);
const chosen = [];
for (const c of candidates) {
  const overlap = chosen.some(x => Math.max(x.start, c.start) < Math.min(x.end, c.end));
  const separation = chosen.every(x => Math.abs(x.start - c.start) >= 90);
  if (!overlap && separation) chosen.push(c);
  if (chosen.length === 3) break;
}
if (chosen.length < 3) throw new Error(`Could only find ${chosen.length} distinct 22–58s candidates.`);
chosen.sort((a, b) => a.start - b.start);

const shorts = chosen.map((c, index) => {
  const first = c.window[0];
  const last = c.window[c.window.length - 1];
  const start = c.start;
  const end = c.end;
  const hook = first.hook || first.text || first.name;
  const payoff = last.payoff || last.reveal || last.text || last.name;
  return {
    id: `short-${index + 1}`,
    title: `${first.name} — ${last.name}`,
    sourceStart: start,
    sourceEnd: end,
    duration: Number((end - start).toFixed(3)),
    hook: hook.slice(0, 180),
    payoff: payoff.slice(0, 180),
    score: c.score,
    beats: c.window.map((b) => {
      const raw = b.raw ?? {};
      return {
        n: b.n,
        name: b.name,
        sourceStart: b.start,
        sourceEnd: b.end,
        start: Number((b.start - start).toFixed(3)),
        end: Number((b.end - start).toFixed(3)),
        module: b.module,
        text: b.text,
        hook: b.hook,
        reveal: b.reveal,
        payoff: b.payoff,
        visual: raw.visual ?? {},
        narrative: raw.narrative ?? {},
        motion: raw.motion ?? {},
        typography: raw.typography ?? {},
        camera: raw.motion?.camera ?? {},
      };
    }),
  };
});

const out = {
  version: 2,
  mode: "SHORTS_FROM_LONGFORM",
  source: {
    title: project.title ?? script.title ?? "Long-form episode",
    duration: Number(project.durationInSeconds ?? script.durationInSeconds ?? 0),
    planVersion: plan.version ?? null,
  },
  policy: {
    targetCount: 3,
    targetDurationSeconds: [22, 58],
    minimumSeparationSeconds: 90,
    standalone: true,
    preserveNarrativeTruth: true,
  },
  shorts,
};

fs.writeFileSync(path.join(VIDEO, "src", "shorts-manifest.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`SHORTS ENGINE  derived ${shorts.length} candidates from ${beats.length} long-form beats`);
for (const s of shorts) console.log(`  ${s.id} ${s.sourceStart.toFixed(1)}–${s.sourceEnd.toFixed(1)}s  ${s.duration.toFixed(1)}s  score=${s.score}`);
