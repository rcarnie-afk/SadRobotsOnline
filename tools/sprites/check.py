"""Checks on the generated sprite sheets. Exit code 1 on any failure.

Usage: python3 tools/sprites/check.py
"""
import json
import os
import sys

from PIL import Image, ImageOps

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'art', 'sprites')
C = 32
fails = []


def cell(im, col, row):
    return im.crop((col * C, row * C, (col + 1) * C, (row + 1) * C))


man = json.load(open(os.path.join(OUT, 'manifest.json')))
ids = set()
for slot, parts in man['slots'].items():
    for p in parts:
        ids.add(p['id'])
        path = os.path.join(OUT, p['sheet'])
        if not os.path.exists(path):
            fails.append(f"{p['id']}: sheet missing")
            continue
        im = Image.open(path).convert('RGBA')
        cols = 6 if slot == 'arms' else 3
        if im.size != (cols * C, 4 * C):
            fails.append(f"{p['id']}: size {im.size}, want {(cols * C, 4 * C)}")
            continue
        for row in range(4):
            for col in range(cols):
                c = cell(im, col, row)
                alphas = set(c.getchannel('A').tobytes())
                if alphas - {0, 255}:
                    fails.append(f"{p['id']} r{row} c{col}: soft alpha (anti-aliasing)")
                if 255 not in alphas:
                    fails.append(f"{p['id']} r{row} c{col}: empty cell")
                if slot == 'legs' and col == 1 and c.getbbox()[3] != C:
                    fails.append(f"{p['id']} r{row}: standing feet are not on the ground line")
        for col in range(cols):
            if ImageOps.mirror(cell(im, col, 1)).tobytes() != cell(im, col, 2).tobytes():
                fails.append(f"{p['id']} c{col}: right row is not the mirror of the left row")
        if slot == 'torso' and len(p.get('arm', [])) != 3:
            fails.append(f"{p['id']}: torso needs arm offsets [inward, front dy, side dy]")
        if slot == 'legs' and len(p.get('bob', [])) != 3:
            fails.append(f"{p['id']}: legs need a 3-frame bob")
        if len(p.get('sourceBox', [])) != 4 or not p.get('source'):
            fails.append(f"{p['id']}: missing source drawing reference")
for combo in man['presets']:
    for slot in ('head', 'torso', 'arms', 'legs'):
        if combo[slot] not in ids:
            fails.append(f"preset {combo['name']}: unknown part {combo[slot]}")

print(f"{len(ids)} parts checked, {len(fails)} problems")
for f in fails:
    print(' -', f)
sys.exit(1 if fails else 0)
