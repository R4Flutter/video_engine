"""The single source of truth for every image prompt in the vox finance video.

Same contract as the crime engine's vox_prompts.py: beats get a fully
art-directed prompt written against the Vox editorial documentary system,
keyed by *slot* instead of by beat, because the image bed changes the picture
every few seconds and each slot shows the narration spoken over it.

Each slot is written for the words actually spoken there (voice.json word
times), so the bed tracks the read instead of the storyboard. Rules enforced
here, by hand, per prompt:

  * ONE hero occupying ~60-70% of the frame, max 2-3 supporting elements.
  * Palette is the finance vox page: ~70% warm cream paper, 20% charcoal /
    ink-black paper-cut subjects, 10% ONE accent (burnt red, #D9491E).
  * No text, no lettering, no numbers, no labels, no arrows, no fake charts
    baked in — the engine renders its own type. Negative-space bands are left
    explicitly for Remotion's typography and motion (top third, bottom band).
  * No faces, no people except anonymous paper hands. Elements are isolated
    paper-cut shapes with clean negative space so the motion system can move
    them independently.
  * Portrait 9:16. Prompts describe a 1080x1920 frame.
  * Background is a FLAT, SOLID cream (#F4F1EA) field — generate on that and
    run tools/transparentize.py once so the plate floats over the page; or
    generate with a real transparent background if the tool supports it.
  * The same blocky toaster-sized 1970s prototype camera recurs as the story
    object across slots 1-1, 2-1, 3-1, 6-1, 6-2, 7-1, 7-3 — keep its design
    consistent: one large round lens, a stepped prism top, a small chimney
    viewfinder, squared body.

The prompts mirror prompts/kodak-bed-prompts-01.txt and -02.txt (the
10-per-file generation sheets); this table is what `npm run bed:dry` prints.
"""

# The script these prompts were written against. Keyed by slot number alone,
# they would paint this video's slot 2-1 onto whatever episode comes next —
# fetch-imagebed.py checks this before it consults the table. A new story
# art-directs in its own script (a `| **Image Prompt:** | ... |` row per beat,
# in script_vox.md) or extends this file with its own keys.
CURATED_FOR = "script_vox.md"

