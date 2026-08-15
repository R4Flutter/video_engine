// Hands: five simple types, each a small set of strokes on the end of the
// forearm. No fingers — five of them turns a stickman into something else —
// but the type has to be readable, because a pointing hand and a fist carry
// different sentences.

import React from "react";
import { STICKMAN_STYLE } from "./constants";
import type { Vec } from "./geometry";
import type { HandType } from "./types";

const FINGER = STICKMAN_STYLE.faceStroke;

export const Hand: React.FC<{
  /** The wrist. */
  at: Vec;
  /** The elbow — the forearm direction comes from here. */
  from: Vec;
  type: HandType;
  ink: string;
  jit: (i: number) => Vec;
  i: number;
}> = ({ at, from, type, ink, jit, i }) => {
  const dx = at.x - from.x;
  const dy = at.y - from.y;
  const l = Math.hypot(dx, dy) || 1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Nudged past the wrist along the forearm so it reads as attached.
  const c = { x: at.x + (dx / l) * 4, y: at.y + (dy / l) * 4 };
  const j = jit(i);
  const r = STICKMAN_STYLE.handSize;

  const ray = (a: number, len: number, w: number = FINGER) => {
    const rad = (a * Math.PI) / 180;
    return (
      <path
        d={`M 0 0 L ${(len * Math.cos(rad)).toFixed(1)} ${(len * Math.sin(rad)).toFixed(1)}`}
        fill="none"
        stroke={ink}
        strokeWidth={w}
        strokeLinecap="round"
      />
    );
  };

  return (
    <g transform={`translate(${(c.x + j.x * 0.5).toFixed(1)} ${(c.y + j.y * 0.5).toFixed(1)}) rotate(${angle.toFixed(1)})`}>
      {type === "open" ? (
        <>
          <circle r={r * 0.9} fill={ink} />
          {/* Fingers splayed around the forearm line, thumb behind. */}
          {ray(-78, 11)}
          {ray(-24, 14)}
          {ray(26, 13)}
          {ray(132, 8)}
        </>
      ) : type === "point" ? (
        <>
          <circle r={r * 0.9} fill={ink} />
          {ray(0, 24, FINGER * 1.15)}
          {ray(-88, 9)}
        </>
      ) : type === "thumbsUp" ? (
        <>
          <circle r={r * 0.9} fill={ink} />
          {ray(-90, 17)}
        </>
      ) : (
        /* Fist and hold: a dot. The eye fills in fingers at this scale, and a
           hold hand is a fist that is slightly smaller, as if curled. */
        <circle r={type === "hold" ? r * 0.92 : r} fill={ink} />
      )}
    </g>
  );
};
