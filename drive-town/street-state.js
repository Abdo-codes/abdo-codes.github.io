import { ROUTES } from './routes.js';
import { playerPose } from './lane-change.js';
import { ruleActors } from './lane-traffic.js';

// Shared pure helpers of the street lessons (chapter 07). A snapshot is the object of DriveSession.snapshot().
export const PLAYER = { width: 2, length: 4.5 }, HALF = PLAYER.length / 2;
export const front = snap => snap.distance + HALF, rear = snap => snap.distance - HALF;
export const playerRect = (mission, snap) => ({ ...playerPose(ROUTES[mission.route], mission, snap), ...PLAYER });
export const actorsAt = (mission, snap, range = 90) => ruleActors(mission, snap.actorTime ?? 0, [snap.distance, range], snap.time2 ?? null);
export const byModel = (actors, ...models) => actors.filter(actor => models.includes(actor.model));
// The second clock (lesson 21) starts when the car reaches `lane.trigger2`. It runs like `actorTime`.
export function nextTime2(lane, time2, distance, dt) {
  if (lane?.trigger2 === undefined) return null;
  const started = time2 === null || time2 === undefined ? distance >= lane.trigger2 ? 0 : null : time2;
  return started === null ? null : started + dt;
}
// The snapshot `dt` seconds later at a held speed (km/h). The lane move stays as it is.
export function advance(mission, snap, dt, kmh = snap.speed) {
  const distance = snap.distance + (snap.speed + kmh) / 2 / 3.6 * dt;
  return { ...snap, distance, speed: kmh, time: (snap.time ?? 0) + dt, actorTime: (snap.actorTime ?? 0) + dt, time2: nextTime2(mission.lane, snap.time2 ?? null, distance, dt) };
}
