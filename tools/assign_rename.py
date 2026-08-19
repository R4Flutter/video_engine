# assign_rename.py — optimal 1:1 assignment: video last frame -> best beat prompt (Hungarian).
#   python tools/assign_rename.py   (writes rename plan + renames files)
import os, sys, csv, shutil
import torch
import open_clip
from PIL import Image
from scipy.optimize import linear_sum_assignment

BASE = r"C:\video_engine\whiteboard_clips"
PROMPT_DIR = r"C:\video_engine\prompt_whiteboard_animations_images"
FRAMES = os.path.join(BASE, "match_frames")

def get_prompts(path):
    raw = open(path, encoding="utf-8").read()
    return [p.strip() for p in raw.split("\n\n") if p.strip()]

prompts = []
for bn in range(1, 68):
    fname = next(f for f in os.listdir(PROMPT_DIR)
                 if f.startswith(f"beat_{bn:02d}_") and f.endswith(".md"))
    for i, p in enumerate(get_prompts(os.path.join(PROMPT_DIR, fname)), 1):
        prompts.append({"beat": bn, "pnum": i, "text": p})

model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-B-32", pretrained="openai", device="cpu")
tokenizer = open_clip.get_tokenizer("ViT-B-32")
model.eval()

with torch.no_grad():
    texts = tokenizer([p["text"] for p in prompts])
    text_feats = model.encode_text(texts)
    text_feats = text_feats / text_feats.norm(dim=-1, keepdim=True)

videos = sorted(f[:-4] for f in os.listdir(FRAMES) if f.endswith(".png"))
S = torch.zeros(len(videos), len(prompts))
with torch.no_grad():
    for i, vid in enumerate(videos):
        img = preprocess(Image.open(os.path.join(FRAMES, vid + ".png"))).unsqueeze(0)
        feat = model.encode_image(img)
        feat = feat / feat.norm(dim=-1, keepdim=True)
        S[i] = (feat @ text_feats.T).squeeze(0)

# Hungarian: maximize total similarity (negate to minimize)
row, col = linear_sum_assignment(-S.numpy())
assign = sorted(zip(col, row), key=lambda x: x[0])  # by prompt index

rows = []
for prompt_idx, vid_idx in assign:
    p = prompts[prompt_idx]
    vid = videos[vid_idx]
    sim = S[vid_idx, prompt_idx].item()
    second = torch.topk(S[vid_idx], 2).indices[1].item()
    margin = (sim - S[vid_idx, second].item())
    rows.append({
        "video": vid + ".mp4",
        "target": f"beat_{p['beat']:02d}_p{p['pnum']:02d}",
        "score": round(sim, 4),
        "margin": round(margin, 4),
    })

# CSV plan
with open(os.path.join(BASE, "rename_plan.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)

# Apply renames
os.makedirs(os.path.join(BASE, "bak"), exist_ok=True)
applied = 0
for r in rows:
    src = os.path.join(BASE, r["video"])
    dst = os.path.join(BASE, r["target"] + ".mp4")
    if not os.path.exists(src):
        continue
    if os.path.exists(dst) and os.path.abspath(src) != os.path.abspath(dst):
        shutil.move(dst, os.path.join(BASE, "bak", r["target"] + ".mp4"))
    os.rename(src, dst)
    applied += 1

# Report
conf = {"high": 0, "medium": 0, "low": 0}
for r in rows:
    conf["high" if r["margin"] >= 0.03 else ("medium" if r["margin"] >= 0.015 else "low")] += 1
print(f"Renamed {applied} clips")
print(f"Confidence: {conf}")
print("\nLOW-confidence matches (margin < 0.015) — check manually:")
for r in rows:
    if r["margin"] < 0.015:
        print(f"  {r['video']} -> {r['target']}  (score {r['score']}, margin {r['margin']})")