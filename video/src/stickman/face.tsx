// The face: brows, eyes with pupils, and a mouth. Everything is procedural
// geometry driven by a FaceParams object — no bitmaps, no emoji — so the 13
// expressions blend into each other frame to frame.
//
// The face has its own lighter stroke (see STICKMAN_STYLE.faceStroke): the
// subtle hierarchy that puts the body in front and the features behind it.

import React from "react";
import { STICKMAN_STYLE, RIG } from "./constants";
import type { Vec } from "./geometry";
import type { FaceParams, MouthKind } from "./types";
import { mouthPaths, SHAPES } from "./mouth";
import type { MouthShape } from "./mouth";
import { theme } from "../theme";

const F = RIG.face;
const vox = theme.vox;

/** The face, rendered in head-local space. `tilt` rotates the whole group so a
 *  head tilt turns the features with it; `shape` is the viseme mouth when the
 *  voice is running (it overrides the expression mouth, because speech is the
 *  louder signal). */
export const Face: React.FC<{
  head: Vec;
  tilt: number;
  turn: number;
  face: FaceParams;
  shape: MouthShape | null;
  energy: number;
  ink: string;
  paper: string;
  jit: (i: number) => Vec;
  clipId: string;
}> = ({ head, tilt, turn, face, shape, energy, ink, paper, jit, clipId }) => {
  const stroke = {
    stroke: ink,
    strokeWidth: STICKMAN_STYLE.faceStroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
    opacity: 0.92,
  };

  // The brow sits on an arc that rises with browHeight. The angle — set per
  // expression — is where the emotion lives.
  const browY = (browHeight: number) => head.y + F.brow.dy - (browHeight - 1) * 7;

  // Pupils look toward the pose's turn and the expression's drift.
  const px = face.pupilDrift.x + turn * 1.5;
  const py = face.pupilDrift.y;

  return (
    <g transform={`rotate(${tilt} ${head.x} ${head.y})`}>
      {/* Brows: drawn before the eyes so a furrow reads as a shadow over them. */}
      <Brow
        cx={head.x - F.brow.dx}
        cy={browY(face.browHeight)}
        w={F.brow.w}
        angle={face.browTiltL}
        jit={jit}
        i={50}
        stroke={stroke}
      />
      <Brow
        cx={head.x + F.brow.dx}
        cy={browY(face.browHeight)}
        w={F.brow.w}
        angle={face.browTiltR}
        jit={jit}
        i={54}
        stroke={stroke}
      />

      <Eye
        cx={head.x - F.eye.dx}
        cy={head.y + F.eye.dy}
        r={F.eye.r}
        open={face.eyeOpen}
        pupil={face.pupil}
        dx={px}
        dy={py}
        ink={ink}
      />
      <Eye
        cx={head.x + F.eye.dx}
        cy={head.y + F.eye.dy}
        r={F.eye.r}
        open={face.eyeOpen}
        pupil={face.pupil}
        dx={px}
        dy={py}
        ink={ink}
      />

      {/* The mouth. Visemes win while the voice is going. */}
      <g transform={`translate(${head.x} ${head.y + F.mouth.dy})`}>
        {shape ? (
          <VisemeMouth shape={shape} energy={energy} ink={ink} paper={paper} clipId={clipId} />
        ) : (
          <ExpressionMouth face={face} ink={ink} stroke={stroke} />
        )}
      </g>
    </g>
  );
};

/** An eye. Squashes to a line as it closes rather than shrinking, because a
 *  shrinking eye reads as the character receding and a squashing one as a lid.
 *  The pupil disappears once the lid is down. */
const Eye: React.FC<{
  cx: number; cy: number; r: number;
  open: number; pupil: number; dx: number; dy: number; ink: string;
}> = ({ cx, cy, r, open, pupil, dx, dy, ink }) => {
  const o = Math.max(0.05, open);
  const shown = o > 0.35 && pupil > 0.05;
  return (
    <g>
      <ellipse
        cx={cx}
        cy={cy}
        rx={r}
        ry={r * o}
        fill={ink}
        transform={o < 0.25 ? `scale(${1 + (0.25 - o) * 1.2} 1)` : undefined}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {shown ? (
        <circle cx={cx + dx} cy={cy + dy} r={Math.max(1.5, r * 0.42 * pupil)} fill={ink} />
      ) : null}
    </g>
  );
};

