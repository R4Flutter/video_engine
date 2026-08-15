/**
 * Word timings -> viseme track, plus a loudness envelope per beat.
 *
 *     node tools/lipsync.mjs            # writes video/src/visemes.json
 *     node tools/lipsync.mjs --print 1  # dump beat 1's cues to stdout
 *
 * Reads video/src/voice.json (written by tools/align.py, so every word already
 * sits where the recorded voice actually put it) and video/public/audio/vo/*.wav.
 *
 * WHY NOT A FORCED PHONEME ALIGNER
 * A real aligner (MFA, gentle) gives phoneme-level boundaries and needs a
 * dictionary, an acoustic model and a working conda. This does something
 * cheaper that survives the only test that matters at 30fps: a mouth has ~10
 * distinguishable shapes, and which one is showing matters far more than
 * whether its boundary is 20ms early. So:
 *
 *   1. letters -> phonemes, by rule, with a lexicon for the irregulars
 *   2. phonemes -> visemes, a 10-way collapse
 *   3. spread them across the word's measured span, weighted by how long each
 *      sound actually takes to say
 *   4. multiply the whole thing by the wav's own loudness, so a word said
 *      quietly moves the jaw less than the same word shouted
 *
 * Step 4 is what stops it looking like a puppet: the shapes come from the text
 * but the *energy* comes from the audio, and energy is what the eye reads first.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VOICE = path.join(ROOT, "video/src/voice.json");
const VO = path.join(ROOT, "video/public/audio/vo");
const OUT = path.join(ROOT, "video/src/visemes.json");

/** Envelope resolution. 100Hz is ~3 samples per frame at 30fps — enough to
 *  catch a plosive's attack, small enough that the JSON stays a few hundred KB. */
const ENV_HZ = 100;

// --------------------------------------------------------------- phonemes
// ARPAbet, minus the stress digits. Anything not in this set is dropped.

/** Sounds that take real time to say, relative to each other. A stop is a
 *  closure and a burst — visually it's over in a frame. A diphthong is the mouth
 *  travelling between two shapes and holds three times as long. */
const DUR = {
  // vowels
  AA: 2.2, AE: 2.1, AH: 1.3, AO: 2.2, AW: 2.6, AY: 2.6, EH: 1.8, ER: 2.0,
  EY: 2.4, IH: 1.4, IY: 2.0, OW: 2.4, OY: 2.6, UH: 1.5, UW: 2.1,
  // consonants
  B: 0.8, CH: 1.3, D: 0.7, DH: 0.9, F: 1.2, G: 0.8, HH: 0.8, JH: 1.3,
  K: 0.9, L: 1.0, M: 1.0, N: 0.9, NG: 1.1, P: 0.8, R: 1.0, S: 1.4,
  SH: 1.4, T: 0.7, TH: 1.2, V: 1.0, W: 0.9, Y: 0.8, Z: 1.3, ZH: 1.3,
};

/**
 * The 10 mouth shapes. Collapsing 39 phonemes to 10 is not a shortcut — a human
 * face genuinely cannot make 39 distinguishable shapes, which is why lip
 * readers confuse "pat" and "bat". These are the groups that stay distinct.
 *
 *   REST closed, neutral        MBP  lips pressed shut
 *   FV   lip under teeth        TH   tongue between teeth
 *   L    tongue to palate       WQ   tight pucker
 *   E    wide and narrow        AI   wide and open
 *   O    round and open         S    narrow, teeth close
 */
const VISEME = {
  P: "MBP", B: "MBP", M: "MBP",
  F: "FV", V: "FV",
  TH: "TH", DH: "TH",
  L: "L",
  W: "WQ", UW: "WQ", UH: "WQ", OY: "WQ", Y: "E",
  IY: "E", IH: "E", EY: "E", EH: "E",
  AA: "AI", AE: "AI", AH: "AI", AY: "AI", AW: "AI",
  AO: "O", OW: "O",
  R: "S", ER: "S", S: "S", Z: "S", SH: "S", ZH: "S", CH: "S", JH: "S",
  T: "S", D: "S", N: "S", K: "S", G: "S", NG: "S", HH: "S",
};

/** How far the jaw drops for each shape, 0..1. Multiplied by the wav's loudness
 *  at that instant, so this is the ceiling rather than the value. */
