import { drawExam, drawDrill, freshCount } from './exam-draw.js';
import { ExamSession } from './exam-session.js';
import { EXAM_SIZE, EXAM_SECONDS, EXTRA_SECONDS, PASS_AT, DEV_CLOCK } from './exam-config.js';
import { bankVersion } from './exam-items.js';
import { SCENES } from './exam/scenes.js';
import { weakTopics } from './weak-topics.js';
import { TOPIC_IDS } from './exam/topics.js';

// Builds the runs of the mock exam. No DOM. env = { bank, weak, prefs, scenesOn, random, now, search }.
// ?examSeconds=60 shortens the clock for browser tests (DEV_CLOCK limits). That run does not count.
export function devSeconds(search = '') {
  const value = Number(new URLSearchParams(search).get('examSeconds'));
  return Number.isFinite(value) && value >= DEV_CLOCK.min && value <= DEV_CLOCK.max ? Math.round(value) : null;
}
const pool = env => env.scenesOn ? env.bank : env.bank.filter(item => !item.scene);
const shared = env => ({ random: env.random, now: env.now, scenes: SCENES, bankVersion: bankVersion(env.bank) });

// A small bank gives a short exam: the pass mark scales with it, so the exam can still be passed.
export const planOf = size => ({ size, passAt: size >= EXAM_SIZE ? PASS_AT : Math.ceil(size * PASS_AT / EXAM_SIZE) });
// The size and the pass mark that an exam gets from this bank, for the start card. A full bank gives 50 and 44.
export const examPlan = env => planOf(drawExam(pool(env), { random: () => .5, scenes: SCENES, withScenes: env.scenesOn }).length);

export function newExam(env) {
  const dev = devSeconds(env.search), items = drawExam(pool(env), { random: env.random, seen: env.weak.items, scenes: SCENES, withScenes: env.scenesOn }), { passAt } = planOf(items.length);
  return new ExamSession(items, { ...shared(env), seconds: dev ?? (env.prefs.extra ? EXTRA_SECONDS : EXAM_SECONDS), passAt, counts: dev === null, fresh: freshCount(items, env.weak.items) });
}
// A drill has no clock, no pass mark and instant feedback. It writes no history and no weak record.
export function newDrill(env, { topic = null, ids = null } = {}) {
  const items = drawDrill(pool(env), { topic, ids, random: env.random, seen: env.weak.items, scenes: SCENES });
  return new ExamSession(items, { ...shared(env), seconds: null, passAt: null, counts: false, feedback: 'instant', fresh: freshCount(items, env.weak.items) });
}
export const weakestTopic = (weak, random = Math.random) => weakTopics(weak, { minSeen: 1, minWrong: 0, limit: 1 })[0]?.topic ?? TOPIC_IDS[Math.floor(random() * TOPIC_IDS.length)];
