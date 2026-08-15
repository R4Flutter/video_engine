# B-ROLL PROMPTS — PRODUCTION VIDEO ASSETS

B-roll is a **real motion asset**, not a still image with the word “cinematic” added.

Use B-roll when physical motion or environmental realism will improve the beat. It is optional only when another asset already communicates the claim better.

## REQUIRED PROMPT FIELDS

Every B-roll asset must specify:

- exact subject and action
- environment and time period
- composition / framing
- camera position
- camera movement
- lens / perspective when useful
- realistic motion / physics
- lighting
- color treatment
- realism level
- duration target
- resolution / aspect ratio
- whether faces are allowed
- whether logos / readable text are allowed
- negative prompt

## DEFAULT FORMAT

- `1920x1080`
- MP4
- 24 or 30 fps
- 3–8 seconds
- designed to survive a 1–2 second editorial cut

## CPU-FIRST RULE

Do not require local generation, frame interpolation, optical flow, or high-memory processing. The local 16 GB CPU machine only catalogs, validates, trims, and assembles footage.

## EXAMPLE

**Filename:** `car_drive.mp4`

**Beat:** `0:04`

**Prompt:**

> Photorealistic documentary-commercial tracking shot of a modern supercar driving at speed on a clean mountain highway at golden hour, camera low behind and slightly left of the vehicle, smooth lateral tracking, believable wheel rotation, road vibration and environmental motion blur, warm natural sunlight reflecting across the bodywork, realistic asphalt and roadside vegetation, restrained contrast, subtle film grain, 35mm perspective, no visible camera rig, no text, no watermark, no deformed vehicle, 5-second continuous shot.

**Negative prompt:**

> illustration, vector, cartoon, impossible physics, duplicated wheels, warped vehicle, floating objects, fake reflections, excessive HDR, text, watermark, camera UI

## STORY-SPECIFIC B-ROLL

The rows below, when present, are episode-specific requirements. They override the default only where explicitly stated.

| Slot | Beat | Search / generation intent | Use |
|---|---|---|---|
| b1 | 0:05 | vintage roulette wheel spinning close-up | status-quo cut, 1s |
| b2 | 0:15 | old printing press feeding paper 1940s | mechanism cut, 1.5s |
| b3 | 0:38 | scissors cutting newspaper coupons hands | escalation cut, 1.5s |
| b4 | 0:48 | vintage bank vault door heavy | reveal cut, 1s |

When these are sourced rather than generated, the visual-generation prompt may be replaced by a precise stock-search query, but the manifest still records the intended shot, beat, duration, and treatment.
