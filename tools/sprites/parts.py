"""Robot parts as 32x32 pixel art, each redrawn from one of Rob's sketches.

Every part function draws one view: 'down' (front), 'up' (back) or 'side'
(facing left; the right-facing row is a mirror). Coordinates are pixels on a
32x32 cell, symmetric about x = 15.5, feet on y = 30.

Slots: head y 0-12, torso y 12-23, arms hang from (x 5-9, y 14), legs y 22-30.
"""
from px import Layer

# ramps: (outline, shadow, mid, light)
BONE = ('#23262b', '#8a939c', '#cfd4d8', '#f4f5f3')
STEEL = ('#1f2228', '#5b6470', '#8c97a3', '#c2cad1')
YEL = ('#3a2c10', '#c08a1a', '#f0c425', '#ffe873')
YELP = ('#3a2c10', '#d9a92a', '#ffe066', '#fff3b0')
TEAL = ('#123b3a', '#1f7a70', '#35b5a0', '#8fe3cf')
PTEAL = ('#123b3a', '#6fb5a8', '#bfe6dc', '#e9faf4')
BROWN = ('#2e1a12', '#6e4230', '#9a6247', '#c08a6a')
RUST = ('#3b1210', '#8f2f22', '#c8492f', '#e8805e')
COPPER = ('#3a2413', '#8a5a2b', '#c98b45', '#eab676')
RUBBER = ('#121416', '#2a2e33', '#4a5058', '#70777f')
HOSE = ('#2a2c33', '#6f7380', '#a3a7b3', '#d5d8de')
GREEN = ('#12300f', '#2f7a26', '#4fb53a', '#9be07f')
DARK = '#14181d'
AMBER = '#ffb84a'
CYAN = '#7fe8ff'
NAVY = '#1b2a5a'
GLASS = ('#0f3f4a', '#2a9fb0', '#7fe0e6')

RAMPS = dict(bone=BONE, steel=STEEL, yellow=YEL, teal=TEAL, brown=BROWN,
             rust=RUST, copper=COPPER)


# ───────────────────────── heads ─────────────────────────

def head_worker(v):
    """Small boxy head with a T-shaped visor slot and a whip antenna (p3_02)."""
    c = Layer()
    if v == 'side':
        c.blob(BONE, [('rr', 12, 5, 18, 12)])
        c.rect(12, 7, 14, 7, DARK)
        c.vl(12, 8, 10, DARK)
        c.pts([(18, 4), (18, 3), (19, 2)], STEEL[2])
        c.put(19, 1, AMBER)
    else:
        c.blob(BONE, [('rr', 12, 5, 19, 12)])
        if v == 'down':
            c.hl(13, 18, 7, DARK)
            c.rect(15, 8, 16, 10, DARK)
            c.pts([(20, 5), (20, 4), (21, 3), (21, 2)], STEEL[2])
            c.put(21, 1, AMBER)
        else:
            c.hl(14, 17, 9, BONE[1])
            c.pts([(11, 5), (11, 4), (10, 3), (10, 2)], STEEL[2])
            c.put(10, 1, AMBER)
    return c.outline(BONE[0])


def head_dome(v):
    """Tall dome helmet, dark goggle visor, breather and ear discs (p3_10)."""
    c = Layer()
    if v == 'side':
        c.blob(BONE, [('e', 15.5, 6.5, 4.6, 4.6), ('r', 11, 7, 19, 11), ('rr', 12, 10, 18, 12)])
        c.rect(11, 6, 14, 8, DARK)
        c.put(12, 7, COPPER[2])
        c.blob(STEEL, [('r', 11, 9, 12, 11)])
        c.blob(STEEL, [('e', 16.5, 7.5, 1.6, 1.6)])
        c.put(16, 7, DARK)
    else:
        c.blob(BONE, [('e', 15.5, 6.5, 5, 4.6), ('r', 11, 7, 20, 11), ('rr', 12, 10, 19, 12)])
        c.blob(STEEL, [('r', 10, 7, 10, 9)], sym=True, bevel=False)
        if v == 'down':
            c.rect(12, 6, 19, 8, DARK)
            c.pts([(13, 7), (18, 7)], COPPER[2])
            c.blob(STEEL, [('r', 14, 9, 17, 11)])
            c.hl(15, 16, 10, DARK)
        else:
            c.vl(15, 3, 11, BONE[1])
            c.vl(16, 3, 11, BONE[3])
    return c.outline(BONE[0])


