# anchor_pnum.py — match the 3 anchor frames to exact prompts of beats 1, 2, 5.
import os
import torch
import open_clip
from PIL import Image

BASE = r"C:\video_engine\whiteboard_clips"
PROMPT_DIR = r"C:\video_engine\prompt_whiteboard_animations_images"
REFS = os.path.join(BASE, "lastframes")

def get_prompts(path):
    raw = open(path, encoding="utf-8").read()
    return [p.strip() for p in raw.split("\n\n") if p.strip()]

model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-B-32", pretrained="openai", device="cpu")
tokenizer = open_clip.get_tokenizer("ViT-B-32")
model.eval()

anchors = [
    ("01.png", 1),
    ("02.png", 2),
    ("5.png", 5),
]
for fname, beat in anchors:
    # prompts for this beat only
    bfile = next(f for f in os.listdir(PROMPT_DIR)
                 if f.startswith(f"beat_{beat:02d}_") and f.endswith(".md"))
    texts = get_prompts(os.path.join(PROMPT_DIR, bfile))
    with torch.no_grad():
        tfeats = model.encode_text(tokenizer(texts))
        tfeats = tfeats / tfeats.norm(dim=-1, keepdim=True)
        img = preprocess(Image.open(os.path.join(REFS, fname))).unsqueeze(0)
        ifeat = model.encode_image(img)
        ifeat = ifeat / ifeat.norm(dim=-1, keepdim=True)
        sims = (ifeat @ tfeats.T).squeeze(0)
    best = sims.argmax().item()
    print(f"{fname} -> beat_{beat:02d}_p{best+1:02d} (sims: {[round(s,3) for s in sims.tolist()]})")