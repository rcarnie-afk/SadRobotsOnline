/** The playable world: Tinker Town or a fresh trip into the Solar Wastelands. */
import * as Phaser from 'phaser';
import { partById } from '../assets';
import { ROW } from '../art/robot';
import { ensureWorldTextures, robotTexture } from '../art/textures';
import { sfx } from '../audio';
import {
  BASE, BATTERY_CHARGE, ENEMIES, EnemyKind, GREEN_REPAIR, OIL, OIL_KINDS, OilKind, SHUTDOWN_LOSS, STORM, TILE,
} from '../data/balance';
import { Build } from '../data/parts';
import { clearBuffs, game, persist, recalc } from '../state';
import { tickCharge } from '../systems/charge';
import { addSolar } from '../systems/leveling';
import { Drop, rollEnemyDrops, rollSalvage } from '../systems/loot';
import { Rng, makeRng } from '../systems/rng';
import { advanceTalk, say, talking } from '../ui/dialogue';
import { blocking } from '../ui/dom';
import { SLOT_KEYS, blackout, buildHud, hideHelp, setPrompt, setStorm, toast, updateHud } from '../ui/hud';
import { showGate, showWorkbench } from '../ui/screens';
import { buildTown } from '../world/town';
import { NpcDef, Prop, WorldData, Zone, propFootprint, walkable } from '../world/types';
import { buildWasteland } from '../world/wasteland';

const CYCLE = [0, 1, 2, 1];
const FOOT_W = 5, FOOT_H = 4;           // half-width and height of the foot box used for walls
const BOT_LOOK: Build = { head: 'head_worker', torso: 'torso_worker', arms: 'arm_fists', legs: 'legs_boots' };

interface Walker { x: number; y: number; spr: Phaser.GameObjects.Sprite; dir: number; step: number; stepAcc: number; }
interface Mob extends Walker {
  kind: EnemyKind; hp: number; max: number; home: { x: number; y: number }; dead: boolean;
  hitAt: number; hurtUntil: number; kx: number; ky: number; wanderAt: number; wx: number; wy: number;
  chargeUntil: number; chargeReadyAt: number; cvx: number; cvy: number; aggro: boolean;
}
interface Npc extends Walker { def: NpcDef; wanderAt: number; tx: number; ty: number; }
interface Pickup { img: Phaser.GameObjects.Image; drop: Drop; x: number; y: number; vx: number; vy: number; born: number; }
interface Bolt { img: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; until: number; dmg: number; }
interface PropObj { prop: Prop; obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite; used: boolean; }

export interface WorldStart { zone: Zone; from: 'title' | 'gate' | 'tow'; note?: string; }

/** Robot textures made for the previous visit; removed once that visit's sprites are gone. */
let stale: string[] = [];

