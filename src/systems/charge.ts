import { CHARGE } from '../data/balance';

export type Light = 'sun' | 'shade' | 'storm' | 'town';

/** Charge after `dt` seconds under the given light. Clamped to 0..max. */
export function tickCharge(charge: number, max: number, light: Light, dt: number, drainMul = 1): number {
  let rate: number;
  if (light === 'sun') rate = CHARGE.sunGain;
  else if (light === 'town') rate = CHARGE.townGain;
  else rate = -CHARGE.shadeDrain * drainMul;
  return Math.min(max, Math.max(0, charge + rate * dt));
}

export const isLow = (charge: number, max: number) => charge / max <= CHARGE.lowWarning;
