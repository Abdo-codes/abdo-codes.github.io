import { ROUTES } from './routes.js';

// The town loop, kept as the default route for existing scenery and missions.
const town = ROUTES.town;
export const ROUTE_LENGTH = town.length;
export const ROUTE_TURNS = town.turns;
export const routeAt = distance => town.at(distance);

const TOWN_MAP = { x: 0, z: 0, scale: 1.1 };
export function mapPoint(point, map = TOWN_MAP) {
  return { x: 60 + (point.x - map.x) * map.scale, y: 47 + (point.z - map.z) * map.scale };
}
