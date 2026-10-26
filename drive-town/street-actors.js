import { actorsAt, byModel } from './street-state.js';

// The road user that a mistake is about: the halo and the decision camera frame it. Used for the reasons in CONFLICT_REASONS (road-users.js).
const MODELS = { passengers: ['walker'], 'tram-way': ['tram'], oncoming: ['car'], 'cut-in': ['cyclist'], collision: null };
export function nearestStreetActor(mission, snapshot, reason) {
  const models = MODELS[reason] ?? null, all = actorsAt(mission, snapshot, 120), pool = models ? byModel(all, ...models) : all;
  const distance = actor => Math.abs(actor.s - snapshot.distance) - actor.length / 2;
  const pick = (list, filter) => list.filter(filter).reduce((best, actor) => !best || distance(actor) < distance(best) ? actor : best, null);
  if (reason === 'tram-way') return pick(pool, actor => actor.clock === 2) ?? pick(pool, () => true);
  if (reason === 'oncoming') return pick(pool, actor => actor.speed < 0) ?? pick(pool, () => true);
  return pick(pool, () => true);
}
