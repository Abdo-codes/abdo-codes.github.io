import { overlaps } from './overlap.js';
import { front, rear, playerRect, actorsAt, advance, byModel } from './street-state.js';

// Lesson 22 (pure). The only hard mistake is contact: the law gives no side gap for a cyclist, so room is a note, not a rule.
export const SEE_S = 6, CLEAR = .7, PASS_BEFORE = 12;
export const cycleCheck = (mission, before, after) => {
  const rect = playerRect(mission, after), hit = actorsAt(mission, after, 60).find(actor => overlaps(rect, actor, 0));
  return hit ? { type: 'mistake', reason: 'collision', measure: { other: hit.model, kmh: after.speed } } : null;
};
// The next 6 s at the held speed, with 0.7 m clearance: "if you go on like this you touch someone".
export function cycleBusy(mission, snap) {
  if (snap.speed <= 0) return false;
  let at = snap;
  for (let i = 0; i < SEE_S * 10; i++) {
    at = advance(mission, at, .1);
    const rect = playerRect(mission, at);
    if (actorsAt(mission, at, 60).some(actor => overlaps(rect, actor, CLEAR))) return true;
  }
  return false;
}
// 'passing' while a rider is out of the strip and the car is within 12 m behind it, beside it, or has not yet cleared it.
export function cycleStage(mission, snap) {
  const out = byModel(actorsAt(mission, snap, 80), 'cyclist', 'moped').filter(rider => rider.lateral < 2.3);
  const passing = out.some(rider => front(snap) >= rider.s - rider.length / 2 - PASS_BEFORE && rear(snap) <= rider.s + rider.length / 2);
  return passing ? 'passing' : snap.distance >= mission.end ? 'done' : 'approach';
}
