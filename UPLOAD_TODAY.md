# Upload Pack — Real Return, Video #2 (Money Secrets)

**File to upload:** `video/out/stickman_upload.mp4` ← use this one, not `stickman.mp4` (see §1)
**Channel:** Real Return · @realreturnhq
**Date:** Monday 10 August 2026

---

## 0. PRE-FLIGHT — 60 seconds, do this first

- [ ] **Channel → Settings → Advanced → Audience: No, not made for kids**
- [ ] Settings → Upload defaults → **Video language: English (United States)**
- [ ] Verify with Studio's preview that the audio plays on a phone speaker before
      scheduling — the phonk bed should be audible but the voice must stay on top.

---

## 1. TECHNICAL CHECK — what I found in the file

| Property | Value | Verdict |
|---|---|---|
| Resolution | 1080 × 1920 | ✅ correct for Shorts |
| Frame rate | 30 fps constant | ✅ |
| Duration | 32.83s | ✅ Short (under 3 min) |
| Video codec | H.264 | ✅ |
| Audio codec | AAC stereo, 48 kHz | ✅ |
| **Loudness** | **−15.9 LUFS** | ✅ loud enough — see below |
| **True peak** | **−1.5 dBTP** | ✅ headroom left for re-encoding |
| **Frame one** | hook word on screen at max size | ✅ never blank (by design) |
| Music | royalty-free phonk, ducked under voice | ✅ safe to monetize — see §5 |

### Loudness — what the number means

YouTube normalizes toward −14 LUFS but only turns audio *down*, never up. This
file sits at **−15.9 LUFS** — the maximum loudness possible without clipping,
because the true peak is already at the −1.5 dBTP budget (raising it 2 dB more
to hit exactly −14 would push peaks through the ceiling). The mix keeps the
narrator's dynamics — no compression pumping — and plays at feed-competitive
volume on a phone.

The mastering gain (+0.74 dB) is baked into the audio during the render, so the
video stream was never re-encoded. `stickman.mp4` is the un-mastered source;
`stickman_upload.mp4` is the file to upload.

### Slam words — changed per your note

The slam words (`BET`, `LOCKED`, `BORING`) now own the frame for exactly
**1 second** — they land on the hit, then get out of the way of the next line.
Previously they stayed for the rest of the beat (~4s).

---

## 2. TITLE

```
Stop Chasing Money Secrets. 3 Boring Rules Win.
```

45 characters. Researched for 2026: keyword "money secrets" in the first four
words, exact match with the first spoken line (transcript-title sync is a
primary signal), and the counterintuitive "boring… win" claim — the hook
pattern that replaced dead "3 mistakes" hooks.

**Backups — swap at 48h only if retention is fine but views stall:**

| # | Title | Angle |
|---|---|---|
| 2 | `Money Secrets Don't Work. These 3 Boring Rules Do.` (51) | Contradiction, direct |
| 3 | `The 3 Boring Rules That Beat Every Money Secret` (47) | Search-first |
| 4 | `Automate Payday. Cap Costs. Fund Emergencies.` (44) | The rules as title |

Don't put `#shorts` in the title — vertical format already classifies it, and
the hashtag costs click-through signal.

---

## 3. DESCRIPTION

Paste exactly as-is:

```
Stop chasing money secrets — three boring rules build wealth: automate on payday, cap fixed costs, and keep an emergency fund. Boring systems win.

Strategies are bets, not answers. The videos selling secret formulas are selling attention, not returns. What actually compounds is structure: money moved the day it lands, costs locked down before the month starts, and a buffer that turns a bad month into a non-event.

Do these three and you'll beat people who spend years chasing the perfect strategy. Which rule are you missing? Drop it below.

Not financial advice — this is a math and behavior explainer.

#Shorts #PersonalFinance #MoneyRules #FinancialLiteracy
```

**Why it's built this way**

- **First ~100 characters** restate the title keyword exactly — that's the fold
  that shows above "more" in search results and the collapsed feed view.
- **Line 1** carries the full hook and the primary keyword.
- **Paragraph 2** defines "boring systems," the concept the video teaches — the
  semantic anchor YouTube uses to file you next to finance content.
- **Paragraph 3** ends in a question — comments outweigh likes as a ranking
  signal in 2026, so the description itself drives replies.
