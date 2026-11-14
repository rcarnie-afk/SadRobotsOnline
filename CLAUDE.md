# Sad Robots Online

A browser RPG built from Rob Carnie's robot drawings. Players build a robot from salvaged parts in Tinker Town and fight through the Solar Wastelands, kept alive by sunlight, batteries and oils. Phaser 4 + TypeScript + Vite, hosted on Firebase (project `sadrobotsonline`), domain sadrobots.online.

Rob is the artist and owner. He decides direction; he is not a programmer, so explain choices in plain words.

## Where the decisions live

These live in Rob's claude.ai project "Sad Robots Online", not in this repository:

- **SadRobotsOnline GAME WORLD MASTER FILE**: Rob's vision. Being rewritten (2026-11) toward a brighter, isometric look; follow the newest version.
- **SadRobotsOnline GAME ART BIBLE FOR NEEDED SPRITES**: sprite standards.
- **SadRobotsOnline V1 DESIGN**: the approved version 1 design, build order and progress.
- **Sad Robots Sprite Replacement Log** (a Claude Sheet): every asset, its source drawing, its game file and its status (Needs your drawing, Drawing in progress, Drawn, sent to Claude, In the game). Update it when an asset changes.

If these and the code disagree, ask Rob.

## Hard rules

- **Art is Rob's, by hand.** Never generate art with AI tools or put AI-made images in the game. Placeholders you draw in code are allowed only if they are listed on the replacement log as placeholders.
- **Rob's process:** he draws freely and hands drawings over. You turn them into game assets (pixel conversion for things that animate; used as drawn for portraits, signs, title art and backgrounds), then mark the log row "In the game".
- **Never commit Rob's original drawings.** The repository is public. `art/source/` is git-ignored; keep it that way. Builds without it must still work (they fall back to the pixel sprites).
- **Not used as sources:** the first two rows of his panel 1 (other artists' robots) and the glossy coloured restyles in panels 4 to 6 (AI-generated).
- **Enemies are tragic, not evil.** Defeated enemies power down; nothing explodes in gore.

## Layout

| Path | What |
|---|---|
| `src/scenes/WorldScene.ts` | The playable world (town or a wasteland trip); restarts per zone |
| `src/systems/` | Pure game rules: stats, levels, charge, loot, saves. Tested |
| `src/data/` | Part stats (`parts.ts`) and every tunable number (`balance.ts`) |
| `src/world/` | Map builders: `town.ts`, `wasteland.ts` (seeded), `types.ts` |
| `src/ui/` | HUD, dialogue and full screens as page elements over the canvas |
| `src/art/` | Robot assembly from part sheets; Phaser texture setup |
| `art/sprites/parts/` | 20 robot-part sheets + `manifest.json` (source drawing, offsets, presets) |
| `art/sprites/world/` | Placeholder tiles, props, creatures, item icons |
| `tools/sprites/` | Python scripts that draw, build and check the sprite sheets |
| `tools/playtest.py` | Scripted play-through in headless Chromium with screenshots |
| `.claude/skills/phaser-*` | Phaser's official agent skills (see `.claude/skills/README.md`) |
| `docs/superpowers/plans/` | Build plans |

## Commands

    npm install
    npm run dev                          # local server
    npm test                             # vitest: rules and maps
    npx tsc --noEmit                     # type-check
    npm run build                        # dist/
    python3 tools/playtest.py dist out   # play-through; fails on any console error
    python3 tools/sprites/build.py       # rebuild part sheets and manifest
    python3 tools/sprites/check.py       # sheet sizes, hard edges, mirrors, ground line
    bash tools/sync-phaser-skills.sh     # after upgrading Phaser

Before calling work done: `npm test`, `tsc`, `npm run build`, and the play-through all pass. Look at the play-through screenshots for anything visual.

## Conventions

- **Phaser 4, not 3.** Import with `import * as Phaser from 'phaser'`. Check the `phaser-*` skills before using an API from memory, especially for filters, tint modes, lighting and textures, which changed in v4.
- **Rules stay pure** in `src/systems/` with tests in `tests/`. New numbers go in `src/data/balance.ts`, not inline.
- **Key taps use keyboard events** (`keyboard.on('keydown-E')`), never `JustDown`: a tap that starts and ends between two frames is otherwise lost. Held movement keys may poll `isDown`.
- **Sprite sheet contract** for robot parts: 32px cells; rows down, left, right, up; columns are walk frames played 0,1,2,1; arm sheets have 6 columns (near arm 0-2, far arm 3-5); the right row mirrors the left; feet on the bottom row; hard pixel edges. Torso `arm` offsets and leg `bob` live in the manifest.
- **Paint** recolours only the four exact "bone" greys in `manifest.paint.key`.
- **Every map must stay reachable**: `tests/world.test.ts` proves gates, salvage, shrines and townsfolk are reachable across many seeds. Keep it passing when changing maps.
- **Storage can fail** (private windows, sandboxed previews). Saves go through `src/systems/save.ts`, which never throws and repairs bad data.

## Git and deploy

- Work on a branch and open a pull request; GitHub Actions (`.github/workflows/ci.yml`) builds and tests it. Merge when it is green and Rob has approved the work.
- `main` deploys to Firebase Hosting once the repository has the `FIREBASE_SERVICE_ACCOUNT_SADROBOTSONLINE` secret. Until then deploys are by hand from a signed-in machine: `npm run build && npx firebase-tools deploy --only hosting`.
- Pointing sadrobots.online at Firebase replaces Rob's old site: check with Rob first.
