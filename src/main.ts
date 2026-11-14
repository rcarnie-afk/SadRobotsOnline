import * as Phaser from 'phaser';
import { loadAll } from './assets';
import { VIEW_H, VIEW_W } from './data/balance';
import { WorldScene, WorldStart } from './scenes/WorldScene';
import { game, persist, recalc } from './state';
import { loadSave, newSave, writeSave } from './systems/save';
import { showTitle, showWorkbench } from './ui/screens';
import { ui } from './ui/dom';

/** Keep the page overlay exactly on top of the scaled game canvas. */
function layout(canvas: HTMLCanvasElement) {
  const app = document.getElementById('app')!.getBoundingClientRect();
  const r = canvas.getBoundingClientRect();
  const o = ui();
  o.style.left = `${r.left - app.left}px`; o.style.top = `${r.top - app.top}px`;
  o.style.width = `${r.width}px`; o.style.height = `${r.height}px`;
  document.documentElement.style.setProperty('--u', `${r.width / VIEW_W}px`);
}

async function boot() {
  try { await document.fonts.ready; } catch { /* fonts are optional */ }
  await loadAll();
  const saved = loadSave();
  game.save = saved ?? newSave();
  game.storageOk = writeSave(game.save) || !saved;
  recalc(true);

  const phaser = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'stage',
    width: VIEW_W,
    height: VIEW_H,
    pixelArt: true,
    backgroundColor: '#12110f',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { mouse: { preventDefaultWheel: false } },
    banner: false,
  });
  phaser.scene.add('world', WorldScene, false);
  phaser.events.once('ready', () => {
    const canvas = phaser.canvas;
    const relayout = () => layout(canvas);
    phaser.scale.on('resize', relayout);
    window.addEventListener('resize', () => window.setTimeout(relayout, 30));
    relayout();
    window.setTimeout(relayout, 200);
    document.getElementById('stage')!.addEventListener('contextmenu', (e) => e.preventDefault());

    const play = (start: WorldStart) => phaser.scene.start('world', start);
    const title = () => showTitle({
      canContinue: saved !== null,
      onContinue: () => { recalc(true); play({ zone: 'town', from: 'title' }); },
      onNew: () => {
        game.save = newSave();
        recalc(true);
        showWorkbench({ first: true, onDone: () => { recalc(true); persist(); play({ zone: 'town', from: 'title' }); } });
      },
    });
    title();
    // handy for testing from the browser console
    (window as any).sro = { game, phaser };
  });
}

boot().catch((err) => {
  document.body.innerHTML = '';
  const p = document.createElement('p');
  p.style.cssText = 'color:#ffb84a;font:20px monospace;padding:24px';
  p.textContent = `Sad Robots Online could not start: ${err?.message ?? err}. Try reloading the page.`;
  document.body.append(p);
});