def head_dish(v):
    """Wide flat helmet, single lens in a slot, dish antenna on top (p4_14)."""
    c = Layer()
    if v == 'side':
        c.blob(BONE, [('rr', 10, 6, 21, 12)])
        c.blob(BONE, [('r', 14, 3, 17, 5)])
        c.rect(10, 8, 14, 10, DARK)
        c.rect(10, 9, 11, 9, CYAN)
    else:
        c.blob(BONE, [('rr', 8, 6, 23, 12)])
        c.blob(BONE, [('r', 14, 3, 17, 5)])
        if v == 'down':
            c.rect(10, 8, 21, 10, DARK)
            c.rect(15, 8, 16, 9, CYAN)
            c.pts([(14, 9), (17, 9)], STEEL[1])
        else:
            c.hl(11, 20, 9, BONE[1])
            c.hl(11, 20, 11, BONE[1])
    c.put(16, 2, STEEL[1])
    c.pts([(14, 0), (15, 1), (16, 1), (17, 0)], STEEL[3])
    return c.outline(BONE[0])


def head_goggle(v):
    """Round yellow head, teal twin goggles, propeller antenna (p5_02)."""
    c = Layer()
    if v == 'side':
        c.blob(YEL, [('e', 15.5, 7.5, 4.6, 4.8), ('r', 11, 8, 19, 12)])
        c.hl(15, 19, 7, HOSE[1])
        c.rect(11, 6, 14, 9, HOSE[3])
        c.rect(11, 7, 13, 8, GLASS[1])
        c.put(11, 7, GLASS[2])
    else:
        c.blob(YEL, [('e', 15.5, 7.5, 5, 4.8), ('r', 11, 8, 20, 12)])
        if v == 'down':
            c.rect(11, 6, 20, 9, HOSE[3])
            c.rect(12, 7, 14, 8, GLASS[1])
            c.rect(17, 7, 19, 8, GLASS[1])
            c.pts([(12, 7), (17, 7)], GLASS[2])
            c.pts([(15, 7), (16, 7), (15, 8), (16, 8)], HOSE[1])
            c.hl(11, 20, 9, YEL[2])
            c.pts([(11, 6), (20, 6)], YEL[3])
        else:
            c.hl(11, 20, 7, HOSE[1])
            c.rect(14, 9, 17, 11, YEL[1])
    c.pts([(15, 2), (16, 2)], STEEL[1])
    c.pts([(13, 0), (14, 1), (17, 1), (18, 0)], '#6f86c8')
    c.pts([(15, 1), (16, 1)], YEL[1])
    return c.outline(YEL[0])


def head_sleep(v):
    """Teal helmet with a pale centre stripe over a rust face (p6_08)."""
    c = Layer()
    if v == 'side':
        c.blob(TEAL, [('e', 15.5, 6.5, 5, 5), ('r', 11, 7, 20, 10)])
        c.rect(11, 6, 13, 9, RUST[2])
        c.hl(11, 13, 6, RUST[1])
        c.put(12, 7, NAVY)
        c.blob(PTEAL, [('r', 11, 10, 14, 12)])
        c.blob(TEAL, [('e', 17, 7.5, 1.6, 2.2)])
        c.pts([(16, 7), (17, 7), (18, 7)], TEAL[1])
        c.vl(15, 2, 3, '#d8f3ea')
    else:
        c.blob(TEAL, [('e', 15.5, 6.5, 5.5, 5), ('r', 10, 7, 21, 10)])
        c.blob(TEAL, [('r', 9, 6, 9, 9)], sym=True, bevel=False)
        if v == 'down':
            c.rect(15, 2, 16, 5, '#d8f3ea')
            c.rect(13, 6, 18, 9, RUST[2])
            c.hl(13, 18, 6, RUST[1])
            c.pts([(14, 7), (17, 7)], NAVY)
            c.blob(PTEAL, [('rr', 13, 10, 18, 12)])
            c.hl(14, 17, 11, PTEAL[1])
        else:
            c.rect(15, 2, 16, 10, '#d8f3ea')
    return c.outline(TEAL[0])


