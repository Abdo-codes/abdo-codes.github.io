// Keyboard rules of the exam. Pure: keyAction(key, ctx) -> action | null.
// ctx = { focus: 'body'|'radio'|'check'|'input'|'button'|'link', overlay: 'none'|'overview'|'dialog'|'confirm', type, singleKeys }
// Escape closes an overlay and never ends or leaves the exam. A native control keeps its own keys.
const NATIVE = new Set(['radio', 'check', 'input', 'button', 'link']);

export function keyAction(key, ctx) {
  const { focus = 'body', overlay = 'none', type = '', singleKeys = true } = ctx;
  if (key === 'Escape') return overlay === 'none' ? null : 'close';
  if (NATIVE.has(focus) || overlay !== 'none') return null;
  if (key === 'ArrowRight' || key === 'Enter') return 'next';
  if (key === 'ArrowLeft') return 'previous';
  if (!singleKeys) return null; // WCAG 2.1.4: letters, digits and Backspace can be turned off
  const k = key.length === 1 ? key.toLowerCase() : key;
  if (k === 'm') return 'mark';
  if (k === 'o') return 'overview';
  if (type === 'yesno') { if (k === 'j' || k === 'y') return { answer: 0 }; if (k === 'n') return { answer: 1 }; }
  if (/^[1-5]$/.test(k) && ['choice', 'multi', 'hotspot', 'order'].includes(type)) return { pick: Number(k) - 1 };
  if (k === 'Backspace' && type === 'order') return 'remove-last';
  return null;
}
