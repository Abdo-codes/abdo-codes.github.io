import { entryAt, stopTimes, DOOR_OPEN } from './lane-entry.js';
import { overlaps } from './overlap.js';
import { advance, front, playerRect, actorsAt, byModel, HALF } from './street-state.js';

// The tram stop and the tram crossing of lesson 21 (pure). Times are in seconds on the actor clock.
export const ROAD_EDGE = 1.75, CLEARANCE = 1;
export const stopTram = mission => mission.lane.traffic.find(entry => entry.stop) ?? null;
export const lampAt = (mission, time) => { const tram = stopTram(mission); return tram ? entryAt(tram, time).lamp : 'off'; };
export function passengersOnRoad(mission, time) {
  return mission.lane.traffic.some(entry => entry.model === 'walker' && (entry.clock ?? 1) === 1 && (entry.appear === undefined || time >= entry.appear)
    && (entry.vanish === undefined || time < entry.vanish) && entryAt(entry, time).lateral < ROAD_EDGE);
}
// Doors open (the lamp is green or amber) and someone is on the road: the driver must give them time (Article 52).
export const passengersBusy = (mission, time) => lampAt(mission, time) !== 'off' && passengersOnRoad(mission, time);
// The hint window: the tram brakes into the stop and the doors have not opened yet.
export function tramApproaching(mission, time) {
  const tram = stopTram(mission);
  if (!tram) return false;
  const { brakeAt, arrive } = stopTimes(tram);
  return time >= brakeAt && time < arrive + DOOR_OPEN;
}
// Would the car overlap the crossing tram if it went on now? It runs the crossing forward at the held speed, at least the Drive speed:
// a car that waits at the line will go on at that pace.
export function crossBusy(mission, snap) {
  const { cross } = mission.lane;
  if (!cross || snap.time2 === null || snap.time2 === undefined || front(snap) > cross.zone[1] + HALF) return false;
  let at = snap;
  const kmh = Math.max(snap.speed, mission.driveSpeed);
  for (let i = 0; i < 160 && front(at) < cross.zone[1] + HALF; i++) {
    at = advance(mission, at, .1, kmh);
    const rect = playerRect(mission, at);
    if (byModel(actorsAt(mission, at, 60), 'tram').some(tram => tram.clock === 2 && overlaps(rect, tram, CLEARANCE))) return true;
  }
  return false;
}
export const tramBusy = (mission, snap) => front(snap) < mission.lane.stop.zone[1] && (tramApproaching(mission, snap.actorTime ?? 0) || passengersBusy(mission, snap.actorTime ?? 0)) || crossBusy(mission, snap);