def head_gopik(v):
    """Flat-capped cylinder with a top port and one small eye port (p2_23)."""
    c = Layer()
    if v == 'side':
        c.blob(BONE, [('rr', 12, 3, 19, 12)])
        c.hl(14, 17, 4, DARK)
        c.hl(12, 19, 8, BONE[1])
        c.put(12, 10, AMBER)
        c.put(13, 10, DARK)
    else:
        c.blob(BONE, [('rr', 11, 3, 20, 12)])
        c.hl(14, 17, 4, DARK)
        c.hl(11, 20, 8, BONE[1])
        if v == 'down':
            c.hl(17, 19, 10, DARK)
            c.put(18, 10, AMBER)
        else:
            c.rect(14, 10, 17, 11, BONE[1])
    return c.outline(BONE[0])


# ───────────────────────── torsos ─────────────────────────

def torso_worker(v):
    """Broad chest with huge slotted shoulder pauldrons (p3_02)."""
    c = Layer()
    c.blob(BONE, [('rr', 11, 13, 20, 19), ('r', 12, 20, 19, 22)])
    if v == 'side':
        c.hl(12, 19, 20, BONE[1])
        c.outline(BONE[0])
        pad = Layer()
        pad.blob(BONE, [('e', 15.5, 14, 4.6, 3.4)])
        pad.hl(14, 17, 12, DARK)
        return c.over(pad.outline(BONE[0]))
    else:
        c.hl(13, 18, 20, BONE[1])
        if v == 'down':
            c.rect(14, 14, 17, 16, BONE[3])
            c.hl(14, 17, 17, BONE[1])
            c.pts([(13, 14), (18, 14)], BONE[1])
        else:
            c.hl(13, 18, 15, BONE[1])
            c.hl(13, 18, 17, BONE[1])
        c.blob(BONE, [('e', 7.5, 14.5, 3.6, 3.2)], sym=True)
        c.hl(6, 8, 13, DARK)
        c.hl(23, 25, 13, DARK)
    return c.outline(BONE[0])


def torso_kneeler(v):
    """Rounded barrel chest with name plate, ribbed belly, disc shoulders (p3_10)."""
    c = Layer()
    if v == 'side':
        c.blob(BONE, [('e', 15.5, 15.5, 5, 4), ('r', 12, 18, 19, 22)])
        c.hl(12, 19, 20, BONE[1])
        c.blob(BONE, [('e', 15.5, 14.5, 2.4, 2.4)])
        c.put(15, 14, DARK)
    else:
        c.blob(BONE, [('e', 15.5, 15.5, 6.5, 4), ('r', 12, 18, 19, 22)])
        c.hl(12, 19, 20, BONE[1])
        if v == 'down':
            c.rect(17, 13, 20, 15, BONE[3])
            c.hl(18, 20, 14, DARK)
        else:
            c.vl(15, 13, 18, BONE[1])
            c.vl(16, 13, 18, BONE[3])
        c.blob(BONE, [('e', 8, 14.5, 2.4, 2.4)], sym=True)
        c.pts([(8, 14), (23, 14)], DARK)
    return c.outline(BONE[0])


