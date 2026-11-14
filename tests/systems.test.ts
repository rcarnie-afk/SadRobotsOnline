import { describe, expect, it } from 'vitest';
import { BASE, CHARGE, ENEMIES, PER_LEVEL } from '../src/data/balance';
import { ALL_PARTS, DEFAULT_BUILD, STARTER_PARTS, slotOf } from '../src/data/parts';
import { isLow, tickCharge } from '../src/systems/charge';
import { addSolar, solarForNext } from '../src/systems/leveling';
import { rollEnemyDrops, rollSalvage } from '../src/systems/loot';
import { makeRng } from '../src/systems/rng';
import { newSave, sanitize } from '../src/systems/save';
import { deriveStats } from '../src/systems/stats';
import manifest from '../art/sprites/manifest.json';

describe('parts data', () => {
  it('has stats for every part in the art manifest, and no extras', () => {
    const ids = Object.values(manifest.slots).flat().map((p: any) => p.id).sort();
    expect([...ALL_PARTS].sort()).toEqual(ids);
  });
  it('lets a new robot fill every slot from the starter parts', () => {
    for (const slot of ['head', 'torso', 'arms', 'legs']) expect(STARTER_PARTS.some((p) => slotOf(p) === slot)).toBe(true);
    for (const id of Object.values(DEFAULT_BUILD)) expect(STARTER_PARTS).toContain(id);
  });
});

describe('deriveStats', () => {
  it('adds part bonuses to the base numbers', () => {
    const s = deriveStats({ head: 'head_gopik', torso: 'torso_worker', arms: 'arm_fists', legs: 'legs_treads' }, 1);
    expect(s.hull).toBe(BASE.hull + 10 + 40 + 20);
    expect(s.speed).toBe(BASE.speed - 6 - 8);
    expect(s.melee).toBe(BASE.melee + 6);
    expect(s.meleeCd).toBe(BASE.meleeCd + 90);
  });
  it('grows hull, charge and damage with level', () => {
    const a = deriveStats(DEFAULT_BUILD, 1), b = deriveStats(DEFAULT_BUILD, 5);
    expect(b.hull - a.hull).toBe(PER_LEVEL.hull * 4);
    expect(b.charge - a.charge).toBe(PER_LEVEL.charge * 4);
    expect(b.melee).toBeGreaterThan(a.melee);
  });
  it('multiplies drain and solar bonuses and ignores unknown parts', () => {
    const s = deriveStats({ head: 'head_sleep', torso: 'torso_sleep', arms: 'nope', legs: 'legs_boots' }, 1);
    expect(s.drain).toBeCloseTo(0.75);
    expect(s.solar).toBeCloseTo(1.25);
    expect(s.melee).toBe(BASE.melee);
  });
  it('never drops below playable floors', () => {
    const s = deriveStats({ head: 'x', torso: 'x', arms: 'x', legs: 'legs_wheel' }, -3);
    expect(s.hull).toBeGreaterThanOrEqual(10);
    expect(s.speed).toBeGreaterThanOrEqual(30);
  });
});

describe('leveling', () => {
  it('needs more solar points each level', () => {
    expect(solarForNext(1)).toBe(30);
    expect(solarForNext(2)).toBeGreaterThan(solarForNext(1));
    expect(solarForNext(3)).toBeGreaterThan(solarForNext(2));
  });
  it('rolls spare points into the next level', () => {
    const r = addSolar({ level: 1, solar: 25 }, 10);
    expect(r).toEqual({ progress: { level: 2, solar: 5 }, gained: 1 });
  });
  it('can gain several levels at once and ignores negative amounts', () => {
    expect(addSolar({ level: 1, solar: 0 }, 30 + solarForNext(2)).gained).toBe(2);
    expect(addSolar({ level: 3, solar: 4 }, -50).progress).toEqual({ level: 3, solar: 4 });
  });
});

