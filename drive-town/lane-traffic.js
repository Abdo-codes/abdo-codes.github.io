import { ROUTES } from './routes.js';
import { offsetPoint } from './lane-change.js';
import { entryAt, exists, doorOpen } from './lane-entry.js';
export { entryAt, exists };

// Road users of the merge lessons as plain data: { model, length, s0, speed (m/s), lateral, wrap?, shifts?, signal?, brake? }.
// Position s = s0 + speed * time. `wrap` repeats the entry inside [lo, lo + span). `shifts` move it sideways by `by` over `over` metres from `at`.
const CAR = 4.5, WRAP_LOW = -100;
export const WIDTHS = { car: 2, lorry: 2.5, tram: 2.65, walker: .6, cyclist: .6, moped: .8, van: 2.1 };

// Cars from the rearmost one: car i + 1 sits 4.5 m + gaps[i % n] in front of car i. With `span` the queue
// repeats in whole periods of the pattern, so it never ends and has no seam at the wrap.
export function queue({ speed, lateral, gaps, from, span, count, model = 'car' }) {
  const period = gaps.reduce((sum, gap) => sum + CAR + gap, 0), periods = span ? Math.ceil(span / period) : 0;
  const total = periods * period, size = span ? periods * gaps.length : count ?? gaps.length + 1, cars = [];
  for (let i = 0, s0 = from; i < size; s0 += CAR + gaps[i++ % gaps.length]) {
    cars.push({ model, length: CAR, s0, speed, lateral, ...span && { wrap: { lo: WRAP_LOW, span: total } } });
  }
  return cars;
}
// `near = [s, range]` keeps only the entries within `range` metres of `s`. `time2` is the second clock of lesson 21 (entries with `clock: 2`).
export function laneActors(mission, time = 0, near = null, time2 = null) {
  const route = ROUTES[mission.route], actors = [];
  (mission.lane?.traffic ?? []).forEach((car, index) => {
    const at = car.clock === 2 ? time2 : time;
    if (!exists(car, at)) return;
    const { s, lateral, yaw, speed, lamp, standing } = entryAt(car, at), shift = car.shifts?.at(-1);
    if (near && Math.abs(s - near[0]) > near[1]) return;
    const signal = car.signal && (!shift || s < shift.at + shift.over) ? car.signal : null, turned = yaw + (car.turn ?? 0) + (car.speed < 0 ? Math.PI : 0);
    actors.push({ index, model: car.model, ...offsetPoint(route.at(s), lateral, turned), s, lateral, speed, length: car.length,
      width: WIDTHS[car.model] ?? 2, signal, brake: Boolean(car.brake), merger: Boolean(car.shifts), clock: car.clock ?? 1, lamp, standing, plate: car.plate, door: doorOpen(car, at) });
  });
  return actors;
}
// Merger lessons: every entry is in the target lane. Host lesson: only the entry that shifts into the learner's lane counts.
export const ruleActors = (mission, time, near, time2 = null) => laneActors(mission, time, near, time2).filter(actor => mission.lane.role !== 'host' || actor.merger);
// The actor with the smallest gap to the learner (merger), or the merging driver (host). Used for the halo and the decision camera.
// With `model` only the actors of that model count (the pins of the street scenes).
export function nearestLaneActor(mission, snapshot, model = null) {
  const actors = ruleActors(mission, snapshot.actorTime ?? 0, null, snapshot.time2 ?? null).filter(actor => !model || actor.model === model);
  const distance = actor => Math.abs(actor.s - snapshot.distance) - actor.length / 2;
  return actors.reduce((best, actor) => !best || distance(actor) < distance(best) ? actor : best, null);
}