def torso_gopik(v):
    """Dome-topped barrel body with a control panel and three dots (p2_23)."""
    c = Layer()
    if v == 'side':
        c.blob(BONE, [('e', 15.5, 15, 5.5, 3.5), ('r', 10, 15, 21, 21), ('rr', 10, 20, 21, 22)])
        c.hl(10, 21, 16, BONE[1])
        c.blob(STEEL, [('e', 15.5, 15, 1.6, 1.6)], bevel=False)
        c.put(15, 15, DARK)
    else:
        c.blob(BONE, [('e', 15.5, 15, 7, 3.5), ('r', 9, 15, 22, 21), ('rr', 9, 20, 22, 22)])
        c.hl(9, 22, 16, BONE[1])
        if v == 'down':
            c.rect(11, 18, 14, 19, DARK)
            c.put(11, 18, STEEL[1])
            c.pts([(16, 19), (18, 19), (20, 19)], DARK)
        else:
            c.rect(13, 18, 18, 20, BONE[1])
            c.rect(14, 19, 17, 19, BONE[2])
    return c.outline(BONE[0])


def torso_yellow(v):
    """Yellow tunic with square shoulder pads, plate skirt and backpack (p5_02)."""
    c = Layer()
    skirt = lambda x0, x1: [('r', x0, 20, x1, 22)]
    if v == 'side':
        c.blob(YELP, [('rr', 19, 9, 23, 19)])
        c.put(21, 12, RUST[2])
        c.blob(GREEN, [('r', 20, 7, 22, 8)])
        c.blob(YEL, [('r', 12, 12, 19, 19)])
        c.hl(12, 19, 19, YEL[1])
        c.blob(YEL, [('r', 11, 20, 20, 22), ('r', 11, 23, 13, 23), ('r', 15, 23, 17, 23), ('r', 19, 23, 20, 23)])
        c.blob(YEL, [('rr', 13, 12, 18, 15)])
        c.put(14, 13, YEL[1])
    elif v == 'down':
        c.blob(YELP, [('rr', 21, 6, 25, 13)])
        c.put(24, 9, RUST[2])
        c.blob(GREEN, [('r', 22, 4, 24, 5)])
        c.blob(YEL, [('r', 11, 12, 20, 19)])
        c.hl(11, 20, 19, YEL[1])
        c.blob(YEL, [('r', 10, 20, 21, 22), ('r', 10, 23, 12, 23), ('r', 14, 23, 17, 23), ('r', 19, 23, 21, 23)])
        c.vl(13, 21, 22, YEL[1])
        c.vl(18, 21, 22, YEL[1])
        c.blob(YEL, [('rr', 7, 12, 11, 15)], sym=True)
        c.pts([(8, 13), (23, 13)], YEL[1])
    else:
        c.blob(YEL, [('r', 11, 12, 20, 19)])
        c.blob(YEL, [('r', 10, 20, 21, 22), ('r', 10, 23, 12, 23), ('r', 14, 23, 17, 23), ('r', 19, 23, 21, 23)])
        c.blob(YEL, [('rr', 7, 12, 11, 15)], sym=True)
        c.blob(YELP, [('rr', 11, 9, 20, 19)])
        c.blob(GREEN, [('r', 13, 7, 18, 8)])
        c.pts([(15, 13), (16, 13), (14, 14), (17, 14), (15, 15), (16, 15)], RUST[2])
    return c.outline(YEL[0])


def torso_sleep(v):
    """Slim brown torso, pale chest screen, teal shoulder balls (p6_08)."""
    c = Layer()
    if v == 'side':
        c.blob(BROWN, [('r', 13, 12, 18, 17), ('r', 13, 18, 17, 21)])
        c.blob(BROWN, [('rr', 12, 21, 18, 23)])
        c.hl(12, 18, 21, TEAL[2])
        c.blob(TEAL, [('e', 15.5, 13.5, 2, 2)])
    else:
        c.blob(BROWN, [('r', 11, 12, 20, 13), ('r', 12, 14, 19, 17), ('r', 13, 18, 18, 21)])
        c.blob(BROWN, [('rr', 12, 21, 19, 23)])
        c.hl(12, 19, 21, TEAL[2])
        if v == 'down':
            c.rect(15, 14, 18, 17, '#bfe6ee')
            c.pts([(15, 14), (16, 14)], '#eaf8fb')
            c.put(15, 17, BROWN[1])
        else:
            c.vl(15, 13, 19, BROWN[1])
        c.blob(TEAL, [('e', 9.5, 13.5, 2, 2)], sym=True)
    return c.outline(BROWN[0])


