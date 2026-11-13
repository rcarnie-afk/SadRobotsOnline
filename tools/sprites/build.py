"""Build part sprite sheets, the manifest and a contact sheet.

Usage: python3 tools/sprites/build.py
Sheets: art/sprites/parts/<id>.png, 32px cells.
  rows: 0 down, 1 left, 2 right, 3 up.  cols: walk frames 0-2 (cycle 0,1,2,1).
  arm sheets have 6 cols: 0-2 screen-left / near arm, 3-5 screen-right / far arm.
"""
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from px import Layer, SIZE  # noqa: E402
from parts import PARTS, PRESETS, BONE, RAMPS  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'art', 'sprites')
ROWS = ['down', 'left', 'right', 'up']
SWING_A = (-1, 0, 1)
SWING_B = (1, 0, -1)


def cell(sheet, col, row, layer):
    sheet.paste(layer.image(), (col * SIZE, row * SIZE))


def build_simple(part, animated):
    sheet = Image.new('RGBA', (3 * SIZE, 4 * SIZE), (0, 0, 0, 0))
    for r, d in enumerate(ROWS):
        v = 'side' if d in ('left', 'right') else d
        for f in range(3):
            lay = part['fn'](v, f) if animated else part['fn'](v)
            if d == 'right':
                lay = lay.mirror()
            cell(sheet, f, r, lay)
    return sheet


def build_arm(part):
    sheet = Image.new('RGBA', (6 * SIZE, 4 * SIZE), (0, 0, 0, 0))
    for r, d in enumerate(ROWS):
        for f in range(3):
            if d in ('down', 'up'):
                a = part['fn'](d, SWING_A[f], flip=False)
                b = part['fn'](d, SWING_B[f], flip=True)
            else:
                a = part['fn']('side', SWING_B[f])   # near arm swings against the near leg
                b = part['fn']('side', SWING_A[f])   # far arm
                if d == 'right':
                    a, b = a.mirror(), b.mirror()
            cell(sheet, f, r, a)
            cell(sheet, 3 + f, r, b)
    return sheet


def grab(sheet, col, row, dx=0, dy=0):
    im = sheet.crop((col * SIZE, row * SIZE, (col + 1) * SIZE, (row + 1) * SIZE))
    out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(im, (dx, dy))
    return out


def compose(sheets, meta, combo, row, f):
    """Assemble one frame exactly the way the game will."""
    d = ROWS[row]
    bob = meta[combo['legs']]['bob'][f]
    adx, ady_front, ady_side = meta[combo['torso']]['arm']
    legs = grab(sheets[combo['legs']], f, row)
    torso = grab(sheets[combo['torso']], f, row, 0, bob)
    head = grab(sheets[combo['head']], f, row, 0, bob)
    out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    if d in ('down', 'up'):
        a = grab(sheets[combo['arms']], f, row, adx, ady_front + bob)
        b = grab(sheets[combo['arms']], 3 + f, row, -adx, ady_front + bob)
        order = [legs, a, b, torso, head]
    else:
        near = grab(sheets[combo['arms']], f, row, 0, ady_side + bob)
        far = grab(sheets[combo['arms']], 3 + f, row, 0, ady_side + bob)
        order = [far, legs, torso, head, near]
    for im in order:
        out.alpha_composite(im)
    return out


def main():
    os.makedirs(os.path.join(OUT, 'parts'), exist_ok=True)
    sheets, meta, manifest = {}, {}, {'cell': SIZE, 'rows': ROWS, 'walkCycle': [0, 1, 2, 1], 'slots': {}}
    for slot, plist in PARTS.items():
        manifest['slots'][slot] = []
        for p in plist:
            sheet = build_arm(p) if slot == 'arms' else build_simple(p, slot == 'legs')
            sheet.save(os.path.join(OUT, 'parts', p['id'] + '.png'))
            sheets[p['id']] = sheet
            entry = dict(id=p['id'], name=p['name'], sheet='parts/' + p['id'] + '.png',
                         source=p['src'], sourceBox=list(p['box']),
                         status='pixel redraw from Rob\'s drawing; awaiting hand-drawn replacement')
            if 'arm' in p:
                entry['arm'] = list(p['arm'])
            if 'bob' in p:
                entry['bob'] = list(p['bob'])
            meta[p['id']] = entry
            manifest['slots'][slot].append(entry)
    manifest['presets'] = PRESETS
    manifest['paint'] = dict(key=list(BONE), options={k: list(v) for k, v in RAMPS.items()})
    json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)

    # contact sheet: each preset, 4 directions x 3 frames, 6x
    S = 6
    pad = 4
    W = 12 * (SIZE + pad) * S
    H = len(PRESETS) * (SIZE + pad) * S
    con = Image.new('RGBA', (W, H), (58, 52, 44, 255))
    for i, combo in enumerate(PRESETS):
        for row in range(4):
            for f in range(3):
                fr = compose(sheets, meta, combo, row, f).resize((SIZE * S, SIZE * S), Image.NEAREST)
                con.alpha_composite(fr, ((row * 3 + f) * (SIZE + pad) * S + pad * S // 2, i * (SIZE + pad) * S + pad * S // 2))
    con.save(os.path.join(OUT, 'contact_presets.png'))
    print('parts:', sum(len(v) for v in PARTS.values()), 'contact', con.size)


if __name__ == '__main__':
    main()
