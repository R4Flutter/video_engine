// Motion primitives: the transitions between poses, the entrance springs and
// the blink schedule. All deterministic — a pose at time t is a function of t,
// so distributed renders stay identical.

/**
 * The pose transition curve.
 *
 * Remotion's `spring` needs a fixed start frame, and a gesture's start frame
 * moves. So the pose is smoothed with a damped step integrated from the cue's
 * own start instead — deterministic, no history.
 *
 * Critically damped for slow poses (a lazy drift that never rings) and mildly
 * underdamped for snap poses, which get a small overshoot — the "arrive and
 * settle" that reads as alive rather than as tweened. The underdamped form is
 * the standard damped-harmonic step, evaluated analytically:
 *
 *   1 - e^(-z·wn·t) · (cos(wd·t) + (z·wn/wd)·sin(wd·t))
 */
export function settle(since: number, snap = 1) {
  const t = Math.max(0.001, since);
  // Snap scales the natural frequency: a 1.8-snap pose lands in a third of the
  // time a 0.7-snap one does.
  const wn = (1.05 + snap * 0.55) * 2 * Math.PI;
  // z = 0.8 at snap 1 (≈2% overshoot), easing toward 0.62 at snap 2 (≈8%).
  const z = Math.max(0.62, 0.82 - (snap - 1) * 0.1);
  const wd = wn * Math.sqrt(1 - z * z);
  const k =
    1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + ((z * wn) / wd) * Math.sin(wd * t));
  return Math.max(0, Math.min(1, k));
}

/** A transition curve with a per-joint delay — the follow-through that makes
 *  the wrist arrive after the shoulder. `delay` is in seconds. */
export function cascade(since: number, snap: number, delay: number) {
  return settle(Math.max(0.001, since - delay), snap);
}

/** A punchy 0->1 spring for entrances, with a real overshoot. */
export function spring01(t: number, zeta = 0.45, freq = 3.2) {
  const wn = freq * 2 * Math.PI;
  const wd = wn * Math.sqrt(Math.max(0.01, 1 - zeta * zeta));
  const k =
    1 - Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + ((zeta * wn) / wd) * Math.sin(wd * t));
  return Math.max(0, Math.min(1, k));
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** 0..1 sawtooth with period `p` seconds. Deterministic, no stored phase. */
export const loop01 = (t: number, p: number) => {
  const x = t % p;
  return x < 0 ? x + p : x;
};

/**
 * Blinks.
 *
 * People blink every 2-6 seconds and almost never on a metronome, so the gaps
 * come from a hash rather than a modulo — a regular blink is more noticeable
 * than no blink at all. A blink is ~5 frames: two to close, one shut, two to
 * open, and closing faster than opening is what makes it read as a blink and
 * not a wink.
 */
export function blinkAmount(t: number) {
  let at = 1.2;
  let i = 0;
  while (at < t + 6 && i < 400) {
    const gap = 2.1 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 3.6;
    const d = t - at;
    if (d >= 0 && d < 0.17) {
      const k = d / 0.17;
      // Asymmetric: shut by 40% through, open over the rest.
      return k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6;
    }
    at += gap;
    i += 1;
  }
  return 0;
}

/** Recoil impulse: a sharp departure, an overshoot, and a settle back. Used by
 *  the reacting behaviour and by impact moments. `t` seconds since the hit. */
export function recoil(t: number, strength = 1) {
  if (t <= 0) return 0;
  const out = Math.exp(-t * 7) * Math.sin(t * 22) * strength;
  return Math.max(0, out);
}
