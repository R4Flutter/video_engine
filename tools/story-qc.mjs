import { readFileSync } from "node:fs";

const PATH = new URL("../video/src/script.json", import.meta.url);
const script = JSON.parse(readFileSync(PATH, "utf8"));
const beats = Array.isArray(script.beats) ? script.beats : [];

const text = (b) => `${b.vo ?? ""} ${b.text ?? ""} ${b.question ?? ""} ${b.reveal ?? ""}`.trim();
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9$% ]+/g, " ").replace(/\s+/g, " ").trim();
const words = text({ vo: script.vo, text: script.caption }).split(/\s+/).length;
const nonEmpty = beats.filter((b) => String(b.vo ?? "").trim()).length;
const purposes = beats.map((b) => String(b.purpose ?? "").toLowerCase());
const questions = beats.filter((b) => String(b.question ?? "").trim()).length;
const reveals = beats.filter((b) => String(b.reveal ?? "").trim()).length;
const escalations = beats.filter((b) => /escalat|reveal|turn|proof|payoff/i.test(String(b.purpose ?? ""))).length;
const hooks = beats.filter((b) => /hook/i.test(String(b.purpose ?? "")) || /hook/i.test(String(b.name ?? ""))).length;
const ctas = beats.filter((b) => /cta|ask|subscribe|follow|comment/i.test(`${b.purpose ?? ""} ${b.name ?? ""}`)).length;
const distinctPurposes = new Set(purposes).size;
const duration = Number(script.durationInSeconds ?? script.duration ?? 0);

const findings = [];
const scoreParts = [];

function check(name, value, points, max, severity = "WARN") {
  scoreParts.push({ name, points, max });
  if (!value) findings.push({ severity, name });
}

check("Hook exists", hooks >= 1, 1, 1, "FATAL");
check("Central curiosity exists", questions >= (duration >= 180 ? 2 : 1), 1, 1);
check("Narrative reveals exist", reveals >= (duration >= 180 ? 3 : 2), 1, 1);
check("Story movement variety", distinctPurposes >= 5, 1, 1);
check("Escalation/reversal density", escalations >= (duration >= 180 ? 4 : 2), 1, 1);
check("CTA is not the entire ending", ctas <= 2, 1, 1);
check("Multiple substantive beats", nonEmpty >= 5, 1, 1);

const fullText = norm(beats.map(text).join(" "));
const uniqueTokens = new Set(fullText.split(" ").filter((w) => w.length > 3));
const repetitionRatio = fullText ? 1 - uniqueTokens.size / fullText.split(" ").length : 1;
check("Repetition is controlled", repetitionRatio < 0.72, 1, 1);

const first = beats[0] ? text(beats[0]) : "";
check("Hook is concrete", first.split(/\s+/).length >= 4 && first.length >= 28, 1, 1);

const middle = beats.slice(1, Math.max(2, beats.length - 2));
const hasTurn = middle.some((b) => /turn|contradict|reveal|actually|but|except/i.test(`${b.purpose ?? ""} ${b.reveal ?? ""}`));
check("Midpoint complication/turn", hasTurn, 1, 1);

const last = beats.at(-1) ? text(beats.at(-1)) : "";
check("Ending contains payoff/answer", /payoff|answer|reveal|conclusion|implication|what this means|the point/i.test(`${beats.at(-1)?.purpose ?? ""} ${last}`), 1, 1);

const total = scoreParts.reduce((a, b) => a + b.points, 0);
const max = scoreParts.reduce((a, b) => a + b.max, 0);
const score = Math.round((total / max) * 100) / 10;

console.log(`STORY QC — ${score}/10`);
for (const f of findings) console.log(`${f.severity}  ${f.name}`);
console.log(`beats=${beats.length} duration=${duration}s questions=${questions} reveals=${reveals} escalations=${escalations} purposes=${distinctPurposes}`);

const fatal = findings.some((f) => f.severity === "FATAL");
const strict = process.argv.includes("--strict");
if (strict && (fatal || score < 9.2)) {
  console.error(`\nSTORY GATE BLOCKED — requires >= 9.2/10 and no FATAL findings. Current: ${score}/10`);
  process.exit(1);
}
