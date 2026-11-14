# First Sprites From Rob's Panels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Rob's six sketch panels into a source library, a first set of modular 32px robot-part sprites, a review page and a running replacement log.

**Architecture:** Python scripts draw each part procedurally on a 32x32 cell (bevel-shaded blobs plus hand-placed detail pixels), export one PNG sheet per part and a manifest that names the source drawing for each. A second script cuts Rob's drawings out of the panel screenshots. A third builds a self-contained HTML page that assembles robots from the sheets exactly the way the game will.

**Tech Stack:** Python 3, Pillow, NumPy, SciPy; plain HTML and canvas for the review page.

**Spec:** "SadRobotsOnline V1 DESIGN" (revision 2) in the Sad Robots Online project on claude.ai, sections 4 and 12 step 1. Scope here is the art half of step 1 only, as Rob asked on 2026-11-13: sprites from the panels plus the replacement log. No game code.

## Global Constraints

- World tile 16x16, character cell 32x32, 3/4 overhead view (Art Bible section 3).
- 4 directions, 3-frame walk cycles, no anti-aliasing, transparent background (Art Bible section 3).
- Muted palette from Art Bible section 2; no glossy or neon colour.
- Every part must name the drawing it came from. Only Rob's own pencil, ink, marker and hand-painted drawings are sources.
- Not sources: other artists' robots (panel 1, first 15 thumbnails), the glossy coloured restyles in panels 4 to 6, photos, screenshots.
- Rob's drawings are not committed to this public repository.
- Sprites are stand-ins: any PNG can be replaced by Rob's hand-drawn version with no code change.

## Review Focus

1. A torso wider or narrower than the default leaves arms floating or buried: each torso carries arm offsets and the compositor applies them.
2. Leg types that roll (treads, wheel) must not bob the body; walkers must: each leg part carries its own 3-frame bob.
3. A replacement PNG with soft edges or the wrong size breaks pixel-perfect rendering: `check.py` rejects soft alpha and wrong sheet sizes.
4. Right-facing frames drifting from left-facing ones: `check.py` requires the right row to be the exact mirror of the left row.
5. Feet at different heights across leg types make robots float or sink: `check.py` requires every standing frame to reach the ground line.

---

### Task 1: Source library

**Files:** Create `tools/sprites/sources.py`, `art/source/README.md`, `.gitignore`

**Interfaces:** Produces `art/source/<crop id>.png` and `art/source/sources.json` (`id`, `title`, `size`, `robotBox`, `usedFor`). Crop ids are `p<panel>_<nn>`.

- [x] Detect thumbnails in each panel as light regions on the near-black gallery background (minimum 100x120).
- [x] View every crop and list Rob's own drawings in `SOURCES`, one clean shot per drawing.
- [x] Even out photo lighting while keeping paper tint.
- [x] Verify: `python3 tools/sprites/sources.py <panels> art/source` prints `24 source drawings written`.

### Task 2: Pixel toolkit and parts

**Files:** Create `tools/sprites/px.py`, `tools/sprites/parts.py`

**Interfaces:** `Layer` (`blob(ramp, prims, sym, bevel)`, `outline`, `shift`, `mirror`, `over`, `image`). Part functions: `head_x(view)`, `torso_x(view)`, `arm_x(view, swing, flip)`, `legs_x(view, frame)`; `view` is `down`, `up` or `side`. `PARTS` registry carries `src`, `box`, torso `arm=(inward, front dy, side dy)`, legs `bob=(f0, f1, f2)`.

- [x] 6 heads, 5 torsos, 4 arms, 5 legs, each from a named drawing.
- [x] 7 presets that rebuild one source robot each.

### Task 3: Sheets, manifest, checks

**Files:** Create `tools/sprites/build.py`, `tools/sprites/check.py`; output `art/sprites/`

- [x] Sheets: rows down, left, right, up; 3 columns (arms 6).
- [x] `manifest.json` with slots, presets and paint ramps.
- [x] Contact sheet composed from the sheets with the game's layer order.
- [x] Verify: `python3 tools/sprites/check.py` prints `20 parts checked, 0 problems`.

### Task 4: Review page

**Files:** Create `tools/preview/template.html`, `tools/preview/build.py`

- [x] Workbench: pick parts, walk in four directions, paint swap for unpainted parts, Rob's drawing shown for each chosen part.
- [x] Every part beside its source; source library; what was left out.
- [x] Verify: page loads headless and renders 20 part buttons.

### Task 5: Replacement log

- [x] Sheet "Sad Robots Sprite Replacement Log": 72 rows covering the 20 parts, queued robots, animations (turns, hits, jumps, slides, dashes), enemies, tiles, props, items, interface and effects, each with a hand-drawn status.

---

# Early Playable Preview (added 2026-11-14)

Rob approved the sprite step and asked for an early MVP preview. This covers design build-order steps 1 to 3 in a first, single-player form. Sign-in, Firebase, the quest chain, artifacts, the boss dungeon and online presence are not in it.

**Architecture:** Phaser 4.2.1 + TypeScript + Vite. One `WorldScene` restarts for each zone (Tinker Town, or a freshly generated Solar Wastelands per trip). Rules live in pure modules under `src/systems` with unit tests. The HUD, dialogue, title, workbench and guest gate are page elements laid over the canvas. Sound is generated in the browser.

- [x] Rules: part stats, levels, charge in sun / shade / storm / town, loot, save repair. Tests in `tests/systems.test.ts`.
- [x] Maps: Tinker Town and a seeded wasteland; tests prove every gate, salvage pile, shrine and townsperson is reachable for many seeds.
- [x] Combat: aimed swing, bolt (costs charge), dash, three enemy kinds, knockback, double hits, drops.
- [x] Loop: solar points and levels, batteries, four oils, salvage, sun shrines, dust storms, shutdown and tow home with cargo loss.
- [x] Town: five of Rob's robots plus wandering Go-Piks, workbench, the yellow robot's gift, the guide's intro.
- [x] Guest gate shown at level 2; the preview lets players continue.
- [x] Verify: `npm test`, `tsc`, and `tools/playtest.py` (title → build → town → gate → fight → level 2 → storm → tow → workbench → reload) with zero console errors, with and without Rob's drawings.