describe('charge', () => {
  it('fills in sun and town, drains in shade and storms', () => {
    expect(tickCharge(50, 100, 'sun', 1)).toBeCloseTo(50 + CHARGE.sunGain);
    expect(tickCharge(50, 100, 'town', 1)).toBeCloseTo(50 + CHARGE.townGain);
    expect(tickCharge(50, 100, 'shade', 1)).toBeCloseTo(50 - CHARGE.shadeDrain);
    expect(tickCharge(50, 100, 'storm', 2, 0.75)).toBeCloseTo(50 - CHARGE.shadeDrain * 2 * 0.75);
  });
  it('stays between empty and full', () => {
    expect(tickCharge(99, 100, 'sun', 60)).toBe(100);
    expect(tickCharge(1, 100, 'storm', 60)).toBe(0);
  });
  it('warns at a quarter', () => {
    expect(isLow(25, 100)).toBe(true);
    expect(isLow(26, 100)).toBe(false);
  });
});

describe('loot', () => {
  it('always pays an enemy’s full solar value', () => {
    for (const kind of ['mite', 'crawler', 'bot'] as const) {
      const drops = rollEnemyDrops(kind, makeRng(3));
      const total = drops.reduce((n, d) => n + (d.kind === 'solar' ? d.amount : 0), 0);
      expect(total).toBe(ENEMIES[kind].xp);
    }
  });
  it('is the same for the same seed', () => {
    expect(rollEnemyDrops('bot', makeRng(42))).toEqual(rollEnemyDrops('bot', makeRng(42)));
  });
  it('lets bots drop only parts the player has not found', () => {
    let parts = 0;
    for (let seed = 1; seed < 400; seed++) for (const d of rollEnemyDrops('bot', makeRng(seed), STARTER_PARTS)) {
      if (d.kind === 'part') { parts++; expect(STARTER_PARTS).not.toContain(d.part); }
    }
    expect(parts).toBeGreaterThan(20);
    for (let seed = 1; seed < 100; seed++) expect(rollEnemyDrops('mite', makeRng(seed), STARTER_PARTS).some((d) => d.kind === 'part')).toBe(false);
  });
  it('only offers parts the player has not found', () => {
    for (let seed = 1; seed < 200; seed++) {
      for (const d of rollSalvage(STARTER_PARTS, makeRng(seed))) if (d.kind === 'part') expect(STARTER_PARTS).not.toContain(d.part);
      for (const d of rollSalvage(ALL_PARTS, makeRng(seed))) expect(d.kind).not.toBe('part');
    }
  });
});

describe('save', () => {
  it('falls back to a new robot for junk', () => {
    for (const junk of [null, 7, 'x', [], { build: 5, oils: 'no' }]) expect(sanitize(junk)).toEqual(newSave());
  });
  it('keeps valid fields and repairs bad ones', () => {
    const s = sanitize({ name: '  Rusty the Very Long Named Robot  ', level: 4.9, solar: -3, batteries: 500,
      unlocked: ['head_dish', 'bogus'], build: { head: 'head_dish', torso: 'torso_sleep', arms: 'legs_boots', legs: 'legs_boots' },
      paint: 'neon', oils: { black: 2, amber: 'x' } });
    expect(s.name).toBe('Rusty the Very L');
    expect(s.level).toBe(4);
    expect(s.solar).toBe(0);
    expect(s.batteries).toBe(99);
    expect(s.unlocked).toContain('head_dish');
    expect(s.unlocked).not.toContain('bogus');
    expect(s.build.head).toBe('head_dish');           // unlocked, right slot
    expect(s.build.torso).toBe(DEFAULT_BUILD.torso);  // not unlocked
    expect(s.build.arms).toBe(DEFAULT_BUILD.arms);    // wrong slot
    expect(s.paint).toBe('bone');
    expect(s.oils).toEqual({ black: 2, amber: 0, green: 0, blue: 0 });
  });
});