export const OPENNESS = {
  REST: 0.0, MBP: 0.0, FV: 0.18, TH: 0.3, L: 0.42,
  WQ: 0.34, E: 0.4, S: 0.28, AI: 1.0, O: 0.78,
};

// ------------------------------------------------------------ the lexicon
// English spelling is regular enough that rules carry most words. It is the
// *frequent* words that are irregular — "the", "of", "one", "said" — and in a
// 40-second narration those are half the tokens. So they get spelled out.
const LEX = {
  a: "AH", the: "DH AH", to: "T UW", of: "AH V", and: "AE N D", is: "IH Z",
  are: "AA R", was: "W AH Z", were: "W ER", be: "B IY", been: "B IH N",
  you: "Y UW", your: "Y AO R", i: "AY", me: "M IY", my: "M AY", we: "W IY",
  he: "HH IY", she: "SH IY", they: "DH EY", them: "DH EH M", this: "DH IH S",
  that: "DH AE T", these: "DH IY Z", those: "DH OW Z", there: "DH EH R",
  what: "W AH T", who: "HH UW", why: "W AY", how: "HH AW", when: "W EH N",
  where: "W EH R", which: "W IH CH", would: "W UH D", could: "K UH D",
  should: "SH UH D", one: "W AH N", two: "T UW", three: "TH R IY",
  four: "F AO R", five: "F AY V", six: "S IH K S", seven: "S EH V AH N",
  eight: "EY T", nine: "N AY N", ten: "T EH N", eleven: "IH L EH V AH N",
  twelve: "T W EH L V", twenty: "T W EH N T IY", thirty: "TH ER T IY",
  forty: "F AO R T IY", fifty: "F IH F T IY", sixty: "S IH K S T IY",
  seventy: "S EH V AH N T IY", eighty: "EY T IY", ninety: "N AY N T IY",
  hundred: "HH AH N D R AH D", thousand: "TH AW Z AH N D",
  million: "M IH L Y AH N", billion: "B IH L Y AH N", zero: "Z IH R OW",
  money: "M AH N IY", said: "S EH D", says: "S EH Z", does: "D AH Z",
  done: "D AH N", come: "K AH M", some: "S AH M", any: "EH N IY",
  many: "M EH N IY", every: "EH V R IY", people: "P IY P AH L",
  because: "B IH K AO Z", into: "IH N T UW", other: "AH DH ER",
  another: "AH N AH DH ER", over: "OW V ER", after: "AE F T ER",
  year: "Y IH R", years: "Y IH R Z", month: "M AH N TH",
  months: "M AH N TH S", day: "D EY", days: "D EY Z",
  dollar: "D AA L ER", dollars: "D AA L ER Z", rupee: "R UW P IY",
  rupees: "R UW P IY Z", percent: "P ER S EH N T", cent: "S EH N T",
  interest: "IH N T R AH S T", compound: "K AA M P AW N D",
  invest: "IH N V EH S T", invests: "IH N V EH S T S",
  investing: "IH N V EH S T IH NG", investment: "IH N V EH S T M AH N T",
  market: "M AA R K AH T", markets: "M AA R K AH T S",
  savings: "S EY V IH NG Z", account: "AH K AW N T", income: "IH N K AH M",
  return: "R IH T ER N", returns: "R IH T ER N Z", growth: "G R OW TH",
  grow: "G R OW", grows: "G R OW Z", value: "V AE L Y UW",
  nothing: "N AH TH IH NG", something: "S AH M TH IH NG", again: "AH G EH N",
  once: "W AH N S", only: "OW N L IY", also: "AO L S OW", very: "V EH R IY",
  through: "TH R UW", though: "DH OW", enough: "IH N AH F",
  earn: "ER N", earns: "ER N Z", early: "ER L IY", earlier: "ER L IY ER",
  buy: "B AY", buys: "B AY Z", pay: "P EY", paid: "P EY D",
  wealth: "W EH L TH", rich: "R IH CH", poor: "P UH R", debt: "D EH T",
  half: "HH AE F", whole: "HH OW L", worth: "W ER TH", work: "W ER K",
  works: "W ER K S", most: "M OW S T", first: "F ER S T", now: "N AW",
  new: "N UW", know: "N OW", no: "N OW", go: "G OW", so: "S OW",
  do: "D UW", too: "T UW", who_s: "HH UW Z", don: "D OW N",
  their: "DH EH R", our: "AW ER", out: "AW T", about: "AH B AW T",
  time: "T AY M", times: "T AY M Z", same: "S EY M", more: "M AO R",
  less: "L EH S", than: "DH AE N", then: "DH EH N", each: "IY CH",
  extra: "EH K S T R AH", never: "N EH V ER", ever: "EH V ER",
  here: "HH IH R", hear: "HH IH R", have: "HH AE V", has: "HH AE Z",
  had: "HH AE D", give: "G IH V", gives: "G IH V Z", put: "P UH T",
  take: "T EY K", takes: "T EY K S", make: "M EY K", makes: "M EY K S",
  wait: "W EY T", waiting: "W EY T IH NG", start: "S T AA R T",
  started: "S T AA R T AH D", stop: "S T AA P", keep: "K IY P",
  double: "D AH B AH L", doubles: "D AH B AH L Z", triple: "T R IH P AH L",
  deposit: "D IH P AA Z AH T", deposits: "D IH P AA Z AH T S",
  becomes: "B IH K AH M Z", become: "B IH K AH M",
  // the /ʌf/ and /uː/ readings of -ough, which the rule below spells as AO
  rough: "R AH F", tough: "T AH F", cough: "K AO F", laugh: "L AE F",
  bough: "B AW", plough: "P L AW", thorough: "TH ER OW",
};

