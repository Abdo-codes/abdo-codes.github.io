import { TYPES } from './exam-grade.js';
import { LIMITS } from './exam-config.js';

const words = text => String(text).trim().split(/\s+/).filter(Boolean).length;
const sentences = text => String(text).split(/(?<=[.!?])\s+/).filter(Boolean);
const choiceText = choice => typeof choice === 'string' ? choice : '';
const FIGURE = /\d+([.,]\d+)?\s?(km\/h|km|m|metres?|meters?|years?|mm|cm|seconds?|minutes?|per mille|‰|%)(?![a-z])/i;
const PREFIX = { road: 'road-use', prio: 'priority', spec: 'special-roads', sign: 'signs', veh: 'vehicle', law: 'law' };

// Registries the validator checks against. Any registry that is missing is treated as empty, so the item fails with a clear message.
// { topics: [ids], scenes: {id: scene}, sources: {key: {url, figure?}}, glossary: {key: {nl, en}}, signs: {id: {annex, term}}, missions: [ids], checks: {name: fn} }
export function validateItem(item, registry = {}) {
  const { topics = [], scenes = {}, sources = {}, glossary = {}, signs = {}, missions = [], checks = {} } = registry;
  const errors = [], fail = message => errors.push(`${item?.id ?? '?'}: ${message}`);
  if (!item || typeof item !== 'object') return ['item is not an object'];
  if (!/^[a-z]+-\d{2,3}$/.test(item.id ?? '')) fail('id must look like "prio-014"');
  else if (!(item.id.split('-')[0] in PREFIX)) fail(`unknown id prefix "${item.id.split('-')[0]}"`);
  if (!TYPES.includes(item.type)) { fail(`unknown type "${item.type}"`); return errors; }
  if (!topics.includes(item.topic)) fail(`unknown topic "${item.topic}"`);
  if (typeof item.prompt !== 'string' || !item.prompt) fail('prompt is missing');
  else if (words(item.prompt) > LIMITS.prompt) fail(`prompt has ${words(item.prompt)} words (limit ${LIMITS.prompt})`);
  if (typeof item.explanation !== 'string' || !item.explanation) fail('explanation is missing');
  else if (sentences(item.explanation).some(s => words(s) > LIMITS.explanation)) fail(`an explanation sentence is longer than ${LIMITS.explanation} words`);
  else if (sentences(item.explanation).length > 3) fail('explanation has more than 3 sentences');

  const sourceKeys = [].concat(item.source ?? []);
  if (!sourceKeys.length) fail('source is missing');
  for (const key of sourceKeys) if (!sources[key]?.url) fail(`unknown source "${key}"`);
  for (const key of item.terms ?? []) if (!glossary[key]) fail(`unknown term "${key}"`);
  if ((item.terms ?? []).length > 3) fail('more than 3 terms');
  if (item.mission !== undefined && !missions.includes(item.mission)) fail(`unknown mission "${item.mission}"`);
  if (item.notCbr !== undefined && item.notCbr !== true) fail('notCbr must be true or absent');

  // Choices and the right answer, by type.
  const n = item.choices?.length ?? 0, c = item.correct;
  const hasChoices = ['choice', 'multi'].includes(item.type) || (item.type === 'order' && !item.scene);
  if (hasChoices) {
    if (!Array.isArray(item.choices)) fail('choices are missing');
    else for (const choice of item.choices) {
      if (typeof choice === 'string') { if (words(choice) > LIMITS.choice) fail(`choice "${choice.slice(0, 20)}" has more than ${LIMITS.choice} words`); }
      else if (!choice?.sign) fail('a choice must be text or { sign }');
    }
  } else if (item.choices) fail(`${item.type} items take no choices`);
  switch (item.type) {
    case 'yesno': if (c !== 0 && c !== 1) fail('correct must be 0 (ja) or 1 (nee)'); break;
    case 'choice':
      if (n < 2 || n > 4) fail('choice needs 2 to 4 choices');
      if (new Set(item.choices?.map(x => JSON.stringify(x))).size !== n) fail('choices must be distinct');
      if (!Number.isInteger(c) || c < 0 || c >= n) fail('correct must be a choice index'); break;
    case 'multi':
      if (n < 4 || n > 5) fail('multi needs 4 to 5 choices');
      if (!Array.isArray(c) || c.length < 2 || c.length > n - 1 || new Set(c).size !== c.length || c.some(v => !Number.isInteger(v) || v < 0 || v >= n)) fail('correct must list 2 to n-1 distinct indexes');
      break;
    case 'fill':
      if (!item.unit) fail('fill needs a unit');
      if (!Array.isArray(c) || !c.length || c.some(v => typeof v !== 'number' || !Number.isFinite(v))) fail('correct must be a list of numbers'); break;
    case 'hotspot': case 'order': {
      const scene = scenes[item.scene], pins = scene?.pins?.map(pin => pin.id) ?? [];
      if (item.type === 'order' && !item.scene) {
        if (n < 3 || n > 5) fail('text order needs 3 to 5 choices');
        if (!Array.isArray(c) || c.length !== n || [...c].sort().join() !== [...Array(n).keys()].join()) fail('correct must list every choice index once');
      } else {
        if (!scene) { fail(`${item.type} needs a known scene`); break; }
        if (item.type === 'hotspot' && pins.length < 2) fail('a hotspot scene needs 2 or more pins');
        if (item.type === 'order' && pins.length < 3) fail('an order scene needs 3 or more pins');
        const list = item.type === 'hotspot' ? [c] : c;
        if (!Array.isArray(list) || !list.length || list.some(pin => !pins.includes(pin))) fail('correct names a pin that the scene does not have');
        if (item.type === 'order' && (new Set(c).size !== c.length || c.length < 3)) fail('order needs 3 or more distinct pins');
      }
      break;
    }
  }

  // Scene items.
  if (item.scene !== undefined) {
    const scene = scenes[item.scene];
    if (!scene) fail(`unknown scene "${item.scene}"`);
    else {
      if (scene.topic !== item.topic) fail(`scene "${item.scene}" belongs to topic "${scene.topic}"`);
      const modes = ['action', 'check', 'pictureOnly'].filter(key => item[key] !== undefined);
      if (modes.length !== 1) fail('a scene item needs exactly one of action, check, pictureOnly');
      if (item.action !== undefined && item.action !== scene.answer) fail(`action "${item.action}" differs from scene answer "${scene.answer}"`);
      if (item.check !== undefined && typeof checks[item.check] !== 'function') fail(`unknown check "${item.check}"`);
      if (item.pictureOnly !== undefined && item.pictureOnly !== true) fail('pictureOnly must be true');
    }
  } else for (const key of ['action', 'check', 'pictureOnly']) if (item[key] !== undefined) fail(`${key} needs a scene`);

  // Signs: shown as pictures. The prompt, the choices and the terms must not give the sign away.
  const shown = [item.sign, ...(item.choices ?? []).map(x => x?.sign)].filter(Boolean);
  const texts = [item.prompt, ...(item.choices ?? []).map(choiceText)].join(' ');
  for (const id of shown) {
    const sign = signs[id];
    if (!sign) { fail(`unknown sign "${id}"`); continue; }
    if (!sourceKeys.includes(`rvv-annex-${String(sign.annex).toLowerCase()}`)) fail(`sign ${id} needs source rvv-annex-${String(sign.annex).toLowerCase()}`);
    if (new RegExp(`\\b${id}\\b`).test(texts)) fail(`the text names sign ${id}`);
    if ((item.terms ?? []).includes(sign.term)) fail(`terms hold the term of sign ${id}`);
  }

  // Figures need a source that states the figure.
  const stated = item.unit || [item.prompt, item.explanation, ...(item.choices ?? []).map(choiceText)].some(text => FIGURE.test(text ?? ''));
  if (stated && !sourceKeys.some(key => sources[key]?.figure)) fail('states a figure but cites no source with a "figure" field');
  return errors;
}

// Validates a whole bank: every item, unique ids and prompts, and the share of choice items with the right answer first.
export function validateBank(items, registry = {}) {
  const errors = items.flatMap(item => validateItem(item, registry));
  for (const key of ['id', 'prompt']) {
    const seen = new Set();
    for (const item of items) { if (seen.has(item[key])) errors.push(`${item.id}: duplicate ${key}`); seen.add(item[key]); }
  }
  const choice = items.filter(item => item.type === 'choice');
  if (choice.length >= 10 && choice.filter(item => item.correct === 0).length / choice.length > LIMITS.firstChoiceShare) errors.push('too many choice items have the right answer first');
  return errors;
}

// A hash of id:type:choices.length. A text fix does not change it. A changed choice count does.
export function bankVersion(items) {
  const text = items.map(item => `${item.id}:${item.type}:${item.choices?.length ?? 0}`).sort().join('|');
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = (hash * 33 ^ text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}
