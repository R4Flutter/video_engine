// llm.mjs — shared LLM client for the editorial audit stages (3, 4, 8).
//
//   Provider priority: Gemini first (best models, then fallbacks), Groq next
//   (cheap/fast), each with its own model priority chain. Keys come from env
//   (GEMINI_API_KEY, GROQ_API_KEY) or the repo .env — never committed.
//   Always asks for structured JSON; parses and validates it.
//
//   Overrides: GEMINI_MODELS, GROQ_MODELS (comma-separated priority chains)
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GEMINI_DEFAULT = ["gemini-3.1-pro-preview", "gemini-3.6-flash"];
const GROQ_DEFAULT = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

function dotenv() {
  const envPath = resolve(ROOT, ".env");
  const out = {};
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m) out[m[1]] = m[2].trim();
    }
  }
  return out;
}

export function loadApiKey(name = "GEMINI_API_KEY") {
  if (process.env[name]) return process.env[name].trim();
  return dotenv()[name] || null;
}

export const modelChain = (prefix = "GEMINI") =>
  (process.env[`${prefix}_MODELS`] || (prefix === "GEMINI" ? GEMINI_DEFAULT : GROQ_DEFAULT).join(","))
    .split(",").map(s => s.trim()).filter(Boolean);

// Gemini no longer accepts sampling params (temperature/top_p/top_k were
// deprecated in the 3.x flash line), so generationConfig carries only the
// mime type and token budget. Groq keeps temperature — it still supports it.
async function geminiCall(model, system, prompt, temperature, maxOutputTokens, timeoutMs) {
  const key = loadApiKey("GEMINI_API_KEY");
  const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens },
      }),
      signal: controller.signal,
    });
    const body = await res.text().catch(() => "");
    if (!res.ok) return { status: res.status, detail: body.slice(0, 300) };
    const data = JSON.parse(body);
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    return { status: 200, text };
  } finally { clearTimeout(timer); }
}

async function groqCall(model, system, prompt, temperature, maxOutputTokens, timeoutMs) {
  const key = loadApiKey("GROQ_API_KEY");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature,
        max_tokens: maxOutputTokens,
      }),
      signal: controller.signal,
    });
    const body = await res.text().catch(() => "");
    if (!res.ok) return { status: res.status, detail: body.slice(0, 300) };
    const data = JSON.parse(body);
    return { status: 200, text: data?.choices?.[0]?.message?.content || "" };
  } finally { clearTimeout(timer); }
}

export async function generateJson({ system, prompt, key = null, temperature = 0.4, maxOutputTokens = 8192, timeoutMs = 120000, retries = 2 }) {
  const providers = [
    { name: "gemini", key: () => loadApiKey("GEMINI_API_KEY"), models: modelChain("GEMINI"), call: geminiCall },
    { name: "groq", key: () => loadApiKey("GROQ_API_KEY"), models: modelChain("GROQ"), call: groqCall },
  ];
  const errors = [];
  const modelsTried = [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  for (const p of providers) {
    if (!p.key()) { errors.push(`${p.name}: no_api_key`); continue; }
    for (const model of p.models) {
      modelsTried.push(`${p.name}:${model}`);
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const r = await p.call(model, system, prompt, temperature, maxOutputTokens, timeoutMs);
          if (r.status !== 200) {
            const transient = r.status === 429 || r.status >= 500 || r.status === 408;
            if (transient && attempt < retries) { await sleep(1500 * attempt); continue; }
            if (r.status === 400) return { ok: false, reason: "bad_request", error: `${p.name}/${model}: ${r.detail}`, modelsTried };
            errors.push(`${p.name}/${model}: ${r.status} ${r.detail}`);
            break;
          }
          const json = extractJson(r.text);
          if (json === null) { errors.push(`${p.name}/${model}: unparseable JSON`); continue; }
          return { ok: true, provider: p.name, model, data: json, modelsTried };
        } catch (e) {
          if (attempt < retries) { await sleep(1500 * attempt); continue; }
          errors.push(`${p.name}/${model}: ${e?.name === "AbortError" ? "timeout" : e.message}`);
        }
      }
    }
  }
  return { ok: false, reason: "all_models_failed", errors, modelsTried };
}

export function extractJson(text) {
  const t = text.trim();
  try { return JSON.parse(t); } catch { /* fall through */ }
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch { /* fall through */ } }
  const open = t.indexOf("{"), close = t.lastIndexOf("}");
  if (open >= 0 && close > open) { try { return JSON.parse(t.slice(open, close + 1)); } catch { /* fall through */ } }
  return null;
}