// SwipeRisk: a hazard model for the thumb.
//
// The essay director asks "is this section weak?". A Short has to ask a
// harder question — "who leaves *here*?" — because the answer is almost never
// spread evenly. Roughly a third of a Short's audience is gone inside the
// first two seconds, and nothing that happens at second twenty can recover
// them.
//
// So this models leaving as a hazard: each beat inherits the audience the
// previous beat handed it and loses some share of it. A baseline comes from
// *when* the beat happens (early beats bleed, late beats mostly don't), and
// multipliers come from *what* the beat does. The product of the survivals is
// the projected share reaching the end.
//
// Two honest caveats, stated here so nobody reads the number as a forecast:
//
//   1. The constants are calibrated against the shape of published Shorts
//      retention curves, not against this channel's analytics. They rank two
//      cuts of the same script against each other. They do not predict views.
//   2. The model can only see the plan. A boring idea, perfectly cut, scores
//      well. The engine judges the edit, never the story.
import type { AttentionEvent, FrameZero, ScriptBeat, SwipeEstimate } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import type { AttentionProfile } from "./AttentionDirector.ts";
import { clamp, round2, wordsPerSecond } from "../util.ts";

/** Instantaneous hazard rate at a point in the video — the pressure to leave
 *  per second, not a share. Steep at the head, flattening fast: this is the
 *  shape every Shorts retention graph has.
 *
 *  Calibrated so a competently cut Short loses roughly 30% in its first three
 *  seconds and lands near 45% at thirty seconds, which is about where a good
 *  one sits. Multipliers move it from there. */
const baselineHazard = (t: number): number => {
  if (t < 1) return 0.22; // the thumb decides here
  if (t < 3) return 0.07; // the promise has to have landed
  if (t < 7) return 0.03; // committed, but still shopping
  if (t < 15) return 0.018;
  return 0.012;
};

/** Comfortable spoken pace for a Short, words per second. Outside this band
 *  the read is either a drag or a blur. */
const WPS_LOW = 2.3;
const WPS_HIGH = 4.2;

/** Past this, a frame with nothing new on it is wallpaper. */
const STALE_SECONDS = 3.0;

export type SwipeInputs = {
  beats: ScriptBeat[];
  facts: BeatFacts[];
  profiles: AttentionProfile[];
  modules: string[];
  frameZero: FrameZero;
  events: AttentionEvent[];
  /** Beats where a question is open and not yet answered. */
  openLoop: boolean[];
};

/**
 * The per-beat swipe estimate and the cumulative curve.
 *
 * Every multiplier is named in `drivers`, so the QC report can tell an author
 * *why* a beat leaks rather than handing them a number and a shrug.
 */