# ───────────────────────── arms ─────────────────────────
# Each arm function draws ONE arm at the screen-left position (flip=True draws
# its lit mirror for the screen-right arm). `s` is swing: -1, 0, +1.

def _arm_layer(flip):
    return Layer(flip=flip)


def arm_fists(v, s, flip=False):
    """Thick forearm ending in an oversized fist (p3_02)."""
    c = _arm_layer(flip)
    if v == 'side':
        c.blob(BONE, [('r', 14 + s, 14, 16 + s, 17)])
        c.blob(BONE, [('rr', 13 + 2 * s, 18, 18 + 2 * s, 23)])
        c.hl(14 + 2 * s, 17 + 2 * s, 21, BONE[1])
    else:
        c.blob(BONE, [('r', 6, 14 + s, 8, 17 + s)])
        c.blob(BONE, [('rr', 4, 18 + s, 9, 23 + s)])
        c.hl(5, 8, 21 + s, BONE[1])
        if v == 'down':
            c.pts([(6, 22 + s), (8, 22 + s)], BONE[1])
    return c.outline(BONE[0])


def arm_hose(v, s, flip=False):
    """Ribbed grey hose arm with a yellow C-claw (p5_02)."""
    c = _arm_layer(flip)
    if v == 'side':
        for i, y in enumerate(range(14, 21)):
            x = 14 + (s * i) // 3
            col = HOSE[1] if i % 2 else HOSE[2]
            c.hl(x, x + 2, y, col)
            if not i % 2:
                c.put(x, y, HOSE[3])
        x = 14 + 2 * s
        c.hl(x, x + 2, 21, YEL[2])
        c.pts([(x, 22), (x + 2, 22), (x, 23), (x + 2, 23)], YEL[2])
        c.put(x, 21, YEL[3])
    else:
        xs = [7, 6, 5, 4, 4, 4, 4]
        for i, x in enumerate(xs):
            y = 14 + i + s
            col = HOSE[1] if i % 2 else HOSE[2]
            c.hl(x, x + 2, y, col)
            if not i % 2:
                c.put(x, y, HOSE[3])
        c.hl(4, 6, 21 + s, YEL[2])
        c.put(4, 21 + s, YEL[3])
        c.pts([(4, 22 + s), (6, 22 + s), (3, 23 + s), (7, 23 + s)], YEL[2])
    return c.outline(HOSE[0])


def arm_gopik(v, s, flip=False):
    """Striped segmented arm with a round mitt hand (p2_23)."""
    c = _arm_layer(flip)
    if v == 'side':
        for i, y in enumerate(range(14, 20)):
            x = 14 + (s * i) // 3
            c.hl(x, x + 2, y, BONE[1] if i % 2 else BONE[2])
            if not i % 2:
                c.put(x, y, BONE[3])
        c.blob(BONE, [('rr', 13 + 2 * s, 20, 17 + 2 * s, 23)])
    else:
        for i in range(6):
            y = 14 + i + s
            c.hl(6, 8, y, BONE[1] if i % 2 else BONE[2])
            if not i % 2:
                c.put(6, y, BONE[3])
        c.blob(BONE, [('rr', 5, 20 + s, 9, 23 + s)])
        if v == 'down':
            c.vl(7, 22 + s, 23 + s, BONE[1])
    return c.outline(BONE[0])


