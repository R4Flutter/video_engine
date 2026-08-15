// Deterministic primitives for the director. Everything here is seeded from
// the beat number and its content, so the same script produces the same plan
// on every machine. Math.random is the one thing a director may never use —
// a plan you cannot reproduce is a plan you cannot debug.
import type { ScriptBeat } from "./types.ts";

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const round2 = (v: number) => Number(v.toFixed(2));

/** FNV-1a over a string, returned as an unsigned 32-bit integer. */
export const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

export type Rng = () => number;

/** mulberry32 — small, fast, deterministic. */
export const rng = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** 0..1 position of a beat through the video. */
export const progress = (b: ScriptBeat, beats: ScriptBeat[]) =>
  beats.length <= 1
    ? 0
    : (b.start - beats[0].start) / (beats[beats.length - 1].end - beats[0].start);

/** Every money-and-number token in a line: "$120" "1,440" "0.4%" "4". */
export const numberTokens = (s: string) =>
  s.match(/[$₹€£]?\d[\d,]*(?:\.\d+)?%?/g) ?? [];

export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

/** Spoken words per second — the pacing dial. Shorts live around 3.0; below
 *  2.4 the read drags and below 2.0 it is a different format entirely. */
export const wordsPerSecond = (b: ScriptBeat) => {
  const dur = Math.max(0.1, b.end - b.start);
  return round2(words(b.vo).length / dur);
};

export const looksLikeQuestion = (s: string) =>
  /\?\s*$/.test(s.trim()) ||
  /^(but |and |so )?(why|who|what|where|how|when|is it|does it|would you|can it|guess)\b/i.test(
    s.trim(),
  );

/** The first n words of a line, for stamps and labels. */
export const firstWords = (s: string, n = 6) => words(s).slice(0, n).join(" ");

/** Normalised for comparison: case, punctuation and filler stripped. Used to
 *  test whether the on-screen hook and the spoken hook are the same claim. */
export const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9$%\s]/g, " ")
    .replace(/\b(the|a|an|your|you|is|are|it|that|this|of|to)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** How much two lines overlap, 0..1, on content words. */
export const overlap = (a: string, b: string) => {
  const A = new Set(normalise(a).split(" ").filter(Boolean));
  const B = new Set(normalise(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit += 1;
  return round2(hit / Math.min(A.size, B.size));
};
