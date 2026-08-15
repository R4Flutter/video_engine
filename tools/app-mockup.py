"""script.json beats -> finance app mockup PNGs in video/public/footage/.

    python tools/app-mockup.py [--force] [--only N]

Port of the crime engine's chat-mockup.py / transfer-mockup.py: a beat whose
subject is a screen gets the screen *drawn* instead of hunted down as a
photograph or generated. Pure design, no AI, deterministic by beat number,
idempotent — a beat whose PNG is on disk is skipped.

The image bed (tools/fetch-imagebed.py) treats these files as supplied assets:
slot 2-2 shows the savings app (0.01% APY) and slot 3-1 shows the 401k plan
checker, so the two frames of this video that are actually UI read as UI.

Everything is drawn in the vox palette (cream paper, ink, one burnt red) so
the bed's paper scrim sits on it invisibly. No real institution, no real
account — the bank is a generic name and the account is truncated fakes.
"""

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "video/src/script.json"
OUT = ROOT / "video/public/footage"

W, H = 1080, 1920

FONT_DIR = "C:/Windows/Fonts"
SEGOE = f"{FONT_DIR}/segoeui.ttf"
SEGOE_B = f"{FONT_DIR}/segoeuib.ttf"
SEGOE_SB = f"{FONT_DIR}/seguisb.ttf"

PAPER = "#F4F1EA"
PAPER_DEEP = "#E4DED1"
INK = "#1A1A1A"
MUTED = "#8A857C"
RULE = "#C9C2B4"
ACCENT = "#D9491E"
WHITE = "#FFFFFF"

STATUS_H = 64
HEADER_H = 180
NAV_H = 170
CONTENT_TOP = STATUS_H + HEADER_H
CONTENT_BOTTOM = H - NAV_H


def font(size: int, bold: bool = False, semibold: bool = False) -> ImageFont.FreeTypeFont:
    path = SEGOE_B if bold else SEGOE_SB if semibold else SEGOE
    return ImageFont.truetype(path, size)


def round_rect(d: ImageDraw.ImageDraw, box, r: int, **kw):
    d.rounded_rectangle(box, radius=r, **kw)


def status_bar(d: ImageDraw.ImageDraw, f_time: ImageFont.FreeTypeFont) -> None:
    d.text((44, 18), "9:41", font=f_time, fill=INK)
    for i, x in enumerate(range(W - 240, W - 64, 36)):
        d.rectangle([x, 34, x + 24, 38], fill=INK if i < 3 else RULE)


def header(d: ImageDraw.ImageDraw, title: str, sub: str) -> None:
    d.text((64, STATUS_H + 34), title, font=font(62, bold=True), fill=INK)
    d.text((64, STATUS_H + 118), sub, font=font(34), fill=MUTED)


def nav(d: ImageDraw.ImageDraw, active: str) -> None:
    top = CONTENT_BOTTOM + 40
    items = [("Home", False), ("Pay", False), ("Plan", active == "Plan"), ("More", False)]
    gap = (W - 128) / len(items)
    for i, (label, on) in enumerate(items):
        x = 64 + i * gap + gap / 2
        d.text((x - 30, top + 34), label, font=font(36, semibold=on), fill=ACCENT if on else MUTED)
    d.rectangle([64, top, W - 64, top + 4], fill=RULE)


def row(
    d: ImageDraw.ImageDraw,
    y: int,
    label: str,
    value: str,
    value_color: str = INK,
    rule: bool = True,
) -> int:
    d.text((64, y), label, font=font(36), fill=MUTED)
    d.text((W - 64 - 480, y), value, font=font(44, semibold=True), fill=value_color)
    if rule:
        d.rectangle([64, y + 74, W - 64, y + 76], fill=RULE)
    return y + 100


def bank_screen(d: ImageDraw.ImageDraw) -> None:
    status_bar(d, font(34))
    header(d, "Everyday Savings", "Account •••• 4412")

    y = CONTENT_TOP + 30
    round_rect(d, [64, y, W - 64, y + 380], 28, fill=WHITE, outline=RULE, width=3)
    d.text((96, y + 42), "APY", font=font(36), fill=MUTED)
    d.text((96, y + 96), "0.01%", font=font(88, bold=True), fill=INK)
    d.text((96, y + 224), "Interest on your balance, paid monthly.", font=font(30), fill=MUTED)
    d.text((96, y + 306), "Balance  $4,250.00", font=font(40, semibold=True), fill=INK)
    y += 460

    d.text((64, y), "Accounts", font=font(30), fill=MUTED)
    y += 58
    round_rect(d, [64, y, W - 64, y + 150], 22, fill=WHITE, outline=RULE, width=3)
    d.text((96, y + 28), "Everyday Savings", font=font(38), fill=INK)
    d.text((96, y + 88), "$4,250.00", font=font(40, semibold=True), fill=INK)
    y += 200

    d.text((64, y), "Rates", font=font(30), fill=MUTED)
    y += 58
    y = row(d, y, "Savings APY", "0.01%")
    y = row(d, y, "Checking APY", "0.00%")
    row(d, y, "Learn more", ">", value_color=ACCENT, rule=False)

    nav(d, "Home")


def plan_screen(d: ImageDraw.ImageDraw) -> None:
    status_bar(d, font(34))
    header(d, "My Plan", "Retirement")

    y = CONTENT_TOP + 30
    round_rect(d, [64, y, W - 64, y + 360], 28, fill=WHITE, outline=RULE, width=3)
    d.text((96, y + 42), "Employer match", font=font(36), fill=MUTED)
    d.text((96, y + 96), "100%", font=font(88, bold=True), fill=ACCENT)
    d.text((96, y + 224), "of your contributions", font=font(30), fill=MUTED)
    d.text((96, y + 286), "up to 4% of salary", font=font(40, semibold=True), fill=INK)
    y += 440

    y = row(d, y, "Your contribution", "4%")
    y = row(d, y, "Salary", "$60,000")
    y = row(d, y, "Match per year", "$2,400", value_color=ACCENT)

    btn_y = CONTENT_BOTTOM - 250
    round_rect(d, [64, btn_y, W - 64, btn_y + 130], 24, fill=ACCENT)
    d.text(
        ((W - 320) / 2, btn_y + 38),
        "Check my match",
        font=font(44, bold=True),
        fill=WHITE,
    )

    nav(d, "Plan")


def draw(beat: int, force: bool = False) -> None:
    name = f"mockup-{beat}.png"
    dest = OUT / name
    if dest.exists() and not force:
        print(f"  beat {beat}  have {name}")
        return
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    if beat == 2:
        bank_screen(d)
    elif beat == 3:
        plan_screen(d)
    else:
        raise ValueError(f"no mockup spec for beat {beat}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest)
    print(f"  beat {beat}  {name}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-draw mockups that exist")
    ap.add_argument("--only", type=int, action="append", help="just this beat (repeatable)")
    args = ap.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf8"))
    beats = [b for b in script["beats"] if b["n"] in (2, 3)]
    if args.only:
        beats = [b for b in beats if b["n"] in set(args.only)]
    if not beats:
        print("no mockup beats in script.json (need beats 2 and 3)")
        return
    for b in beats:
        draw(b["n"], args.force)
    print(f"  review video/public/footage/ before rendering")


if __name__ == "__main__":
    main()