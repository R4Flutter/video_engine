# match_ref_frames.py — find which videos match the 3 ground-truth reference frames (01/02/5 = beats 1,2,5).
import os
import torch
import open_clip
from PIL import Image

BASE = r"C:\video_engine\whiteboard_clips"
REFS = os.path.join(BASE, "lastframes")
FRAMES = os.path.join(BASE, "fresh_frames")

model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-B-32", pretrained="openai", device="cpu")
model.eval()

def embed(path):
    img = preprocess(Image.open(path)).unsqueeze(0)
    with torch.no_grad():
        f = model.encode_image(img)
        return f / f.norm(dim=-1, keepdim=True)

refs = ["01.png", "02.png", "5.png"]
ref_feats = {r: embed(os.path.join(REFS, r)) for r in refs}

vids = sorted(f[:-4] for f in os.listdir(FRAMES) if f.endswith(".png"))
vid_feats = {}
for v in vids:
    vid_feats[v] = embed(os.path.join(FRAMES, v + ".png"))

for r in refs:
    rf = ref_feats[r].squeeze(0)
    sims = []
    for v in vids:
        s = (rf @ vid_feats[v].squeeze(0)).item()
        sims.append((s, v))
    sims.sort(reverse=True)
    print(f"\n=== {r} (user says = beat {r.replace('.png','') if r != '5.png' else 5}) top matches:")
    for s, v in sims[:10]:
        print(f"  {v}: {s:.4f}")