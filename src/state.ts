/** The one shared game state: the saved robot plus what is true right now. */
import { OIL_KINDS, OilKind } from './data/balance';
import { SaveData, newSave, writeSave } from './systems/save';
import { Stats, deriveStats } from './systems/stats';
import { Zone } from './world/types';

export const game = {
  save: newSave() as SaveData,
  stats: deriveStats(newSave().build, 1) as Stats,
  hull: 0,
  charge: 0,
  buffs: { black: 0, amber: 0, green: 0, blue: 0 } as Record<OilKind, number>,   // seconds left
  zone: 'town' as Zone,
  trip: 0,                    // counts wasteland visits; each one is a freshly generated map
  light: 'town' as 'sun' | 'shade' | 'storm' | 'town',
  storageOk: true,
};

export function recalc(refill = false) {
  game.stats = deriveStats(game.save.build, game.save.level);
  if (refill) { game.hull = game.stats.hull; game.charge = game.stats.charge; }
  game.hull = Math.min(game.hull, game.stats.hull);
  game.charge = Math.min(game.charge, game.stats.charge);
}

export function persist() { game.storageOk = writeSave(game.save); }

export function clearBuffs() { for (const k of OIL_KINDS) game.buffs[k] = 0; }