def arm_gauntlet(v, s, flip=False):
    """Thin brown upper arm, big teal forearm gauntlet, small hand (p6_08)."""
    c = _arm_layer(flip)
    if v == 'side':
        c.blob(BROWN, [('r', 15 + s, 14, 16 + s, 16)])
        c.blob(BROWN, [('r', 14 + 2 * s, 23, 16 + 2 * s, 24)])
        c.blob(TEAL, [('rr', 13 + 2 * s, 17, 17 + 2 * s, 22)])
        c.put(14 + 2 * s, 18, TEAL[3])
    else:
        c.blob(BROWN, [('r', 7, 14 + s, 8, 16 + s)])
        c.blob(BROWN, [('r', 6, 23 + s, 8, 24 + s)])
        c.blob(TEAL, [('rr', 5, 17 + s, 9, 22 + s)])
        c.put(6, 18 + s, TEAL[3])
    return c.outline(BROWN[0])


# ───────────────────────── legs ─────────────────────────
# frame 0 = left foot forward, 1 = standing, 2 = right foot forward.

def _lifts(f):
    return {0: (0, 2), 1: (0, 0), 2: (2, 0)}[f]


def _side_steps(f):
    return {0: (-2, 2), 1: (0, 0), 2: (2, -2)}[f]


def legs_boots(v, f):
    """Short thick legs in huge chevron-striped boots (p3_02)."""
    c = Layer()
    if v == 'side':
        near, far = _side_steps(f)
        for dx in (far, near):
            leg = Layer()
            leg.blob(BONE, [('r', 14 + dx, 22, 17 + dx, 26)])
            leg.blob(BONE, [('rr', 11 + dx, 26, 18 + dx, 30)])
            leg.hl(12 + dx, 16 + dx, 28, BONE[1])
            leg.outline(BONE[0])
            c = c.over(leg)
        return c
    ll, lr = _lifts(f)
    for flip, lift in ((False, ll), (True, lr)):
        leg = Layer(flip=flip)
        leg.blob(BONE, [('r', 11, 22, 13, 26 - lift)])
        leg.blob(BONE, [('rr', 8, 26 - lift, 14, 30 - lift)])
        if v == 'down':
            leg.hl(9, 13, 28 - lift, BONE[1])
            leg.put(11, 27 - lift, BONE[1])
        else:
            leg.hl(10, 13, 27 - lift, BONE[1])
        leg.outline(BONE[0])
        c = c.over(leg)
    return c


def legs_treads(v, f):
    """Twin tank-tread pods with scrolling zigzag grip (p2_23)."""
    c = Layer()
    if v == 'side':
        c.blob(RUBBER, [('rr', 6, 24, 25, 30)])
        c.rect(8, 26, 23, 28, RUBBER[1])
        for cx in (9, 15, 21):
            c.rect(cx, 26, cx + 1, 27, BONE[2])
            c.put(cx, 26, BONE[3])
        for x in range(7, 25):
            if (x + f) % 3 == 0:
                c.put(x, 24, RUBBER[3])
                c.put(x, 30, RUBBER[3])
        c.blob(BONE, [('r', 13, 22, 18, 23)])
    else:
        c.blob(BONE, [('r', 13, 23, 18, 26)])
        c.blob(RUBBER, [('rr', 6, 23, 13, 30)], sym=True)
        step = f if v == 'down' else -f
        for y in range(24, 30):
            if (y - step) % 3 == 0:
                c.hl(7, 12, y, RUBBER[3])
                c.hl(19, 24, y, RUBBER[3])
                c.pts([(9, y + 1), (10, y + 1), (21, y + 1), (22, y + 1)], RUBBER[3])
    return c.outline(RUBBER[0])


