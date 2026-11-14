/** Solar points needed to go from `level` to the next one. */
export function solarForNext(level: number): number {
  return Math.round(30 * Math.pow(Math.max(1, level), 1.6));
}

export interface Progress { level: number; solar: number; }

/** Add solar points and roll over into new levels. Returns the new progress and levels gained. */
export function addSolar(p: Progress, amount: number): { progress: Progress; gained: number } {
  let level = Math.max(1, Math.floor(p.level));
  let solar = Math.max(0, p.solar) + Math.max(0, amount);
  let gained = 0;
  while (solar >= solarForNext(level) && level < 99) {
    solar -= solarForNext(level);
    level++;
    gained++;
  }
  return { progress: { level, solar }, gained };
}