# Slot "b-s" -> detailed art-directed prompt. Every slot of the Kodak script
# is user-supplied (MOCKUP_SLOTS is empty), so all eleven slots have one.
PROMPTS = {
    "1-1": (
        "Two identical blocky toaster-sized 1970s prototype cameras face each "
        "other across a flat solid cream paper field, the pair the hero, "
        "centered, together occupying 65 percent of the frame: the left camera "
        "cut from deep charcoal ink paper, the right camera an exact mirror "
        "copy cut from burnt-red paper, each with one large round lens, a "
        "stepped prism top and a small chimney viewfinder. The duality is the "
        "whole composition — the same object twice, one kept and one "
        "abandoned, two faint oval paper shadows beneath them pointing toward "
        "each other. Wide empty cream bands at the top third and bottom fifth "
        "reserved for typography. Hand-cut paper collage with crisp right "
        "angles, faint halftone grain, even editorial light, matte finish, no "
        "gradients beyond the soft paper shadows. Monumental, ominous, quiet. "
        "No text, no numbers, no labels, no faces, no other objects."
    ),
    "2-1": (
        "A paper-cut engineer's workbench on a flat solid cream paper field: "
        "the blocky toaster-sized charcoal prototype camera from the hook "
        "stands center on a thin charcoal bench rectangle spanning the bottom "
        "third, beside it two tiny charcoal film canisters of different "
        "heights, one flat charcoal pencil lying at an angle with a tiny "
        "burnt-red tip, and one thin burnt-red wire curled into three loops. "
        "The camera is the hero at 45 percent of frame height; a small warm "
        "cream pool of light sits on the bench under it. Flat vector paper-cut "
        "with crisp edges, deckle on the canister rims, a soft paper shadow "
        "under every object, faint halftone grain, even editorial light. The "
        "top third of the frame is empty for typography. Laboratory, origin, "
        "discovery. No text, no numbers, no soldering, no faces, no gradients "
        "beyond the paper shadows and the warm pool, no other objects."
    ),
    "3-1": (
        "A massive vertical column of twenty stacked charcoal paper film "
        "rolls rising from the baseline to 78 percent of frame height on a "
        "flat solid cream paper field, the column the hero, dead center: each "
        "roll a clean cylinder with visible paper coil lines and a deckle "
        "rim, three of the twenty cut from burnt-red paper spaced evenly "
        "through the tower like load-bearing markers, one soft paper shadow "
        "running down the column's right side. At the column's foot, tiny, "
        "the blocky toaster-sized charcoal prototype camera from the hook, "
        "occupying only 8 percent of frame height, casting the same shadow "
        "direction. The imbalance between tower and camera is the whole "
        "composition. Flat hand-cut collage, even editorial light, matte, "
        "faint grain, no gradients beyond the paper shadow. Monolithic, "
        "entrenched, too big to question. The top third stays empty for "
        "typography. No text, no numbers, no labels, no faces, no other "
        "objects."
    ),
    "4-1": (
        "A row of three identical compact charcoal paper-cut cameras marching "
        "right in single file across a flat solid cream paper field, the row "
        "the hero, occupying the middle band of the frame: flat rounded "
        "bodies, one round lens each, a small square viewfinder notch on top, "
        "the middle camera's lens cut from burnt-red paper. Each camera is "
        "slightly larger than the one behind it, so the row reads as depth by "
        "size, and each casts a soft charcoal smear of a shadow leaning "
        "forward twenty degrees as if running. Hand-cut collage with deckle "
        "edges, even editorial light, matte, faint halftone grain, no "
        "gradients beyond the leaning shadows. Unstoppable, competitive, a "
        "wave. Wide empty cream bands at the top third and bottom fifth for "
        "typography. No text, no numbers, no logos, no brand marks, no faces, "
        "no other objects."
    ),
    "4-2": (
        "A lone charcoal paper-cut shelf edge runs across the lower third of "
        "a flat solid cream paper field; on it sits the blocky toaster-sized "
        "charcoal prototype camera, the hero, occupying 55 percent of frame "
        "height, small dust flecks as tiny charcoal specks above it. Far "
        "behind and below the shelf, small and receding toward the right "
        "edge, the three compact marching cameras from the previous slot now "
        "tiny silhouettes with one burnt-red lens, their forward-leaning "
        "shadows stretched long — they have already passed the shelf by. The "
        "static camera in front against the retreating row behind is the "
        "whole composition. Flat paper-cut collage, deckle edges, crisp "
        "shelf, even editorial light, matte, faint grain, no gradients beyond "
        "the paper shadows. Shelved, left behind, quiet. The top third stays "
        "empty for typography. No text, no numbers, no logos, no faces, no "
        "other objects."
    ),
    "5-1": (
        "A tall column of charcoal paper film rolls mid-collapse on a flat "
        "solid cream paper field, the break at one-third height: the top "
        "segment tilts thirty degrees to the right with a ragged torn edge at "
        "the break point, rolls spilling outward in a scatter across the full "
        "width of the bottom third, two burnt-red rolls prominent in the "
        "debris, three small charcoal coins caught mid-air between the "
        "segments, a thin strip of torn cream paper hanging from the break. "
        "One soft paper shadow under each fallen roll, faint dust motes as "
        "tiny charcoal specks, hand-cut collage with deckle on every torn "
        "edge and clean cylinder shapes elsewhere, even editorial light, "
        "matte, grain. Collapse, gravity, end. The top third of the frame "
        "stays empty for typography. No text, no numbers, no explosion, no "
        "fire, no faces, no gradients beyond the paper shadows, no other "
        "objects."
    ),
    "6-1": (
        "A single blocky toaster-sized charcoal paper-cut prototype camera "
        "stands centered on a low flat charcoal plinth on a solid cream paper "
        "field, the camera the hero at 60 percent of frame height: one large "
        "round lens, stepped prism top, small chimney viewfinder, a thin "
        "burnt-red film roll resting at its base like an abandoned shell. "
        "Behind the camera a flat burnt-red sun disc sits at 55 percent "
        "height at 25 percent opacity with a slightly ragged outer edge. A "
        "soft paper shadow falls down-right from the plinth. Hand-cut "
        "collage, crisp right angles on the body, deckle on the film roll, "
        "even editorial light with a faint warm halo around the camera's "
        "outline, matte, grain. Monumental, a buried monument, ironic "
        "gravity. Wide empty cream bands at the top third and bottom fifth "
        "for typography. No text, no numbers, no labels, no faces, no other "
        "objects."
    ),
    "6-2": (
        "A charcoal paper-cut hand, a simplified anonymous silhouette with "
        "four fingers and a thumb, no skin detail, rises from the bottom edge "
        "of a flat solid cream paper field, palm up, holding the blocky "
        "toaster-sized charcoal prototype camera toward the viewer, the "
        "camera the hero at 65 percent of frame height, lens facing the "
        "viewer dead center: one large round lens catching a faint warm halo, "
        "stepped prism top, small chimney viewfinder. A small flat burnt-red "
        "sun disc sits behind the camera at 55 percent height at 25 percent "
        "opacity. A paper shadow line marks where thumb meets palm; a soft "
        "shadow falls below the hand. Flat vector paper-cut with crisp camera "
        "edges and a simplified hand, deckle on the sun disc, even editorial "
        "light, matte, grain. Vindication, irony, origin. The top third "
        "stays empty for typography. No text, no numbers, no skin tones, no "
        "faces, no confetti, no gradients beyond the paper shadows and warm "
        "halo, no other objects."
    ),
    "7-1": (
        "A charcoal paper-cut hand, anonymous, no skin detail, rises from the "
        "bottom edge of a flat solid cream paper field holding the blocky "
        "toaster-sized prototype camera high above the palm line, the camera "
        "the hero, centered, occupying 70 percent of frame height, one large "
        "round lens facing the viewer directly, stepped prism top, small "
        "chimney viewfinder, the lens ring catching a warm halo. A flat "
        "burnt-red sun disc with a ragged outer edge sits at 25 percent "
        "opacity behind the camera, large, filling the negative space behind "
        "it like a signal. The arm is cut in two clean charcoal segments with "
        "a joint notch at the elbow; a soft paper shadow spreads below. Flat "
        "hand-cut collage, crisp edges, deckle on the sun disc, even "
        "editorial light, matte, faint halftone grain. Raised, defiant, a "
        "final proof. Wide empty cream bands at the top third and bottom "
        "fifth for typography. No text, no numbers, no skin tones, no faces, "
        "no gradients beyond the paper shadows and halo, no other objects."
    ),
    "7-2": (
        "A row of five empty charcoal paper-cut picture frames standing on a "
        "flat solid cream paper field, the row the hero, each frame a thin "
        "crisp rectangle with no glass and no picture inside, the middle "
        "frame's inner border cut from burnt-red paper, the frames stepping "
        "up in height from left to right like a staircase. Behind the last "
        "frame, faint at 15 percent opacity, the blocky toaster-sized "
        "prototype camera silhouette in lighter charcoal, visible only as an "
        "outline. Soft paper shadows beneath each frame, flat vector "
        "paper-cut, deckle on the red border, even editorial light, matte, "
        "grain. Absence, memory, aftermath. The top third of the frame stays "
        "empty for typography. No text, no numbers, no photos, no faces, no "
        "gradients beyond the paper shadows, no other objects."
    ),
    "7-3": (
        "The blocky toaster-sized charcoal prototype camera lies on its side "
        "on a flat solid cream paper field, the camera the hero, centered, "
        "occupying 50 percent of frame height, its round lens turned away "
        "from the viewer: around it, scattered at rest, five charcoal film "
        "rolls with deckle rims and one burnt-red roll, two small charcoal "
        "coins, and a single torn strip of cream paper lying across the "
        "camera body like a fallen flag. Every element lies flat and still "
        "with a soft paper shadow under each; faint dust motes as tiny "
        "charcoal specks hang in the air. Hand-cut collage with clean crisp "
        "edges, even editorial light, matte, faint grain, no gradients beyond "
        "the paper shadows. Stillness, aftermath, the end of the story. The "
        "top third of the frame stays empty for typography. No text, no "
        "numbers, no faces, no other objects."
    ),
}

# Appended to every prompt. Tuned to the finance vox palette in theme.ts —
# cream paper, ink black, one burnt red — so the bed sits under the page type
# instead of fighting it. No faces: nothing here is a real person.
BED_STYLE = (
    "editorial explainer illustration in the style of a Vox finance video, "
    "flat paper-cut shapes with halftone grain, solid cream paper background, "
    "deep ink black linework, single burnt red accent color, "
    "bold simple composition, generous negative space, "
    "no faces, no recognizable people, no text, no lettering, no numbers, "
    "no labels, no logos, no watermark"
)

# The place negation belongs. In the positive prompt "no text" is a vote for
# text; here it is subtracted.
BED_NEGATIVE = (
    "text, lettering, words, captions, labels, signage, logo, watermark, "
    "signature, numbers, digits, currency symbols, face, portrait, crowd, "
    "cartoon, anime, 3d render, glossy, cinematic lighting, lens flare, "
    "bokeh, gradient, clutter, arrows, charts, low quality, blurry, "
    "jpeg artifacts, deformed, extra limbs"
)