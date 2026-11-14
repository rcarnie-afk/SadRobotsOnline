/** What each robot part does. Ids match art/sprites/manifest.json. */
export type Slot = 'head' | 'torso' | 'arms' | 'legs';
export const SLOTS: Slot[] = ['head', 'torso', 'arms', 'legs'];

export interface Mods {
  hull?: number;        // max hull points
  charge?: number;      // max charge
  speed?: number;       // walk speed, pixels per second
  melee?: number;       // melee damage
  meleeCd?: number;     // melee cooldown, ms (negative is faster)
  reach?: number;       // melee reach, pixels
  bolt?: number;        // bolt damage
  crit?: number;        // chance of a double-damage hit, 0-1
  drain?: number;       // multiplier on charge drain out of the sun
  solar?: number;       // multiplier on solar points gained
  magnet?: number;      // pickup range, pixels
  dashCd?: number;      // dash cooldown, ms
  dashCost?: number;    // dash charge cost
}

export const PART_MODS: Record<string, { mods: Mods; blurb: string }> = {
  head_worker: { mods: { bolt: 2 }, blurb: 'Steady aim. Bolt +2.' },
  head_dome: { mods: { charge: 20 }, blurb: 'Roomy dome. Charge +20.' },
  head_dish: { mods: { bolt: 4, magnet: 16 }, blurb: 'Dish antenna. Bolt +4, wider pickup.' },
  head_goggle: { mods: { crit: 0.12 }, blurb: 'Sharp goggles. 12% double hits.' },
  head_sleep: { mods: { drain: 0.75 }, blurb: 'Sleep mode. Loses charge 25% slower.' },
  head_gopik: { mods: { hull: 10 }, blurb: 'Thick cap. Hull +10.' },
  torso_worker: { mods: { hull: 40, speed: -6 }, blurb: 'Pauldrons. Hull +40, a little slower.' },
  torso_kneeler: { mods: { hull: 25 }, blurb: 'Barrel chest. Hull +25.' },
  torso_gopik: { mods: { hull: 15, charge: 15 }, blurb: 'Go-Pik body. Hull +15, charge +15.' },
  torso_yellow: { mods: { charge: 35, hull: 5 }, blurb: 'Backpack cell. Charge +35.' },
  torso_sleep: { mods: { speed: 8, solar: 1.25 }, blurb: 'Slim frame. Faster, solar points +25%.' },
  arm_fists: { mods: { melee: 6, meleeCd: 90 }, blurb: 'Heavy fists. Hit +6, slower swing.' },
  arm_hose: { mods: { melee: 1, reach: 9 }, blurb: 'Long hose arms. Longer reach.' },
  arm_gopik: { mods: { melee: 2 }, blurb: 'Work mitts. Hit +2.' },
  arm_gauntlet: { mods: { melee: 3, meleeCd: -80 }, blurb: 'Gauntlets. Hit +3, faster swing.' },
  legs_boots: { mods: { hull: 10 }, blurb: 'Big boots. Hull +10.' },
  legs_treads: { mods: { hull: 20, speed: -8 }, blurb: 'Treads. Hull +20, slower.' },
  legs_wheel: { mods: { speed: 22, hull: -5 }, blurb: 'One wheel. Much faster, hull -5.' },
  legs_fins: { mods: { speed: 10, dashCd: -200 }, blurb: 'Finned boots. Faster, quicker dash.' },
  legs_claws: { mods: { speed: 6, dashCost: -4 }, blurb: 'Claw feet. Faster, cheaper dash.' },
};

export type Build = Record<Slot, string>;

export const DEFAULT_BUILD: Build = { head: 'head_gopik', torso: 'torso_gopik', arms: 'arm_gopik', legs: 'legs_treads' };

/** Parts every new robot can choose from. The rest are found in the wasteland. */
export const STARTER_PARTS: string[] = [
  'head_gopik', 'head_worker', 'head_dome',
  'torso_gopik', 'torso_kneeler',
  'arm_gopik', 'arm_fists',
  'legs_treads', 'legs_boots',
];

export const ALL_PARTS: string[] = Object.keys(PART_MODS);
export const slotOf = (id: string): Slot =>
  id.startsWith('head_') ? 'head' : id.startsWith('torso_') ? 'torso' : id.startsWith('arm_') ? 'arms' : 'legs';
