import { routeAt } from './route.js';

// Bus bay on the right-hand (inner) side of the north street, before the side road at x = -8.
// Traffic drives on the right, so a departing bus signals left and merges into the learner's lane.
export const BUS_BAY = { west: -1, east: 12, kerb: 18, road: 21, offset: 4.4 };

export function railwayState(mission, snapshot) {
  const time = snapshot.actorTime ?? 0;
  const opening = Math.max(0, Math.min(1, (time - mission.duration + 2) / 2));
  return { red: time < mission.duration, barrierOpen: time >= mission.duration,
    barrierAngle: opening * Math.PI / 2 };
}
export function railwayZone(mission) {
  return { x: routeAt(mission.gate + 7).x, z: -26, heading: Math.PI / 2, width: 10, length: 9.5 };
}
export function sharingDirection(mission, view, busy, base) {
  const gap = mission.gate - view.distance;
  if (gap < -6 || gap > 40) return null;
  const railway = mission.kind === 'rail', waiting = railway ? railwayState(mission, view).red : busy;
  const title = railway ? waiting ? 'Railway red — wait before the barrier' : 'Lights off — check the crossing'
    : mission.kind === 'bus' ? waiting ? 'Make room for the signalling bus' : 'Bus clear — check before following'
    : waiting ? 'F5 — let the oncoming car pass' : 'Narrow passage clear — check ahead';
  const detail = railway ? waiting ? 'Wait even while the barrier rises' : 'Barrier fully open · keep the tracks clear'
    : mission.kind === 'bus' ? waiting ? 'Inside the built-up area · departure indicator on' : 'Departure path clear · keep checking'
    : 'Oncoming traffic has priority';
  return { ...base, target: mission.id, phase: waiting ? 'wait' : 'clear', arrow: waiting ? 'Ⅱ' : '↑', title, detail,
    distance: Math.max(0, Math.ceil(gap)), distanceTarget: railway ? 'barrier' : mission.kind === 'bus' ? 'bus stop' : 'passage', caution: waiting };
}
