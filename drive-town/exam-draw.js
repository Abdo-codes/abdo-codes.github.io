import { TOPICS } from './exam/topics.js';
import { DRILL_SIZE, MAX_SAME_TYPE_RUN } from './exam-config.js';

// Draws the items of one exam. Pure: `random` returns a number in [0, 1). `seen` is the item store of the weak data:
// { id: { seen, wrong, last } }. `scenes` maps a scene id to { cluster } (optional). The draw never borrows from another topic.
const stat = (seen, id) => seen[id] ?? { seen: 0, wrong: 0, last: 0 };
const clusterOf = (item, scenes) => item.cluster ?? scenes[item.scene]?.cluster ?? item.scene ?? item.id;

function shuffle(list, random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
// Coverage rank: never seen first, then least recently seen, ties by random.
const coverage = (items, seen, random) => shuffle(items, random).sort((a, b) => stat(seen, a.id).seen - stat(seen, b.id).seen || stat(seen, a.id).last - stat(seen, b.id).last);
// Drill rank: wrong-first, `seen - 2 * wrong + random()`.
const wrongFirst = (items, seen, random) => items.map(item => ({ item, key: stat(seen, item.id).seen - 2 * stat(seen, item.id).wrong + random() })).sort((a, b) => a.key - b.key).map(x => x.item);

// Takes up to `count` items in rank order. A scene or a cluster is used once.
function take(ranked, count, used, scenes) {
  const out = [];
  for (const item of ranked) {
    if (out.length >= count) break;
    const cluster = clusterOf(item, scenes);
    if (used.clusters.has(cluster) || (item.scene && used.scenes.has(item.scene))) continue;
    used.clusters.add(cluster); if (item.scene) used.scenes.add(item.scene); out.push(item);
  }
  return out;
}

// Order: no two scene items side by side and no more than three items of one type in a row, where that is possible.
// `fits` says if an item may follow `last` after a run of `run` items of its type. `ranked` lists the allowed items, the most urgent first.
const runOf = out => { const last = out.at(-1); let run = 0; while (last && out.at(-1 - run)?.type === last.type) run++; return run; };
function ranked(rest, out) {
  const last = out.at(-1), counts = {};
  const sameRun = runOf(out) >= MAX_SAME_TYPE_RUN;
  for (const item of rest) counts[item.type] = (counts[item.type] ?? 0) + 1;
  // A type is urgent when only placing it now keeps its items from ending in one long run.
  const urgent = Object.keys(counts).filter(type => counts[type] > MAX_SAME_TYPE_RUN * (rest.length - counts[type]));
  const scenes = rest.filter(item => item.scene).length, sceneUrgent = !last?.scene && scenes > rest.length - scenes;
  const allowed = rest.filter(item => !(last?.scene && item.scene) && !(sameRun && item.type === last.type));
  const rules = [item => !urgent.length || urgent.includes(item.type), item => !sceneUrgent || item.scene];
  let best = allowed;
  for (const rule of rules) if (best.some(rule)) best = best.filter(rule);
  return [...best, ...allowed.filter(item => !best.includes(item))];
}
// The greedy order can end in a run of four. A short search with back-tracking finds an order with no run when one exists.
export function arrange(items, random) {
  const start = shuffle(items, random), rest = start.slice(), out = [];
  let budget = 5000;
  function place() {
    if (!rest.length) return true;
    if (budget-- <= 0) return false;
    for (const item of ranked(rest, out)) {
      const at = rest.indexOf(item); rest.splice(at, 1); out.push(item);
      if (place()) return true;
      out.pop(); rest.splice(at, 0, item);
    }
    return false;
  }
  if (place()) return out;
  const fallback = start.slice(), result = [];
  while (fallback.length) { const options = ranked(fallback, result); result.push(fallback.splice(fallback.indexOf(options[0] ?? fallback[0]), 1)[0]); }
  return result;
}

// The mock exam draw: scene items first (fewest clusters first), then text items per topic.
export function drawExam(bank, { random = Math.random, seen = {}, scenes = {}, withScenes = true, topics = TOPICS } = {}) {
  const used = { clusters: new Set(), scenes: new Set() }, chosen = [];
  const pool = topic => bank.filter(item => item.topic === topic.id);
  const withScene = topic => pool(topic).filter(item => item.scene);
  if (withScenes) {
    const order = topics.filter(topic => topic.animQuota).sort((a, b) =>
      new Set(withScene(a).map(item => clusterOf(item, scenes))).size - new Set(withScene(b).map(item => clusterOf(item, scenes))).size);
    for (const topic of order) chosen.push(...take(coverage(withScene(topic), seen, random), topic.animQuota, used, scenes));
  }
  for (const topic of topics) {
    const have = chosen.filter(item => item.topic === topic.id).length;
    chosen.push(...take(coverage(pool(topic).filter(item => !item.scene), seen, random), topic.quota - have, used, scenes));
  }
  return arrange(chosen, random);
}

// Weak-topic drill and "Redo my mistakes": wrong-first, scenes allowed, no quota.
export function drawDrill(bank, { topic = null, ids = null, size = DRILL_SIZE, random = Math.random, seen = {}, scenes = {} } = {}) {
  const pool = bank.filter(item => (topic ? item.topic === topic : true) && (ids ? ids.includes(item.id) : true));
  if (ids) return arrange(pool, random);
  return arrange(take(wrongFirst(pool, seen, random), size, { clusters: new Set(), scenes: new Set() }, scenes), random);
}

// How many drawn items the player has not seen before.
export const freshCount = (items, seen) => items.filter(item => !stat(seen, item.id).seen).length;
