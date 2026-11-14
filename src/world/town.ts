import { NpcDef, Prop, Tl, WorldData } from './types';
import { makeRng } from '../systems/rng';

const W = 40, H = 22;

/** Tinker Town: a walled yard of scrap-metal shacks around a charging pad. */
export function buildTown(): WorldData {
  const rng = makeRng(1984);
  const ground: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      const r = rng();
      row.push(r < 0.7 ? Tl.PLATE1 : r < 0.88 ? Tl.PLATE2 : Tl.RIVET);
    }
    ground.push(row);
  }
  const set = (x: number, y: number, t: number) => { if (ground[y]?.[x] !== undefined) ground[y][x] = t; };
  const rect = (x: number, y: number, w: number, h: number, t: number | (() => number)) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, typeof t === 'number' ? t : t());
  };
  // outer wall: top rows show the wall top, the last row before open ground shows its face
  for (let x = 0; x < W; x++) { set(x, 0, Tl.WALL_TOP); set(x, 1, Tl.WALL_FACE); set(x, H - 1, Tl.WALL_TOP); }
  for (let y = 0; y < H; y++) { set(0, y, Tl.WALL_TOP); set(W - 1, y, Tl.WALL_TOP); }

  const building = (x: number, y: number, w: number, roof: number, door: number) => {
    rect(x, y, w, 2, roof);
    for (let i = 0; i < w; i++) set(x + i, y + 2, i === door ? Tl.DOOR : i % 2 ? Tl.WINDOW : Tl.WALL_FACE);
  };
  building(3, 3, 7, Tl.ROOF_RUST, 3);
  building(14, 3, 8, Tl.ROOF_TEAL, 2);
  building(27, 3, 8, Tl.ROOF_RUST, 5);
  building(3, 14, 6, Tl.ROOF_TEAL, 2);
  building(17, 15, 8, Tl.ROOF_RUST, 3);

  rect(15, 8, 6, 4, () => (rng() < 0.55 ? Tl.GRASS : Tl.CONCRETE));
  rect(27, 9, 4, 4, Tl.GRATE);
  rect(28, 10, 2, 2, Tl.PAD);
  rect(5, 9, 3, 2, Tl.SCRAP);
  rect(11, 17, 3, 2, Tl.SCRAP);
  rect(31, 16, 4, 2, Tl.SCRAP);

  // east gate
  for (const y of [10, 11, 12]) { set(36, y, Tl.HAZARD); set(37, y, Tl.GATE); set(38, y, Tl.GATE); set(39, y, Tl.GATE); }
  set(39, 9, Tl.WALL_FACE);

  const props: Prop[] = [
    { kind: 'workbench', x: 5, y: 7, id: 'bench' },
    { kind: 'sign_town', x: 32, y: 8, id: 'sign' },
  ];

  const gopik = { head: 'head_gopik', torso: 'torso_gopik', arms: 'arm_gopik', legs: 'legs_treads' };
  const npcs: NpcDef[] = [
    { id: 'gopik-guide', name: 'Go-Pik 1', source: 'p2_23', build: gopik, paint: 'bone', x: 25, y: 12,
      lines: ['New frame? Good. Parts are easy. Purpose is harder.',
        'WASD moves you. Click to swing, right-click to fire a bolt, Shift to dash.',
        'The gate is east. Sun fills your charge. Shade and dust storms drain it.'] },
    { id: 'worker', name: 'The Worker', source: 'p3_02', action: 'workbench', x: 8, y: 7, paint: 'bone',
      build: { head: 'head_worker', torso: 'torso_worker', arms: 'arm_fists', legs: 'legs_boots' },
      lines: ['Work? There is always work. Step up to the bench and I will refit you.'] },
    { id: 'butterfly', name: 'Butterfly robot', source: 'p3_10', x: 18, y: 10, paint: 'bone',
      build: { head: 'head_dome', torso: 'torso_kneeler', arms: 'arm_gopik', legs: 'legs_boots' },
      lines: ['Something small landed on my hand once. It weighed nothing.', 'I have been holding still ever since, in case it comes back.'] },
    { id: 'yellow', name: 'Yellow goggle robot', source: 'p5_02', action: 'gift', x: 21, y: 19, paint: 'bone',
      build: { head: 'head_goggle', torso: 'torso_yellow', arms: 'arm_hose', legs: 'legs_claws' },
      lines: ['Going out there? Take these cells. The sun is not guaranteed.'] },
    { id: 'sleeper', name: 'Sleep-mode robot', source: 'p6_08', x: 6, y: 18, paint: 'bone',
      build: { head: 'head_sleep', torso: 'torso_sleep', arms: 'arm_gauntlet', legs: 'legs_fins' },
      lines: ['Sigh. Not this again.', '[I am in sleep mode]'] },
    { id: 'lookout', name: 'Dish-helm robot', source: 'p4_14', x: 34, y: 9, paint: 'bone',
      build: { head: 'head_dish', torso: 'torso_kneeler', arms: 'arm_fists', legs: 'legs_claws' },
      lines: ['I watch the horizon. When it turns brown, the sun is gone for a while.',
        'If your charge runs out, the tow comes for you. You keep your parts. Not all your cargo.'] },
    { id: 'gopik-a', name: 'Go-Pik 1', source: 'p2_23', build: gopik, paint: 'copper', x: 13, y: 12, wander: true,
      lines: ['Push. Pull. Pick up. It is honest.'] },
    { id: 'gopik-b', name: 'Go-Pik 1', source: 'p2_23', build: gopik, paint: 'steel', x: 30, y: 17, wander: true,
      lines: ['Humans left the lights on. We are still paying for it.'] },
  ];

  return {
    zone: 'town', name: 'Tinker Town', w: W, h: H, ground,
    shade: ground.map((r) => r.map(() => false)),
    spawn: { x: 27, y: 13 },
    gates: [10, 11, 12].map((y) => ({ x: 39, y, to: 'wasteland' as const })),
    props, npcs, enemies: [],
  };
}
