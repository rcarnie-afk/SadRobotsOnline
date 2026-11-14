/** Full-page screens that sit over the game: title, workbench and the guest gate. */
import { drawings, partById } from '../assets';
import { blit, composeSheet, partThumb, ROW } from '../art/robot';
import { startAudio } from '../audio';
import { ALL_PARTS, Build, PART_MODS, SLOTS, Slot, slotOf } from '../data/parts';
import { game } from '../state';
import { PAINTS } from '../systems/save';
import { Stats, deriveStats } from '../systems/stats';
import { block, el, screen, unblock } from './dom';

let open = false;
let anim: number | undefined;

function show(build: (wrap: HTMLElement) => void) {
  const s = screen();
  if (!open) block();
  open = true;
  window.clearInterval(anim);
  s.replaceChildren();
  const wrap = el('div', 'wrap');
  build(wrap);
  s.append(wrap);
  s.classList.add('on');
  s.scrollTop = 0;
}

export function closeScreen() {
  if (!open) return;
  open = false;
  window.clearInterval(anim);
  screen().classList.remove('on');
  screen().replaceChildren();
  unblock();
}

export const screenOpen = () => open;

function drawingCanvas(id: string, maxW: number): HTMLCanvasElement | null {
  const d = drawings[id];
  if (!d) return null;
  const [x0, y0, x1, y1] = d.box;
  const k = maxW / (x1 - x0);
  const cv = el('canvas');
  cv.width = Math.round((x1 - x0) * k); cv.height = Math.round((y1 - y0) * k);
  cv.getContext('2d')!.drawImage(d.img, x0, y0, x1 - x0, y1 - y0, 0, 0, cv.width, cv.height);
  return cv;
}

// ───────────────────────── title ─────────────────────────

export function showTitle(opts: { canContinue: boolean; onContinue: () => void; onNew: () => void }) {
  show((wrap) => {
    const panel = el('section', 'panel');
    const grid = el('div', 'title');
    const paper = el('div', 'paper');
    const art = drawingCanvas('p3_10', 520);
    if (art) { paper.append(art); paper.title = 'Drawing by Rob Carnie'; }
    else {
      const cv = el('canvas', 'px'); cv.width = cv.height = 256;
      blit(cv, composeSheet({ head: 'head_dome', torso: 'torso_kneeler', arms: 'arm_gopik', legs: 'legs_boots' }, 'bone'), ROW.down, 1);
      paper.append(cv); paper.style.background = '#3a342c';
    }
    const col = el('div', 'col');
    col.append(
      el('h1', '', 'Sad Robots Online'),
      el('p', '', 'The humans left. The robots stayed, and the lights are going out. Build a robot from salvage, keep it charged in the sun, and fight through the Solar Wastelands for parts, batteries and oil.'),
    );
    const btns = el('div', 'btns');
    const s = game.save;
    if (opts.canContinue) {
      const go = el('button', 'big', `Continue as ${s.name}`);
      go.onclick = () => { startAudio(); opts.onContinue(); };
      const fresh = el('button', 'plain', 'Start a new robot');
      fresh.onclick = () => {
        fresh.textContent = 'Click again to replace your saved robot';
        fresh.onclick = () => { startAudio(); opts.onNew(); };
      };
      btns.append(go, fresh);
      col.append(el('p', 'dim', `Saved: ${s.name}, level ${s.level}, ${s.unlocked.length} of ${ALL_PARTS.length} parts found.`));
    } else {
      const go = el('button', 'big', 'Build your robot');
      go.onclick = () => { startAudio(); opts.onNew(); };
      btns.append(go);
    }
    col.append(btns);
    const keys = el('div', 'keys');
    for (const [k, v] of [['WASD', 'move'], ['Click', 'swing (hold to keep swinging)'], ['Right-click', 'fire a bolt (costs charge)'],
      ['Shift', 'dash'], ['E', 'talk, search, use'], ['1 to 5', 'battery and oils']]) keys.append(el('b', '', k), el('span', '', v));
    col.append(keys);
    grid.append(paper, col);
    panel.append(grid);
    const note = el('section', 'panel');
    note.append(
      el('h3', '', 'Early preview'),
      el('p', 'dim', 'The robots are pixel stand-ins drawn from Rob Carnie\'s sketches, waiting for his hand-drawn sprites. Tiles, ruins and creatures are placeholders. Progress saves in this browser only.'),
    );
    if (!game.storageOk) note.append(el('p', '', 'This page cannot save here, so your robot lasts until you close it.'));
    wrap.append(panel, note);
  });
}

