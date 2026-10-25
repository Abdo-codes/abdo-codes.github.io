import { ROUTES } from './routes.js';
import { EXTRA_PATHS, flipPoint } from './actor-paths-extra.js';

// Road-user paths as data. Each mission's `actor` is `{ slot, path }`: `slot` picks the
// reusable model (1 car, 2 pedestrian, 3 cyclist, 4 pedestrian, 5 bus, 6 train) and
// `path` describes where it moves while the mission clock runs from 0 to `duration`.
// Optional: `clearAt` (progress after which the conflict point is clear), `retire`
// (hide the road user once its lesson is over) and `name` (used in feedback).
const smooth = t => { const p = Math.max(0, Math.min(1, t)); return p * p * (3 - 2 * p); };

const PATHS = {
  // Straight movement between two ground points.
  line(path, progress) {
    const [fx, fz] = path.from, [tx, tz] = path.to;
    return { x: fx + (tx - fx) * progress, z: fz + (tz - fz) * progress, heading: Math.atan2(tx - fx, tz - fz) };
  },
  // Along a route, starting `offset` metres to the right of it and merging in by `merge` progress.
  'route-merge'(path, progress) {
    const p = ROUTES[path.route ?? 'town'].at(path.from + progress * (path.to - path.from));
    const lateral = path.offset * (1 - smooth(Math.min(1, progress / path.merge)));
    return { ...p, x: p.x - p.dz * lateral, z: p.z + p.dx * lateral };
  },
  // Along any registered route, from one distance to another.
  route(path, progress) {
    return ROUTES[path.route].at(path.from + progress * (path.to - path.from));
  },
  // Around a circle (e.g. a roundabout cycle path); angles in radians, x = cos, z = sin.
  arc(path, progress) {
    const [cx, cz] = path.centre, angle = path.from + progress * (path.to - path.from), sign = Math.sign(path.to - path.from);
    return { x: cx + path.radius * Math.cos(angle), z: cz + path.radius * Math.sin(angle),
      heading: Math.atan2(-Math.sin(angle) * sign, Math.cos(angle) * sign) };
  },
  // Travel along +z while the lane's x shifts smoothly: x = base + Σ by · smooth((z - start) / over).
  lane(path, progress) {
    const lane = at => path.shifts.reduce((x, shift) => x + shift.by * smooth((at - shift.start) / shift.over), path.base);
    const z = path.from + progress * (path.to - path.from);
    return { x: lane(z), z, heading: Math.atan2((lane(z + .05) - lane(z)) / .05, 1) };
  },
  ...EXTRA_PATHS,
};

export function actorProgress(mission, time) {
  const delay = mission.approachDelay ?? 0;
  return Math.min(Math.max((time ?? 0) - delay, 0) / (mission.duration - delay), 1);
}
export function actorPoint(mission, time) {
  const path = mission.actor?.path;
  if (!path) return { x: 0, z: 0, heading: 0 };
  const point = PATHS[path.type](path, actorProgress(mission, time), mission);
  return mission.flip ? flipPoint(point, mission.actor.pivot) : point;
}
export const PATH_TYPES = Object.keys(PATHS);
