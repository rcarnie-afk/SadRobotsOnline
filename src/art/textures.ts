/** Turns loaded images and composed robot sheets into Phaser textures. */
import * as Phaser from 'phaser';
import { images } from '../assets';
import { Build } from '../data/parts';
import { CELL, composeSheet } from './robot';

const SHEETS: [string, number, number][] = [
  ['shrine', 24, 40], ['salvage', 24, 20], ['mite', 16, 16], ['crawler', 32, 24], ['items', 16, 16],
];
const SINGLE = ['solar_panel', 'solar_panel_broken', 'pylon', 'workbench', 'bolt', 'sign_town', 'sign_junction', 'tiles'];

export function ensureWorldTextures(scene: Phaser.Scene) {
  const T = scene.textures;
  if (T.exists('tiles')) return;
  for (const k of SINGLE) T.addImage(k, images[k]);
  for (const [k, w, h] of SHEETS) T.addSpriteSheet(k, images[k], { frameWidth: w, frameHeight: h });
  const dot = document.createElement('canvas');
  dot.width = dot.height = 2;
  const ctx = dot.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 2, 2);
  T.addCanvas('dot', dot);
}

let serial = 0;
/** A new texture for one robot's look. Returns its key; frames are row * 3 + column. */
export function robotTexture(scene: Phaser.Scene, build: Build, paint: string): string {
  const key = `robot-${serial++}`;
  scene.textures.addSpriteSheet(key, composeSheet(build, paint) as unknown as HTMLImageElement, { frameWidth: CELL, frameHeight: CELL });
  return key;
}
