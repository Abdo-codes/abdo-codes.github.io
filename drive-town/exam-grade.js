// Marking. Answers use the original choice indexes. Pure: no DOM, no clock.
export const TYPES = ['yesno', 'choice', 'multi', 'fill', 'hotspot', 'order'];
const isIndex = (value, max) => Number.isInteger(value) && value >= 0 && value < max;

// "50", "50 km/h", "50,0" and " 50 " give 50. Anything else gives NaN.
export function parseNumber(text, unit = '') {
  if (typeof text === 'number') return Number.isFinite(text) ? text : NaN;
  let value = String(text ?? '').trim().toLowerCase().replace(',', '.');
  const tail = String(unit).toLowerCase();
  if (tail && value.endsWith(tail)) value = value.slice(0, -tail.length).trim();
  return /^\d+(\.\d+)?$/.test(value) ? Number(value) : NaN;
}

// The list of entries an order or hotspot item can use: choice indexes for text items, pin ids for scene items.
export const orderKeys = (item, pins = []) => item.choices ? item.choices.map((_, i) => i) : pins;

// True when `value` has the shape this item type stores. A wrong answer can still have a valid shape.
export function isValidAnswer(item, value, pins = []) {
  switch (item.type) {
    case 'yesno': return value === 0 || value === 1;
    case 'choice': return isIndex(value, item.choices.length);
    case 'multi': return Array.isArray(value) && value.length <= item.choices.length && new Set(value).size === value.length && value.every(v => isIndex(v, item.choices.length));
    case 'fill': return typeof value === 'string' && value.length <= 40;
    case 'hotspot': return typeof value === 'string' && (!pins.length || pins.includes(value));
    case 'order': { const keys = orderKeys(item, pins); return Array.isArray(value) && new Set(value).size === value.length && value.every(v => keys.includes(v)); }
    default: return false;
  }
}

// True when the player gave an answer that counts as "answered" (a typed text that is not a number does not).
export function isAnswered(item, value) {
  if (value === null || value === undefined) return false;
  if (item.type === 'fill') return !Number.isNaN(parseNumber(value, item.unit));
  if (item.type === 'multi' || item.type === 'order') return value.length > 0;
  return value !== '';
}

// Drive Town rule for multiple response: all right answers and no wrong one. A partial order is wrong.
export function gradeItem(item, value) {
  if (!isAnswered(item, value)) return false;
  switch (item.type) {
    case 'yesno': case 'choice': case 'hotspot': return value === item.correct;
    case 'multi': return value.length === item.correct.length && item.correct.every(v => value.includes(v));
    case 'fill': return item.correct.includes(parseNumber(value, item.unit));
    case 'order': return value.length === item.correct.length && value.every((v, i) => v === item.correct[i]);
    default: return false;
  }
}
