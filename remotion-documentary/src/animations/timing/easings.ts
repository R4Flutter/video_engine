export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuart(t: number): number {
  if (t < 0.5) return Math.pow(2 * t, 2) / 2;
  return 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutExpo(t: number): number {
  if (t === 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}

export function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 10 * t - 1) / 2;
  return (2 - Math.pow(2, -10 * t + 1)) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return Math.pow(t, 2) * ((c3 + 1) * t - c3);
}

export function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const p = 0.3;
  const s = p / 2;
  const tNorm = t - 1;
  return Math.pow(2, -10 * tNorm) * Math.sin((tNorm - s) * (2 * Math.PI) / p) + 1;
}

export function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  } else if (t < 2.5 / 2.75) {
    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  }
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
}

export function linear(t: number): number {
  return t;
}

export const cinema = easeOutQuart;

export function easeInSine(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2);
}

export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}