import { tramBusy } from './tram-state.js';
import { cycleBusy } from './cycle-rules.js';
import { overtakeBusy, riderOf } from './overtake-rules.js';
import { actorsAt, rear } from './street-state.js';

// "Busy" for the street lessons: a preview that runs the same checks as the drive over the next seconds with the speed held.
// So "not busy" means the real check passes. It feeds the hint line, the markers and hazardActive.
export function streetBusy(mission, snap) {
  const role = mission.lane.role;
  return role === 'tram' ? tramBusy(mission, snap) : role === 'cycle' ? cycleBusy(mission, snap) : overtakeBusy(mission, snap);
}
export const CLOSING = 1.4; // m/s: the car closes on the rider
// The hazard of a hazard clip. Overtake: a reason not to pass lies ahead (a zone, or a pass that would fail) and the car closes on the rider.
export function streetHazard(mission, snap) {
  if (mission.lane.role !== 'overtake') return streetBusy(mission, snap);
  const rider = riderOf(actorsAt(mission, snap, 220));
  if (!rider || snap.merge || snap.speed / 3.6 - rider.speed <= CLOSING) return false;
  return (mission.lane.zones ?? []).some(zone => zone.to >= rear(snap)) || overtakeBusy(mission, snap);
}