def legs_wheel(v, f):
    """One big wheel on a fork, copper hub (p3_22)."""
    c = Layer()
    if v == 'side':
        c.blob(RUBBER, [('e', 15.5, 26, 4.5, 4.5)])
        c.blob(BONE, [('e', 15.5, 26, 2.6, 2.6)], bevel=False)
        spokes = {0: [(13, 26), (18, 26)], 1: [(14, 24), (17, 28)], 2: [(15, 24), (16, 28)]}[f]
        c.pts(spokes, RUBBER[1])
        c.blob(COPPER, [('r', 15, 25, 16, 26)])
        c.blob(BONE, [('r', 15, 22, 16, 24)])
    else:
        c.blob(RUBBER, [('rr', 13, 22, 18, 30)])
        step = f if v == 'down' else -f
        for y in range(23, 30):
            if (y - step) % 3 == 0:
                c.hl(14, 17, y, RUBBER[3])
        c.blob(BONE, [('r', 11, 22, 12, 27)], sym=True)
        c.pts([(11, 26), (12, 26), (19, 26), (20, 26)], COPPER[2])
    return c.outline(RUBBER[0])


def legs_fins(v, f):
    """Slim brown legs in teal boots with a red heel fin (p6_08)."""
    c = Layer()
    if v == 'side':
        near, far = _side_steps(f)
        for dx in (far, near):
            leg = Layer()
            leg.blob(BROWN, [('r', 15 + dx, 22, 16 + dx, 26)])
            leg.blob(TEAL, [('rr', 11 + dx, 27, 17 + dx, 30), ('r', 14 + dx, 26, 17 + dx, 27)])
            leg.pts([(18 + dx, 27), (19 + dx, 26), (19 + dx, 25)], RUST[2])
            leg.outline(BROWN[0])
            c = c.over(leg)
        return c
    ll, lr = _lifts(f)
    for flip, lift in ((False, ll), (True, lr)):
        leg = Layer(flip=flip)
        leg.blob(BROWN, [('r', 12, 22, 13, 26 - lift)])
        leg.blob(TEAL, [('rr', 10, 27 - lift, 14, 30 - lift)])
        leg.pts([(9, 27 - lift), (9, 26 - lift)], RUST[2])
        leg.outline(BROWN[0])
        c = c.over(leg)
    return c


def legs_claws(v, f):
    """Short bent legs on splayed two-toed claw feet (p4_14)."""
    c = Layer()
    if v == 'side':
        near, far = _side_steps(f)
        for dx in (far, near):
            leg = Layer()
            leg.blob(BONE, [('rr', 13 + dx, 22, 18 + dx, 25)])
            leg.blob(BONE, [('r', 16 + dx, 26, 17 + dx, 27), ('r', 14 + dx, 28, 16 + dx, 29),
                            ('p', 12 + dx, 30), ('p', 13 + dx, 30), ('p', 17 + dx, 30), ('p', 13 + dx, 29)])
            leg.outline(BONE[0])
            c = c.over(leg)
        return c
    ll, lr = _lifts(f)
    for flip, lift in ((False, ll), (True, lr)):
        leg = Layer(flip=flip)
        leg.blob(BONE, [('rr', 10, 22, 14, 25 - lift)])
        leg.blob(BONE, [('r', 12, 26 - lift, 13, 27 - lift), ('r', 11, 28 - lift, 13, 29 - lift),
                        ('p', 9, 30 - lift), ('p', 10, 29 - lift), ('p', 10, 30 - lift),
                        ('p', 14, 29 - lift), ('p', 14, 30 - lift), ('p', 15, 30 - lift)])
        leg.outline(BONE[0])
        c = c.over(leg)
    return c


# ───────────────────────── registry ─────────────────────────
# src = crop id in the panel catalogue; box = part region inside that crop.

