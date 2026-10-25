// Short builders for bank items. Each returns a plain item object (see the item schema in the exam design).
// `extra` holds explanation, source, terms and the optional fields (sign, scene, mission, cluster, ...).
const base = (type, id, topic, prompt, extra) => ({ id, type, topic, prompt, ...extra });
export const yn = (id, topic, prompt, yes, extra) => base('yesno', id, topic, prompt, { correct: yes ? 0 : 1, ...extra });
export const mc = (id, topic, prompt, choices, correct, extra) => base('choice', id, topic, prompt, { choices, correct, ...extra });
export const multi = (id, topic, prompt, choices, correct, extra) => base('multi', id, topic, prompt, { choices, correct, ...extra });
export const fill = (id, topic, prompt, unit, correct, extra) => base('fill', id, topic, prompt, { unit, correct: [].concat(correct), ...extra });
export const hot = (id, topic, prompt, scene, correct, extra) => base('hotspot', id, topic, prompt, { scene, correct, ...extra });
export const ord = (id, topic, prompt, correct, extra) => base('order', id, topic, prompt, { correct, ...extra });
