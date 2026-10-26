import { ROUTES } from './routes.js';

// Paths of chapter 06. Each gets the path, the progress (0 to 1) and the mission.
export const EXTRA_PATHS = {
  // A road user that stands still at `at`, or at `kerb` when the mission variant sets `kerb`.
  stand(path, progress, mission) {
    const [x, z] = mission.kerb ? path.kerb : path.at;
    return { x, z, heading: path.face };
  },
  // Along a route from one distance to another, `lateral` metres to the right of it (negative = left, the oncoming lane).
  'route-offset'(path, progress) {
    const p = ROUTES[path.route ?? 'town'].at(path.from + progress * (path.to - path.from));
    return { ...p, x: p.x - p.dz * path.lateral, z: p.z + p.dx * path.lateral };
  },
};
// Point reflection about `pivot`: the same road user comes from the other side (mission variant `flip`).
export const flipPoint = (p, [cx, cz]) => ({ ...p, x: 2 * cx - p.x, z: 2 * cz - p.z, heading: p.heading + Math.PI });
