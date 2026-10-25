// Draws and orders the clips of one hazard test from the clip pool, so each run differs like an exam.
// `random` returns a number in [0, 1); tests pass a seeded one.
export const TEST_SIZE = 25;

// A pool larger than `size` gives one clip per topic before any topic repeats. Each pick takes, from
// all topics left in the round, a clip whose answer has been chosen least so far (ties are random).
function pick(pool, size, random) {
  if (pool.length <= size) return pool.slice();
  const byTopic = new Map(), counts = {}, chosen = [];
  for (const clip of pool) { counts[clip.answer] = 0; byTopic.set(clip.topic, [...(byTopic.get(clip.topic) ?? []), clip]); }
  while (chosen.length < size) {
    const round = new Set(byTopic.keys());
    while (round.size && chosen.length < size) {
      const open = [...round].flatMap(topic => byTopic.get(topic)), least = Math.min(...open.map(clip => counts[clip.answer]));
      const options = open.filter(clip => counts[clip.answer] === least), clip = options[Math.floor(random() * options.length)];
      chosen.push(clip); counts[clip.answer]++; round.delete(clip.topic);
      const clips = byTopic.get(clip.topic); clips.splice(clips.indexOf(clip), 1);
      if (!clips.length) byTopic.delete(clip.topic);
    }
  }
  return chosen;
}

// Random order with no two clips of one mission in a row where that is possible: a mission that
// would hold more than half of the places left must go next.
function order(clips, random) {
  const rest = clips.slice(), out = [];
  while (rest.length) {
    const prev = out.at(-1)?.mission, counts = {};
    for (const clip of rest) counts[clip.mission] = (counts[clip.mission] ?? 0) + 1;
    const forced = Object.keys(counts).filter(mission => counts[mission] * 2 > rest.length);
    let options = rest.filter(clip => clip.mission !== prev && (!forced.length || forced.includes(clip.mission)));
    if (!options.length) options = rest.filter(clip => clip.mission !== prev);
    if (!options.length) options = rest;
    const clip = options[Math.floor(random() * options.length)];
    rest.splice(rest.indexOf(clip), 1); out.push(clip);
  }
  return out;
}

export const drawClips = (pool, random = Math.random, size = TEST_SIZE) => order(pick(pool, size, random), random);