// ───────────────────────── workbench ─────────────────────────

const STAT_ROWS: [keyof Stats, string, (v: number) => string, boolean][] = [
  ['hull', 'Hull', (v) => `${v}`, true],
  ['charge', 'Charge', (v) => `${v}`, true],
  ['speed', 'Speed', (v) => `${v}`, true],
  ['melee', 'Swing damage', (v) => `${v}`, true],
  ['meleeCd', 'Swing time', (v) => `${(v / 1000).toFixed(2)}s`, false],
  ['reach', 'Reach', (v) => `${v}`, true],
  ['bolt', 'Bolt damage', (v) => `${v}`, true],
  ['crit', 'Double hits', (v) => `${Math.round(v * 100)}%`, true],
  ['drain', 'Drain in shade', (v) => `${Math.round(v * 100)}%`, false],
  ['solar', 'Solar points', (v) => `${Math.round(v * 100)}%`, true],
  ['dashCd', 'Dash cooldown', (v) => `${(v / 1000).toFixed(1)}s`, false],
  ['dashCost', 'Dash cost', (v) => `${v}`, false],
];

export function showWorkbench(opts: { first: boolean; onDone: () => void }) {
  const s = game.save;
  const draft: Build = { ...s.build };
  let paint = s.paint;
  let name = s.name;
  const before = deriveStats(s.build, s.level);

  show((wrap) => {
    const head = el('section', 'panel');
    head.append(
      el('h1', '', opts.first ? 'Build your robot' : 'The Worker\'s workbench'),
      el('p', 'dim', opts.first
        ? 'Pick a part for each slot. More parts are out in the Solar Wastelands, in salvage piles and inside the bots that guard them.'
        : 'Swap parts and paint. Parts you found in the wastelands are here now.'),
    );
    const bench = el('section', 'panel');
    const grid = el('div', 'bench');
    const stage = el('div', 'stagebox');
    const floor = el('div', 'floor');
    const big = el('canvas', 'px'); big.id = 'bigbot'; big.width = big.height = 224;
    floor.append(big);
    const four = el('div', 'four');
    const small = [0, 1, 2, 3].map(() => { const c = el('canvas', 'px'); c.width = c.height = 64; const d = el('div'); d.append(c); four.append(d); return c; });
    const stats = el('div', 'statlist');
    stage.append(floor, four, stats);

    const bins = el('div', 'bins');
    if (opts.first) {
      const b = el('div', 'bin');
      const lab = el('label', '', 'Name'); lab.htmlFor = 'robot-name';
      const input = el('input'); input.type = 'text'; input.id = 'robot-name'; input.maxLength = 16; input.value = name; input.autocomplete = 'off';
      input.oninput = () => { name = input.value; };
      b.append(lab, input);
      bins.append(b);
    }
    const buttons: Record<string, HTMLButtonElement> = {};
    for (const slot of SLOTS) {
      const b = el('div', 'bin');
      b.append(el('h3', '', { head: 'Head', torso: 'Torso', arms: 'Arms', legs: 'Legs' }[slot]));
      const row = el('div', 'row');
      for (const id of ALL_PARTS.filter((p) => slotOf(p) === slot)) {
        const have = s.unlocked.includes(id);
        const btn = el('button', 'pick' + (have ? '' : ' locked'));
        btn.append(partThumb(id, 72), el('span', '', have ? partById[id].name : 'Not found yet'));
        if (have) btn.append(el('small', '', PART_MODS[id].blurb));
        btn.disabled = !have;
        btn.title = have ? `${partById[id].name}: ${PART_MODS[id].blurb}` : 'Find this part in the Solar Wastelands';
        btn.onclick = () => { draft[slot as Slot] = id; refresh(); };
        buttons[id] = btn;
        row.append(btn);
      }
      b.append(row);
      bins.append(b);
    }
    const pb = el('div', 'bin');
    pb.append(el('h3', '', 'Paint'));
    const prow = el('div', 'row');
    const paintBtns: Record<string, HTMLButtonElement> = {};
    for (const k of PAINTS) {
      const sw = el('span', 'swatch');
      sw.style.background = { bone: '#cfd4d8', steel: '#8c97a3', copper: '#c98b45', teal: '#35b5a0', rust: '#c8492f', yellow: '#f0c425', brown: '#9a6247' }[k]!;
      const btn = el('button', 'plain'); btn.append(sw, k);
      btn.onclick = () => { paint = k; refresh(); };
      paintBtns[k] = btn;
      prow.append(btn);
    }
    pb.append(prow, el('p', 'dim', 'Paint covers the unpainted metal. Parts that came painted keep their colours.'));
    bins.append(pb);
    grid.append(stage, bins);
    bench.append(grid);

    const foot = el('div', 'btns');
    const done = el('button', 'big', opts.first ? 'Power on' : 'Done');
    done.onclick = () => {
      s.build = { ...draft };
      s.paint = paint;
      if (opts.first) s.name = name.trim().slice(0, 16) || 'Unit 7';
      closeScreen();
      opts.onDone();
    };
    foot.append(done);
    if (!opts.first) {
      const cancel = el('button', 'plain', 'Leave without changes');
      cancel.onclick = () => { closeScreen(); opts.onDone(); };
      foot.append(cancel);
    }
    wrap.append(head, bench, foot);

    let sheet = composeSheet(draft, paint);
    let tick = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = () => {
      const f = reduced ? 1 : [0, 1, 2, 1][tick % 4];
      blit(big, sheet, ROW.down, f);
      small.forEach((c, r) => blit(c, sheet, r, f));
    };
    function refresh() {
      for (const id of Object.keys(buttons)) buttons[id].setAttribute('aria-pressed', String(draft[slotOf(id)] === id));
      for (const k of Object.keys(paintBtns)) paintBtns[k].setAttribute('aria-pressed', String(k === paint));
      sheet = composeSheet(draft, paint);
      const now = deriveStats(draft, s.level);
      stats.replaceChildren();
      for (const [key, label, fmt, higherIsBetter] of STAT_ROWS) {
        const v = now[key], was = before[key];
        const b = el('b', '', fmt(v));
        if (v !== was && !opts.first) b.style.color = (v > was) === higherIsBetter ? 'var(--green)' : '#ff9a84';
        stats.append(el('span', '', label), b);
      }
      draw();
    }
    refresh();
    anim = window.setInterval(() => { tick++; draw(); }, 150);
  });
}

// ───────────────────────── guest gate ─────────────────────────

export function showGate(onContinue: () => void) {
  show((wrap) => {
    const p = el('section', 'panel');
    const btn = el('button', 'big', 'Keep playing');
    btn.onclick = () => { closeScreen(); onContinue(); };
    p.append(
      el('h1', '', 'Level 2: the guest gate'),
      el('p', '', 'In the full game, a guest robot stops earning solar points here and is asked to sign in with Google to keep its robot. Later, this is also where a paid unlock can go.'),
      el('p', 'dim', 'Sign-in comes in a later build, so this preview lets you keep going.'),
      el('div', 'btns'),
    );
    p.lastElementChild!.append(btn);
    wrap.append(p);
    window.setTimeout(() => btn.focus(), 0);
  });
}
