// Feet: a short forward tick under the ankle. Enough shape to read direction
// and walking, nothing more — no shoes, no toes. The tick points the way the
// character is facing, and when a foot lifts off the ground on a stride it
// lifts and swings with the leg, which is what makes walking read as walking.

import React from "react";
import { STICKMAN_STYLE } from "./constants";
import type { Vec } from "./geometry";

export const Foot: React.FC<{
  /** The ankle — where the leg ends. */
  at: Vec;
  /** Lifted height (0 = planted): the toe rises with it. */
  lift?: number;
  ink: string;
  jit: (i: number) => Vec;
  i: number;
}> = ({ at, lift = 0, ink, jit, i }) => {
  const j0 = jit(i);
  const j1 = jit(i + 1);
  const ax = at.x + j0.x * 0.4;
  const ay = at.y + j0.y * 0.4;
  const tx = at.x + STICKMAN_STYLE.footSize + j1.x * 0.4;
  const ty = at.y + 4 - lift * 0.5 + j1.y * 0.4;
  const mx = (ax + tx) / 2;
  const my = (ay + ty) / 2 - 3;
  return (
    <path
      d={`M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`}
      fill="none"
      stroke={ink}
      strokeWidth={STICKMAN_STYLE.limbStroke * 0.92}
      strokeLinecap="round"
    />
  );
};
