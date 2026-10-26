import { mapPoint } from './route.js';
import { ROUTES } from './routes.js';
import { actorsAt } from './street-state.js';

// Shapes of the street minimap (pure). They come from the snapshot only (`display ?? state.snapshot()`), so a replay frame shows its own positions.
// Each shape is in minimap units: { type, x, y (centre), w, h, angle (degrees), tone }. types: bar (tram, van), dot (walker, cyclist, moped), zone, zebra, tick.
const SIZES = { tram: [24, 2.65, 'tram'], van: [5.5, 2.1, 'van'], walker: [.6, .6, 'walker'], cyclist: [1.8, .6, 'rider'], moped: [1.8, .8, 'rider'], car: [4.5, 2, 'car'] };
// The map is 120 units wide and shows about 90 px on a phone, so 1 unit is about 0.75 px. At the street map scale (.33) a tram is 8 units long
// and 0.9 units wide, which is a hair of 1 px. A shape gets a minimum size that stays readable: a bar 4 by 3.2 units, a tick 1.6 by 5 units.
const MIN_LENGTH = 4, MIN_WIDTH = 3.2, TICK = [1.6, 5];
export function streetMarkers(mission, snapshot) {
  const route = ROUTES[mission.route], map = route.map, lane = mission.lane, shapes = [];
  const at = (s, lateral) => { const p = route.at(s); return mapPoint({ x: p.x - p.dz * lateral, z: p.z + p.dx * lateral }, map); };
  for (const actor of actorsAt(mission, snapshot, 400)) {
    const [length, width, tone] = SIZES[actor.model] ?? SIZES.car, p = mapPoint(actor, map);
    shapes.push({ type: ['walker', 'cyclist', 'moped'].includes(actor.model) ? 'dot' : 'bar', x: p.x, y: p.y, w: Math.max(MIN_LENGTH, length * map.scale), h: Math.max(MIN_WIDTH, width * map.scale),
      angle: (Math.PI / 2 - actor.heading) * 180 / Math.PI, tone });
  }
  for (const zone of lane.zones ?? []) {
    const a = at(zone.from, -1.75), b = at(zone.to, -1.75);
    shapes.push({ type: zone.kind === 'zebra' ? 'zebra' : 'zone', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: b.x - a.x, h: Math.max(MIN_WIDTH, 3.5 * map.scale), angle: 0, tone: 'stop' });
  }
  for (const s of [lane.stop?.line, lane.cross?.line].filter(item => item !== undefined)) { const p = at(s, 0); shapes.push({ type: 'tick', x: p.x, y: p.y, w: TICK[0], h: Math.max(TICK[1], 3.5 * map.scale), angle: 0, tone: 'line' }); }
  return shapes;
}
