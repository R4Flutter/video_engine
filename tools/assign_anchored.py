# assign_anchored.py — Hungarian assignment with 3 user-verified anchors locked.
import os, csv
import torch
import open_clip
from PIL import Image
from scipy.optimize import linear_sum_assignment

BASE = r"C:\video_engine\whiteboard_clips"
PROMPT_DIR = r"C:\video_engine\prompt_whiteboard_animations_images"
FRAMES = os.path.join(BASE, "fresh_frames")
TMP = os.path.join(BASE, "swap_tmp")

# Anchors already applied in main folder: these names = verified correct content
ANCHOR_NAMES = ["beat_01_p01", "beat_02_p01", "beat_05_p01"]

def get_prompts(path):
    raw = open(path, encoding="utf-8").read()
    return [p.strip() for p in raw.split("\n\n") if p.strip()]

prompts = []
for bn in range(1, 68):
    fname = next(f for f in os.listdir(PROMPT_DIR)
                 if f.startswith(f"beat_{bn:02d}_") and f.endswith(".md"))
    for i, p in enumerate(get_prompts(os.path.join(PROMPT_DIR, fname)), 1):
        prompts.append(f"beat_{bn:02d}_p{i:02d}")

model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-B-32", pretrained="openai", device="cpu")
tokenizer = open_clip.get_tokenizer("ViT-B-32")
model.eval()

# All videos: main (except anchors) + tmp
main_videos = [f[:-4] for f in os.listdir(BASE) if f.endswith(".mp4")]
tmp_videos = [f[:-4] for f in os.listdir(TMP) if f.endswith(".mp4")]
pool_videos = [v for v in main_videos if v not in ANCHOR_NAMES] + tmp_videos
pool_targets = [p for p in prompts if p not in ANCHOR_NAMES]
print(f"Pool: {len(pool_videos)} videos x {len(pool_targets)} targets")
assert len(pool_videos) == len(pool_targets), "sizes must match"

with torch.no_grad():
    tfeats = model.encode_text(tokenizer(pool_targets))
    tfeats = tfeats / tfeats.norm(dim=-1, keepdim=True)

    S = torch.zeros(len(pool_videos), len(pool_targets))
    for i, v in enumerate(pool_videos):
        frame = os.path.join(FRAMES, v + ".png")
        if not os.path.exists(frame):
            print(f"WARN no frame for {v}")
            continue
        img = preprocess(Image.open(frame)).unsqueeze(0)
        f = model.encode_image(img)
        f = f / f.norm(dim=-1, keepdim=True)
        S[i] = (f @ tfeats.T).squeeze(0)

    row, col = linear_sum_assignment(-S.numpy())

plan = []
for a in ANCHOR_NAMES:
    plan.append({"video": a + ".mp4", "target": a, "score": "ANCHOR", "margin": "USER"})
for r, c in zip(row, col):
    plan.append({"video": pool_videos[r] + ".mp4", "target": pool_targets[c],
                 "score": round(S[r, c].item(), 4),
                 "margin": round((S[r, c] - torch.topk(S[r], 2).values[1]).item(), 4)})

with open(os.path.join(BASE, "rename_plan_anchored.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(plan[0].keys()))
    w.writeheader()
    w.writerows(plan)

from collections import Counter
dupes = [k for k, v in Counter(p["target"] for p in plan).items() if v > 1]
print(f"Plan rows: {len(plan)}, duplicate targets: {dupes if dupes else 'none'}")
conf = {"anchor": 0, "high": 0, "medium": 0, "low": 0}
for p in plan:
    if p["score"] == "ANCHOR": conf["anchor"] += 1
    elif float(p["margin"]) >= 0.03: conf["high"] += 1
    elif float(p["margin"]) >= 0.015: conf["medium"] += 1
    else: conf["low"] += 1
print(f"Confidence: {conf}")