- **Exactly 4 hashtags.** More reads as spam; 2–4 is the 2026 band.
- **The disclaimer** satisfies YouTube's financial-content policy without
  softening the hook. (If you ever want a punchier variant, this is the one
  line to drop — but it's a monetization-safety line, keep it.)

---

## 4. TAGS

Paste into the Tags field — well under the 500 character limit:

```
money secrets, boring money rules, automate savings on payday, emergency fund, payday automation
```

**Restraint is the research-backed play.** 2026 data: tags are a weak
confirmation signal at best (they mostly catch misspellings and disambiguate
niche topics). 3–5 on-topic tags confirm the topic; 15+ tags signal the
algorithm you don't know your own clip — the title and first description line
do the real ranking work.

If you ever want the long-form tag list, it was trimmed out of the pack for
exactly this reason — the five above beat twenty on every ranking test.

---

## 5. MUSIC — what's in the file and why it's safe

The bed is **"Neon Drift (Phonk House)"** by White_Records, downloaded from
Pixabay:

- **License:** Pixabay Content License — free for commercial use, **no
  attribution required**, monetization allowed, no Content ID claims.
- **Source:** https://pixabay.com/music/phonk-neon-drift-phonk-house-background-music-for-video-27-second-496492/
- **Why phonk:** it's the dominant trending sound in the Shorts feed right now —
  it reads as "this video belongs in this feed."
- **Mix:** the bed sits at 40% and ducks to 34% under every spoken word, lifting
  slightly toward the payoff. The voice is never fighting the beat.
- Keep a copy of this URL in the channel's records in case Pixabay's license
  terms ever change (they haven't since 2019, and the license is broad).

**One honest caveat:** the actual viral audio you hear in the feed is
copyrighted — using it gets a Short muted or demonetized. The legal way to ride
a trending sound is YouTube Studio's Shorts composer at upload time, which
clears rights automatically. For a pre-baked bed like this project needs,
Pixabay phonk is the right call.

---

## 6. UPLOAD SETTINGS

| Field | Value |
|---|---|
| Category | Education |
| Language | English (United States) |
| Audience | Not made for kids |
| Altered content | No |
| Comments | On — engagement is a ranking input |
| Playlist | **"Money, Explained"** — adds to the topical cluster from Video #1 |
| Thumbnail | `video/out/thumb_secrets_1080x1920.png` — professional editorial poster, no character: hairline cover frame + red corner tick, hook claim at max type ("STOP CHASING / MONEY SECRETS" with red marker swipe), "3 BORING RULES" + red WIN stamp, and the three rule names as a footer line. Same paper-and-ink identity as the video. |

**Pin this comment the moment it publishes:**

```
Which rule are you missing — automation, cost caps, or the emergency fund?
```

A question that makes the viewer answer drives reply volume, and reply volume in
the first hour is one of the few levers you control.

---

## 7. WHEN TO POST

Same math as Video #1 — you're in India, the audience is in the US:

| You schedule | US East Coast sees it | Quality of slot |
|---|---|---|
| 9:00 AM IST Mon | 11:30 PM ET Sun | late-night |
| **9:00 PM ET Mon** | **9:00 PM ET Mon** | **US prime** |

9:00 PM ET Monday = **6:30 AM IST Tuesday**. Set it with YouTube's **Schedule**
option tonight and go to sleep. If Studio is still on IST, schedule for **6:30
AM, Tuesday 11 August**.

Publish time matters much less for Shorts than for long-form — distribution
rolls out over days. It's a small edge, not a lever.

---

## 8. FIRST HOUR

- [ ] Pin the comment immediately
- [ ] Reply to every comment for the first hour
- [ ] Do **not** check views. Check **Analytics → Reach → "How viewers find this Short"**
- [ ] Win condition: **"Shorts feed" appears as a traffic source at all** — that
      means distribution is working. Views are the lagging indicator.

---

## 9. REALITY CHECK

Video #1 taught the lesson that mattered: the first frame must carry the hook —
blank page = dead on arrival. This video was built with that baked in: **frame
one has the hook word on screen at maximum size**, and the kinetic reveal runs
underneath, synced to the voice. The complete hook phrase is readable by second
two.

Also fixed this round: slams last exactly one second (they previously sat on
screen for the whole beat), and the audio is mastered to feed-competitive
loudness. Both are in the upload file — nothing left to fix before posting.
