import { describe, expect, it } from 'vitest';
import { buildTown } from '../src/world/town';
import { buildWasteland } from '../src/world/wasteland';
import { WorldData, isSolid, reachable, walkable } from '../src/world/types';

function checkWorld(w: WorldData) {
  expect(w.ground.length).toBe(w.h);
  for (const row of w.ground) expect(row.length).toBe(w.w);
  expect(isSolid(w, w.spawn.x, w.spawn.y)).toBe(false);
  const seen = reachable(w, w.spawn.x, w.spawn.y);
  const ok = walkable(w);
  for (const g of w.gates) expect(seen[g.y][g.x], `gate ${g.x},${g.y}`).toBe(true);
  const beside = (x: number, y: number) => [[0, 1], [0, -1], [1, 0], [-1, 0], [2, 1], [-1, 1]].some(([dx, dy]) => seen[y + dy]?.[x + dx]);
  for (const p of w.props) if (['salvage', 'shrine', 'workbench', 'sign_junction'].includes(p.kind)) expect(beside(p.x, p.y), `${p.id} reachable`).toBe(true);
  for (const n of w.npcs) expect(seen[n.y][n.x], `${n.id} stands on reachable ground`).toBe(true);
  for (const e of w.enemies) expect(ok[e.y]?.[e.x] !== undefined && !isSolid(w, e.x, e.y), `enemy at ${e.x},${e.y}`).toBe(true);
}

describe('Tinker Town', () => {
  it('is sound: everyone and everything can be reached', () => checkWorld(buildTown()));
  it('has the east gate and no enemies', () => {
    const t = buildTown();
    expect(t.gates.every((g) => g.to === 'wasteland')).toBe(true);
    expect(t.enemies).toEqual([]);
  });
});

describe('Solar Wastelands', () => {
  it('is sound for many seeds', () => {
    for (const seed of [2026, 1, 2, 3, 99, 12345, 777, 31337]) checkWorld(buildWasteland(seed));
  });
  it('is the same map for the same seed', () => {
    expect(buildWasteland(5).ground).toEqual(buildWasteland(5).ground);
  });
  it('has shrines, salvage, shade and all three enemy kinds', () => {
    const w = buildWasteland();
    expect(w.props.filter((p) => p.kind === 'shrine').length).toBeGreaterThanOrEqual(2);
    expect(w.props.filter((p) => p.kind === 'salvage').length).toBeGreaterThanOrEqual(6);
    expect(w.shade.flat().some(Boolean)).toBe(true);
    for (const k of ['mite', 'crawler', 'bot']) expect(w.enemies.some((e) => e.kind === k), k).toBe(true);
  });
  it('keeps enemies away from the gate', () => {
    const w = buildWasteland();
    for (const e of w.enemies) expect(Math.hypot(e.x - w.spawn.x, e.y - w.spawn.y)).toBeGreaterThanOrEqual(10);
  });
});
