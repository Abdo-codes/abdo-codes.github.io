import { laneStage } from './lane-change.js';
import { stopTimes } from './lane-entry.js';
import { front, rear, actorsAt, byModel } from './street-state.js';
import { passengersBusy, tramApproaching, crossBusy, lampAt, stopTram } from './tram-state.js';
import { riderOf, oncomingOf, pressMeasure, overtakeBusy, rearPast } from './overtake-rules.js';
import { cycleBusy } from './cycle-rules.js';
import { HINT_KMH, REAR } from './overtake-gap.js';

// The phase of a street lesson and the one-line hint of the guided mode (pure). Navigation prompts and the hint line read the same phase.
// phase: tram approach | wait | go | cross | drive. cycle van | out | pair | clear. overtake follow | blocked | speed | signal | go | back.
export const TEXT = {
  approach: 'Tram stop ahead. Slow down.', wait: 'Doors open. Stop.', closing: 'Doors closing. Wait.', go: 'Clear. Drive on slowly.', cross: 'Tram crossing. Let it go first.',
  van: 'Van on the cycle strip. Slow down.', out: 'Cyclist moves out. Give room.', pair: 'Two cyclists side by side. Stay behind.', clear: 'Clear. Drive on.',
  zebra: 'Zebra ahead. No passing.', solid: 'Solid line. No passing.', oncoming: 'Oncoming car in the strip. Stay behind.', speed: 'Speed up to 40 km/h first.',
  back: 'Past the cyclist. Signal right, then tap Back.',
};
function tramPhase(mission, view) {
  const time = view.actorTime ?? 0, lane = mission.lane, tram = stopTram(mission), past = front(view) >= lane.stop.zone[1];
  if (crossBusy(mission, view)) return 'cross';
  if (tram && !past) {
    if (passengersBusy(mission, time)) return 'wait';
    if (tramApproaching(mission, time)) return 'approach';
    if (lampAt(mission, time) === 'amber') return 'closing';
    if (time > stopTimes(tram).arrive && front(view) >= mission.gate - 20) return 'go';
  }
  return 'drive';
}
function cyclePhase(mission, view) {
  const actors = actorsAt(mission, view, 90), riders = byModel(actors, 'cyclist', 'moped'), ahead = riders.filter(rider => rider.s + rider.length / 2 > rear(view));
  if (!ahead.length) return 'drive';
  if (ahead.filter(rider => Math.abs(rider.lateral) < 1.6).length > 1) return 'pair';
  if (ahead.some(rider => rider.lateral < 2.3)) return 'out';
  if (byModel(actors, 'van').some(van => van.s > front(view) - 2)) return 'van';
  return cycleBusy(mission, view) ? 'out' : 'clear';
}
// Overtake. `need` is the free oncoming road in metres that the pass needs at the current speed (at least 40 km/h).
export function overtakePhase(mission, view) {
  const stage = laneStage(mission, view.merge ?? null, view.distance, view.time ?? 0), actors = actorsAt(mission, view, 400);
  if (stage === 'out' || stage === 'moving-out') return rearPast(view, riderOf(actors)) >= REAR - 2 ? 'back' : 'drive';
  if (stage !== 'idle') return 'drive';
  const zone = (mission.lane.zones ?? []).find(item => item.to >= rear(view) && item.from - front(view) < 80);
  if (zone) return zone.kind === 'zebra' ? 'zebra' : 'solid';
  if (!riderOf(actors)) return 'drive';
  if (overtakeBusy(mission, { ...view, speed: Math.max(view.speed, HINT_KMH) })) return oncomingOf(actors).length ? 'oncoming' : 'follow';
  return view.speed < HINT_KMH ? 'speed' : view.signal === mission.signal ? 'go' : 'signal';
}
export function streetPhase(mission, view) {
  const role = mission.lane.role;
  return role === 'tram' ? tramPhase(mission, view) : role === 'cycle' ? cyclePhase(mission, view) : overtakePhase(mission, view);
}
export function streetHint(mission, view) {
  const phase = streetPhase(mission, view);
  if (mission.lane.role === 'overtake' && (phase === 'signal' || phase === 'go')) return `Road clear for ${Math.ceil(pressMeasure(mission, { ...view, speed: Math.max(view.speed, HINT_KMH) }).need ?? 0)} m. ${phase === 'signal' ? 'Signal left, then tap Overtake.' : 'Tap Overtake.'}`;
  return TEXT[phase] ?? '';
}
