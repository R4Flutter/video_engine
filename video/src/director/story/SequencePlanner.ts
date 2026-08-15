// SequencePlanner: a Short has no chapters. It has three or four movements,
// and the only reason to name them is so the QC can say "the mechanism runs
// eleven seconds with one register and one question" rather than pointing at
// beats individually.
//
// A sequence is a run of beats doing the same narrative work. hook, turn,
// payoff and cta are each their own sequence by definition — they are single
// beats doing single jobs.
import type { NarrativePurpose, Script, Sequence } from "../types.ts";
import type { BeatFacts } from "./StoryAnalyzer.ts";
import type { Emotion } from "../types.ts";

const RUNNABLE = new Set<NarrativePurpose>(["explain", "proof", "escalate"]);
const MAX_RUN = 3;

export const planSequences = (
  script: Script,
  facts: BeatFacts[],
  emotions: Emotion[],
): Sequence[] => {
  const beats = script.beats;
  const seqs: Sequence[] = [];
  let run: number[] = [];
  let runPurpose: NarrativePurpose | null = null;

  const flush = () => {
    if (!run.length) return;
    const first = run[0];
    const last = run[run.length - 1];
    seqs.push({
      id: `seq_${String(seqs.length + 1).padStart(2, "0")}`,
      purpose: runPurpose ?? facts[first].purpose,
      beatRange: [beats[first].n, beats[last].n],
      start: beats[first].start,
      end: beats[last].end,
      openQuestion: run.map((i) => facts[i].question).find(Boolean),
      answer: run.map((i) => facts[i].reveal).find(Boolean),
      emotion: emotions[first],
    });
    run = [];
    runPurpose = null;
  };

  facts.forEach((f, i) => {
    if (!RUNNABLE.has(f.purpose)) {
      flush();
      run = [i];
      runPurpose = f.purpose;
      flush();
      return;
    }
    if (runPurpose && f.purpose !== runPurpose) flush();
    run.push(i);
    runPurpose = f.purpose;
    if (run.length >= MAX_RUN) flush();
  });
  flush();

  return seqs;
};

export const sequenceOfBeat = (seqs: Sequence[], n: number) =>
  seqs.find((s) => n >= s.beatRange[0] && n <= s.beatRange[1]) ?? seqs[seqs.length - 1];