/** Consonant letters, for the "is the next letter a vowel" tests below. */
const VOW = "aeiou";
const isV = (c) => VOW.includes(c);

/**
 * Letters to phonemes.
 *
 * Ordered longest-first within each starting letter: "tion" must be tried
 * before "ti", and "ch" before "c", or the shorter rule eats the cluster. Each
 * entry is [spelling, phonemes, guard?] where guard(rest, before, whole, i)
 * decides whether the rule applies here.
 *
 * The guards do the work English spelling refuses to: a final `e` is silent and
 * lengthens the vowel before it, `c` is /s/ before e/i/y, `g` usually is too,
 * and a doubled consonant is one sound.
 */
const silentE = (rest) => rest === "e" || rest === "es" || rest === "ed";
const softNext = (rest) => "eiy".includes(rest[0]);

const RULES = [
  // suffixes with a mind of their own. `ough` is the worst spelling in the
  // language and has no majority reading; AO covers bought/thought/brought,
  // which is what a finance script actually says. The /Vf/ readings (rough,
  // tough, cough) and /uː/ (through) are in the lexicon instead.
  ["ough", "AO"], ["augh", "AO"], ["tion", "SH AH N"], ["sion", "ZH AH N"],
  ["cian", "SH AH N"], ["tien", "SH AH N"], ["cien", "SH AH N"],
  ["cious", "SH AH S"], ["tious", "SH AH S"],
  ["ture", "CH ER"], ["sure", "ZH ER"], ["cial", "SH AH L"],
  ["ight", "AY T"], ["eigh", "EY"], ["ing", "IH NG"], ["igh", "AY"],
  ["dge", "JH"], ["tch", "CH"], ["que", "K"],
  // -le is a syllable: "little" is three sounds at the end, not two.
  ["le", "AH L", (rest, before) => rest === "" && !isV(before[before.length - 1])],
  // -ed is only a syllable after t or d: "waited" yes, "worked" no.
  ["ed", "AH D", (rest, before) => rest === "" && /[td]$/.test(before)],
  ["ed", "D", (rest) => rest === ""],

  // consonant digraphs
  ["sch", "S K"], ["chr", "K R"], ["sh", "SH"], ["ph", "F"], ["gh", ""],
  ["ch", "CH"], ["th", "TH"], ["wh", "W"], ["ck", "K"], ["ng", "NG"],
  ["qu", "K W"], ["wr", "R"], ["kn", "N"], ["gn", "N"], ["ps", "S"],
  ["mb", "M", (rest) => rest === ""], ["mn", "M", (rest) => rest === ""],

  // vowel teams
  ["eau", "OW"], ["iou", "IY AH"], ["oo", "UW"], ["ee", "IY"], ["ea", "IY"],
  ["ie", "IY"], ["ei", "EY"], ["ai", "EY"], ["ay", "EY"], ["oa", "OW"],
  ["oe", "OW"], ["oi", "OY"], ["oy", "OY"], ["ou", "AW"], ["ow", "AW"],
  ["au", "AO"], ["aw", "AO"], ["ew", "UW"], ["ue", "UW"], ["ui", "UW"],
  ["eu", "UW"],

  // r-coloured vowels: the r swallows the vowel, so these are one sound
  ["ar", "AA R"], ["or", "AO R"], ["er", "ER"], ["ir", "ER"], ["ur", "ER"],
  ["yr", "ER"],

  // single vowels — long when a silent e follows one consonant, else short
  ["a", "EY", (rest) => /^[^aeiou]e$/.test(rest)],
  ["e", "IY", (rest) => /^[^aeiou]e$/.test(rest)],
  ["i", "AY", (rest) => /^[^aeiou]e$/.test(rest)],
  ["o", "OW", (rest) => /^[^aeiou]e$/.test(rest)],
  ["u", "UW", (rest) => /^[^aeiou]e$/.test(rest)],
  // "future", "value", "usual" — u before a consonant + e glides.
  ["u", "Y UW", (rest) => /^(ture|te|re|me|ne|de|be|pe)$/.test(rest)],
  ["a", "AE"], ["e", "EH", (rest) => rest !== ""], ["e", ""],
  ["i", "AY", (rest) => rest === "o"], ["i", "IH"], ["o", "AA"], ["u", "AH"],
  // A final y is /aɪ/ only in a word that has no other vowel — "my", "try",
  // "dry". Everything else ("wealthy", "ninety", "money") is /i/.
  ["y", "AY", (rest, before) => rest === "" && ![...before].some(isV)],
  ["y", "IY", (rest) => rest === ""],
  ["y", "Y"],

  // single consonants
  ["c", "S", (rest) => softNext(rest)], ["c", "K"],
  ["g", "JH", (rest) => softNext(rest) && rest !== "e"], ["g", "G"],
  ["s", "Z", (rest, before) => rest === "" && before.length > 1 && isV(before[before.length - 1])],
  ["s", "S"],
  ["x", "K S"], ["b", "B"], ["d", "D"], ["f", "F"], ["h", "HH"],
  ["j", "JH"], ["k", "K"], ["l", "L"], ["m", "M"], ["n", "N"],
  ["p", "P"], ["r", "R"], ["t", "T"], ["v", "V"], ["w", "W"], ["z", "Z"],
];

