"""Placeholder world art: tiles, props, enemies, item icons.

None of this comes from one of Rob's drawings. Every sheet here is listed on
the replacement log as needing his hand-drawn version.

Usage: python3 tools/sprites/world.py
Output: art/sprites/world/
"""
import os
import random

from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'art', 'sprites', 'world')
T = 16
R = random.Random(7)


def rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


def speckle(im, cols, density, rnd=R):
    w, h = im.size
    for y in range(h):
        for x in range(w):
            if rnd.random() < density:
                im.putpixel((x, y), rgb(rnd.choice(cols)))


def new(base, w=T, h=T):
    return Image.new('RGBA', (w, h), rgb(base))


def crack(im, col, n=1):
    for _ in range(n):
        x, y = R.randrange(2, 14), 0
        while y < 16 and 0 <= x < 16:
            im.putpixel((x, y), rgb(col))
            y += 1
            x += R.choice((-1, 0, 0, 1))


def sand(kind):
    im = new('#cfae74')
    speckle(im, ['#c29f66', '#c29f66', '#dcc089'], 0.2)
    d = ImageDraw.Draw(im)
    if kind == 2:
        for y0 in (4, 11):
            for x in range(16):
                im.putpixel((x, y0 + (1 if (x // 4) % 2 else 0)), rgb('#b8935a'))
    if kind == 3:
        for _ in range(3):
            x, y = R.randrange(1, 14), R.randrange(1, 14)
            d.rectangle((x, y, x + 1, y), fill=rgb('#8f7a5c'))
            im.putpixel((x, y + 1), rgb('#a58c63'))
    return im


def cracked(kind):
    im = new('#b08a5e')
    speckle(im, ['#a47d52', '#bd9769'], 0.18)
    crack(im, '#6e5236', 2 + kind)
    for x in range(16):
        if R.random() < 0.3:
            im.putpixel((x, R.randrange(16)), rgb('#6e5236'))
    return im


def rock():
    im = sand(0)
    d = ImageDraw.Draw(im)
    d.ellipse((1, 3, 14, 14), fill=rgb('#7a7268'), outline=rgb('#3d3832'))
    d.ellipse((3, 4, 10, 9), fill=rgb('#9a9288'))
    d.line((4, 12, 12, 12), fill=rgb('#5a544c'))
    d.point((6, 6), fill=rgb('#b7b0a6'))
    return im


def rubble():
    im = sand(0)
    d = ImageDraw.Draw(im)
    for (x, y, w, h) in ((1, 8, 6, 5), (7, 3, 6, 6), (9, 10, 5, 4)):
        d.rectangle((x, y, x + w, y + h), fill=rgb('#8b8a82'), outline=rgb('#3d3832'))
        d.line((x + 1, y + 1, x + w - 1, y + 1), fill=rgb('#a9a89f'))
    d.line((3, 5, 6, 2), fill=rgb('#7a4a2c'))
    return im


def plate(kind):
    im = new('#6b7078')
    speckle(im, ['#666b73', '#70757d'], 0.25)
    d = ImageDraw.Draw(im)
    d.line((0, 0, 15, 0), fill=rgb('#80868e'))
    d.line((0, 0, 0, 15), fill=rgb('#80868e'))
    d.line((0, 15, 15, 15), fill=rgb('#54595f'))
    d.line((15, 0, 15, 15), fill=rgb('#54595f'))
    if kind == 1:
        d.line((3, 11, 9, 5), fill=rgb('#5d6269'))
        d.line((10, 12, 12, 10), fill=rgb('#7a4a2c'))
    if kind == 2:
        for (x, y) in ((2, 2), (13, 2), (2, 13), (13, 13)):
            d.point((x, y), fill=rgb('#9aa0a8'))
            d.point((x + 1, y + 1), fill=rgb('#4b5056'))
    if kind == 3:
        for i in range(-16, 16, 6):
            d.line((i, 15, i + 15, 0), fill=rgb('#b58a2a'), width=2)
        for i in range(-13, 16, 6):
            d.line((i, 15, i + 15, 0), fill=rgb('#3a3a3a'), width=2)
        speckle(im, ['#6b7078'], 0.12)
    return im


def wall_top():
    im = new('#3c3f45')
    speckle(im, ['#383b40', '#42454b'], 0.2)
    d = ImageDraw.Draw(im)
    d.line((0, 0, 15, 0), fill=rgb('#54585f'))
    d.line((0, 15, 15, 15), fill=rgb('#2a2c30'))
    return im


def wall_face(window=False, door=False):
    im = new('#4d5158')
    speckle(im, ['#484c52', '#53575e'], 0.2)
    d = ImageDraw.Draw(im)
    d.line((0, 0, 15, 0), fill=rgb('#2a2c30'))
    for x in (3, 9, 12):
        d.line((x, 2, x, 2 + R.randrange(4, 11)), fill=rgb('#7a4a2c'))
    d.line((0, 15, 15, 15), fill=rgb('#2f3237'))
    d.line((0, 14, 15, 14), fill=rgb('#3f4349'))
    if window:
        d.rectangle((4, 4, 11, 10), fill=rgb('#2a2c30'))
        d.rectangle((5, 5, 10, 9), fill=rgb('#e0a040'))
        d.line((5, 5, 10, 5), fill=rgb('#ffd27a'))
        d.line((8, 5, 8, 9), fill=rgb('#2a2c30'))
    if door:
        d.rectangle((3, 2, 12, 15), fill=rgb('#1c1d20'))
        d.rectangle((4, 3, 11, 15), fill=rgb('#26282c'))
        d.point((10, 9), fill=rgb('#c98b45'))
    return im


def concrete(grass=False):
    im = new('#8b8a82')
    speckle(im, ['#84837b', '#94938b'], 0.25)
    crack(im, '#5f5e58', 1)
    if grass:
        for _ in range(7):
            x, y = R.randrange(1, 15), R.randrange(3, 15)
            im.putpixel((x, y), rgb('#6b7a3c'))
            im.putpixel((x, y - 1), rgb('#84964a'))
    return im


def ruin_top():
    im = new('#8a8275')
    speckle(im, ['#7f786c', '#958d80', '#5c6b3a'], 0.22)
    d = ImageDraw.Draw(im)
    d.line((0, 0, 15, 0), fill=rgb('#a39b8d'))
    d.line((0, 15, 15, 15), fill=rgb('#4f4a41'))
    return im


def ruin_face():
    im = new('#6a6357')
    speckle(im, ['#625c50', '#73695c'], 0.2)
    d = ImageDraw.Draw(im)
    d.line((0, 0, 15, 0), fill=rgb('#4f4a41'))
    for y in (5, 10):
        d.line((0, y, 15, y), fill=rgb('#514b42'))
    for x, y0, y1 in ((5, 0, 5), (11, 5, 10), (3, 10, 15), (13, 10, 15)):
        d.line((x, y0, x, y1), fill=rgb('#514b42'))
    for x in range(16):
        if R.random() < 0.5:
            im.putpixel((x, 15), rgb('#5c6b3a'))
            if R.random() < 0.4:
                im.putpixel((x, 14), rgb('#6f8046'))
    return im


def asphalt(line=False):
    im = new('#4a4c50')
    speckle(im, ['#45474b', '#505257', '#5a5c60'], 0.25)
    if line:
        d = ImageDraw.Draw(im)
        d.rectangle((2, 7, 9, 8), fill=rgb('#b9a86a'))
        speckle(im, ['#4a4c50'], 0.08)
    return im


def pad():
    im = plate(0)
    d = ImageDraw.Draw(im)
    d.ellipse((2, 2, 13, 13), outline=rgb('#ffb84a'))
    d.ellipse((5, 5, 10, 10), fill=rgb('#c98b45'), outline=rgb('#ffd27a'))
    return im


def grate():
    im = new('#2f3237')
    d = ImageDraw.Draw(im)
    for i in range(0, 16, 4):
        d.line((i, 0, i, 15), fill=rgb('#54595f'))
        d.line((0, i, 15, i), fill=rgb('#54595f'))
    return im


def dune():
    im = sand(0)
    d = ImageDraw.Draw(im)
    d.arc((-6, 4, 20, 22), 200, 340, fill=rgb('#b08a55'))
    d.arc((-6, 5, 20, 23), 200, 340, fill=rgb('#e0c690'))
    return im


def scrap_floor():
    im = new('#7d5a40')
    speckle(im, ['#74523a', '#8a6648', '#6b7078'], 0.3)
    d = ImageDraw.Draw(im)
    d.line((0, 7, 15, 7), fill=rgb('#5a3f2c'))
    d.line((8, 0, 8, 7), fill=rgb('#5a3f2c'))
    d.line((4, 8, 4, 15), fill=rgb('#5a3f2c'))
    return im


def gate_floor():
    im = plate(0)
    d = ImageDraw.Draw(im)
    for x0 in (3, 9):
        d.line((x0, 4, x0 + 3, 7), fill=rgb('#ffb84a'))
        d.line((x0 + 3, 8, x0, 11), fill=rgb('#ffb84a'))
    return im


def roof(base, dark, light):
    im = new(base)
    d = ImageDraw.Draw(im)
    for x in range(0, 16, 4):
        d.line((x, 0, x, 15), fill=rgb(dark))
        d.line((x + 1, 0, x + 1, 15), fill=rgb(light))
    speckle(im, [dark, '#7a4a2c'], 0.08)
    d.line((0, 15, 15, 15), fill=rgb(dark))
    return im


def shadow():
    return Image.new('RGBA', (T, T), (22, 16, 34, 96))


TILES = [
    sand(0), sand(1), sand(2), sand(3), cracked(0), cracked(1), rock(), rubble(),
    plate(0), plate(1), plate(2), plate(3), wall_top(), wall_face(), concrete(), concrete(True),
    ruin_top(), ruin_face(), asphalt(), asphalt(True), pad(), grate(), dune(), scrap_floor(),
    gate_floor(), roof('#8f3f2a', '#6e2f20', '#a85640'), roof('#3f7f78', '#2f625c', '#57998f'),
    wall_face(door=True), wall_face(window=True), new('#cfae74'), shadow(), Image.new('RGBA', (T, T), (0, 0, 0, 0)),
]

FONT = {
    'A': '010101111101101', 'C': '011100100100011', 'E': '111100110100111', 'H': '101101111101101',
    'I': '111010010010111', 'J': '001001001101010', 'K': '101101110101101', 'L': '100100100100111',
    'N': '110101101101101', 'O': '010101101101010', 'P': '110101110100100', 'R': '110101110101101',
    'S': '011100010001110', 'T': '111010010010010', 'U': '101101101101111', 'W': '101101101111101',
    ' ': '000000000000000',
}


def text(d, x, y, s, col):
    for ch in s:
        g = FONT[ch]
        for i, bit in enumerate(g):
            if bit == '1':
                d.point((x + i % 3, y + i // 3), fill=rgb(col))
        x += 4


def sign(lines):
    w = max(len(l) for l in lines) * 4 + 5
    h = 7 * len(lines) + 12
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    ph = 7 * len(lines) + 3
    d.rectangle((0, 0, w - 1, ph), fill=rgb('#7a4a2c'), outline=rgb('#2e1a12'))
    d.line((1, 1, w - 2, 1), fill=rgb('#a06a44'))
    for i, l in enumerate(lines):
        text(d, 3 + (w - 5 - len(l) * 4) // 2, 3 + i * 7, l, '#f1e6c8')
    for x in (w // 4, 3 * w // 4):
        d.rectangle((x, ph + 1, x + 1, h - 1), fill=rgb('#3d3832'))
    return im


def solar_panel(broken):
    im = Image.new('RGBA', (32, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((14, 14, 17, 22), fill=rgb('#5a4a3a'), outline=rgb('#2e1a12'))
    d.rectangle((10, 21, 21, 23), fill=rgb('#3d3832'))
    d.polygon([(2, 12), (29, 12), (27, 2), (4, 2)], fill=rgb('#1f2f4a'), outline=rgb('#121416'))
    for x in range(6, 28, 5):
        d.line((x, 3, x - 1, 11), fill=rgb('#4f7f9a'))
    d.line((3, 7, 28, 7), fill=rgb('#4f7f9a'))
    d.line((5, 3, 26, 3), fill=rgb('#7fb7c9'))
    if broken:
        d.line((9, 3, 14, 8), fill=rgb('#121416'))
        d.line((14, 8, 12, 11), fill=rgb('#121416'))
        d.line((14, 8, 19, 9), fill=rgb('#121416'))
        d.polygon([(22, 12), (29, 12), (28, 6)], fill=rgb('#7a4a2c'))
    return im


def pylon():
    im = Image.new('RGBA', (16, 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(7, 2), (8, 2), (12, 38), (3, 38)], outline=rgb('#2e1a12'), fill=rgb('#6e4a34'))
    for y in range(8, 38, 6):
        d.line((5, y, 10, y + 4), fill=rgb('#2e1a12'))
    d.line((2, 6, 13, 6), fill=rgb('#3d3832'))
    d.line((4, 12, 11, 12), fill=rgb('#3d3832'))
    d.point((7, 1), fill=rgb('#ff5a3c'))
    return im


def salvage():
    im = Image.new('RGBA', (48, 20), (0, 0, 0, 0))
    for i in range(2):
        d = ImageDraw.Draw(im)
        ox = i * 24
        d.ellipse((ox + 1, 8, ox + 22, 19), fill=rgb('#5a4a3a'), outline=rgb('#2e1a12'))
        d.rectangle((ox + 5, 5, ox + 12, 13), fill=rgb('#6b7078'), outline=rgb('#23262b'))
        d.rectangle((ox + 12, 9, ox + 19, 15), fill=rgb('#8f3f2a'), outline=rgb('#2e1a12'))
        d.line((ox + 3, 12, ox + 8, 16), fill=rgb('#c98b45'))
        if i == 0:
            d.point((ox + 8, 8), fill=rgb('#ffb84a'))
            d.point((ox + 15, 11), fill=rgb('#7fe8ff'))
            d.line((ox + 9, 2, ox + 9, 5), fill=rgb('#8c97a3'))
        else:
            d.rectangle((ox + 6, 6, ox + 11, 12), fill=rgb('#3d3832'))
    return im


def shrine():
    im = Image.new('RGBA', (48, 40), (0, 0, 0, 0))
    for i in range(2):
        d = ImageDraw.Draw(im)
        ox = i * 24
        d.rectangle((ox + 6, 30, ox + 17, 38), fill=rgb('#6a6357'), outline=rgb('#2e2a24'))
        d.rectangle((ox + 10, 16, ox + 13, 30), fill=rgb('#8a5a2b'), outline=rgb('#3a2413'))
        glow = '#ffd27a' if i else '#6e5a3a'
        rim = '#ffb84a' if i else '#8a6a3a'
        d.ellipse((ox + 3, 2, ox + 20, 19), fill=rgb(glow), outline=rgb('#3a2413'))
        d.ellipse((ox + 6, 5, ox + 17, 16), outline=rgb(rim))
        d.ellipse((ox + 10, 9, ox + 13, 12), fill=rgb('#fff3c4' if i else '#4a3d28'))
        for (x, y) in ((1, 10), (22, 10), (11, 0)):
            if i:
                d.point((ox + x, y), fill=rgb('#ffb84a'))
    return im


def workbench():
    im = Image.new('RGBA', (32, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((1, 8, 30, 14), fill=rgb('#7d5a40'), outline=rgb('#2e1a12'))
    d.line((2, 9, 29, 9), fill=rgb('#9a7450'))
    for x in (3, 26):
        d.rectangle((x, 15, x + 2, 22), fill=rgb('#3d3832'))
    d.rectangle((5, 3, 11, 8), fill=rgb('#6b7078'), outline=rgb('#23262b'))
    d.point((8, 5), fill=rgb('#7fe8ff'))
    d.line((15, 6, 22, 6), fill=rgb('#c98b45'))
    d.line((22, 6, 24, 4), fill=rgb('#8c97a3'))
    d.rectangle((25, 5, 28, 8), fill=rgb('#8f3f2a'), outline=rgb('#2e1a12'))
    return im


def mite():
    im = Image.new('RGBA', (32, 16), (0, 0, 0, 0))
    for i in range(2):
        d = ImageDraw.Draw(im)
        ox = i * 16
        d.ellipse((ox + 4, 5, ox + 11, 11), fill=rgb('#4a5058'), outline=rgb('#121416'))
        d.line((ox + 5, 6, ox + 9, 6), fill=rgb('#70777f'))
        d.point((ox + 6, 8), fill=rgb('#ff5a3c'))
        d.point((ox + 9, 8), fill=rgb('#ffb84a'))
        legs = ((3, 9, 1, 12), (12, 9, 14, 12), (4, 11, 3, 14), (11, 11, 12, 14)) if i == 0 else \
               ((3, 9, 2, 13), (12, 9, 13, 13), (4, 11, 5, 14), (11, 11, 10, 14))
        for (x0, y0, x1, y1) in legs:
            d.line((ox + x0, y0, ox + x1, y1), fill=rgb('#121416'))
        d.line((ox + 7, 4, ox + 7 + (1 if i else -1), 2), fill=rgb('#8a5a2b'))
    return im


def crawler():
    im = Image.new('RGBA', (64, 24), (0, 0, 0, 0))
    for i in range(2):
        d = ImageDraw.Draw(im)
        ox = i * 32
        for k, (x, r) in enumerate(((23, 5), (17, 6), (10, 7))):
            y = 14 + ((k + i) % 2)
            d.ellipse((ox + x - r, y - r, ox + x + r, y + r), fill=rgb('#6f7a45'), outline=rgb('#232a14'))
            d.arc((ox + x - r + 1, y - r + 1, ox + x + r - 1, y + r - 1), 200, 320, fill=rgb('#93a05e'))
        d.rectangle((ox + 6, 9, ox + 13, 12), fill=rgb('#8f3f2a'), outline=rgb('#2e1a12'))
        d.point((ox + 5, 14), fill=rgb('#d8ff7a'))
        d.point((ox + 7, 16), fill=rgb('#d8ff7a'))
        d.line((ox + 3, 17, ox + 1, 19 + i), fill=rgb('#232a14'))
        d.line((ox + 3, 13, ox + 0, 12 - i), fill=rgb('#232a14'))
        for x in (10, 17, 23):
            d.line((ox + x, 20, ox + x + (1 if i else -1), 23), fill=rgb('#232a14'))
        d.point((ox + 18, 12), fill=rgb('#b7ff5a'))
        d.point((ox + 24, 15), fill=rgb('#b7ff5a'))
    return im


def items():
    im = Image.new('RGBA', (16 * 8, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # 0 solar orb
    d.ellipse((4, 4, 11, 11), fill=rgb('#ffd27a'), outline=rgb('#c98b45'))
    d.point((6, 6), fill=rgb('#fff3c4'))
    # 1 small battery, 7 large battery
    for ox, hgt, col in ((16, 8, '#35b5a0'), (112, 11, '#ffb84a')):
        top = 13 - hgt
        d.rectangle((ox + 5, top, ox + 10, 13), fill=rgb('#3d3832'), outline=rgb('#121416'))
        d.rectangle((ox + 7, top - 2, ox + 8, top - 1), fill=rgb('#8c97a3'))
        d.rectangle((ox + 6, top + 2, ox + 9, 12), fill=rgb(col))
        d.line((ox + 6, top + 2, ox + 6, 12), fill=rgb('#f4f5f3'))
    # 2-5 oil cans: black, amber, green, blue
    for k, col in enumerate(('#23262b', '#c98b45', '#4fb53a', '#4f9fd0')):
        ox = 32 + k * 16
        d.rectangle((ox + 4, 6, ox + 11, 13), fill=rgb('#8c97a3'), outline=rgb('#1f2228'))
        d.rectangle((ox + 5, 8, ox + 10, 11), fill=rgb(col))
        d.line((ox + 6, 4, ox + 9, 4), fill=rgb('#1f2228'))
        d.line((ox + 9, 4, ox + 12, 2), fill=rgb('#1f2228'))
        d.point((ox + 5, 7), fill=rgb('#c2cad1'))
    # 6 part crate
    d.rectangle((98, 5, 109, 13), fill=rgb('#7d5a40'), outline=rgb('#2e1a12'))
    d.line((99, 9, 108, 9), fill=rgb('#2e1a12'))
    d.line((103, 6, 103, 12), fill=rgb('#c98b45'))
    d.point((104, 8), fill=rgb('#7fe8ff'))
    return im


def bolt():
    im = Image.new('RGBA', (8, 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((1, 1, 6, 6), fill=rgb('#ffb84a'))
    d.rectangle((3, 3, 4, 4), fill=rgb('#fff3c4'))
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    sheet = Image.new('RGBA', (8 * T, 4 * T), (0, 0, 0, 0))
    for i, t in enumerate(TILES):
        sheet.paste(t, ((i % 8) * T, (i // 8) * T))
    sheet.save(os.path.join(OUT, 'tiles.png'))
    for name, im in dict(solar_panel=solar_panel(False), solar_panel_broken=solar_panel(True), pylon=pylon(),
                         salvage=salvage(), shrine=shrine(), workbench=workbench(), mite=mite(), crawler=crawler(),
                         items=items(), bolt=bolt(), sign_town=sign(['TINKER', 'TOWN']),
                         sign_junction=sign(['HOPELESS', 'JUNCTION'])).items():
        im.save(os.path.join(OUT, name + '.png'))
    print('world art written:', sorted(os.listdir(OUT)))


if __name__ == '__main__':
    main()