export const estimateSwipe = (i: SwipeInputs): SwipeEstimate[] => {
  const out: SwipeEstimate[] = [];
  let retained = 1;

  for (let k = 0; k < i.beats.length; k++) {
    const b = i.beats[k];
    const f = i.facts[k];
    const p = i.profiles[k];
    const dur = Math.max(0.2, b.end - b.start);
    const drivers: string[] = [];

    // --- baseline: the hazard integrated across the beat, because a 6s beat
    //     spanning the cliff is not the same risk as a 6s beat at second
    //     twenty. Sampled rather than solved — the rate is piecewise flat.
    let hazard = 0;
    const steps = Math.max(1, Math.ceil(dur * 4));
    for (let s = 0; s < steps; s++) hazard += baselineHazard(b.start + (s / steps) * dur) * (dur / steps);

    let mult = 1;

    // --- beat one is the whole ballgame -----------------------------------
    if (k === 0) {
      if (!i.frameZero.text) {
        mult *= 2.4;
        drivers.push("frame zero has no text at all");
      } else {
        if (!i.frameZero.glanceable) {
          mult *= 1.45;
          drivers.push(`hook is ${i.frameZero.words} words / ${i.frameZero.chars} chars — past a glance`);
        }
        if (!i.frameZero.audioSynced) {
          mult *= 1.3;
          drivers.push("on-screen hook does not match the first spoken line");
        }
        if (i.frameZero.holdFrames < 8) {
          mult *= 1.25;
          drivers.push("the complete hook is never held still long enough to read");
        }
      }
      // A claim that finishes late is a claim most of the audience never hears.
      if (i.frameZero.timeToClaim > 3) {
        mult *= 1.35;
        drivers.push(`the claim is not complete until ${i.frameZero.timeToClaim.toFixed(1)}s`);
      }
    }

    // --- curiosity: an open loop is the cheapest retention there is --------
    if (!i.openLoop[k] && f.purpose !== "cta") {
      mult *= 1.18;
      drivers.push("no open question at this point — nothing pulls the viewer forward");
    }
    if (f.reveal) {
      mult *= 0.78;
      drivers.push("carries a reveal");
    }
    if (f.numbers.length) {
      // A checkable number is a reason to stay: the viewer wants to test it.
      mult *= 0.9;
    }

    // --- staleness: how long since anything on screen changed -------------
    const lastEventBefore = i.events
      .filter((e) => e.at <= b.start)
      .reduce((max, e) => Math.max(max, e.at), 0);
    const stale = b.start - lastEventBefore;
    if (stale > STALE_SECONDS) {
      mult *= 1 + clamp((stale - STALE_SECONDS) * 0.12, 0, 0.5);
      drivers.push(`${stale.toFixed(1)}s since anything changed on screen`);
    }

    // --- repetition: the same frame language twice reads as one long beat --
    if (k > 0 && i.modules[k] === i.modules[k - 1]) {
      mult *= 1.15;
      drivers.push(`same module as the previous beat ("${i.modules[k]}")`);
    }

    // --- density: confusion and boredom are the same exit --------------
    if (p.informationDensity > 0.85) {
      mult *= 1.2;
      drivers.push("information density is high enough to lose people");
    } else if (p.informationDensity < 0.25 && f.purpose !== "cta") {
      mult *= 1.12;
      drivers.push("almost no information in this beat");
    }

    // --- pace -------------------------------------------------------------
    const wps = wordsPerSecond(b);
    if (wps < WPS_LOW) {
      mult *= 1 + clamp((WPS_LOW - wps) * 0.35, 0, 0.45);
      drivers.push(`${wps} words/sec — the read drags here`);
    } else if (wps > WPS_HIGH) {
      mult *= 1.15;
      drivers.push(`${wps} words/sec — too fast to follow`);
    }

    // --- length without a staged reveal -----------------------------------
    if (dur > 6 && p.strategy !== "progressive" && p.strategy !== "open_loop") {
      mult *= 1.22;
      drivers.push(`${dur.toFixed(1)}s on one idea with nothing staged inside it`);
    }

    // --- the ask ----------------------------------------------------------
    if (f.purpose === "cta") {
      mult *= 1.3;
      drivers.push("the ask — some leaving here is the cost of asking");
    }
    if (f.purpose === "payoff") {
      mult *= 0.8;
    }

    // Survival, not subtraction. Converting the integrated hazard through
    // exp() keeps the risk bounded below 1 no matter how many multipliers
    // stack, which a naive sum does not — and a beat that is "160% likely to
    // lose the viewer" is a modelling bug reported as a fact.
    const risk = clamp(1 - Math.exp(-hazard * mult), 0, 0.92);
    retained = retained * (1 - risk);

    out.push({
      beat: b.n,
      at: round2(b.start),
      risk: round2(risk),
      retained: round2(retained),
      drivers,
    });
  }

  return out;
};

/** The projected share reaching the final frame, 0..1. */
export const projectedRetention = (curve: SwipeEstimate[]) =>
  curve.length ? curve[curve.length - 1].retained : 0;