/** Spell out a word. Returns ARPAbet with no stress marks. */
export function g2p(raw) {
  const w = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return [];
  if (LEX[w]) return LEX[w].split(" ");
  // A plural or past tense of a known word is still that word.
  for (const [suf, add] of [
    ["s", "Z"], ["es", "AH Z"], ["ed", "D"], ["ing", "IH NG"],
    ["y", "IY"], ["ly", "L IY"], ["er", "ER"], ["ers", "ER Z"],
  ]) {
    const stem = w.endsWith(suf) ? LEX[w.slice(0, -suf.length)] : null;
    if (!stem) continue;
    // "-ed" is its own syllable only after t or d, so "waited" is three beats
    // of mouth and "worked" is two.
    const tail = suf === "ed" && /[TD]$/.test(stem) ? "AH D" : add;
    return [...stem.split(" "), ...tail.split(" ")];
  }

  const out = [];
  let i = 0;
  while (i < w.length) {
    // A doubled consonant is one sound: "little" is L IH T AH L, not T T.
    if (i > 0 && w[i] === w[i - 1] && !isV(w[i])) {
      i += 1;
      continue;
    }
    // A silent final e that we have already accounted for by lengthening.
    if (w[i] === "e" && i === w.length - 1 && out.length && i > 1 && !isV(w[i - 1])) {
      i += 1;
      continue;
    }
    let hit = null;
    for (const [pat, ph, guard] of RULES) {
      if (!w.startsWith(pat, i)) continue;
      const rest = w.slice(i + pat.length);
      if (guard && !guard(rest, w.slice(0, i), w, i)) continue;
      hit = [pat.length, ph];
      break;
    }
    if (!hit) { i += 1; continue; }
    if (hit[1]) out.push(...hit[1].split(" "));
    i += hit[0];
  }
  // Every word has to move the mouth. A word we failed to spell still opens it.
  return out.length ? out : ["AH"];
}

