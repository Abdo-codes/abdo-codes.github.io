import { TOPIC_IDS, topicById, MISSION_TOPIC, lessonsOf } from './exam/topics.js';
import { HAZARD_CLIPS } from './hazard-clips.js';
import { MISSIONS } from './missions.js';

// The weak-topic store: pure data functions. exam-store.js loads and saves it. Each source keeps its own counter and window.
// { version: 1, runs: [run ids], exams, topics: { id: { exam, hazard, drive: { recent, seen, wrong }, missions: { id: misses } } }, items: { id: { seen, wrong, last } } }
export const WINDOW = 20, SOURCES = ['exam', 'hazard', 'drive'];
const blank = () => ({ recent: [], seen: 0, wrong: 0 });
const clone = data => JSON.parse(JSON.stringify(data));
const count = value => Number.isInteger(value) && value >= 0 ? value : 0;
export const emptyWeak = () => ({ version: 1, runs: [], exams: 0, topics: {}, items: {} });

function cleanCounter(raw) {
  const recent = Array.isArray(raw?.recent) ? raw.recent.filter(v => v === 0 || v === 1).slice(-WINDOW) : [];
  return { recent, seen: count(raw?.seen), wrong: count(raw?.wrong) };
}
// Drops unknown topics, items and missions, like progress.js. Never throws.
export function cleanWeak(raw, itemIds = null) {
  if (!raw || raw.version !== 1 || typeof raw !== 'object') return emptyWeak();
  const out = emptyWeak();
  out.runs = Array.isArray(raw.runs) ? raw.runs.filter(id => typeof id === 'string').slice(-WINDOW) : [];
  out.exams = count(raw.exams);
  for (const topic of TOPIC_IDS) {
    const entry = raw.topics?.[topic]; if (!entry || typeof entry !== 'object') continue;
    const missions = {};
    for (const [id, misses] of Object.entries(entry.missions ?? {})) if (MISSION_TOPIC[id] && count(misses)) missions[id] = misses;
    out.topics[topic] = { exam: cleanCounter(entry.exam), hazard: cleanCounter(entry.hazard), drive: cleanCounter(entry.drive), missions };
  }
  for (const [id, row] of Object.entries(raw.items ?? {})) {
    if (itemIds && !itemIds.has(id)) continue;
    if (row && typeof row === 'object') out.items[id] = { seen: count(row.seen), wrong: count(row.wrong), last: count(row.last) };
  }
  return out;
}

function apply(data, { source, topic, correct, itemId, mission }) {
  if (!SOURCES.includes(source)) throw new RangeError(`Unknown weak-topic source "${source}"`);
  if (!topicById[topic]) throw new RangeError(`Unknown exam topic "${topic}"`);
  const entry = data.topics[topic] ??= { exam: blank(), hazard: blank(), drive: blank(), missions: {} }, counter = entry[source];
  counter.recent = [...counter.recent, correct ? 0 : 1].slice(-WINDOW); counter.seen++; if (!correct) counter.wrong++;
  if (!correct && mission && MISSION_TOPIC[mission]) entry.missions[mission] = (entry.missions[mission] ?? 0) + 1;
  if (itemId) { const row = data.items[itemId] ??= { seen: 0, wrong: 0, last: 0 }; row.seen++; if (!correct) row.wrong++; row.last = data.exams; }
  return data;
}
// A bad topic is never dropped silently: callers catch the RangeError and call console.error.
export const recordResult = (data, result) => apply(clone(data), result);

// Records every answer of a counted exam once. A run id that is in `runs` is skipped.
export function recordExam(data, session) {
  if (!session.counts || data.runs.includes(session.id)) return data;
  const next = clone(data); next.runs = [...next.runs, session.id].slice(-WINDOW); next.exams++;
  const wrong = new Set(session.result().wrong.map(entry => entry.index));
  session.items.forEach((item, index) => apply(next, { source: 'exam', topic: item.topic, correct: !wrong.has(index), itemId: item.id, mission: item.mission }));
  return next;
}

// Topics with enough exam answers in the window and enough mistakes, ranked by expected mistakes per exam (rate x quota).
export function weakTopics(data, { minSeen = 8, minWrong = 2, limit = 3 } = {}) {
  const rows = [];
  for (const [topic, entry] of Object.entries(data.topics)) {
    const { recent } = entry.exam, n = recent.length, wrong = recent.reduce((a, b) => a + b, 0);
    if (n < minSeen || wrong < minWrong || !topicById[topic]) continue;
    const rate = wrong / n, also = entry.hazard.recent.concat(entry.drive.recent).reduce((a, b) => a + b, 0);
    rows.push({ topic, rate, expected: rate * topicById[topic].quota, n, wrong, also });
  }
  return rows.sort((a, b) => b.expected - a.expected).slice(0, limit);
}

// The lessons and hazard clips that belong to a topic. `focus` lists lessons of wrong items: they come first, then the lessons with the most recorded misses.
// `clipMissions` is the part of `missions` that has hazard clips, in the same order.
export function practiceFor(topic, data, focus = []) {
  const misses = data.topics[topic]?.missions ?? {};
  const own = lessonsOf(topic).filter(id => MISSIONS.some(mission => mission.id === id)).sort((a, b) => (misses[b] ?? 0) - (misses[a] ?? 0));
  const missions = [...focus.filter(id => own.includes(id)), ...own.filter(id => !focus.includes(id))];
  const clipIds = HAZARD_CLIPS.filter(clip => missions.includes(clip.mission)).map(clip => clip.id);
  return { missions, clipIds, clipMissions: missions.filter(id => HAZARD_CLIPS.some(clip => clip.mission === id)) };
}
// The lessons of the wrong items of one topic, the most missed first. Items without a lesson add nothing.
export function focusLessons(items) {
  const hits = {}; for (const item of items) if (item.mission) hits[item.mission] = (hits[item.mission] ?? 0) + 1;
  return Object.keys(hits).sort((a, b) => hits[b] - hits[a]);
}
