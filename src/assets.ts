/** Loads every image the game uses. Art is bundled into the script, so nothing is fetched at run time. */
import manifestJson from '../art/sprites/manifest.json';
import { Build } from './data/parts';

export interface PartEntry { id: string; name: string; source: string; sourceBox: number[]; arm?: number[]; bob?: number[]; }
export interface Manifest {
  cell: number; rows: string[]; walkCycle: number[];
  slots: Record<string, PartEntry[]>;
  presets: ({ name: string; src: string } & Build)[];
  paint: { key: string[]; options: Record<string, string[]> };
}
export const manifest = manifestJson as unknown as Manifest;
export const partById: Record<string, PartEntry> = {};
for (const slot of Object.keys(manifest.slots)) for (const p of manifest.slots[slot]) partById[p.id] = p;

const urlsOf = (found: Record<string, unknown>) => {
  const out: Record<string, string> = {};
  for (const path of Object.keys(found)) out[path.split('/').pop()!.replace('.png', '')] = found[path] as string;
  return out;
};
const partUrls = urlsOf(import.meta.glob('../art/sprites/parts/*.png', { eager: true, query: '?url', import: 'default' }));
const worldUrls = urlsOf(import.meta.glob('../art/sprites/world/*.png', { eager: true, query: '?url', import: 'default' }));

// Rob's own drawings, used for portraits and the title screen. They are not in the public
// repository, so a build made without them falls back to the pixel sprites.
const sourceUrls = urlsOf(import.meta.glob(
  ['../art/source/p2_23.png', '../art/source/p3_02.png', '../art/source/p3_10.png', '../art/source/p4_14.png',
    '../art/source/p5_02.png', '../art/source/p6_08.png'],
  { eager: true, query: '?url', import: 'default' }));
const sourceIndex = Object.values(import.meta.glob('../art/source/sources.json', { eager: true, import: 'default' }))[0] as
  { id: string; title: string; robotBox: number[] }[] | undefined;

export const images: Record<string, HTMLImageElement> = {};
export const drawings: Record<string, { img: HTMLImageElement; box: number[]; title: string }> = {};

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load an image'));
    img.src = url;
  });
}

export async function loadAll(): Promise<void> {
  const jobs: Promise<void>[] = [];
  for (const [name, url] of Object.entries({ ...partUrls, ...worldUrls })) jobs.push(load(url).then((i) => { images[name] = i; }));
  for (const [name, url] of Object.entries(sourceUrls)) {
    const meta = sourceIndex?.find((s) => s.id === name);
    if (meta) jobs.push(load(url).then((img) => { drawings[name] = { img, box: meta.robotBox, title: meta.title }; }).catch(() => undefined));
  }
  await Promise.all(jobs);
}
