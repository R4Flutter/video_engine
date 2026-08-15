# Editorial Render Engine

The renderer's job is not to make every frame busy. Its job is to make the viewer
notice the *right* thing, at the *right* moment, with the least visual friction.

## Evidence used

The companion `R4Flutter/yt_engine` corpus currently contains 1,189 tracked
videos, 46 retention heatmaps and 13,024 aligned utterances. Its own model warns
that sentence-level findings are still low-confidence, so the renderer treats
those measurements as priors and ranks cuts rather than pretending to predict
virality.

Its current media gate is 10–24 cuts/min and a maximum static shot of 8 seconds.
One checked viral finance render in the repo is much calmer: 11.09 cuts/min with
a 7.2-second longest shot. Therefore this engine targets **visual novelty**, not
constant cutting.

## Visual hierarchy

For a business / finance beat, choose assets in this order:

1. Real archival footage, photography, documents or product imagery.
2. Evidence: a chart, filing, screenshot, receipt, quote, map or timeline.
3. Purpose-built editorial graphics derived from the beat's facts.
4. Icons and decorative shapes only as connective tissue.

The renderer should never invent a decorative scene when a factual artifact is
available.

## Shot grammar

`hold` is reserved for a claim that must be read.

`push` means the viewer should feel increasing importance: about 3–5% scale over
the shot, with a tiny lateral drift.

`pull` means context or release: reverse the push.

`punch` is a reveal or payoff: a short 6% impact hit, then settle around 3.5%
closer than the starting frame.

`settle` is a breathing move for explanatory material: slight scale and drift,
never enough to distract from captions or evidence.

A camera move and a complex staged reveal should not both peak on the same frame.
The motion budget belongs to the information with the highest narrative weight.

## Transition grammar

Default to a cut. Use a punch when the idea changes through impact. Use a page
or wipe only when the visual language itself requires it. Avoid decorative
slideshow transitions.

J-cuts and L-cuts are valuable because the next idea can begin in audio before
the picture changes; they create continuity without spending another visual
beat.

## Pacing grammar

The engine distinguishes a **shot change** from a **visual event**.

A 5–7 second shot is acceptable when it contains a camera move, a number reveal,
a chart progression, a highlighted detail or an evidence entry.

A 2-second shot is not automatically better if the viewer gets no new
information from it.

The practical target is one meaningful visual event every ~0.8–2.5 seconds,
with longer holds around high-value claims and evidence.

## CPU-first rendering rules

Do not add a heavy rendering dependency merely to make a shot feel expensive.

Prefer transform / opacity animations, static image plates, simple SVG paths and
text. Avoid large blurs, CSS filters, particle fields, WebGL and unnecessary
layout animation.

The camera is applied to the visual stage only. Captions and UI remain in the
reading layer, so the viewer does not have to chase moving text.

When stock or archival footage exists, keep it as a small number of deliberate
plates. Do not turn every beat into a video decode job.

## QA rules

A render is not ready merely because it has motion.

The director should check:

- frame zero is complete and readable;
- each beat has a narrative purpose;
- no module repeats without a meaningful visual reason;
- no long shot is visually dead;
- camera motion is motivated by the beat purpose;
- evidence gets more visual weight than decoration;
- captions never ride with the camera;
- the payoff receives the strongest visual hierarchy;
- the last frame can visually rhyme with frame zero.

## Research references

YouTube's retention guidance highlights flat sections, dips, spikes, top moments
and the first 30 seconds; it recommends moving compelling moments earlier when
they occur later in the video.

StudioBinder's camera-movement references consistently treat push-ins as a way
to focus attention on a significant subject/detail, with tracking and other
movement serving story rather than existing as decoration.

MagnatesMedia's current business-documentary packaging is explicitly described
as business mini-movies / business documentaries, while How Money Works credits
professional editing, music and selected archival footage. The common pattern
is a documentary evidence layer supported by motion graphics, not a sequence of
cartoon props.
