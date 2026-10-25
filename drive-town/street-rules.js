import { laneStage } from './lane-change.js';
import { overlaps } from './overlap.js';
import { front, rear, playerRect, actorsAt, byModel } from './street-state.js';
import { passengersBusy, crossBusy, tramApproaching } from './tram-state.js';
import { cycleCheck, cycleStage } from './cycle-rules.js';
import { overtakeCheck, overtakePress } from './overtake-rules.js';

// Rules of the street lessons (chapter 07, pure). A mistake carries `cause` and `measure` for the feedback text where a number failed.
// Every reason a street lesson can end with, and the checks in this file are run on every tick (see street-busy.js for the previews).
export const STREET_REASONS = ['passengers', 'tram-way', 'collision', 'oncoming', 'cut-in', 'overtake-zebra', 'solid-line', 'no-return', 'signal', 'speed'];
export const STILL = 1; // km/h: a car at or below this speed is waiting

const mistake = (reason, extra = {}) => ({ type: 'mistake', reason, ...extra });

// Lesson 21. Article 52: give passengers the chance to get on and off. Article 15: a tram has priority at a junction.
export function tramCheck(mission, before, after) {
  const lane = mission.lane, time = after.actorTime ?? 0, actors = actorsAt(mission, after, 60), rect = playerRect(mission, after);
  if (passengersBusy(mission, time) && front(after) >= lane.stop.zone[0] && front(after) <= lane.stop.zone[1] && after.speed > STILL) {
    return mistake('passengers', { measure: { kmh: after.speed } });
  }
  const tram = byModel(actors, 'tram').find(item => item.clock === 2);
  if (tram && overlaps(rect, tram, 0)) return mistake('tram-way', { cause: 'overlap' });
  if (before.distance + 2.25 < lane.cross.line && front(after) >= lane.cross.line && crossBusy(mission, after)) return mistake('tram-way', { cause: 'line', measure: { kmh: after.speed } });
  const hit = actors.find(item => item.clock !== 2 && overlaps(rect, item, 0));
  return hit ? mistake('collision', { measure: { other: hit.model } }) : null;
}
export function tramStage(mission, snap) {
  const { stop, cross } = mission.lane;
  if (rear(snap) > cross.zone[1] + 4.5) return 'done';
  if (front(snap) >= stop.zone[0] && rear(snap) <= stop.zone[1] || front(snap) >= cross.zone[0] && rear(snap) <= cross.zone[1] + 4.5) return 'passing';
  return front(snap) < stop.zone[0] ? 'approach' : 'between';
}

export const streetStage = (mission, snap) => {
  const role = mission.lane.role;
  return role === 'tram' ? tramStage(mission, snap) : role === 'cycle' ? cycleStage(mission, snap) : laneStage(mission, snap.merge ?? null, snap.distance, snap.time ?? 0);
};
// Success only outside a manoeuvre: not while the car passes the tram, the rider or is out on the other side.
const settled = stage => ['idle', 'approach', 'between', 'done'].includes(stage);

export function evaluateStreet(mission, before, after, context) {
  const role = mission.lane.role;
  if (context.mergeRequested) return role === 'overtake' ? overtakePress(mission, after, context) : null;
  const result = role === 'tram' ? tramCheck(mission, before, after) : role === 'cycle' ? cycleCheck(mission, before, after) : overtakeCheck(mission, before, after);
  if (result) return result;
  return after.distance >= mission.end && settled(streetStage(mission, after)) ? { type: 'success' } : null;
}
export { tramApproaching };
