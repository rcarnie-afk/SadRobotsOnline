export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
export const ui = () => document.getElementById('ui')!;
export const screen = () => document.getElementById('screen')!;

/** True while a full screen or a conversation has the player's attention; the world holds still. */
let blocks = 0;
export const blocking = () => blocks > 0;
export const block = () => { blocks++; };
export const unblock = () => { blocks = Math.max(0, blocks - 1); };
