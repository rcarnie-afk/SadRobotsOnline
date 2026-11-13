# Sad Robots Online

A browser RPG set after humans, built from Rob Carnie's robot sketches.
Build a sad robot from salvaged parts, leave Tinker Town, and fight through a
ruined wasteland to keep the lights on.

Status: art step. No game code yet.

## What is here

| Path | What it is |
|---|---|
| `art/sprites/parts/` | 32px sprite sheets for the first 20 robot parts |
| `art/sprites/manifest.json` | Part list, source drawing for each part, layering offsets, presets, paint ramps |
| `art/sprites/contact_presets.png` | Seven assembled robots, 4 directions x 3 walk frames |
| `art/source/` | Where Rob's drawings go locally (not committed, see its README) |
| `tools/sprites/` | The scripts that draw, build and check the sheets |
| `tools/preview/` | Builds the self-contained sprite review page |
| `docs/superpowers/plans/` | Build plans |

## The sprites are stand-ins

Each part is a pixel redraw made by eye from one of Rob's drawings. They exist
so the game can be built and played while Rob draws the real art. To replace
one, overwrite its PNG in `art/sprites/parts/` keeping the same layout, then run
the checker. No code changes.

Sheet layout, 32px cells:

- rows: down, left, right, up
- columns: walk frames 0, 1, 2 (played 0, 1, 2, 1)
- arm sheets have 6 columns: 0-2 screen-left or near arm, 3-5 screen-right or far arm
- feet stand on the bottom row of the cell

## Commands

    python3 tools/sprites/build.py      # redraw every sheet, manifest and contact sheet
    python3 tools/sprites/check.py      # verify sizes, hard pixel edges, mirrors, ground line
    python3 tools/preview/build.py out.html   # review page (needs art/source filled in)

Needs Python 3 with Pillow; `sources.py` also needs NumPy and SciPy.