const Brow: React.FC<{
  cx: number; cy: number; w: number; angle: number;
  jit: (i: number) => Vec; i: number;
  stroke: React.SVGProps<SVGPathElement>;
}> = ({ cx, cy, w, angle, jit, i, stroke }) => {
  const j0 = jit(i);
  const j1 = jit(i + 1);
  const a = { x: cx - w / 2 + j0.x * 0.5, y: cy + j0.y * 0.5 };
  const b = { x: cx + w / 2 + j1.x * 0.5, y: cy + j1.y * 0.5 };
  return (
    <g transform={`rotate(${angle} ${cx} ${cy})`}>
      <path d={`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`} {...stroke} />
    </g>
  );
};

/** The expression mouth: a handful of shapes, each a string built from the
 *  face numbers so the envelope stays live. */
const ExpressionMouth: React.FC<{
  face: FaceParams; ink: string; stroke: React.SVGProps<SVGPathElement>;
}> = ({ face, ink, stroke }) => {
  const kind: MouthKind = face.mouth;
  const w = 22 + 46 * face.mouthWide;
  const h = 5 + 26 * face.mouthOpen;
  const c = face.mouthCurve * 13;
  const hw = w / 2;

  let d = "";
  let fill: string | undefined;
  let extra: string | undefined;

  switch (kind) {
    case "line":
      d = `M ${-hw} 0 L ${hw} 0`;
      break;
    case "smile":
      if (face.mouthOpen > 0.3) {
        // An open smile: a lens with a lifted top lip and a full bottom.
        d = `M ${-hw} 0 Q 0 ${-c * 0.5} ${hw} 0 Q 0 ${h + c * 0.9} ${-hw} 0 Z`;
        fill = ink;
      } else {
        d = `M ${-hw} 0 Q 0 ${c} ${hw} 0`;
      }
      break;
    case "frown":
      d = `M ${-hw} 0 Q 0 ${c} ${hw} 0`;
      break;
    case "open":
      d =
        `M ${-hw} 0 Q ${-hw} ${h / 2} 0 ${h / 2} Q ${hw} ${h / 2} ${hw} 0 ` +
        `Q ${hw} ${-h / 2} 0 ${-h / 2} Q ${-hw} ${-h / 2} ${-hw} 0 Z`;
      fill = ink;
      break;
    case "wavy":
      d =
        `M ${-hw} 0 Q ${-hw / 3} -6 ${-hw / 6} 0 Q 0 6 ${hw / 6} 0 ` +
        `Q ${hw / 3} -6 ${hw} 0`;
      break;
    case "smirk":
      d = `M ${-hw} 0 Q ${-hw / 4} -5 ${hw} 3`;
      break;
    case "grit":
      d = `M ${-hw} 0 L ${hw} 0`;
      extra = `M ${-hw * 0.3} 0 L ${-hw * 0.3} 4 M ${hw * 0.3} 0 L ${hw * 0.3} 4`;
      break;
    case "pucker":
      d = `M 0 -6 A 6 6 0 1 1 0 6 A 6 6 0 1 1 0 -6 Z`;
      break;
  }

  return (
    <g opacity={0.92}>
      <path d={d} {...stroke} fill={fill} opacity={fill ? 0.88 : undefined} strokeOpacity={fill ? 1 : undefined} />
      {extra ? <path d={extra} {...stroke} /> : null}
    </g>
  );
};

/** The lip-sync mouth: interior, then teeth and tongue clipped to it, then the
 *  lip line on top so the stroke always closes the shape. Same drawing as the
 *  voice engine's, restyled to the face stroke. */
const VisemeMouth: React.FC<{
  shape: MouthShape;
  energy: number;
  ink: string;
  paper: string;
  clipId: string;
}> = ({ shape, energy, ink, paper, clipId }) => {
  const mouth = mouthPaths(shape, F.mouth.w, F.mouth.h, energy);
  return (
    <>
      {mouth.open ? (
        <>
          <clipPath id={clipId}>
            <path d={mouth.lip} />
          </clipPath>
          <path d={mouth.lip} fill={ink} opacity={0.88} />
          <g clipPath={`url(#${clipId})`}>
            {mouth.tongue ? <path d={mouth.tongue} fill={vox.accent} opacity={0.75} /> : null}
            {mouth.teeth ? <path d={mouth.teeth} fill={paper} opacity={0.95} /> : null}
          </g>
        </>
      ) : null}
      <path
        d={mouth.lip}
        fill="none"
        stroke={ink}
        strokeWidth={STICKMAN_STYLE.faceStroke}
        strokeLinejoin="round"
        opacity={0.92}
      />
      {mouth.tuck ? (
        <path
          d={mouth.tuck}
          fill="none"
          stroke={ink}
          strokeWidth={STICKMAN_STYLE.faceStroke * 0.65}
          strokeLinecap="round"
          opacity={0.75}
        />
      ) : null}
    </>
  );
};

export { SHAPES };
