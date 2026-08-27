// Typography — 29 text animation components.
// All components take TextEffectProps (text + font + position).
// Configurable per-effect knobs are passed via `config={{ ... }}` on the props.

export { TextFade } from "./TextFade";
export { TextSlide } from "./TextSlide";
export { TextRise } from "./TextRise";
export { TextDrop } from "./TextDrop";
export { TextScale } from "./TextScale";
export { TextBlurSharp } from "./TextBlurSharp";
export { Typewriter } from "./Typewriter";
export { CharByChar } from "./CharByChar";
export { WordByWord } from "./WordByWord";
export { LineByLine } from "./LineByLine";
export { TextMaskReveal } from "./TextMaskReveal";
export { TextWipeReveal } from "./TextWipeReveal";
export { Kinetic } from "./Kinetic";
export { WordEmphasis } from "./WordEmphasis";
export { NumberEmphasis } from "./NumberEmphasis";
export { OversizedNumber } from "./OversizedNumber";
export { FullScreenStatement } from "./FullScreenStatement";
export { SplitTypography } from "./SplitTypography";
export { TrackingAnimation } from "./TrackingAnimation";
export { LetterSpacingAnimation } from "./LetterSpacingAnimation";
export { WeightChange } from "./WeightChange";
export { HighlightSweep } from "./HighlightSweep";
export { UnderlineDraw } from "./UnderlineDraw";
export { StrikeThrough } from "./StrikeThrough";
export { TextDisplacement } from "./TextDisplacement";
export { TextStagger } from "./TextStagger";
export { TextStacking } from "./TextStacking";
export { TextCollision } from "./TextCollision";
export { TextSnapping } from "./TextSnapping";

export {
  resolvePos,
  useTextPosition,
  buildContainerStyle,
  baseTextStyle,
  intensityScale,
  entranceFrames,
} from "./utils";
