import { ROUTES } from './routes.js';
import { MERGE_LENGTH, MERGE_SECONDS, laneState, offsetPoint } from './lane-change.js';
import { ruleActors, entryAt, WIDTHS } from './lane-traffic.js';
import { overlaps } from './overlap.js';

// The gap rule of the merge lessons. The law gives no number: these values are design choices (instructor review is open).
// Gaps are bumper to bumper in metres, speeds in m/s. The follower is the rear car of the pair.
export const MIN_HEADWAY_S = 1, PROJECT_S = 2, PROJECT_MIN_S = .5, SPEED_FLOOR = 2.5, BUSY_MARGIN = .05, CLEAR = .7;
const PLAYER = { width: 2, length: 4.5 }, SEVERITY = { overlap: 3, 'gap-now': 2, 'gap-soon': 1 };

export function gapOf(player, actor, margin = 0) {
  const ahead = actor.s > player.s;
  const gap = ahead ? actor.s - actor.length / 2 - (player.s + PLAYER.length / 2) : player.s - PLAYER.length / 2 - (actor.s + actor.length / 2);
  const follower = ahead ? player.speed : actor.speed, lead = ahead ? actor.speed : player.speed, base = Math.max(follower, SPEED_FLOOR);
  const headway = gap / base, projected = (gap + (lead - follower) * PROJECT_S) / base;
  const cause = gap < 0 ? 'overlap' : headway < MIN_HEADWAY_S + margin ? 'gap-now' : projected < PROJECT_MIN_S + margin ? 'gap-soon' : null;
  return { cause, gap, headway, projected, ahead, closing: (follower - lead) * 3.6, playerKmh: player.speed * 3.6, otherKmh: actor.speed * 3.6, actor };
}
// The worst pair between the player { s, speed } and the actors (null without actors). `cause` is null when every gap is fine.
export function gapAt(player, actors, margin = 0) {
  let worst = null;
  for (const actor of actors) {
    const pair = gapOf(player, actor, margin), rank = SEVERITY[pair.cause] ?? 0;
    if (!worst || rank > (SEVERITY[worst.cause] ?? 0) || rank === (SEVERITY[worst.cause] ?? 0) && pair.headway < worst.headway) worst = pair;
  }
  return worst;
}
export const rectangle = (route, s, lateral = 0, yaw = 0) => ({ ...offsetPoint(route.at(s), lateral, yaw), ...PLAYER });

// Busy for the merger: "if you choose Merge now, you fail". It runs the same checks as the real rules over the whole shift
// with the speeds held, a clearance between samples and a small extra margin. So not busy means the real check passes.
function mergerBusy(mission, snapshot) {
  const lane = mission.lane, route = ROUTES[mission.route], v = snapshot.speed / 3.6, time = snapshot.actorTime ?? 0;
  const press = { s: snapshot.distance, t: snapshot.time ?? 0, from: lane.from, to: lane.to };
  const duration = Math.min(MERGE_LENGTH / Math.max(v, 1e-9), MERGE_SECONDS);
  const at = t => ({ s: press.s + v * t, ...laneState(mission, press, press.s + v * t, press.t + t) });
  for (let i = 0; i * .1 < duration + .05; i++) {
    const t = Math.min(i * .1, duration), pose = at(t), rect = rectangle(route, pose.s, pose.lateral, pose.yaw);
    if (ruleActors(mission, time + t, [pose.s, 40]).some(actor => overlaps(rect, actor, CLEAR))) return true;
  }
  const crossing = Math.ceil(Math.min(MERGE_LENGTH / 2 / Math.max(v, 1e-9), MERGE_SECONDS / 2) * 60) / 60;
  const worst = gapAt({ s: press.s + v * crossing, speed: v }, ruleActors(mission, time + crossing, [press.s, 80]), BUSY_MARGIN);
  return Boolean(worst?.cause);
}

// Host role (lesson 17): the merging driver's shift into the learner's lane.
export function hostTimes(mission) {
  const car = mission.lane.traffic.find(entry => entry.shifts), shift = car.shifts[0], when = place => (place - car.s0) / car.speed;
  return { car, t0: when(shift.at), tc: when(shift.at + shift.over / 2), t1: when(shift.at + shift.over) };
}
// The first failure of the learner against the merging driver, or null. `learnerAt(time)` gives { s, speed }.
// A learner who is ahead of the merging driver is never blamed. Overlap is checked at `overlapTimes`, the gap rule at `gapTime`.
export function hostCheck(mission, learnerAt, { overlapTimes = [], gapTime = null, margin = 0, clearance = 0 } = {}) {
  const { car } = hostTimes(mission), route = ROUTES[mission.route];
  const driver = (time) => { const e = entryAt(car, time); return { ...e, speed: car.speed, length: car.length, width: WIDTHS[car.model] ?? 2 }; };
  for (const time of overlapTimes) {
    const learner = learnerAt(time), other = driver(time);
    if (learner.s > other.s) continue;
    if (overlaps(rectangle(route, learner.s), { ...offsetPoint(route.at(other.s), other.lateral, other.yaw), width: other.width, length: other.length }, clearance)) {
      return { ...gapOf(learner, other), cause: 'overlap' };
    }
  }
  if (gapTime === null) return null;
  const learner = learnerAt(gapTime), other = driver(gapTime);
  if (learner.s >= other.s) return null;
  const pair = gapOf(learner, other, margin);
  return pair.cause ? pair : null;
}
function hostBusy(mission, snapshot) {
  const { t0, tc, t1 } = hostTimes(mission), now = snapshot.actorTime ?? 0, v = snapshot.speed / 3.6;
  if (now > t1) return false;
  const learnerAt = time => ({ s: snapshot.distance + v * (time - now), speed: v });
  const overlapTimes = [];
  for (let time = Math.max(t0, now); time < t1; time += .1) overlapTimes.push(time);
  overlapTimes.push(t1);
  return Boolean(hostCheck(mission, learnerAt, { overlapTimes, gapTime: tc >= now ? tc : null, margin: BUSY_MARGIN, clearance: CLEAR }));
}
export function mergeBusy(mission, snapshot) {
  if (mission.lane.role === 'host') return hostBusy(mission, snapshot);
  return !snapshot.merge && mission.lane.to !== undefined && mergerBusy(mission, snapshot);
}
