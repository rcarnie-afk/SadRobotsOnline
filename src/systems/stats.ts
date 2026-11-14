import { BASE, PER_LEVEL } from '../data/balance';
import { Build, Mods, PART_MODS, SLOTS } from '../data/parts';

export interface Stats {
  hull: number; charge: number; speed: number;
  melee: number; meleeCd: number; reach: number;
  bolt: number; crit: number; drain: number; solar: number; magnet: number;
  dashCd: number; dashCost: number;
}

/** A robot's numbers from its four parts and its level. Unknown part ids count as nothing. */
export function deriveStats(build: Build, level: number): Stats {
  const sum: Required<Mods> = {
    hull: 0, charge: 0, speed: 0, melee: 0, meleeCd: 0, reach: 0, bolt: 0, crit: 0,
    drain: 1, solar: 1, magnet: 0, dashCd: 0, dashCost: 0,
  };
  for (const slot of SLOTS) {
    const m = PART_MODS[build[slot]]?.mods;
    if (!m) continue;
    for (const k of Object.keys(m) as (keyof Mods)[]) {
      if (k === 'drain' || k === 'solar') sum[k] *= m[k]!;
      else sum[k] += m[k]!;
    }
  }
  const lv = Math.max(1, Math.floor(level)) - 1;
  const dmg = 1 + PER_LEVEL.damage * lv;
  return {
    hull: Math.max(10, BASE.hull + sum.hull + PER_LEVEL.hull * lv),
    charge: Math.max(20, BASE.charge + sum.charge + PER_LEVEL.charge * lv),
    speed: Math.max(30, BASE.speed + sum.speed),
    melee: Math.round((BASE.melee + sum.melee) * dmg),
    meleeCd: Math.max(150, BASE.meleeCd + sum.meleeCd),
    reach: BASE.reach + sum.reach,
    bolt: Math.round((BASE.bolt + sum.bolt) * dmg),
    crit: Math.min(0.6, sum.crit),
    drain: sum.drain,
    solar: sum.solar,
    magnet: BASE.magnet + sum.magnet,
    dashCd: Math.max(300, BASE.dashCd + sum.dashCd),
    dashCost: Math.max(2, BASE.dashCost + sum.dashCost),
  };
}
