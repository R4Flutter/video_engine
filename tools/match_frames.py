# match_frames.py — match each video's last frame to the best beat prompt using CLIP.
#   python tools/match_frames.py
import os, sys, csv
import torch
import open_clip
from PIL import Image

BASE = r"C:\video_engine\whiteboard_clips"
PROMPT_DIR = r"C:\video_engine\prompt_whiteboard_animations_images"
FRAMES = os.path.join(BASE, "match_frames")
OUT_CSV = os.path.join(BASE, "clip_mapping.csv")

def get_prompts(path):
    raw = open(path, encoding="utf-8").read()
    return [p.strip() for p in raw.split("\n\n") if p.strip()]

# 1. Build 165 beat prompts
prompts = []  # list of {beat, pnum, text}
for bn in range(1, 68):
    fname = None
    for f in os.listdir(PROMPT_DIR):
        if f.startswith(f"beat_{bn:02d}_") and f.endswith(".md"):
            fname = f
            break
    if not fname:
        continue
    for i, p in enumerate(get_prompts(os.path.join(PROMPT_DIR, fname)), 1):
        prompts.append({"beat": bn, "pnum": i, "text": p})
print(f"Prompts: {len(prompts)}", flush=True)

# 2. Load CLIP
model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-B-32", pretrained="openai", device="cpu")
tokenizer = open_clip.get_tokenizer("ViT-B-32")
model.eval()

# 3. Embed prompts once
with torch.no_grad():
    texts = tokenizer([p["text"] for p in prompts])
    text_feats = model.encode_text(texts)
    text_feats = text_feats / text_feats.norm(dim=-1, keepdim=True)

# 4. For each video frame, find best prompt
rows = []
for fname in sorted(os.listdir(FRAMES)):
    if not fname.endswith(".png"):
        continue
    vid = fname[:-4] + ".mp4"
    img = preprocess(Image.open(os.path.join(FRAMES, fname))).unsqueeze(0)
    with torch.no_grad():
        img_feat = model.encode_image(img)
        img_feat = img_feat / img_feat.norm(dim=-1, keepdim=True)
        sims = (img_feat @ text_feats.T).squeeze(0)
        top2 = torch.topk(sims, 2)
        best = top2.indices[0].item()
        second = top2.indices[1].item()
        margin = (sims[best] - sims[second]).item()
    p = prompts[best]
    p2 = prompts[second]
    rows.append({
        "video": vid,
        "match_beat": f"beat_{p['beat']:02d}",
        "match_pnum": f"p{p['pnum']:02d}",
        "match_name": f"beat_{p['beat']:02d}_p{p['pnum']:02d}",
        "score": round(sims[best].item(), 4),
        "margin": round(margin, 4),
        "second": f"beat_{p2['beat']:02d}_p{p2['pnum']:02d}",
        "prompt": p["text"],
    })
    print(f"{vid} -> {rows[-1]['match_name']} (score {rows[-1]['score']}, margin {rows[-1]['margin']}, 2nd {rows[-1]['second']})", flush=True)

# 5. Write CSV sorted by matched beat
rows.sort(key=lambda r: (int(r["match_beat"][5:7]), int(r["match_pnum"][1:])))
with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)

# 6. Summary
from collections import Counter
conf = Counter()
for r in rows:
    conf["high" if r["margin"] >= 0.03 else ("medium" if r["margin"] >= 0.015 else "low")] += 1
print(f"\nConfidence: {dict(conf)}")
dupes = [k for k, v in Counter(r["match_name"] for r in rows).items() if v > 1]
print(f"Duplicate matches: {dupes if dupes else 'none'}")