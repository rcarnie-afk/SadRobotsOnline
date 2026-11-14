import { OIL_KINDS, OilKind } from '../data/balance';
import { ALL_PARTS, Build, DEFAULT_BUILD, SLOTS, STARTER_PARTS, slotOf } from '../data/parts';

export interface SaveData {
  version: 1;
  name: string;
  build: Build;
  paint: string;
  level: number;
  solar: number;
  unlocked: string[];
  batteries: number;
  oils: Record<OilKind, number>;
  gift: boolean;       // took the free cells in town
  seenHelp: boolean;
  gateSeen: boolean;  // saw the level-2 guest gate
}

export const PAINTS = ['bone', 'steel', 'copper', 'teal', 'rust', 'yellow', 'brown'];
const KEY = 'sad-robots-online-save-v1';

export function newSave(): SaveData {
  return {
    version: 1, name: 'Unit 7', build: { ...DEFAULT_BUILD }, paint: 'bone', level: 1, solar: 0,
    unlocked: [...STARTER_PARTS], batteries: 2, oils: { black: 0, amber: 0, green: 0, blue: 0 },
    gift: false, seenHelp: false, gateSeen: false,
  };
}

const count = (v: unknown, max = 99) => (typeof v === 'number' && isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0);

/** Turn anything that came out of storage into a valid save. Bad or missing fields fall back to defaults. */
export function sanitize(raw: unknown): SaveData {
  const d = newSave();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, any>;
  if (typeof r.name === 'string' && r.name.trim()) d.name = r.name.trim().slice(0, 16);
  if (Array.isArray(r.unlocked)) {
    const extra = r.unlocked.filter((p: unknown): p is string => typeof p === 'string' && ALL_PARTS.includes(p));
    d.unlocked = Array.from(new Set([...STARTER_PARTS, ...extra]));
  }
  if (r.build && typeof r.build === 'object') {
    for (const slot of SLOTS) {
      const id = r.build[slot];
      if (typeof id === 'string' && ALL_PARTS.includes(id) && slotOf(id) === slot && d.unlocked.includes(id)) d.build[slot] = id;
    }
  }
  if (typeof r.paint === 'string' && PAINTS.includes(r.paint)) d.paint = r.paint;
  if (typeof r.level === 'number') d.level = Math.max(1, count(r.level, 99));
  if (typeof r.solar === 'number') d.solar = count(r.solar, 1e6);
  if (typeof r.batteries === 'number') d.batteries = count(r.batteries);
  if (r.oils && typeof r.oils === 'object') for (const k of OIL_KINDS) d.oils[k] = count(r.oils[k]);
  d.gift = r.gift === true;
  d.seenHelp = r.seenHelp === true;
  d.gateSeen = r.gateSeen === true;
  return d;
}

/** Storage can be missing or refuse writes (private windows, sandboxed pages). Never throw. */
export function loadSave(): SaveData | null {
  try {
    const text = localStorage.getItem(KEY);
    return text ? sanitize(JSON.parse(text)) : null;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
