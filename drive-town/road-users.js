import { routeAt } from './route.js';
import { routeFor } from './routes.js';
import { MISSIONS } from './missions.js';
import { actorPoint, actorProgress } from './actor-paths.js';
import { sirenBusy, armUp } from './lights-state.js';
import { overlaps } from './overlap.js';
import { playerPose } from './lane-change.js';
import { laneActors } from './lane-traffic.js';
import { mergeBusy } from './merge-gap.js';
import { isLaneKind } from './lane-kind.js';
import { streetBusy } from './street-busy.js';
export { overlaps };

export const ACTOR_SIZES = { 1: { width: 2, length: 4.5 }, 2: { width: .9, length: .9 },
  3: { width: .85, length: 2.1 }, 4: { width: .9, length: .9 },
  5: { width: 2.5, length: 9.5 }, 6: { width: 2.8, length: 18 }, 7: { width: 2.3, length: 6.2 }, 8: { width: .6, length: .6 } };

// Results that show the amber ring and the badge on a road user, and frame the decision view around it.
// Reasons about a place (zebra, solid line) or the lesson bound (no-return) are not crossing conflicts: they show no ring.
export const CONFLICT_REASONS = ['yield', 'railway', 'hinder', 'siren-yield', 'officer-ignored', 'passengers', 'tram-way', 'collision', 'oncoming', 'cut-in'];
export const actorIndexFor = missionIndex => MISSIONS[missionIndex].actor?.slot ?? null;
// `index` is the model slot; the mission's own path decides the position.
export const hazardPoint = (index, time, mission = MISSIONS[index]) => actorPoint(mission, time);
export function crossingBusy(missionIndex, snapshot) {
  const mission = snapshot.scenario ?? snapshot.mission ?? MISSIONS[missionIndex];
  if (isLaneKind(mission)) return mission.kind === 'street' ? streetBusy(mission, snapshot) : mergeBusy(mission, snapshot);
  if (mission.kind === 'amber') return false;
  if (mission.kind === 'siren') return sirenBusy(mission, snapshot.actorTime);
  if (mission.kind === 'priority') return armUp(mission, snapshot.actorTime);
  if (!mission.duration) return false;
  if (snapshot.actorTime === null || snapshot.actorTime === undefined) return true;
  if (snapshot.actorTime >= mission.duration) return false;
  // Require .6 m beyond the far edge for the walking body and a small margin.
  // Walking onward on the pavement is animation, not crossing occupancy.
  if (mission.actor?.clearAt !== undefined) return actorProgress(mission, snapshot.actorTime) < mission.actor.clearAt;
  return mission.crossingExit === undefined || hazardPoint(actorIndexFor(missionIndex), snapshot.actorTime, mission).x < mission.crossingExit;
}
export function actorContext(index, snapshot, missionIndex, future = 0) {
  if (index > 4 && actorIndexFor(missionIndex) !== index) return { time: null, point: { x: 200, z: 200, heading: 0 }, mission: MISSIONS[missionIndex] };
  let latest = index;
  for (let candidate = 1; candidate <= missionIndex; candidate++) if (actorIndexFor(candidate) === index) latest = candidate;
  const mission = latest === missionIndex ? snapshot.scenario ?? MISSIONS[latest] : MISSIONS[latest];
  if (latest < missionIndex && (mission.kind === 'narrow' || mission.actor?.retire)) return { time: null, point: { x: 200, z: 200, heading: 0 }, mission };
  const time = latest < missionIndex ? mission.duration
    : latest === missionIndex && snapshot.actorTime !== null ? snapshot.actorTime + future : null;
  return { time, point: hazardPoint(index, time, mission), mission };
}
export function trafficPoint(distance) {
  const p = routeAt(distance);
  return { x: p.x + p.dz * 4, z: p.z - p.dx * 4, heading: p.heading + Math.PI, width: 2, length: 4.5 };
}
export function roadUsers(snapshot, missionIndex, future = 0) {
  const learnerMission = snapshot.scenario ?? MISSIONS[missionIndex];
  const player = { ...playerPose(routeFor(learnerMission), learnerMission, snapshot, future), width: 2, length: 4.5 };
  const users = [player];
  for (let index = 1; index <= 8; index++) {
    users.push({ ...actorContext(index, snapshot, missionIndex, future).point, ...ACTOR_SIZES[index] });
  }
  const mission = snapshot.scenario ?? MISSIONS[missionIndex];
  if (mission.kind === 'narrow') users.push({ x: -40.5, z: -13.5, heading: 0, width: 3, length: 8 });
  if (isLaneKind(mission)) users.push(...laneActors(mission, (snapshot.actorTime ?? 0) + future, [snapshot.distance, 60], snapshot.time2 === null || snapshot.time2 === undefined ? null : snapshot.time2 + future));
  return users;
}