PARTS = {
    'head': [
        dict(id='head_worker', name='Worker cap', fn=head_worker, src='p3_02', box=(108, 50, 155, 105)),
        dict(id='head_dome', name='Dome and visor', fn=head_dome, src='p3_10', box=(100, 40, 150, 105)),
        dict(id='head_dish', name='Dish helm', fn=head_dish, src='p4_14', box=(55, 30, 150, 140)),
        dict(id='head_goggle', name='Goggle bulb', fn=head_goggle, src='p5_02', box=(90, 5, 160, 80)),
        dict(id='head_sleep', name='Sleep-mode helmet', fn=head_sleep, src='p6_08', box=(80, 20, 135, 95)),
        dict(id='head_gopik', name='Go-Pik cap', fn=head_gopik, src='p2_23', box=(80, 50, 150, 115)),
    ],
    'torso': [
        dict(id='torso_worker', name='Pauldron chest', fn=torso_worker, src='p3_02', box=(60, 55, 200, 200), arm=(0, 2, 3)),
        dict(id='torso_kneeler', name='Barrel chest', fn=torso_kneeler, src='p3_10', box=(75, 90, 175, 185), arm=(0, 1, 1)),
        dict(id='torso_gopik', name='Go-Pik body', fn=torso_gopik, src='p2_23', box=(45, 100, 165, 185), arm=(0, 0, 1)),
        dict(id='torso_yellow', name='Tunic and backpack', fn=torso_yellow, src='p5_02', box=(75, 25, 200, 165), arm=(0, 1, 1)),
        dict(id='torso_sleep', name='Slim frame', fn=torso_sleep, src='p6_08', box=(70, 85, 150, 160), arm=(1, 0, 0)),
    ],
    'arms': [
        dict(id='arm_fists', name='Heavy fists', fn=arm_fists, src='p3_02', box=(15, 125, 110, 200)),
        dict(id='arm_hose', name='Hose and claw', fn=arm_hose, src='p5_02', box=(30, 85, 105, 150)),
        dict(id='arm_gopik', name='Go-Pik mitts', fn=arm_gopik, src='p2_23', box=(140, 105, 185, 225)),
        dict(id='arm_gauntlet', name='Teal gauntlets', fn=arm_gauntlet, src='p6_08', box=(145, 95, 200, 185)),
    ],
    'legs': [
        dict(id='legs_boots', name='Big boots', fn=legs_boots, src='p3_02', box=(65, 185, 230, 280), bob=(1, 0, 1)),
        dict(id='legs_treads', name='Go-Pik treads', fn=legs_treads, src='p2_23', box=(15, 170, 170, 255), bob=(0, 0, 0)),
        dict(id='legs_wheel', name='Single wheel', fn=legs_wheel, src='p3_22', box=(0, 140, 70, 210), bob=(0, 0, 0)),
        dict(id='legs_fins', name='Finned boots', fn=legs_fins, src='p6_08', box=(55, 150, 175, 290), bob=(1, 0, 1)),
        dict(id='legs_claws', name='Claw feet', fn=legs_claws, src='p4_14', box=(55, 185, 150, 290), bob=(1, 0, 1)),
    ],
}

# Robots rebuilt from one drawing each, used as presets and for checking.
PRESETS = [
    dict(name='The Worker', src='p3_02', head='head_worker', torso='torso_worker', arms='arm_fists', legs='legs_boots'),
    dict(name='Go-Pik 1', src='p2_23', head='head_gopik', torso='torso_gopik', arms='arm_gopik', legs='legs_treads'),
    dict(name='Butterfly robot', src='p3_10', head='head_dome', torso='torso_kneeler', arms='arm_gopik', legs='legs_boots'),
    dict(name='Yellow goggles', src='p5_02', head='head_goggle', torso='torso_yellow', arms='arm_hose', legs='legs_claws'),
    dict(name='Sleep mode', src='p6_08', head='head_sleep', torso='torso_sleep', arms='arm_gauntlet', legs='legs_fins'),
    dict(name='Dish helm', src='p4_14', head='head_dish', torso='torso_kneeler', arms='arm_fists', legs='legs_claws'),
    dict(name='Wheel rider', src='p3_22', head='head_dome', torso='torso_gopik', arms='arm_gopik', legs='legs_wheel'),
]
