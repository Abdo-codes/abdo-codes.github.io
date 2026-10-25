import { laneStage } from './lane-change.js';
import { front, actorsAt, byModel } from './street-state.js';
import { STILL } from './street-rules.js';
import { passengersBusy, tramApproaching, crossBusy, stopTram, lampAt } from './tram-state.js';
import { riderOf, rearPast } from './overtake-rules.js';
import { REAR, KEEP_RIGHT_S, SLOW_PASS_KMH } from './overtake-gap.js';
import { entryAt } from './lane-entry.js';
import { CLEAR } from './cycle-rules.js';

// Coaching notes of the street lessons (at most 2 on the success card; see merge-notes.js pickNotes). They never end an attempt.
// (D) marks a Drive Town design choice; the copy says "habit" or "design choice" for it.
export const NOTES = {
  'tram-street': {
    'tram-late': 'Slow down earlier when the tram brakes.',
    'tram-fast-pass': 'Pass slowly. People can step out.' },
  'cycle-lane': {
    'cyc-room': 'Give a cyclist plenty of room. The law gives no number.',
    'cyc-following': 'Keep a longer following distance behind a cyclist.',
    'cyc-late': 'Slow down earlier when a cyclist rides out.' },
  overtaking: {
    'slow-pass': 'You passed at {n} km/h. A quicker pass keeps you on the left for less time.',
    'late-back': 'You waited long before you moved back. Move back when you are clear of the cyclist.',
    'tight-back': 'You moved back with little room. This is a habit: leave more room.',
    'keep-right': 'Move back to the right soon. Drive Town asks this (design choice). Article 3 paragraph 1 says keep right as far as possible.',
    'no-back-signal': 'Show the right indicator when you move back (Article 55, an important sideways move).' },
};
const HARD = 4, LATE_NEAR = 12, FOLLOW_S = 2, SIDE_ROOM = CLEAR, FAST_KMH = 20, RIDER_HALF = .3, CAR_HALF = 1;
const decel = (before, after) => (before.speed - after.speed) / 3.6 / Math.max(1e-9, (after.time ?? 0) - (before.time ?? 0));

// Notes that depend on a press: the speed of the pass, and the way back.
export function streetPressNotes(mission, merge, snap) {
  if (!merge.back) return merge.kmh <= SLOW_PASS_KMH ? ['slow-pass'] : [];
  const past = rearPast(snap, riderOf(actorsAt(mission, snap, 220))), ids = [];
  if (past >= REAR && past < REAR + 2) ids.push('tight-back');
  if (merge.back.signal !== 'right') ids.push('no-back-signal');
  return ids;
}
// Notes found while driving, and the summary the success text reads (session.summary).
export function streetTrackNotes(session, before, after) {
  const mission = session.mission, role = mission.lane.role, time = after.actorTime ?? 0, summary = session.summary, ids = [];
  const actors = actorsAt(mission, after, 90);
  if (role === 'tram') {
    const line = mission.lane.stop.line, still = after.speed <= STILL;
    if (front(after) >= line - LATE_NEAR && front(after) <= line && decel(before, after) > HARD && before.speed > 14) ids.push('tram-late');
    const tram = stopTram(mission);
    if (tram && entryAt(tram, time).standing && lampAt(mission, time) === 'off' && front(after) >= line && front(after) <= mission.lane.stop.zone[1] && after.speed > FAST_KMH) ids.push('tram-fast-pass');
    if (still && (tramApproaching(mission, time) || passengersBusy(mission, time)) && front(after) >= line - 10 && front(after) <= mission.lane.stop.zone[1]) summary.waitedStop = true;
    const cross = mission.lane.cross;
    if (still && crossBusy(mission, after) && front(after) >= cross.line - LATE_NEAR && front(after) <= cross.line) summary.waitedCross = true;
  } else if (role === 'cycle') {
    const riders = byModel(actors, 'cyclist', 'moped');
    for (const rider of riders) {
      const gap = rider.s - rider.length / 2 - front(after), lateral = Math.abs(rider.lateral - after.lateral);
      if (Math.abs(rider.s - after.distance) < (rider.length + 4.5) / 2 && lateral - RIDER_HALF - CAR_HALF > 0 && lateral - RIDER_HALF - CAR_HALF < SIDE_ROOM) ids.push('cyc-room');
      const inLane = Math.abs(rider.lateral) < 1.6;
      if (inLane && gap > 0 && after.speed > 5 && gap / (after.speed / 3.6) < FOLLOW_S) ids.push('cyc-following');
      if (gap > 0 && gap < LATE_NEAR && decel(before, after) > HARD && before.speed > 14) ids.push('cyc-late');
      if (rider.lateral < 2.3 && gap > 0 && gap < 40 && after.speed <= 14) summary.slowed = true;
    }
    if (riders.filter(rider => Math.abs(rider.lateral) < 1.6).length > 1) summary.pair = true;
  } else {
    if (after.merge?.back) summary.passed = true;
    if (laneStage(mission, after.merge ?? null, after.distance, after.time ?? 0) === 'out') {
      if (after.time - after.merge.t > KEEP_RIGHT_S) ids.push('keep-right');
      const rider = riderOf(actors), past = rearPast(after, rider);
      if (rider && past >= REAR && after.speed / 3.6 > rider.speed && (past - REAR) / (after.speed / 3.6 - rider.speed) > 3) ids.push('late-back');
    }
  }
  return ids;
}
