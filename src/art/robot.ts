/** Assembles a robot from its four part sheets, the same way for the game, the workbench and portraits. */
import { images, manifest, partById } from '../assets';
import { Build } from '../data/parts';

export const CELL = 32;
export const ROW = { down: 0, left: 1, right: 2, up: 3 } as const;

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const KEY = manifest.paint.key.map(hex);

/** Recolour the unpainted (bone) pixels to another paint. Parts Rob coloured keep his colours. */
function repaint(ctx: CanvasRenderingContext2D, w: number, h: number, paint: string) {
  const to = manifest.paint.options[paint]?.map(hex);
  if (!to) return;
  const id = ctx.getImageData(0, 0, w, h), a = id.data;
  for (let i = 0; i < a.length; i += 4) {
    if (!a[i + 3]) continue;
    for (let k = 0; k < 4; k++) {
      if (a[i] === KEY[k][0] && a[i + 1] === KEY[k][1] && a[i + 2] === KEY[k][2]) { a[i] = to[k][0]; a[i + 1] = to[k][1]; a[i + 2] = to[k][2]; break; }
    }
  }
  ctx.putImageData(id, 0, 0);
}

/** One frame: layer order and offsets come from the manifest (torso arm offsets, leg bob). */
function drawFrame(ctx: CanvasRenderingContext2D, build: Build, row: number, f: number, ox: number, oy: number) {
  const bob = partById[build.legs].bob![f];
  const [adx, adyFront, adySide] = partById[build.torso].arm!;
  const put = (id: string, col: number, dx: number, dy: number) =>
    ctx.drawImage(images[id], col * CELL, row * CELL, CELL, CELL, ox + dx, oy + dy, CELL, CELL);
  if (row === ROW.down || row === ROW.up) {
    put(build.legs, f, 0, 0);
    put(build.arms, f, adx, adyFront + bob);
    put(build.arms, 3 + f, -adx, adyFront + bob);
    put(build.torso, f, 0, bob);
    put(build.head, f, 0, bob);
  } else {
    put(build.arms, 3 + f, 0, adySide + bob);
    put(build.legs, f, 0, 0);
    put(build.torso, f, 0, bob);
    put(build.head, f, 0, bob);
    put(build.arms, f, 0, adySide + bob);
  }
}

/** Full sheet for one robot: 3 walk frames across, 4 directions down. */
export function composeSheet(build: Build, paint: string): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = 3 * CELL; cv.height = 4 * CELL;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  for (let row = 0; row < 4; row++) for (let f = 0; f < 3; f++) drawFrame(ctx, build, row, f, f * CELL, row * CELL);
  if (paint !== 'bone') repaint(ctx, cv.width, cv.height, paint);
  return cv;
}

/** Draw one frame of a composed sheet onto any canvas at a whole-number scale. */
export function blit(target: HTMLCanvasElement, sheet: HTMLCanvasElement, row: number, f: number, shadow = true) {
  const ctx = target.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, target.width, target.height);
  const s = target.width / CELL;
  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(target.width / 2, 30.5 * s, 9 * s, 1.6 * s, 0, 0, 7); ctx.fill();
  }
  ctx.drawImage(sheet, f * CELL, row * CELL, CELL, CELL, 0, 0, target.width, target.height);
}

/** Close-up of one part for a workbench button: a 24px window of its front-view cell. */
export function partThumb(id: string, px: number): HTMLCanvasElement {
  const slot = id.startsWith('head_') ? 'head' : id.startsWith('torso_') ? 'torso' : id.startsWith('arm_') ? 'arms' : 'legs';
  const y = { head: 0, torso: 5, arms: 8, legs: 8 }[slot];
  const cv = document.createElement('canvas');
  cv.width = cv.height = px;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  if (slot === 'arms') ctx.drawImage(images[id], 4 * CELL + 4, y, 24, 24, 0, 0, px, px);
  ctx.drawImage(images[id], CELL + 4, y, 24, 24, 0, 0, px, px);
  return cv;
}
