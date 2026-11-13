"""Tiny pixel-art toolkit: 32x32 layers, bevel-shaded blobs, outlines."""
from PIL import Image

SIZE = 32


def hexrgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


class Layer:
    def __init__(self, flip=False):
        self.p = {}
        self.flip = flip

    def _x(self, x):
        return SIZE - 1 - x if self.flip else x

    def put(self, x, y, c):
        x = self._x(x)
        if 0 <= x < SIZE and 0 <= y < SIZE:
            self.p[(x, y)] = hexrgb(c) if isinstance(c, str) else c

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, c)

    def hl(self, x0, x1, y, c):
        self.rect(x0, y, x1, y, c)

    def vl(self, x, y0, y1, c):
        self.rect(x, y0, x, y1, c)

    def pts(self, pts, c):
        for x, y in pts:
            self.put(x, y, c)

    @staticmethod
    def _mask(prims):
        m = set()
        for pr in prims:
            k = pr[0]
            if k == 'r' or k == 'rr':
                _, x0, y0, x1, y1 = pr
                for y in range(y0, y1 + 1):
                    for x in range(x0, x1 + 1):
                        m.add((x, y))
                if k == 'rr' and x1 - x0 >= 2 and y1 - y0 >= 2:
                    for c in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)):
                        m.discard(c)
            elif k == 'e':
                _, cx, cy, rx, ry = pr
                for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
                    for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                        if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0:
                            m.add((x, y))
            elif k == 'p':
                m.add((pr[1], pr[2]))
        return m

    def blob(self, ramp, prims, sym=False, bevel=True):
        """Fill a shape with ramp=(outline, shadow, mid, light), lit from top-left."""
        m = self._mask(prims)
        if sym:
            m |= {(SIZE - 1 - x, y) for x, y in m}
        if self.flip:
            m = {(SIZE - 1 - x, y) for x, y in m}
        for (x, y) in m:
            col = ramp[2]
            if bevel:
                top = (x, y - 1) not in m or (x - 1, y) not in m
                bot = (x, y + 1) not in m or (x + 1, y) not in m
                if top and not bot:
                    col = ramp[3]
                elif bot and not top:
                    col = ramp[1]
            if 0 <= x < SIZE and 0 <= y < SIZE:
                self.p[(x, y)] = hexrgb(col)

    def outline(self, c):
        c = hexrgb(c)
        add = {}
        for (x, y) in self.p:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q not in self.p and 0 <= q[0] < SIZE and 0 <= q[1] < SIZE:
                    add[q] = c
        self.p.update(add)
        return self

    def shift(self, dx, dy):
        out = Layer()
        for (x, y), c in self.p.items():
            if 0 <= x + dx < SIZE and 0 <= y + dy < SIZE:
                out.p[(x + dx, y + dy)] = c
        return out

    def mirror(self):
        out = Layer()
        out.p = {(SIZE - 1 - x, y): c for (x, y), c in self.p.items()}
        return out

    def over(self, other):
        """Return a new layer with `other` drawn on top of self."""
        out = Layer()
        out.p = dict(self.p)
        out.p.update(other.p)
        return out

    def image(self):
        im = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
        for (x, y), c in self.p.items():
            im.putpixel((x, y), c + (255,))
        return im
