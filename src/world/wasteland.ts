import { EnemyKind } from '../data/balance';
import { Rng, makeRng, randInt } from '../systems/rng';
import { Prop, Tl, WorldData, propFootprint, reachable, isSolid } from './types';

const W = 110, H = 76;

/** Smooth-ish value noise in 0..1, for patches of cracked earth. */
function makeNoise(rng: Rng, cell: number) {
  const gw = Math.ceil(W / cell) + 2, gh = Math.ceil(H / cell) + 2;
  const g = Array.from({ length: gh }, () => Array.from({ length: gw }, () => rng()));
  return (x: number, y: number) => {
    const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = fx - ix, ty = fy - iy;
    const a = g[iy][ix] * (1 - tx) + g[iy][ix + 1] * tx;
    const b = g[iy + 1][ix] * (1 - tx) + g[iy + 1][ix + 1] * tx;
    return a * (1 - ty) + b * ty;
  };
}

/** The Solar Wastelands: one road east out of town, ruins in shade, dead solar farms, sun shrines. */
export function buildWasteland(seed = 2026): WorldData {
  const rng = makeRng(seed);
  const noise = makeNoise(rng, 9);
  const mid = Math.floor(H / 2);
  const ground: number[][] = [];
  const shade: boolean[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      const r = rng();
      let t: number = r < 0.55 ? Tl.SAND1 : r < 0.75 ? Tl.SAND2 : r < 0.85 ? Tl.SAND3 : r < 0.93 ? Tl.SAND4 : Tl.DUNE;
      if (noise(x, y) > 0.64) t = rng() < 0.5 ? Tl.CRACK1 : Tl.CRACK2;
      row.push(t);
    }
    ground.push(row);
    shade.push(row.map(() => false));
  }
  const props: Prop[] = [];
  const enemies: { kind: EnemyKind; x: number; y: number }[] = [];
  const taken = shade.map((r) => r.map(() => false));     // tiles claimed by a feature
  const claim = (x: number, y: number, w: number, h: number) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (taken[j]?.[i] !== undefined) taken[j][i] = true;
  };
  const free = (x: number, y: number, w: number, h: number) => {
    for (let j = y - 1; j < y + h + 1; j++) for (let i = x - 1; i < x + w + 1; i++) {
      if (i < 3 || j < 3 || i >= W - 3 || j >= H - 3 || taken[j][i]) return false;
    }
    return true;
  };
  const spawn = { x: 4, y: mid };
  const far = (x: number, y: number, d: number) => Math.hypot(x - spawn.x, y - spawn.y) >= d;

  // border of rock, with the town gate in the west
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
    if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) ground[y][x] = Tl.ROCK;
  }
  const gates = [mid - 1, mid, mid + 1].map((y) => ({ x: 0, y, to: 'town' as const }));
  for (const g of gates) { ground[g.y][0] = Tl.GATE; ground[g.y][1] = Tl.GATE; ground[g.y][2] = Tl.HAZARD; }

  // the old road east, and Hopeless Junction where a second road crosses it
  const jx = 36;
  for (let x = 3; x < W - 3; x++) {
    if (rng() < 0.12 && x > 8) continue;                       // stretches swallowed by sand
    ground[mid][x] = x % 3 === 0 ? Tl.ROAD_LINE : Tl.ASPHALT;
    ground[mid + 1][x] = Tl.ASPHALT;
  }
  for (let y = mid - 16; y <= mid + 17; y++) {
    if (rng() < 0.12) continue;
    ground[y][jx] = Tl.ASPHALT; ground[y][jx + 1] = Tl.ASPHALT;
  }
  claim(2, mid - 2, W - 4, 5);
  claim(jx - 1, mid - 17, 4, 36);
  claim(0, mid - 6, 12, 13);                                   // keep the gate area clear
  props.push({ kind: 'sign_junction', x: jx + 3, y: mid - 2, id: 'junction' });

  // ruins: broken walls around a shaded floor, with salvage and something still on duty inside
  let ruins = 0, tries = 0;
  while (ruins < 8 && tries++ < 600) {
    const w = randInt(rng, 7, 11), h = randInt(rng, 6, 9);
    const x = randInt(rng, 12, W - w - 5), y = randInt(rng, 5, H - h - 5);
    if (!free(x, y, w, h)) continue;
    claim(x, y, w, h);
    const door = randInt(rng, 2, w - 4);
    const side = randInt(rng, 2, h - 3);
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const edge = i === x || j === y || i === x + w - 1 || j === y + h - 1;
      shade[j][i] = true;
      if (!edge) { const r = rng(); ground[j][i] = r < 0.5 ? Tl.CONCRETE : r < 0.75 ? Tl.GRASS : Tl.ASPHALT; continue; }
      const isDoor = (j === y + h - 1 && (i === x + door || i === x + door + 1)) || (i === x && (j === y + side || j === y + side + 1));
      if (isDoor) { ground[j][i] = Tl.CONCRETE; continue; }
      const r = rng();
      ground[j][i] = r < 0.14 ? Tl.RUBBLE : r < 0.2 ? Tl.CONCRETE : Tl.RUIN_TOP;
    }
    // a wall tile with open ground under it shows its face
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      if (ground[j][i] === Tl.RUIN_TOP && ground[j + 1]?.[i] !== Tl.RUIN_TOP) ground[j][i] = Tl.RUIN_FACE;
    }
    const inside = () => ({ x: randInt(rng, x + 2, x + w - 3), y: randInt(rng, y + 2, y + h - 3) });
    const piles = far(x, y, 40) ? 2 : 1;
    for (let k = 0; k < piles; k++) {
      const p = inside();
      if (!props.some((q) => q.x === p.x && q.y === p.y)) props.push({ kind: 'salvage', x: p.x, y: p.y, id: `salvage-${ruins}-${k}` });
    }
    const bots = far(x, y, 45) ? 2 : 1;
    for (let k = 0; k < bots; k++) enemies.push({ kind: 'bot', ...inside() });
    for (let k = 0; k < 2; k++) enemies.push({ kind: 'mite', ...inside() });
    ruins++;
  }

  // dead solar farms, where dune crawlers nest
  let farms = 0; tries = 0;
  while (farms < 4 && tries++ < 400) {
    const x = randInt(rng, 16, W - 18), y = randInt(rng, 6, H - 12);
    if (!free(x, y, 12, 7) || !far(x, y, 22)) continue;
    claim(x, y, 12, 7);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      props.push({ kind: rng() < 0.45 ? 'solar_panel_broken' : 'solar_panel', x: x + 1 + c * 4, y: y + 1 + r * 3, id: `panel-${farms}-${r}-${c}` });
    }
    props.push({ kind: 'pylon', x: x + 11, y: y + 3, id: `pylon-${farms}` });
    enemies.push({ kind: 'crawler', x: x + 3, y: y + 6 }, { kind: 'crawler', x: x + 8, y: y + 6 });
    farms++;
  }

  // sun shrines, far from town
  for (const [qx, qy] of [[0.55, 0.18], [0.85, 0.5], [0.6, 0.85]] as const) {
    for (let t = 0; t < 200; t++) {
      const x = Math.floor(W * qx) + randInt(rng, -8, 8), y = Math.floor(H * qy) + randInt(rng, -5, 5);
      if (!free(x, y, 3, 3)) continue;
      claim(x - 1, y - 1, 5, 5);
      props.push({ kind: 'shrine', x: x + 1, y: y + 1, id: `shrine-${props.length}` });
      break;
    }
  }

  // loose rock, then wandering packs
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    if (!taken[y][x] && rng() < 0.022) ground[y][x] = Tl.ROCK;
  }
  const open = (d: number) => {
    for (let t = 0; t < 300; t++) {
      const x = randInt(rng, 6, W - 6), y = randInt(rng, 6, H - 6);
      if (!taken[y][x] && !isSolidTile(ground[y][x]) && far(x, y, d)) return { x, y };
    }
    return null;
  };
  for (let p = 0; p < 12; p++) {
    const c = open(14);
    if (!c) continue;
    for (let k = 0; k < randInt(rng, 3, 4); k++) enemies.push({ kind: 'mite', x: c.x + randInt(rng, -1, 1), y: c.y + randInt(rng, -1, 1) });
  }
  for (let p = 0; p < 8; p++) { const c = open(24); if (c) enemies.push({ kind: 'crawler', ...c }); }

  const world: WorldData = { zone: 'wasteland', name: 'Solar Wastelands', w: W, h: H, ground, shade, spawn, gates, props, npcs: [], enemies };
  openPaths(world, mid);
  // nothing may stand inside rock, or on top of the player's way in
  world.enemies = world.enemies.filter((e) => !isSolid(world, e.x, e.y) && far(e.x, e.y, 10));
  return world;
}

const isSolidTile = (t: number) => t === Tl.ROCK || t === Tl.RUBBLE || t === Tl.RUIN_TOP || t === Tl.RUIN_FACE;

/** Anything worth reaching must be reachable: cut a path to the road from each prop that is walled off. */
function openPaths(world: WorldData, roadY: number) {
  for (let pass = 0; pass < 3; pass++) {
    const seen = reachable(world, world.spawn.x, world.spawn.y);
    let fixed = 0;
    for (const p of world.props) {
      if (p.kind !== 'salvage' && p.kind !== 'shrine') continue;
      const near = [[0, 1], [0, -1], [-1, 0], [1, 0]].some(([dx, dy]) => seen[p.y + dy]?.[p.x + dx]);
      if (near) continue;
      fixed++;
      const dir = p.y < roadY ? 1 : -1;
      for (let y = p.y + dir; y !== roadY + dir; y += dir) {
        if (isSolid(world, p.x, y)) world.ground[y][p.x] = Tl.CONCRETE;
        world.props = world.props.filter((q) => q === p || !propFootprint(q.kind).some(([dx, dy]) => q.x + dx === p.x && q.y + dy === y));
      }
    }
    if (!fixed) return;
  }
}
