# displaced.py — find best prompt for the 3 displaced videos (old beat_01/02/05).
import os
import torch
import open_clip
from PIL import Image

BASE = r"C:\video_engine\whiteboard_clips"
PROMPT_DIR = r"C:\video_engine\prompt_whiteboard_animations_images"
TMP = os.path.join(BASE, "swap_tmp")
FRAMES = os.path.join(BASE, "fresh_frames")

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
    tfeats = model.encode_text(tokenizer([p["text"] for p in prompts]))
    tfeats = tfeats / tfeats.norm(dim=-1, keepdim=True)

for f in sorted(os.listdir(TMP)):
    if not f.endswith(".mp4"):
        continue
    # extract a frame quickly using PIL? no — reuse: find matching frame by hashing
    print(f, "-> check fresh_frames hash match")
    # instead of re-extracting, compare md5 of a fresh extraction... skip; just CLIP a frame
    # use ffprobe-free approach: load via opencv not available; use fresh_frames hashes below

# simplest: the 3 displaced videos' last frames == 3 existing fresh_frames (from pre-swap videos)
# old beat_01_p01/02_p01/05_p01 frames still exist in fresh_frames (they were extracted pre-swap)
for bn in ["01", "02", "05"]:
    fpath = os.path.join(FRAMES, f"beat_{bn}_p01.png")
    if not os.path.exists(fpath):
        print(f"beat_{bn}_p01.png missing"); continue
    img = preprocess(Image.open(fpath)).unsqueeze(0)
    with torch.no_grad():
        ifeat = model.encode_image(img)
        ifeat = ifeat / ifeat.norm(dim=-1, keepdim=True)
        sims = (ifeat @ tfeats.T).squeeze(0)
        top = torch.topk(sims, 3)
    print(f"old beat_{bn}_p01 frame -> best matches:")
    for s, idx in zip(top.values, top.indices):
        p = prompts[idx.item()]
        print(f"   beat_{p['beat']:02d}_p{p['pnum']:02d}  {s.item():.4f}")