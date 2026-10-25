import { label } from './exam/labels.js';

// Text helpers shared by the exam screens. Every item and stored text passes through esc(): storage values are untrusted.
export const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// An exam word in the chosen language. The English word stays in the title attribute.
export const word = (key, prefs) => prefs.dutch ? `<span lang="nl" title="${esc(label(key, false))}">${esc(label(key, true))}</span>` : esc(label(key, false));
export const plain = (key, prefs) => label(key, prefs.dutch);
