# Sad Robots Online

A browser RPG set after humans, built from Rob Carnie's robot sketches.
Build a sad robot from salvaged parts, leave Tinker Town, and fight through a
ruined wasteland to keep the lights on.

Status: early playable preview. Build a robot, walk Tinker Town, fight in the Solar Wastelands. Single-player; saves in the browser.

## What is here

| Path | What it is |
|---|---|
| `src/` | The game: Phaser 4 + TypeScript (`scenes/WorldScene.ts` is the playable world) |
| `tests/` | Rule and map tests (`npm test`) |
| `art/sprites/parts/` | 32px sprite sheets for the first 20 robot parts |
| `art/sprites/world/` | Placeholder tiles, props, creatures and item icons (`tools/sprites/world.py`) |
| `art/sprites/manifest.json` | Part list, source drawing for each part, layering offsets, presets, paint ramps |
| `art/sprites/contact_presets.png` | Seven assembled robots, 4 directions x 3 walk frames |
| `art/source/` | Where Rob's drawings go locally (not committed, see its README) |
| `tools/sprites/` | The scripts that draw, build and check the sheets |
| `tools/preview/` | Builds the self-contained sprite review page |
| `docs/superpowers/plans/` | Build plans |
| `CLAUDE.md` | Rules and conventions for AI coding agents working here |
| `.claude/skills/` | Phaser's official agent skills (`tools/sync-phaser-skills.sh` refreshes them) |

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

    npm install
    npm run dev                         # play locally at the address it prints
    npm test                            # rules and map checks
    npm run build                       # production build in dist/
    python3 tools/playtest.py dist out  # scripted play-through in headless Chromium, with screenshots

Art scripts:

    python3 tools/sprites/build.py      # redraw every sheet, manifest and contact sheet
    python3 tools/sprites/check.py      # verify sizes, hard pixel edges, mirrors, ground line
    python3 tools/preview/build.py out.html   # review page (needs art/source filled in)

Needs Python 3 with Pillow; `sources.py` also needs NumPy and SciPy; `playtest.py` needs Playwright.

Rob's drawings appear in the game as dialogue portraits and title art only when
`art/source/` has been filled locally. Without them the game falls back to the
pixel sprites, so builds from this public repository work as they are.

## Deploying

The game is hosted on Firebase Hosting in the `sadrobotsonline` project
(`firebase.json`, `.firebaserc`).

- By hand, from a machine signed in to Firebase: `npm run build && npx firebase-tools deploy --only hosting`
- Automatically: `.github/workflows/ci.yml` builds and tests every pull request and
  push, and deploys `main` once the repository has a
  `FIREBASE_SERVICE_ACCOUNT_SADROBOTSONLINE` secret.
