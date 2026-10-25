import { laneState, laneStage } from './lane-change.js';
import { overlaps } from './overlap.js';
import { front, rear, playerRect, actorsAt, byModel, advance } from './street-state.js';
import { MARGIN, REAR, LEFT, BAND, needGap } from './overtake-gap.js';

// Lesson 23 (pure). Article 55: signal before a sideways move. Articles 12 and 76: no pass at a zebra crossing or over a solid line.
// Article 19 asks for a free road ahead: MARGIN and REAR are Drive Town values (overtake-gap.js).
const mistake = (reason, extra = {}) => ({ type: 'mistake', reason, ...extra });
export const riderOf = actors => byModel(actors, 'cyclist')[0] ?? null;
export const oncomingOf = actors => actors.filter(actor => actor.speed < 0);
// Bumper gap in metres between the front of the car and the nearest oncoming car in front of it (negative: overlap).
export const oncomingGap = (snap, actors) => oncomingOf(actors).filter(actor => actor.s + actor.length / 2 > rear(snap))
  .reduce((best, actor) => Math.min(best, actor.s - actor.length / 2 - front(snap)), Infinity);
export const riderGap = (snap, rider) => rider ? rider.s - rider.length / 2 - front(snap) : Infinity;
// How far the rear bumper is past the front of the rider (negative: still behind it).
export const rearPast = (snap, rider) => rider ? rear(snap) - (rider.s + rider.length / 2) : Infinity;
export const zoneAt = (zones, snap) => (zones ?? []).find(zone => front(snap) >= zone.from && rear(snap) <= zone.to) ?? null;

// The press of Overtake: only the indicator is a rule. Back to lane never fails.
export function overtakePress(mission, snap, context) {
  if (snap.merge) return null;
  return mission.signal && context.signal !== mission.signal ? mistake('signal') : null;
}
// What the player passes to the planner: the state of the pass at the press.
export function pressMeasure(mission, snap) {
  const actors = actorsAt(mission, snap), rider = riderOf(actors), gap = oncomingGap(snap, actors), v = snap.speed / 3.6;
  const need = rider ? needGap(v, rider.speed, Math.max(0, riderGap(snap, rider)), oncomingOf(actors)[0] ? -oncomingOf(actors)[0].speed : 11.1) : 0;
  return { kmh: snap.speed, gap: Number.isFinite(gap) ? gap : null, need: Number.isFinite(need) ? need : null, ahead: rider ? riderGap(snap, rider) : null };
}

// The checks of every tick. `before` and `after` are snapshots; the car holds whatever the player does.
export function overtakeCheck(mission, before, after) {
  const lane = mission.lane, actors = actorsAt(mission, after, 220), rect = playerRect(mission, after), rider = riderOf(actors);
  const now = laneState(mission, after.merge ?? null, after.distance, after.time ?? 0), stage = laneStage(mission, after.merge ?? null, after.distance, after.time ?? 0);
  const hitRider = rider && overlaps(rect, rider, 0), hitOncoming = oncomingOf(actors).find(actor => overlaps(rect, actor, 0));
  if (hitOncoming) return mistake('oncoming', { cause: 'overlap', measure: { kmh: after.speed, gap: 0 } });
  if (hitRider) return mistake('collision', { measure: { other: 'cyclist', kmh: after.speed } });
  if (now.lateral < LEFT) {
    const zone = zoneAt(lane.zones, after);
    if (zone) return mistake(zone.kind === 'solid' ? 'solid-line' : 'overtake-zebra', { measure: { zone: zone.kind } });
    const gap = oncomingGap(after, actors);
    if (gap < MARGIN) return mistake('oncoming', { cause: 'gap', measure: { kmh: after.speed, gap, margin: MARGIN, press: after.merge?.measure ?? null } });
  }
  if (after.merge?.back) {
    const was = laneState(mission, before.merge ?? null, before.distance, before.time ?? 0).lateral;
    if (was <= BAND && now.lateral > BAND && rearPast(after, rider) < REAR) return mistake('cut-in', { measure: { past: rearPast(after, rider), need: REAR } });
  }
  if (!['idle', 'done'].includes(stage) && lane.limit !== undefined && after.distance >= lane.limit) return mistake('no-return');
  return null;
}
// Preview: would Overtake fail if pressed now? It holds the speed and presses Back at the first safe moment, with the same checks as the drive.
// A pass that is not finished in 25 s (the car is too slow to get past) also counts as busy.
export function overtakeBusy(mission, snap) {
  if (snap.merge || snap.speed <= 0) return false;
  const lane = mission.lane;
  let at = { ...snap, merge: { s: snap.distance, t: snap.time ?? 0, from: lane.from, to: lane.to, kmh: snap.speed } };
  for (let i = 0; i < 250; i++) {
    const before = at;
    at = advance(mission, at, .1);
    const rider = riderOf(actorsAt(mission, at, 220));
    if (!at.merge.back && laneStage(mission, at.merge, at.distance, at.time) === 'out' && rearPast(at, rider) >= REAR) at = { ...at, merge: { ...at.merge, back: { s: at.distance, t: at.time } } };
    if (overtakeCheck(mission, before, at)) return true;
    if (laneStage(mission, at.merge, at.distance, at.time) === 'done') return false;
  }
  return true;
}
