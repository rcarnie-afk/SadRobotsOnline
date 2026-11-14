/** The in-game overlay: bars, hotbar, prompts and messages. Plain page elements over the game canvas. */
import { images } from '../assets';
import { isMuted, toggleMute } from '../audio';
import { OIL, OIL_KINDS, OilKind } from '../data/balance';
import { game } from '../state';
import { isLow } from '../systems/charge';
import { solarForNext } from '../systems/leveling';
import { el, ui } from './dom';

interface Refs {
  who: HTMLElement; hull: HTMLElement; hullT: HTMLElement; charge: HTMLElement; chargeT: HTMLElement; chargeBar: HTMLElement;
  solar: HTMLElement; solarT: HTMLElement; zone: HTMLElement; prompt: HTMLElement; toasts: HTMLElement;
  slots: { root: HTMLElement; count: HTMLElement; timer: HTMLElement }[]; storm: HTMLElement; blackout: HTMLElement; help: HTMLElement;
}
let r: Refs | null = null;
let last = '';

const bar = (cls: string) => {
  const b = el('div', 'bar ' + cls), fill = el('i'), text = el('span');
  b.append(fill, text);
  return { b, fill, text };
};

function icon(frame: number): HTMLCanvasElement {
  const cv = el('canvas', 'px'); cv.width = cv.height = 16;
  cv.getContext('2d')!.drawImage(images.items, frame * 16, 0, 16, 16, 0, 0, 16, 16);
  return cv;
}

export const SLOT_KEYS: ('battery' | OilKind)[] = ['battery', ...OIL_KINDS];
const SLOT_ICON = { battery: 1, black: 2, amber: 3, green: 4, blue: 5 };
const SLOT_TITLE = (k: 'battery' | OilKind) => (k === 'battery' ? 'Battery: restores charge' : `${OIL[k].label}: ${OIL[k].text}`);

export function buildHud(onUse: (slot: number) => void) {
  const root = ui();
  root.replaceChildren();
  const storm = el('div', 'storm');
  const bars = el('div', 'bars'), who = el('div', 'who');
  const hull = bar('hull'), charge = bar('charge'), solar = bar('solar');
  bars.append(who, hull.b, charge.b, solar.b);
  const zone = el('div', 'zone');
  const hot = el('div', 'hotbar');
  const slots = SLOT_KEYS.map((k, i) => {
    const s = el('button', 'slot'); s.title = SLOT_TITLE(k); s.setAttribute('aria-label', SLOT_TITLE(k));
    const count = el('em'), timer = el('u');
    s.append(icon(SLOT_ICON[k]), el('b', '', String(i + 1)), count, timer);
    s.onclick = () => onUse(i);
    hot.append(s);
    return { root: s, count, timer };
  });
  const prompt = el('div', 'prompt'); prompt.hidden = true;
  const toasts = el('div', 'toasts');
  const corner = el('div', 'corner');
  const mute = el('button', '', isMuted() ? 'Sound: off' : 'Sound: on');
  mute.onclick = () => { mute.textContent = toggleMute() ? 'Sound: off' : 'Sound: on'; mute.blur(); };
  corner.append(mute);
  const help = el('div', 'help');
  help.innerHTML = '<b>WASD</b> move<br><b>Click</b> swing<br><b>Right-click</b> bolt<br><b>Shift</b> dash<br><b>E</b> use<br><b>1-5</b> items';
  const blackout = el('div', 'blackout');
  root.append(storm, bars, zone, hot, help, corner, prompt, toasts, blackout);
  r = { who, hull: hull.fill, hullT: hull.text, charge: charge.fill, chargeT: charge.text, chargeBar: charge.b, solar: solar.fill,
    solarT: solar.text, zone, prompt, toasts, slots, storm, blackout, help };
  last = '';
}

const LIGHT = { sun: 'SUN', shade: 'SHADE', storm: 'STORM', town: 'TOWN POWER' };

export function updateHud(zoneName: string) {
  if (!r) return;
  const s = game.save, st = game.stats;
  const need = solarForNext(s.level);
  const sig = [s.name, s.level, Math.ceil(game.hull), st.hull, Math.floor(game.charge), st.charge, game.light, s.solar, zoneName,
    s.batteries, ...OIL_KINDS.map((k) => s.oils[k] + ':' + Math.ceil(game.buffs[k]))].join('|');
  if (sig === last) return;
  last = sig;
  r.who.textContent = `${s.name} · LV ${s.level}`;
  r.hull.style.width = `${(100 * game.hull) / st.hull}%`;
  r.hullT.textContent = `HULL ${Math.ceil(game.hull)}/${st.hull}`;
  r.charge.style.width = `${(100 * game.charge) / st.charge}%`;
  r.chargeT.textContent = `CHARGE ${Math.floor(game.charge)}/${st.charge} · ${LIGHT[game.light]}`;
  r.chargeBar.classList.toggle('low', isLow(game.charge, st.charge) && game.light !== 'town');
  r.solar.style.width = `${(100 * s.solar) / need}%`;
  r.solarT.textContent = `SOLAR ${s.solar}/${need}`;
  r.zone.innerHTML = '';
  r.zone.append(zoneName);
  SLOT_KEYS.forEach((k, i) => {
    const n = k === 'battery' ? s.batteries : s.oils[k];
    const left = k === 'battery' ? 0 : game.buffs[k];
    r!.slots[i].count.textContent = String(n);
    r!.slots[i].root.classList.toggle('empty', n === 0);
    r!.slots[i].root.classList.toggle('on', left > 0);
    r!.slots[i].timer.style.width = k === 'battery' ? '0' : `${(100 * left) / OIL[k].seconds}%`;
  });
}

export function setPrompt(text: string | null) {
  if (!r) return;
  if (!text) { r.prompt.hidden = true; return; }
  r.prompt.hidden = false;
  r.prompt.innerHTML = '';
  r.prompt.append(el('kbd', '', 'E'), text);
}

export function toast(text: string, kind: '' | 'good' | 'warn' | 'bad' = '', ms = 3200) {
  if (!r) return;
  const t = el('div', 'toast ' + kind, text);
  r.toasts.append(t);
  while (r.toasts.children.length > 4) r.toasts.firstChild!.remove();
  window.setTimeout(() => t.remove(), ms);
}

export const setStorm = (on: boolean) => r?.storm.classList.toggle('on', on);
export const hideHelp = () => { if (r) r.help.hidden = true; };
export function blackout(on: boolean, text = '') {
  if (!r) return;
  r.blackout.textContent = text;
  r.blackout.classList.toggle('on', on);
}
