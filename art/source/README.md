# Source drawings

Every sprite in this game traces back to one of Rob Carnie's hand drawings.
The drawings themselves are **not** stored in this public repository.

`tools/sprites/sources.py` cuts them out of the six gallery panel screenshots
and evens out the photo lighting. Run it with the panels on hand:

    python3 tools/sprites/sources.py <folder with the six panel PNGs> art/source

It writes one PNG per drawing plus `sources.json` here. Both are git-ignored.
Crop ids look like `p3_02`: panel 3, second thumbnail, counted left to right,
top to bottom. `art/sprites/manifest.json` records which drawing, and which
region of it, each part came from.
