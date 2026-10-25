// The lane change of the merge lessons. The route steers; Merge starts a smooth sideways shift.
// `lateral` is in metres to the right of the route centre line. A shift ends after 16 m or 4 s, whichever is first.
export const MERGE_LENGTH = 16, MERGE_SECONDS = 4;
export const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
export const smooth = t => { const p = clamp(t); return p * p * (3 - 2 * p); };
export const progress = (merge, s, t) => clamp(Math.max((s - merge.s) / MERGE_LENGTH, (t - merge.t) / MERGE_SECONDS));
export function laneState(mission, merge, s, t) {
  if (!merge) return { lateral: mission.lane?.from ?? 0, yaw: 0, progress: 0 };
  const p = progress(merge, s, t), change = merge.to - merge.from, slope = q => change * 6 * q * (1 - q) / MERGE_LENGTH;
  if (!merge.back) return { lateral: merge.from + change * smooth(p), yaw: -Math.atan(slope(p)), progress: p };
  // The overtake lesson moves back to the first lane. `back` is a second press; the shared `merge` object is never changed (simulation.js makes a new one).
  const b = progress(merge.back, s, t);
  return { lateral: merge.to - change * smooth(b), yaw: Math.atan(slope(b)), progress: b };
}
// idle: no move yet. out: across and waiting. done: back in the first lane. Lessons without `back` end in 'out'.
export function laneStage(mission, merge, s, t) {
  if (!merge) return 'idle';
  const out = progress(merge, s, t);
  if (!merge.back) return out >= 1 ? 'out' : 'moving-out';
  return progress(merge.back, s, t) >= 1 ? 'done' : out < 1 ? 'moving-out' : 'moving-back';
}
// A route point moved to the right by `lateral` metres and turned by `yaw`.
export const offsetPoint = (point, lateral, yaw = 0) => ({ ...point, x: point.x - point.dz * lateral, z: point.z + point.dx * lateral, heading: point.heading + yaw });
// The learner's pose, `future` seconds ahead at the current speed. Old snapshots without `merge` keep the lane centre.
export function playerPose(route, mission, snapshot, future = 0) {
  const s = snapshot.distance + snapshot.speed / 3.6 * future, point = route.at(s);
  if (!mission.lane) return point;
  const { lateral, yaw } = laneState(mission, snapshot.merge ?? null, s, (snapshot.time ?? 0) + future);
  return offsetPoint(point, lateral, yaw);
}
