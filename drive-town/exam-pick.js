// Pure answer rules of the exam controller: what a tap on a choice, a pin or a digit key does to the answer of each type.
export const keyOf = (item, raw) => item.type === 'yesno' || item.choices ? Number(raw) : String(raw);
const list = value => Array.isArray(value) ? value : [];
const toggled = (value, key) => list(value).includes(key) ? list(value).filter(k => k !== key) : [...list(value), key];

// The new answer after the player picks `key`, or undefined when the type ignores a pick. An empty list is no answer (null).
export function picked(item, value, key) {
  switch (item.type) {
    case 'choice': case 'hotspot': return key;
    case 'multi': { const next = toggled(value, key).sort((a, b) => a - b); return next.length ? next : null; }
    case 'order': { const next = toggled(value, key); return next.length ? next : null; }
    default: return undefined;
  }
}
export const withoutLast = value => list(value).length > 1 ? list(value).slice(0, -1) : null;
