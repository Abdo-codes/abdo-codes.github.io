import { actorsAt, byModel } from './street-state.js';

// The area that a standing tram or a van hides from the driver (pure). Points are { s, lateral } on the route. Drawn as a light amber fan in the guided mode.
// The shadow of a box seen from the eye: the two corners that bound it, and the same rays carried `depth` metres further. Rays stop at the kerb.
export const KERB = 1.75, DEPTH = 30;
export function shadow(eye, box, depth = DEPTH) {
  const corners = [[box.s - box.length / 2, box.lateral - box.width / 2], [box.s - box.length / 2, box.lateral + box.width / 2], [box.s + box.length / 2, box.lateral - box.width / 2], [box.s + box.length / 2, box.lateral + box.width / 2]];
  const angle = ([s, lateral]) => Math.atan2(lateral - eye.lateral, s - eye.s), sorted = corners.slice().sort((a, b) => angle(a) - angle(b)), [low, high] = [sorted[0], sorted.at(-1)];
  const far = ([s, lateral]) => { const d = Math.hypot(s - eye.s, lateral - eye.lateral) || 1, k = (d + depth) / d; return { s: eye.s + (s - eye.s) * k, lateral: Math.min(KERB + 4, eye.lateral + (lateral - eye.lateral) * k) }; };
  return [{ s: low[0], lateral: low[1] }, { s: high[0], lateral: high[1] }, far(high), far(low)];
}
// Shadows for the standing tram and the van. `snapshot.distance` is the eye (the driver sits 0.4 m behind the car centre: not modelled).
export function sightCones(mission, snapshot) {
  const eye = { s: snapshot.distance, lateral: snapshot.lateral ?? 0 };
  return byModel(actorsAt(mission, snapshot, 90), 'tram', 'van').filter(box => box.clock !== 2 && (box.model === 'van' || box.standing) && box.s - box.length / 2 > eye.s)
    .map(box => ({ model: box.model, points: shadow(eye, { s: box.s, length: box.length, lateral: box.lateral, width: box.width }) }));
}
