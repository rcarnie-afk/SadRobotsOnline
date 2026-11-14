import { ENEMIES, EnemyKind, OIL_KINDS, OilKind } from '../data/balance';
import { ALL_PARTS } from '../data/parts';
import { Rng, pick } from './rng';

export type Drop =
  | { kind: 'solar'; amount: number }
  | { kind: 'battery' }
  | { kind: 'oil'; oil: OilKind }
  | { kind: 'part'; part: string };

/** What a defeated enemy leaves behind. Solar points always; consumables by chance. */
export function rollEnemyDrops(kind: EnemyKind, rng: Rng, unlocked: readonly string[] = ALL_PARTS): Drop[] {
  const e = ENEMIES[kind];
  const drops: Drop[] = [];
  const orbs = kind === 'mite' ? 1 : kind === 'crawler' ? 2 : 3;
  const each = Math.floor(e.xp / orbs);
  for (let i = 0; i < orbs; i++) drops.push({ kind: 'solar', amount: i === 0 ? e.xp - each * (orbs - 1) : each });
  if (rng() < e.battery) drops.push({ kind: 'battery' });
  if (rng() < e.oil) drops.push({ kind: 'oil', oil: pick(rng, OIL_KINDS) });
  const locked = ALL_PARTS.filter((p) => !unlocked.includes(p));
  if (locked.length && rng() < e.part) drops.push({ kind: 'part', part: pick(rng, locked) });
  return drops;
}

/** What a salvage pile holds. A part the player has not found yet turns up about a third of the time. */
export function rollSalvage(unlocked: readonly string[], rng: Rng): Drop[] {
  const drops: Drop[] = [{ kind: 'solar', amount: 6 + Math.floor(rng() * 7) }];
  const locked = ALL_PARTS.filter((p) => !unlocked.includes(p));
  if (locked.length && rng() < 0.36) drops.push({ kind: 'part', part: pick(rng, locked) });
  if (rng() < 0.5) drops.push({ kind: 'battery' });
  if (rng() < 0.45) drops.push({ kind: 'oil', oil: pick(rng, OIL_KINDS) });
  return drops;
}
