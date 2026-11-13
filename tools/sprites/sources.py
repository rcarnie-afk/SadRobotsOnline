"""Cut Rob's drawings out of the six gallery panels.

Usage: python3 tools/sprites/sources.py <dir with the six panel PNGs> <out dir>
Only the crops listed in SOURCES (Rob's own hand drawings) are written.
The panel screenshots and these crops are NOT committed: see art/source/README.md.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

PANELS = ['826d5e6e', 'a5385e67', 'b9adef0e', '5f7e5087', '9c846fa7', 'f9ac713d']

# crop id -> (title, whole-robot box inside the crop, used for)
SOURCES = {
    'p3_02': ('The Worker ("WORK?")', (15, 35, 230, 282), 'sprites: head, torso, arms, legs'),
    'p3_10': ('Butterfly robot ("TIME?")', (30, 38, 192, 262), 'sprites: head, torso; title screen; the Musician'),
    'p2_23': ('The Go-Pik 1', (10, 48, 185, 258), 'sprites: head, torso, arms, treads; townsfolk'),
    'p5_02': ('Yellow goggle robot', (28, 3, 205, 232), 'sprites: head, torso, arms'),
    'p6_08': ('Sleep-mode robot ("Sigh. Not this again.")', (55, 18, 200, 296), 'sprites: head, torso, arms, legs'),
    'p4_14': ('Dish-helm robot', (0, 28, 208, 292), 'sprites: head, legs'),
    'p3_22': ('Wheel rider', (0, 48, 138, 216), 'sprites: wheel legs'),
    'p5_20': ('Smiling twin-wheeler', (5, 18, 200, 250), 'next: head, arms, twin wheels'),
    'p6_24': ('PartyBot', (8, 58, 150, 258), 'next: full NPC (trader)'),
    'p6_19': ('Arx the Arxian', (0, 0, 200, 270), 'next: full NPC (wasteland stranger)'),
    'p2_16': ('Tray robot ("Sigh... humans are so messy")', (0, 0, 250, 182), 'next: full NPC (Archivist)'),
    'p2_26': ('The Push Pull Bot', (0, 0, 250, 250), 'next: full NPC (tow bot)'),
    'p2_27': ('Tinker Town big-job robot', (0, 0, 145, 270), 'next: full NPC'),
    'p2_30': ('Lawbot', (0, 0, 140, 270), 'next: full NPC (gate guard)'),
    'p5_24': ('Wide-eyes robot ("Why are my eyes so far apart?")', (0, 0, 195, 270), 'next: head; ambient NPC'),
    'p1_23': ('Headphones robot', (0, 0, 140, 270), 'next: ambient NPC'),
    'p1_17': ('Sitting robot in the grass', (0, 0, 170, 270), 'next: loading screen'),
    'p2_21': ('"Tinker Town" hand lettering', (0, 0, 141, 270), 'next: town sign'),
    'p2_33': ('Crawling four-legged robot', (0, 0, 140, 270), 'next: feral enemy'),
    'p6_04': ('Fist-bump robots', (0, 0, 196, 270), 'next: co-op / friends art'),
    'p4_01': ('Two-headed heavy robot', (0, 0, 140, 270), 'next: boss candidate'),
    'p6_21': ('Pencil robot, arms folded', (0, 0, 146, 270), 'next: NPC'),
    'p6_25': ('Bearded tank robot (ink)', (0, 0, 190, 270), 'next: NPC or mini-boss'),
    'p2_19': ('Antenna robot holding cells', (0, 0, 140, 270), 'next: battery trader'),
}


def crop_all(panel_dir):
    out = {}
    for pi, n in enumerate(PANELS, 1):
        im = Image.open(os.path.join(panel_dir, f'{n}-image.png')).convert('RGB')
        a = np.asarray(im).astype(int)
        bg = (abs(a[:, :, 0] - 17) < 10) & (abs(a[:, :, 1] - 17) < 10) & (abs(a[:, :, 2] - 17) < 10)
        mask = ndimage.binary_closing(~bg, structure=np.ones((5, 5)))
        lab, _ = ndimage.label(mask)
        boxes = []
        for sl in ndimage.find_objects(lab):
            y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
            if (y1 - y0) >= 120 and (x1 - x0) >= 100:
                boxes.append((y0, x0, y1, x1))
        boxes.sort(key=lambda b: (round(b[0] / 60), b[1]))
        for i, (y0, x0, y1, x1) in enumerate(boxes, 1):
            out[f'p{pi}_{i:02d}'] = im.crop((x0, y0, x1, y1))
    return out


def flatten_light(im):
    """Even out the photo lighting so paper reads as paper, keeping its tint."""
    a = np.asarray(im).astype(float)
    bgest = np.asarray(im.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(18))).astype(float)
    paper = np.median(bgest.reshape(-1, 3), axis=0)
    out = np.clip(a / np.maximum(bgest, 1) * paper * 1.04, 0, 255).astype('uint8')
    return Image.fromarray(out)


def main(panel_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    crops = crop_all(panel_dir)
    index = []
    for cid, (title, box, use) in SOURCES.items():
        im = crops[cid]
        w, h = im.size
        box = (max(0, box[0]), max(0, box[1]), min(w, box[2]), min(h, box[3]))
        flat = flatten_light(im)
        flat.save(os.path.join(out_dir, cid + '.png'))
        index.append(dict(id=cid, title=title, size=[w, h], robotBox=list(box), usedFor=use))
    json.dump(index, open(os.path.join(out_dir, 'sources.json'), 'w'), indent=1)
    print(len(index), 'source drawings written; total thumbnails found:', len(crops))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
