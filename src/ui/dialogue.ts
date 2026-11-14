/** Conversations in a pixel-edged thought bubble, with Rob's drawing of the speaker when it is available. */
import { drawings } from '../assets';
import { blit, composeSheet, ROW } from '../art/robot';
import { sfx } from '../audio';
import { Build } from '../data/parts';
import { block, el, ui, unblock } from './dom';

export interface Talk { name: string; lines: string[]; source?: string; build?: Build; paint?: string; onDone?: () => void; }

let open: { root: HTMLElement; advance: () => void } | null = null;
export const talking = () => open !== null;

function portrait(t: Talk): HTMLElement | null {
  const d = t.source ? drawings[t.source] : undefined;
  if (d) {
    // top part of Rob's drawing of this robot
    const [x0, y0, x1, y1] = d.box, w = x1 - x0, h = Math.round((y1 - y0) * 0.62);
    const cv = el('canvas'); cv.width = w * 2; cv.height = h * 2;
    cv.getContext('2d')!.drawImage(d.img, x0, y0, w, h, 0, 0, cv.width, cv.height);
    const box = el('div', 'portrait'); box.append(cv); box.title = 'Drawing by Rob Carnie';
    return box;
  }
  if (t.build) {
    const cv = el('canvas', 'px'); cv.width = cv.height = 64;
    blit(cv, composeSheet(t.build, t.paint ?? 'bone'), ROW.down, 1, false);
    const box = el('div', 'portrait pixel'); box.append(cv);
    return box;
  }
  return null;
}

export function say(t: Talk) {
  if (open) return;
  block();
  let i = 0;
  const root = el('div', 'talk'), bubble = el('div', 'bubble'), name = el('h4', '', t.name), line = el('p'), hint = el('small');
  bubble.append(name, line, hint);
  const p = portrait(t);
  if (p) root.append(p);
  root.append(bubble);
  const show = () => {
    line.textContent = t.lines[i];
    hint.textContent = i < t.lines.length - 1 ? 'E or click: next' : 'E or click: close';
    sfx.talk();
  };
  const advance = () => {
    i++;
    if (i < t.lines.length) { show(); return; }
    root.remove(); open = null; unblock();
    t.onDone?.();
  };
  root.onclick = advance;
  ui().append(root);
  open = { root, advance };
  show();
}

export const advanceTalk = () => open?.advance();