// ------------------------------------------------------- numbers to words
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven",
  "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
  "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty",
  "seventy", "eighty", "ninety"];

function small(n) {
  if (n < 20) return [ONES[n]];
  if (n < 100) return [TENS[Math.floor(n / 10)], ...(n % 10 ? [ONES[n % 10]] : [])];
  return [ONES[Math.floor(n / 100)], "hundred", ...(n % 100 ? small(n % 100) : [])];
}

/** 96000 -> ninety six thousand. Indian grouping is not modelled: the mouth
 *  cannot tell a lakh from a hundred thousand, only the caption can. */
function spellNumber(n) {
  if (n === 0) return ["zero"];
  const out = [];
  const scales = [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];
  for (const [size, name] of scales) {
    if (n >= size) {
      out.push(...small(Math.floor(n / size)), name);
      n %= size;
    }
  }
  if (n > 0) out.push(...small(n));
  return out;
}

/**
 * A written token as it is actually said. "$96,000" is five syllables and a
 * mouth has to make all of them, so the caption's spelling is no use here.
 */
export function speakable(token) {
  let t = token.trim();
  const currency = /^[₹$€£]/.test(t) ? (t[0] === "₹" ? "rupees" : "dollars") : null;
  t = t.replace(/[₹$€£]/g, "");
  const pct = /%/.test(t);
  t = t.replace(/%/g, "").replace(/,/g, "");

  const out = [];
  const num = t.match(/^-?\d+(\.\d+)?$/);
  if (num) {
    const [whole, frac] = t.replace("-", "").split(".");
    out.push(...spellNumber(parseInt(whole, 10)));
    if (frac) out.push("point", ...frac.split("").map((d) => ONES[+d]));
  } else if (/\d/.test(t)) {
    // Mixed, like "10x" or "2026". Say the digits and keep the letters.
    for (const part of t.split(/(\d+)/).filter(Boolean)) {
      if (/^\d+$/.test(part)) out.push(...spellNumber(parseInt(part, 10)));
      else out.push(part);
    }
  } else {
    out.push(...t.split(/[^A-Za-z']+/).filter(Boolean));
  }
  if (currency) out.push(currency);
  if (pct) out.push("percent");
  return out.filter(Boolean);
}

// ------------------------------------------------------------------- wav
/** Float32 or 16-bit PCM mono/stereo -> Float32Array of mono samples. */
function readWav(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString("ascii", 0, 4) !== "RIFF") throw new Error(`not a wav: ${file}`);
  let pos = 12;
  let fmt = null;
  let data = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    const body = pos + 8;
    if (id === "fmt ") {
      fmt = {
        format: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        rate: buf.readUInt32LE(body + 4),
        bits: buf.readUInt16LE(body + 14),
      };
    } else if (id === "data") {
      data = buf.subarray(body, Math.min(body + size, buf.length));
    }
    pos = body + size + (size % 2);
  }
  if (!fmt || !data) throw new Error(`malformed wav: ${file}`);

  const { channels, bits, format } = fmt;
  const bytes = bits / 8;
  const frames = Math.floor(data.length / (bytes * channels));
  const mono = new Float32Array(frames);
  for (let i = 0; i < frames; i += 1) {
    let sum = 0;
    for (let c = 0; c < channels; c += 1) {
      const at = (i * channels + c) * bytes;
      sum += format === 3 ? data.readFloatLE(at)
        : bits === 16 ? data.readInt16LE(at) / 32768
        : data.readInt32LE(at) / 2147483648;
    }
    mono[i] = sum / channels;
  }
  return { samples: mono, rate: fmt.rate };
}

/**
 * Loudness at ENV_HZ, normalised so the loudest moment of the beat is 1.
 *
 * Per-beat normalisation, not per-episode: each beat is its own take, and a
 * quietly-delivered beat should still open the mouth. Absolute normalisation
 * would leave the soft beats mumbling.
 *
 * The square root is deliberate — RMS is linear in pressure and the eye reads
 * mouth opening closer to loudness, so raw RMS makes speech look far too
 * closed between the peaks.
 */
function envelope(samples, rate) {
  const step = rate / ENV_HZ;
  const win = Math.round(step * 2.2);
  const n = Math.ceil(samples.length / step);
  const env = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const mid = Math.round(i * step);
    const a = Math.max(0, mid - win);
    const b = Math.min(samples.length, mid + win);
    let sum = 0;
    for (let j = a; j < b; j += 1) sum += samples[j] * samples[j];
    env[i] = b > a ? Math.sqrt(sum / (b - a)) : 0;
  }
  let peak = 0;
  for (const v of env) peak = Math.max(peak, v);
  if (peak <= 0) return Array.from(env);
  // A short attack and a slower release: lips close faster than they open, and
  // an envelope that decays as fast as it rises chatters on every consonant.
  const out = new Array(n);
  let held = 0;
  for (let i = 0; i < n; i += 1) {
    const v = Math.sqrt(env[i] / peak);
    held = v > held ? held + (v - held) * 0.55 : held + (v - held) * 0.28;
    out[i] = Math.round(held * 1000) / 1000;
  }
  return out;
}

