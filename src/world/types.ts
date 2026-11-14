import { EnemyKind } from '../data/balance';
import { Build } from '../data/parts';

export type Zone = 'town' | 'wasteland';

export const Tl = {
  SAND1: 0, SAND2: 1, SAND3: 2, SAND4: 3, CRACK1: 4, CRACK2: 5, ROCK: 6, RUBBLE: 7,
  PLATE1: 8, PLATE2: 9, RIVET: 10, HAZARD: 11, WALL_TOP: 12, WALL_FACE: 13, CONCRETE: 14, GRASS: 15,
  RUIN_TOP: 16, RUIN_FACE: 17, ASPHALT: 18, ROAD_LINE: 19, PAD: 20, GRATE: 21, DUNE: 22, SCRAP: 23,
  GATE: 24, ROOF_RUST: 25, ROOF_TEAL: 26, DOOR: 27, WINDOW: 28, SHADOW: 30,
} as const;

export const SOLID_TILES: number[] = [Tl.ROCK, Tl.RUBBLE, Tl.WALL_TOP, Tl.WALL_FACE, Tl.RUIN_TOP, Tl.RUIN_FACE,
  Tl.ROOF_RUST, Tl.ROOF_TEAL, Tl.DOOR, Tl.WINDOW];

export type PropKind = 'solar_panel' | 'solar_panel_broken' | 'pylon' | 'salvage' | 'shrine' | 'workbench'
  | 'sign_town' | 'sign_junction';

export interface Prop { kind: PropKind; x: number; y: number; id: string; }

export interface NpcDef {
  id: string; name: string; source: string;   // source = crop id of Rob's drawing, for the portrait
  build: Build; paint: string; x: number; y: number; wander?: boolean;
  lines: string[]; action?: 'workbench' | 'gift';
}

export interface WorldData {
  zone: Zone; name: string; w: number; h: number;
  ground: number[][];
  shade: boolean[][];
  spawn: { x: number; y: number };
  gates: { x: number; y: number; to: Zone }[];
  props: Prop[];
  npcs: NpcDef[];
  enemies: { kind: EnemyKind; x: number; y: number }[];
}

/** Tiles a prop blocks, as [dx, dy] offsets from its anchor tile. */
export function propFootprint(kind: PropKind): [number, number][] {
  if (kind === 'solar_panel' || kind === 'solar_panel_broken' || kind === 'workbench') return [[0, 0], [1, 0]];
  if (kind === 'sign_town' || kind === 'sign_junction') return [[0, 0], [1, 0]];
  return [[0, 0]];
}

export function isSolid(world: WorldData, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= world.w || y >= world.h) return true;
  return SOLID_TILES.includes(world.ground[y][x]);
}

/** Walkable map as booleans, with props counted as blocking. */
export function walkable(world: WorldData): boolean[][] {
  const ok = world.ground.map((row, y) => row.map((_, x) => !isSolid(world, x, y)));
  for (const p of world.props) for (const [dx, dy] of propFootprint(p.kind)) {
    if (ok[p.y + dy]?.[p.x + dx] !== undefined) ok[p.y + dy][p.x + dx] = false;
  }
  return ok;
}

/** Every tile reachable on foot from the start tile. */
export function reachable(world: WorldData, sx: number, sy: number): boolean[][] {
  const ok = walkable(world);
  const seen = ok.map((r) => r.map(() => false));
  const queue: [number, number][] = [[sx, sy]];
  seen[sy][sx] = true;
  while (queue.length) {
    const [x, y] = queue.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (ok[ny]?.[nx] && !seen[ny][nx]) { seen[ny][nx] = true; queue.push([nx, ny]); }
    }
  }
  return seen;
}