export class WorldScene extends Phaser.Scene {
  private world!: WorldData;
  private open!: boolean[][];
  private rng!: Rng;
  private player!: Walker & { tex: string; meleeAt: number; boltAt: number; dashAt: number; dashUntil: number; dvx: number; dvy: number; hurtUntil: number; down: boolean };
  private mobs: Mob[] = [];
  private npcs: Npc[] = [];
  private pickups: Pickup[] = [];
  private bolts: Bolt[] = [];
  private props: PropObj[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private bars!: Phaser.GameObjects.Graphics;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private stormDust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private storm = false;
  private dashWanted = false;
  private stormAt = 0;
  private stormWarned = false;
  private leaving = false;
  private saveAt = 0;
  private start!: WorldStart;

  constructor() { super('world'); }

  init(data: WorldStart) {
    this.start = data;
    this.mobs = []; this.npcs = []; this.pickups = []; this.bolts = []; this.props = [];
    this.storm = false; this.stormWarned = false; this.leaving = false; this.dashWanted = false;
  }

  private made: string[] = [];
  private robotTex(build: Build, paint: string) { const k = robotTexture(this, build, paint); this.made.push(k); return k; }

  create() {
    ensureWorldTextures(this);
    for (const k of stale) if (this.textures.exists(k)) this.textures.remove(k);
    stale = [];
    this.made = [];
    this.botTex = '';
    const zone = this.start.zone;
    game.zone = zone;
    if (zone === 'wasteland') game.trip++;
    this.world = zone === 'town' ? buildTown() : buildWasteland(9000 + game.trip * 131 + game.save.level);
    this.open = walkable(this.world);
    this.rng = makeRng(Date.now() & 0xffffff);
    const W = this.world.w * TILE, H = this.world.h * TILE;

    const map = this.make.tilemap({ data: this.world.ground, tileWidth: TILE, tileHeight: TILE });
    map.createLayer(0, map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!, 0, 0)!.setDepth(-10);
    if (this.world.shade.flat().some(Boolean)) {
      const shade = this.make.tilemap({ data: this.world.shade.map((r) => r.map((s) => (s ? 30 : -1))), tileWidth: TILE, tileHeight: TILE });
      shade.createLayer(0, shade.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!, 0, 0)!.setDepth(-9);
    }

    for (const p of this.world.props) this.addProp(p);
    for (const n of this.world.npcs) this.addNpc(n);
    for (const e of this.world.enemies) this.addMob(e.kind, (e.x + 0.5) * TILE, (e.y + 0.9) * TILE);

    // player
    let spawn = this.world.spawn;
    if (zone === 'town' && this.start.from === 'gate') spawn = { x: 35, y: 11 };
    const tex = this.robotTex(game.save.build, game.save.paint);
    const px = (spawn.x + 0.5) * TILE, py = (spawn.y + 0.9) * TILE;
    this.player = {
      x: px, y: py, spr: this.add.sprite(px, py, tex, ROW.down * 3 + 1).setOrigin(0.5, 31 / 32), dir: ROW.down, step: 0, stepAcc: 0,
      tex, meleeAt: 0, boltAt: 0, dashAt: 0, dashUntil: 0, dvx: 0, dvy: 0, hurtUntil: 0, down: false,
    };
    if (this.start.from === 'tow') { game.hull = game.stats.hull; game.charge = Math.round(game.stats.charge * 0.2); }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, H);
    cam.startFollow(this.player.spr, true, 0.18, 0.18, 0, 10);
    cam.setBackgroundColor('#12110f');
    cam.fadeIn(350, 18, 17, 15);

    this.bars = this.add.graphics().setDepth(100000);
    this.sparks = this.add.particles(0, 0, 'dot', {
      speed: { min: 30, max: 110 }, lifespan: { min: 180, max: 380 }, scale: { start: 1, end: 0 },
      tint: [0xffb84a, 0xfff3c4, 0xc98b45], emitting: false,
    }).setDepth(99999);
    this.dust = this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: 480 }, y: { min: 0, max: 270 }, speedX: { min: -14, max: -4 }, speedY: { min: -3, max: 3 },
      lifespan: 4000, alpha: { start: 0.35, end: 0 }, scale: 0.5, tint: 0xe8d3a0, frequency: 220, quantity: 1,
      emitting: zone === 'wasteland',
    }).setScrollFactor(0).setDepth(99998);
    this.stormDust = this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: 560 }, y: { min: -20, max: 270 }, speedX: { min: -220, max: -120 }, speedY: { min: 10, max: 40 },
      lifespan: 2200, alpha: { start: 0.75, end: 0 }, scale: { min: 0.5, max: 1.5 }, tint: [0xc9a46a, 0xa8834e], frequency: 12, quantity: 2,
      emitting: false,
    }).setScrollFactor(0).setDepth(99998);

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT', false) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.mouse?.disableContextMenu();
    const live = () => !blocking() && !this.player.down && !this.leaving;
    kb.on('keydown-E', () => { if (talking()) advanceTalk(); else if (live()) this.nearest()?.act(); });
    kb.on('keydown-SPACE', () => { if (talking()) advanceTalk(); });
    kb.on('keydown-SHIFT', () => { if (live()) this.dashWanted = true; });
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((k, i) => kb.on(`keydown-${k}`, () => { if (live()) this.useSlot(i); }));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (blocking() || this.player.down || this.leaving) return;
      if (p.rightButtonDown()) this.fireBolt(); else this.swing();
    });

    buildHud((slot) => this.useSlot(slot));
    if (game.save.seenHelp && zone === 'wasteland') hideHelp();
    setStorm(false);
    this.stormAt = this.time.now + 1000 * (STORM.minGap * 0.6 + this.rng() * 30);
    this.saveAt = this.time.now + 15000;

    if (zone === 'town') {
      if (this.start.from !== 'tow') toast(this.start.from === 'title' ? 'Tinker Town' : 'Back in Tinker Town. Town power is charging you.', '', 2600);
      if (!game.save.seenHelp) this.time.delayedCall(500, () => this.talkTo(this.npcs.find((n) => n.def.id === 'gopik-guide')!, true));
    } else {
      toast(`Solar Wastelands, trip ${game.trip}. Stay in the sun.`, 'warn', 3200);
    }
    persist();
    this.events.once('shutdown', () => { setPrompt(null); setStorm(false); stale = [...this.made]; });
    if (this.start.note) toast(this.start.note, 'warn', 6000);
  }

  // ───────────── building the world ─────────────

  private addProp(p: Prop) {
    const wide = propFootprint(p.kind).length > 1;
    const x = (p.x + (wide ? 1 : 0.5)) * TILE, y = (p.y + 1) * TILE;
    let obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    if (p.kind === 'shrine' || p.kind === 'salvage') obj = this.add.sprite(x, y, p.kind, 0);
    else obj = this.add.image(x, y, p.kind);
    obj.setOrigin(0.5, 1).setDepth(y);
    this.props.push({ prop: p, obj, used: false });
  }

  private addNpc(def: NpcDef) {
    const tex = this.robotTex(def.build, def.paint);
    const x = (def.x + 0.5) * TILE, y = (def.y + 0.9) * TILE;
    const spr = this.add.sprite(x, y, tex, ROW.down * 3 + 1).setOrigin(0.5, 31 / 32).setDepth(y);
    this.npcs.push({ def, x, y, spr, dir: ROW.down, step: 0, stepAcc: 0, wanderAt: 0, tx: x, ty: y });
  }

  private botTex = '';
  private addMob(kind: EnemyKind, x: number, y: number) {
    let spr: Phaser.GameObjects.Sprite;
    if (kind === 'bot') {
      if (!this.botTex) this.botTex = this.robotTex(BOT_LOOK, 'rust');
      spr = this.add.sprite(x, y, this.botTex, ROW.down * 3 + 1).setOrigin(0.5, 31 / 32);
    } else {
      spr = this.add.sprite(x, y, kind, 0).setOrigin(0.5, kind === 'mite' ? 15 / 16 : 23 / 24);
    }
    const e = ENEMIES[kind];
    this.mobs.push({
      kind, x, y, spr, dir: ROW.down, step: 0, stepAcc: 0, hp: e.hp, max: e.hp, home: { x, y }, dead: false, hitAt: 0, hurtUntil: 0,
      kx: 0, ky: 0, wanderAt: 0, wx: x, wy: y, chargeUntil: 0, chargeReadyAt: 0, cvx: 0, cvy: 0, aggro: false,
    });
  }

  // ───────────── movement ─────────────

  private blocked(x: number, y: number): boolean {
    const x0 = Math.floor((x - FOOT_W) / TILE), x1 = Math.floor((x + FOOT_W) / TILE);
    const y0 = Math.floor((y - FOOT_H) / TILE), y1 = Math.floor((y - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!this.open[ty]?.[tx]) return true;
    return false;
  }

  /** Move with walls; returns the distance actually moved. */
  private move(w: { x: number; y: number }, dx: number, dy: number): number {
    const ox = w.x, oy = w.y;
    if (dx && !this.blocked(w.x + dx, w.y)) w.x += dx;
    if (dy && !this.blocked(w.x, w.y + dy)) w.y += dy;
    return Math.hypot(w.x - ox, w.y - oy);
  }

  private faceToward(w: Walker, dx: number, dy: number) {
    if (Math.abs(dx) > Math.abs(dy)) w.dir = dx < 0 ? ROW.left : ROW.right;
    else if (dy) w.dir = dy < 0 ? ROW.up : ROW.down;
  }

  /** Advance a robot's walk frame by distance travelled; stand still on frame 1. */
  private animateRobot(w: Walker, moved: number) {
    if (moved > 0) {
      w.stepAcc += moved;
      if (w.stepAcc >= 6) { w.stepAcc = 0; w.step++; }
    } else { w.step = 0; w.stepAcc = 0; }
    w.spr.setFrame(w.dir * 3 + (moved > 0 ? CYCLE[w.step % 4] : 1));
    w.spr.setPosition(Math.round(w.x), Math.round(w.y)).setDepth(w.y);
  }

  // ───────────── main loop ─────────────

  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    if (blocking() || this.leaving) { setPrompt(null); updateHud(this.zoneLabel()); return; }
    if (!this.player.down) {
      this.updatePlayer(time, dt);
      this.updateLight(time, dt);
      this.updateBuffs(dt);
    }
    this.updateMobs(time, dt);
    this.updateNpcs(time, dt);
    this.updateBolts(time, dt);
    this.updatePickups(time, dt);
    this.drawBars();
    if (!this.player.down) this.checkInteract();
    if (!this.player.down && game.zone === 'wasteland' && (game.charge <= 0 || game.hull <= 0)) this.shutdown(game.hull <= 0);
    if (time > this.saveAt) { persist(); this.saveAt = time + 15000; }
    updateHud(this.zoneLabel());
  }

  private zoneLabel() { return game.zone === 'town' ? 'TINKER TOWN' : 'SOLAR WASTELANDS'; }

  private aim(): { x: number; y: number; a: number } {
    const p = this.input.activePointer;
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    const cx = this.player.x, cy = this.player.y - 10;
    return { x: w.x, y: w.y, a: Math.atan2(w.y - cy, w.x - cx) };
  }

  private updatePlayer(time: number, dt: number) {
    const p = this.player, k = this.keys, st = game.stats;
    let ix = 0, iy = 0;
    if (k.A.isDown || k.LEFT.isDown) ix--;
    if (k.D.isDown || k.RIGHT.isDown) ix++;
    if (k.W.isDown || k.UP.isDown) iy--;
    if (k.S.isDown || k.DOWN.isDown) iy++;
    const len = Math.hypot(ix, iy) || 1;
    ix /= len; iy /= len;
    const cdMul = game.buffs.blue > 0 ? 0.5 : 1;

    const wantDash = this.dashWanted;
    this.dashWanted = false;
    if (wantDash && time > p.dashAt && game.charge > st.dashCost) {
      let dx = ix, dy = iy;
      if (!dx && !dy) { const a = this.aim().a; dx = Math.cos(a); dy = Math.sin(a); }
      p.dvx = dx * BASE.dashSpeed; p.dvy = dy * BASE.dashSpeed;
      p.dashUntil = time + BASE.dashMs; p.dashAt = time + st.dashCd * cdMul;
      if (game.zone !== 'town') game.charge -= st.dashCost;
      sfx.dash();
      p.spr.setAlpha(0.6);
    }
    let moved: number;
    if (time < p.dashUntil) {
      moved = this.move(p, p.dvx * dt, p.dvy * dt);
      if (Math.random() < 0.6) this.sparks.emitParticleAt(p.x + (Math.random() - 0.5) * 8, p.y - 4, 1);
    } else {
      p.spr.setAlpha(1);
      const speed = st.speed * (game.buffs.amber > 0 ? 1.3 : 1);
      moved = this.move(p, ix * speed * dt, iy * speed * dt);
      if (ix || iy) this.faceToward(p, ix, iy);
    }
    const ptr = this.input.activePointer;
    if (ptr.isDown && ptr.leftButtonDown() && time > p.meleeAt) this.swing();
    this.animateRobot(p, moved);
    if (time < p.hurtUntil) p.spr.setTint(0xff7a6a); else p.spr.clearTint();

    // gates
    const tx = Math.floor(p.x / TILE), ty = Math.floor((p.y - 1) / TILE);
    const gate = this.world.gates.find((g) => g.x === tx && g.y === ty);
    if (gate) this.leave(gate.to, 'gate');
  }

  private updateLight(time: number, dt: number) {
    if (game.zone === 'town') game.light = 'town';
    else {
      // storms come and go on a timer
      if (!this.storm && time > this.stormAt - STORM.warning * 1000 && !this.stormWarned) {
        this.stormWarned = true;
        toast('The horizon is turning brown. A dust storm is coming.', 'warn', 4500);
      }
      if (!this.storm && time > this.stormAt) {
        this.storm = true; setStorm(true); this.stormDust.start();
        toast('Dust storm. No sun until it passes.', 'bad');
      }
      if (this.storm && time > this.stormAt + STORM.length * 1000) {
        this.storm = false; this.stormWarned = false; setStorm(false); this.stormDust.stop();
        this.stormAt = time + 1000 * (STORM.minGap + this.rng() * (STORM.maxGap - STORM.minGap));
        toast('The dust settles. The sun is back.', 'good');
      }
      const tx = Math.floor(this.player.x / TILE), ty = Math.floor((this.player.y - 1) / TILE);
      game.light = this.storm ? 'storm' : this.world.shade[ty]?.[tx] ? 'shade' : 'sun';
    }
    game.charge = tickCharge(game.charge, game.stats.charge, game.light, dt, game.stats.drain);
    if (game.zone === 'town') game.hull = Math.min(game.stats.hull, game.hull + 6 * dt);
  }

  private updateBuffs(dt: number) {
    for (const k of OIL_KINDS) {
      if (game.buffs[k] <= 0) continue;
      game.buffs[k] = Math.max(0, game.buffs[k] - dt);
      if (game.buffs[k] === 0) toast(`${OIL[k].label} wore off.`);
    }
    if (game.buffs.green > 0) game.hull = Math.min(game.stats.hull, game.hull + GREEN_REPAIR * dt);
  }

  // ───────────── combat ─────────────

  private damageMul() { return game.buffs.black > 0 ? 1.5 : 1; }

  private swing() {
    const time = this.time.now, p = this.player, st = game.stats;
    if (time < p.meleeAt || time < p.dashUntil) return;
    p.meleeAt = time + st.meleeCd * (game.buffs.blue > 0 ? 0.5 : 1);
    const { a } = this.aim();
    this.faceToward(p, Math.cos(a), Math.sin(a));
    sfx.swing();
    const cx = p.x, cy = p.y - 10;
    const g = this.add.graphics().setDepth(p.y + 1);
    g.lineStyle(2, 0xffe8b0, 0.9);
    g.beginPath(); g.arc(cx, cy, st.reach, a - 0.9, a + 0.9); g.strokePath();
    g.lineStyle(1, 0xffb84a, 0.7);
    g.beginPath(); g.arc(cx, cy, st.reach - 4, a - 0.7, a + 0.7); g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
    let hit = false;
    for (const m of this.mobs) {
      if (m.dead) continue;
      const dx = m.x - cx, dy = m.y - 6 - cy, d = Math.hypot(dx, dy);
      if (d > st.reach + 8) continue;
      let diff = Math.atan2(dy, dx) - a;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) > 1.15 && d > 10) continue;
      this.hurtMob(m, st.melee, dx / (d || 1), dy / (d || 1), 5);
      hit = true;
    }
    if (hit) this.cameras.main.shake(60, 0.002);
  }

  private fireBolt() {
    const time = this.time.now, p = this.player;
    if (time < p.boltAt) return;
    if (game.zone !== 'town' && game.charge <= BASE.boltCost) { toast('Too little charge for a bolt.', 'warn', 1500); return; }
    p.boltAt = time + BASE.boltCd * (game.buffs.blue > 0 ? 0.5 : 1);
    if (game.zone !== 'town') game.charge -= BASE.boltCost;
    const { a } = this.aim();
    this.faceToward(p, Math.cos(a), Math.sin(a));
    const x = p.x + Math.cos(a) * 8, y = p.y - 12 + Math.sin(a) * 8;
    const img = this.add.image(x, y, 'bolt').setDepth(p.y + 2);
    this.bolts.push({ img, x, y, vx: Math.cos(a) * BASE.boltSpeed, vy: Math.sin(a) * BASE.boltSpeed, until: time + 900, dmg: game.stats.bolt });
    sfx.bolt();
  }

  private updateBolts(time: number, dt: number) {
    for (const b of this.bolts) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.img.setPosition(Math.round(b.x), Math.round(b.y)).setDepth(b.y + 12);
      const tx = Math.floor(b.x / TILE), ty = Math.floor((b.y + 10) / TILE);
      let done = time > b.until || !this.open[ty]?.[tx] && this.world.ground[ty]?.[tx] !== undefined && !this.isLowProp(tx, ty);
      for (const m of this.mobs) {
        if (done || m.dead) continue;
        if (Math.hypot(m.x - b.x, m.y - 8 - b.y) < (m.kind === 'mite' ? 8 : 11)) {
          const d = Math.hypot(b.vx, b.vy);
          this.hurtMob(m, b.dmg, b.vx / d, b.vy / d, 3);
          done = true;
        }
      }
      if (done) { this.sparks.explode(5, b.x, b.y); b.img.destroy(); b.until = -1; }
    }
    this.bolts = this.bolts.filter((b) => b.until !== -1);
  }

  /** Bolts fly over salvage piles and signs, but not over walls, rocks or panels. */
  private isLowProp(tx: number, ty: number) {
    return this.props.some((o) => (o.prop.kind === 'salvage' || o.prop.kind.startsWith('sign')) &&
      propFootprint(o.prop.kind).some(([dx, dy]) => o.prop.x + dx === tx && o.prop.y + dy === ty));
  }

  private hurtMob(m: Mob, base: number, nx: number, ny: number, push: number) {
    const crit = this.rng() < game.stats.crit;
    const dmg = Math.round(base * this.damageMul() * (crit ? 2 : 1));
    m.hp -= dmg; m.aggro = true;
    m.kx += nx * push * 30; m.ky += ny * push * 30;
    m.hurtUntil = this.time.now + 90;
    sfx.hit();
    this.sparks.explode(crit ? 12 : 6, m.x, m.y - 8);
    this.floatText(m.x, m.y - 22, crit ? `${dmg}!` : `${dmg}`, crit ? '#ffb84a' : '#ffffff');
    if (m.hp <= 0) this.killMob(m);
  }

  private killMob(m: Mob) {
    m.dead = true;
    sfx.down();
    m.spr.setTintMode(Phaser.TintModes.MULTIPLY).setTint(0x6a6a6a);
    this.tweens.add({ targets: m.spr, alpha: { from: 1, to: 0 }, duration: 700, ease: 'Stepped', easeParams: [5], onComplete: () => m.spr.destroy() });
    for (const d of rollEnemyDrops(m.kind, this.rng, game.save.unlocked)) this.spawnPickup(d, m.x, m.y - 4);
  }

  private floatText(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color, stroke: '#000000', strokeThickness: 2, resolution: 3,
    }).setOrigin(0.5, 1).setDepth(100001);
    this.tweens.add({ targets: t, y: y - 14, alpha: 0, duration: 650, ease: 'Quad.out', onComplete: () => t.destroy() });
  }

  private hurtPlayer(dmg: number, fromX: number, fromY: number) {
    const p = this.player, time = this.time.now;
    if (time < p.hurtUntil || time < p.dashUntil || p.down) return;
    game.hull = Math.max(0, game.hull - dmg);
    p.hurtUntil = time + 450;
    const d = Math.hypot(p.x - fromX, p.y - fromY) || 1;
    this.move(p, ((p.x - fromX) / d) * 6, ((p.y - fromY) / d) * 6);
    sfx.hurt();
    this.cameras.main.shake(90, 0.004);
    this.floatText(p.x, p.y - 26, `-${dmg}`, '#ff8a74');
  }

  // ───────────── enemies ─────────────

  private updateMobs(time: number, dt: number) {
    const p = this.player;
    for (const m of this.mobs) {
      if (m.dead) continue;
      const e = ENEMIES[m.kind];
      const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
      if (!p.down && (d < e.aggro || (m.aggro && d < e.aggro * 1.8))) m.aggro = true; else if (d > e.aggro * 2) m.aggro = false;
      let vx = 0, vy = 0;
      if (m.aggro && !p.down) {
        if (m.kind === 'crawler' && time > m.chargeReadyAt && d < 90 && d > 30) {
          m.chargeUntil = time + 420; m.chargeReadyAt = time + 2600; m.cvx = (dx / d) * e.speed * 3.2; m.cvy = (dy / d) * e.speed * 3.2;
        }
        if (time < m.chargeUntil) { vx = m.cvx; vy = m.cvy; }
        else if (d > 9) { vx = (dx / d) * e.speed; vy = (dy / d) * e.speed; }
        const reach = m.kind === 'mite' ? 13 : 17;
        if (d < reach && time > m.hitAt) { m.hitAt = time + e.hitCd; this.hurtPlayer(e.dmg, m.x, m.y); }
      } else {
        if (time > m.wanderAt) {
          m.wanderAt = time + 1500 + this.rng() * 2500;
          m.wx = m.home.x + (this.rng() - 0.5) * 60; m.wy = m.home.y + (this.rng() - 0.5) * 40;
        }
        const wx = m.wx - m.x, wy = m.wy - m.y, wd = Math.hypot(wx, wy);
        if (wd > 3) { vx = (wx / wd) * e.speed * 0.4; vy = (wy / wd) * e.speed * 0.4; }
      }
      // knockback decays quickly
      vx += m.kx; vy += m.ky; m.kx *= 0.82; m.ky *= 0.82;
      // keep a little space from other mobs
      for (const o of this.mobs) {
        if (o === m || o.dead) continue;
        const ox = m.x - o.x, oy = m.y - o.y, od = Math.hypot(ox, oy);
        if (od > 0 && od < 10) { vx += (ox / od) * 30; vy += (oy / od) * 30; }
      }
      const moved = this.move(m, vx * dt, vy * dt);
      if (vx || vy) this.faceToward(m, vx, vy);
      if (m.kind === 'bot') this.animateRobot(m, moved);
      else {
        if (moved > 0) { m.stepAcc += moved; if (m.stepAcc > 5) { m.stepAcc = 0; m.step++; } }
        m.spr.setFrame(m.step % 2).setFlipX(vx > 0).setPosition(Math.round(m.x), Math.round(m.y)).setDepth(m.y);
      }
      if (time < m.hurtUntil) m.spr.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else m.spr.setTintMode(Phaser.TintModes.MULTIPLY).setTint(m.kind === 'bot' && Math.floor(time / 180) % 9 === 0 ? 0xff9a7a : 0xffffff);
    }
  }

  private drawBars() {
    const g = this.bars;
    g.clear();
    for (const m of this.mobs) {
      if (m.dead || m.hp >= m.max) continue;
      const w = m.kind === 'mite' ? 12 : 18, top = m.kind === 'bot' ? 30 : m.kind === 'crawler' ? 24 : 15;
      const x = Math.round(m.x - w / 2), y = Math.round(m.y - top);
      g.fillStyle(0x0e0d0b, 1).fillRect(x - 1, y - 1, w + 2, 4);
      g.fillStyle(0xc8492f, 1).fillRect(x, y, Math.max(1, Math.round((w * m.hp) / m.max)), 2);
    }
  }

  // ───────────── townsfolk ─────────────

  private updateNpcs(time: number, dt: number) {
    for (const n of this.npcs) {
      let moved = 0;
      if (n.def.wander) {
        if (time > n.wanderAt) {
          n.wanderAt = time + 2000 + this.rng() * 3000;
          n.tx = (n.def.x + 0.5) * TILE + (this.rng() - 0.5) * 64; n.ty = (n.def.y + 0.9) * TILE + (this.rng() - 0.5) * 40;
        }
        const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
        if (d > 2) { moved = this.move(n, (dx / d) * 22 * dt, (dy / d) * 22 * dt); if (moved) this.faceToward(n, dx, dy); else n.tx = n.x; }
      }
      this.animateRobot(n, moved);
    }
  }

  // ───────────── things to use ─────────────

  private nearest(): { label: string; act: () => void } | null {
    const p = this.player;
    let best = null as { d: number; label: string; act: () => void } | null;
    const offer = (d: number, label: string, act: () => void) => { if (d < 24 && (!best || d < best.d)) best = { d, label, act }; };
    for (const n of this.npcs) offer(Math.hypot(n.x - p.x, n.y - p.y), `Talk to ${n.def.name}`, () => this.talkTo(n));
    for (const o of this.props) {
      const wide = propFootprint(o.prop.kind).length > 1;
      const d = Math.hypot((o.prop.x + (wide ? 1 : 0.5)) * TILE - p.x, (o.prop.y + 1) * TILE - p.y);
      if (o.prop.kind === 'salvage' && !o.used) offer(d, 'Search the salvage', () => this.search(o));
      if (o.prop.kind === 'shrine' && !o.used) offer(d + 2, 'Wake the sun shrine', () => this.wakeShrine(o));
      if (o.prop.kind === 'workbench') offer(d, 'Use the workbench', () => this.openBench());
      if (o.prop.kind === 'sign_junction') offer(d, 'Read the sign', () => say({ name: 'Hopeless Junction', lines: ['The paint is newer than the road. Someone came back to name this place.'] }));
      if (o.prop.kind === 'sign_town') offer(d, 'Read the sign', () => say({ name: 'Tinker Town', lines: ['TINKER TOWN. Bring what you find. Take what you need.'] }));
    }
    return best ? { label: best.label, act: best.act } : null;
  }

  private checkInteract() {
    const n = this.nearest();
    setPrompt(n ? n.label : null);
  }

  private talkTo(n: Npc, intro = false) {
    if (!n) return;
    const p = this.player;
    this.faceToward(n, p.x - n.x, p.y - n.y);
    this.animateRobot(n, 0);
    const def = n.def;
    let lines = def.lines;
    if (def.action === 'gift' && !game.save.gift) lines = [...lines, 'Two battery cells and a can of green oil. Press 1 for a cell, 4 for the oil.'];
    if (def.action === 'gift' && game.save.gift) lines = ['Still standing? Good. The sun is out there somewhere.'];
    say({
      name: def.name, lines, source: def.source, build: def.build, paint: def.paint,
      onDone: () => {
        if (intro) { game.save.seenHelp = true; persist(); }
        if (def.action === 'workbench') this.openBench();
        if (def.action === 'gift' && !game.save.gift) {
          game.save.gift = true; game.save.batteries += 2; game.save.oils.green += 1; persist();
          sfx.item(); toast('Got 2 battery cells and green oil.', 'good');
        }
      },
    });
  }

  private openBench() {
    if (game.zone !== 'town') return;
    showWorkbench({
      first: false,
      onDone: () => {
        recalc();
        const old = this.player.tex;
        this.player.tex = this.robotTex(game.save.build, game.save.paint);
        this.made = this.made.filter((k) => k !== old);
        this.player.spr.setTexture(this.player.tex, this.player.dir * 3 + 1);
        this.textures.remove(old);
        persist();
      },
    });
  }

  private search(o: PropObj) {
    o.used = true;
    (o.obj as Phaser.GameObjects.Sprite).setFrame(1);
    sfx.item();
    const drops = rollSalvage(game.save.unlocked, this.rng);
    const x = (o.prop.x + 0.5) * TILE, y = (o.prop.y + 1) * TILE;
    drops.forEach((d, i) => this.time.delayedCall(i * 90, () => this.spawnPickup(d, x, y - 4)));
    // something always notices the noise
    for (const m of this.mobs) if (!m.dead && Math.hypot(m.x - x, m.y - y) < 120) m.aggro = true;
  }

  private wakeShrine(o: PropObj) {
    o.used = true;
    (o.obj as Phaser.GameObjects.Sprite).setFrame(1);
    sfx.shrine();
    game.charge = game.stats.charge;
    this.sparks.explode(30, (o.prop.x + 0.5) * TILE, o.prop.y * TILE - 12);
    toast('The shrine wakes. Full charge.', 'good');
    this.gainSolar(15);
  }

  // ───────────── loot ─────────────

  private spawnPickup(drop: Drop, x: number, y: number) {
    const frame = drop.kind === 'solar' ? 0 : drop.kind === 'battery' ? 1 : drop.kind === 'part' ? 6 : 2 + OIL_KINDS.indexOf(drop.oil);
    const img = this.add.image(x, y, 'items', frame).setOrigin(0.5, 1);
    const a = this.rng() * Math.PI * 2, s = 30 + this.rng() * 50;
    this.pickups.push({ img, drop, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, born: this.time.now });
  }

  private updatePickups(time: number, dt: number) {
    const p = this.player;
    for (const k of this.pickups) {
      const age = time - k.born;
      const dx = p.x - k.x, dy = p.y - 4 - k.y, d = Math.hypot(dx, dy);
      if (age > 350 && d < game.stats.magnet && !p.down) {
        const sp = 170 + (game.stats.magnet - d) * 3;
        k.x += (dx / d) * sp * dt; k.y += (dy / d) * sp * dt;
      } else {
        const ox = k.x, oy = k.y;
        this.move(k, k.vx * dt, k.vy * dt);
        if (k.x === ox) k.vx = 0;
        if (k.y === oy) k.vy = 0;
        k.vx *= 0.9; k.vy *= 0.9;
      }
      const bob = k.drop.kind === 'solar' ? Math.round(Math.sin(time / 160 + k.born) * 1.5) : 0;
      k.img.setPosition(Math.round(k.x), Math.round(k.y) + bob).setDepth(k.y);
      if (d < 9 && age > 350 && !p.down) { this.collect(k.drop); k.img.destroy(); k.born = -1; }
    }
    this.pickups = this.pickups.filter((k) => k.born !== -1);
  }

  private collect(d: Drop) {
    const s = game.save;
    if (d.kind === 'solar') { sfx.pickup(); this.gainSolar(d.amount); return; }
    sfx.item();
    if (d.kind === 'battery') { s.batteries = Math.min(99, s.batteries + 1); toast('Battery cell'); }
    if (d.kind === 'oil') { s.oils[d.oil] = Math.min(99, s.oils[d.oil] + 1); toast(OIL[d.oil].label); }
    if (d.kind === 'part' && !s.unlocked.includes(d.part)) {
      s.unlocked.push(d.part);
      toast(`New part: ${partById[d.part].name}. Fit it at the workbench in Tinker Town.`, 'good', 5000);
      persist();
    }
  }

  private gainSolar(amount: number) {
    const s = game.save;
    const r = addSolar({ level: s.level, solar: s.solar }, Math.round(amount * game.stats.solar));
    s.level = r.progress.level; s.solar = r.progress.solar;
    if (!r.gained) return;
    recalc();
    game.hull = game.stats.hull;
    sfx.level();
    this.cameras.main.flash(250, 255, 210, 120);
    toast(`Level ${s.level}. Hull and charge grow, hits land harder.`, 'good', 4000);
    persist();
    if (s.level >= 2 && !s.gateSeen) {
      s.gateSeen = true; persist();
      this.time.delayedCall(700, () => showGate(() => undefined));
    }
  }

  private useSlot(i: number) {
    if (blocking() || this.player.down) return;
    const k = SLOT_KEYS[i], s = game.save;
    if (k === 'battery') {
      if (!s.batteries) { toast('No battery cells.', '', 1500); return; }
      if (game.charge >= game.stats.charge - 1) { toast('Charge is already full.', '', 1500); return; }
      s.batteries--; game.charge = Math.min(game.stats.charge, game.charge + BATTERY_CHARGE);
      sfx.item(); toast(`+${BATTERY_CHARGE} charge`, 'good', 1500);
      return;
    }
    const oil = k as OilKind;
    if (!s.oils[oil]) { toast(`No ${OIL[oil].label.toLowerCase()}.`, '', 1500); return; }
    s.oils[oil]--; game.buffs[oil] = OIL[oil].seconds;
    sfx.item(); toast(`${OIL[oil].label}: ${OIL[oil].text} for ${OIL[oil].seconds}s`, 'good', 2200);
  }

  // ───────────── leaving ─────────────

  private leave(to: Zone, from: 'gate' | 'tow') {
    if (this.leaving) return;
    this.leaving = true;
    setPrompt(null);
    persist();
    this.cameras.main.fadeOut(300, 18, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ zone: to, from } as WorldStart));
  }

  private shutdown(hullGone: boolean) {
    const p = this.player, s = game.save;
    p.down = true;
    sfx.shutdown();
    p.spr.setTint(0x555555);
    this.tweens.add({ targets: p.spr, angle: 90, duration: 600, ease: 'Bounce.out' });
    const lostB = Math.floor(s.batteries * SHUTDOWN_LOSS);
    s.batteries -= lostB;
    let lostO = 0;
    for (const k of OIL_KINDS) { const n = Math.floor(s.oils[k] * SHUTDOWN_LOSS); s.oils[k] -= n; lostO += n; }
    clearBuffs();
    persist();
    const why = hullGone ? 'Hull broken.' : 'Charge empty.';
    this.time.delayedCall(1300, () => blackout(true, `${why} The Push Pull Bot hooks your frame and drags you home.`));
    this.time.delayedCall(4200, () => {
      const lost = lostB || lostO ? `Lost on the way: ${lostB} battery cells, ${lostO} oils.` : 'Nothing fell off the cart.';
      this.leaving = true;
      this.scene.restart({ zone: 'town', from: 'tow', note: `Towed home. ${lost} Your parts are safe.` } as WorldStart);
    });
  }
}