// ------------------------------------------------------------ the track
/** Gap between words longer than this and the mouth goes back to rest. */
const REST_GAP = 0.13;

/**
 * One word -> its cues. Each cue is { t, v } — a shape and the moment the mouth
 * should have arrived at it. The renderer interpolates between them, so the
 * count matters more than the precision: too few and the mouth flaps, too many
 * and at 30fps they blur into a single average shape.
 */
function wordCues(word, start, end) {
  const phones = speakable(word).flatMap(g2p).filter((p) => p in VISEME);
  if (!phones.length) return [];

  // Collapse runs of the same shape. "S T" is two phonemes and one mouth.
  const groups = [];
  for (const p of phones) {
    const v = VISEME[p];
    const last = groups[groups.length - 1];
    if (last && last.v === v) last.w += DUR[p] ?? 1;
    else groups.push({ v, w: DUR[p] ?? 1 });
  }

  const total = groups.reduce((s, g) => s + g.w, 0);
  const span = Math.max(0.001, end - start);
  const cues = [];
  let at = 0;
  for (const g of groups) {
    // Placed at the group's centre. A viseme is a target the mouth passes
    // through, not a state it switches into, and centring is what makes the
    // interpolation between two of them land on the right frame.
    cues.push({ t: start + ((at + g.w / 2) / total) * span, v: g.v });
    at += g.w;
  }
  return cues;
}

function buildBeat(beat) {
  const cues = [];
  let prevEnd = null;
  for (const w of beat.words) {
    if (prevEnd !== null && w.start - prevEnd > REST_GAP) {
      cues.push({ t: prevEnd + 0.05, v: "REST" });
    }
    cues.push(...wordCues(w.w, w.start, w.end));
    prevEnd = w.end;
  }
  if (prevEnd !== null) cues.push({ t: prevEnd + 0.06, v: "REST" });

  let env = [];
  const wav = path.join(VO, path.basename(beat.file ?? `beat-${beat.n}.wav`));
  if (fs.existsSync(wav)) {
    const { samples, rate } = readWav(wav);
    env = envelope(samples, rate);
  }

  return {
    n: beat.n,
    start: beat.start,
    cues: cues.map((c) => ({ t: Math.round(c.t * 1000) / 1000, v: c.v })),
    env,
  };
}

function main() {
  const args = process.argv.slice(2);
  if (!fs.existsSync(VOICE)) {
    console.error(`no ${path.relative(ROOT, VOICE)} — run tools/align.py first`);
    process.exit(1);
  }
  const voice = JSON.parse(fs.readFileSync(VOICE, "utf8"));
  const beats = voice.beats.filter((b) => b.words?.length).map(buildBeat);

  const print = args.indexOf("--print");
  if (print !== -1) {
    const n = Number(args[print + 1]);
    const b = beats.find((x) => x.n === n) ?? beats[0];
    for (const c of b.cues) console.log(c.t.toFixed(2), c.v);
    return;
  }

  const out = { envHz: ENV_HZ, openness: OPENNESS, beats };
  fs.writeFileSync(OUT, JSON.stringify(out));
  const cues = beats.reduce((s, b) => s + b.cues.length, 0);
  console.log(
    `visemes.json: ${beats.length} beats, ${cues} cues, ` +
      `${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`,
  );
}

// A Windows-proof "am I the entrypoint" test: argv[1] comes with backslashes
// there, which never matches a file:// URL built from forward slashes.
const argv = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (argv === fileURLToPath(import.meta.url)) main();
