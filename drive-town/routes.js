import { buildRoute } from './route-builder.js';
import { ROUNDABOUT_ROUTES } from './roundabout-layout.js';
import { MERGE_ROUTES } from './merge-layout.js';
import { STREET_ROUTES } from './street-layout.js';
export { buildRoute };

const RADIUS = 8, QUARTER = { arc: RADIUS, angle: Math.PI / 2, turn: 'right' };
export const ROUTES = {
  town: buildRoute({ id: 'town', loop: true, start: { x: 28, z: 24, dx: -1, dz: 0 },
    segments: [{ straight: 56 }, QUARTER, { straight: 32 }, QUARTER, { straight: 56 }, QUARTER, { straight: 32 }, QUARTER] }),
  ...ROUNDABOUT_ROUTES,
  ...MERGE_ROUTES,
  ...STREET_ROUTES,
};
export const routeFor = mission => ROUTES[mission?.route ?? 'town'];
