import { hostCheck, hostTimes } from './merge-gap.js';
import { NOTES as STREET_NOTES } from './street-notes.js';

// Coaching notes: good practice shown on the success card (at most 2). They never end an attempt and never change Independent credit.
// The key order of each lesson is the order of display.
const SIGNAL = 'Signal earlier. Other drivers need time to see it.';
export const NOTES = {
  'zipper-merge': {
    'last-moment': 'You merged very near the hatched area. Merge at the last safe gap before it, and do not wait for the area.',
    early: 'You merged before the sign. The sign asks you to drive on to it.',
    fast: 'You arrived much faster than the queue. Match the speed of the other lane.',
    'late-signal': SIGNAL },
  'acceleration-lane': {
    'last-moment': 'You merged very near the end of the lane. Look for a gap earlier.',
    'slow-merge': 'You joined at {n} km/h. The road drives at 50. Use the lane to build speed.',
    'late-stop': 'If you must stop, stop early. Then you keep lane to build speed.',
    'late-signal': SIGNAL },
  'room-to-merge': {
    'sped-up': 'You sped up near a merging driver. Keep your speed or slow down.',
    'needless-slow': 'You slowed more than needed. The gap was already good.' },
};
export const MAX_NOTES = 2;

// Notes that depend on the Merge press: where, how fast and how long the indicator was on.
export function pressNotes(mission, merge) {
  const crossing = merge.s + Math.min(8, merge.kmh / 3.6 * 2), ids = [];
  if (mission.id === 'zipper-merge') {
    if (crossing >= 220) ids.push('last-moment');
    if (merge.s < mission.lane.openAt) ids.push('early');
    if (merge.kmh > 30) ids.push('fast');
  } else {
    if (crossing >= 210) ids.push('last-moment');
    if (merge.kmh < 42) ids.push('slow-merge');
  }
  if (merge.lead < 1.5) ids.push('late-signal');
  return ids;
}
// Notes found while driving (lesson 16: a late stop; lesson 17: the speed at the merger's crossing).
export function trackNotes(session, before, after) {
  const mission = session.mission;
  if (mission.id === 'acceleration-lane') return !after.merge && after.speed < .5 && after.distance >= 190 ? ['late-stop'] : [];
  if (mission.id !== 'room-to-merge') return [];
  const { t0, tc, t1 } = hostTimes(mission), time = after.actorTime ?? 0;
  if (!((before.actorTime ?? 0) < tc && tc <= time)) return [];
  const earlier = session.history.at(-181) ?? session.history[0], ids = [];
  if (after.speed - earlier.speed >= 3) ids.push('sped-up');
  // Counterfactual: keeping the start speed would have passed, and the real speed is far below it.
  const v = mission.startSpeed / 3.6, learnerAt = at => ({ s: mission.start + v * at, speed: v });
  const times = Array.from({ length: Math.ceil((t1 - t0) / .1) + 1 }, (_, i) => Math.min(t0 + i * .1, t1));
  if (after.speed < 35 && !hostCheck(mission, learnerAt, { overlapTimes: times, gapTime: tc })) ids.push('needless-slow');
  return ids;
}
// At most two notes in the lesson's order, as { id, text }.
export function pickNotes(ids, mission, merge = null) {
  const table = NOTES[mission.id] ?? STREET_NOTES[mission.id] ?? {};
  return Object.keys(table).filter(id => ids.includes(id)).slice(0, MAX_NOTES)
    .map(id => ({ id, text: table[id].replace('{n}', Math.round(merge?.kmh ?? 0)) }));
}
