/** Every tunable number in one place. */
export const VIEW_W = 480;
export const VIEW_H = 270;
export const TILE = 16;

export const BASE = {
  hull: 60, charge: 100, speed: 78,
  melee: 8, meleeCd: 380, reach: 26,
  bolt: 6, boltCost: 5, boltCd: 450, boltSpeed: 230,
  dashCost: 10, dashCd: 900, dashSpeed: 260, dashMs: 170,
  magnet: 34,
};

export const PER_LEVEL = { hull: 8, charge: 4, damage: 0.06 };

export const CHARGE = {
  sunGain: 2.2,      // per second in open sun
  shadeDrain: 1.6,   // per second in shade or a dust storm
  townGain: 8,       // per second inside Tinker Town
  lowWarning: 0.25,  // fraction of max that triggers the warning
};

export const STORM = { minGap: 70, maxGap: 110, length: 22, warning: 5 };

export const SHUTDOWN_LOSS = 0.25;   // share of carried batteries and oils lost when towed home

export const OIL = {
  black: { label: 'Black oil', seconds: 20, text: 'Damage +50%' },
  amber: { label: 'Amber oil', seconds: 20, text: 'Speed +30%' },
  green: { label: 'Green oil', seconds: 15, text: 'Self-repair' },
  blue: { label: 'Blue coolant', seconds: 20, text: 'Cooldowns halved' },
} as const;
export type OilKind = keyof typeof OIL;
export const OIL_KINDS: OilKind[] = ['black', 'amber', 'green', 'blue'];

export const BATTERY_CHARGE = 45;
export const GREEN_REPAIR = 3;        // hull per second

export const ENEMIES = {
  mite: { name: 'Scrap mite', hp: 10, dmg: 4, speed: 62, xp: 4, aggro: 110, hitCd: 800, battery: 0.06, oil: 0.05, part: 0 },
  crawler: { name: 'Dune crawler', hp: 34, dmg: 10, speed: 42, xp: 14, aggro: 130, hitCd: 1000, battery: 0.16, oil: 0.14, part: 0.04 },
  bot: { name: 'Corrupted maintenance bot', hp: 60, dmg: 14, speed: 34, xp: 26, aggro: 120, hitCd: 1100, battery: 0.3, oil: 0.25, part: 0.15 },
} as const;
export type EnemyKind = keyof typeof ENEMIES;
