import { usingHints } from './practice.js';
import { pickNotes } from './merge-notes.js';
import { isLaneKind } from './lane-kind.js';

// Feedback strings of the merge lessons (pure). `attempt-feedback.js` and `lesson-ui.js` call these first for kind 'merge'.
const BODY = {
  yield: ['Let other traffic go first', 'You changed lane. The driver who changes lane lets other traffic go first (Article 54). This game uses a gap of at least one second. The law gives no number (Article 54).'],
  hatched: ['Do not drive on the hatched area', 'Your lane ended and you were still in it. The hatched area is not a lane (Article 77). Merge at the last safe gap before the hatched area. If no gap is open, slow down and wait before it.'],
  'lane-end': ['The acceleration lane ended', 'The lane has an end (Article 1). The driver who merges lets other traffic go first (Article 54). To merge before the lane ends is a safe-driving habit from the CBR driving procedure (3.4), not an article. Look for a gap early. If no gap is open, slow down and drive behind a car.'],
  hinder: ['Leave room for a merging driver', 'The merging driver had too little gap. A careful driver slows down early to make room. This is a safe-driving habit from the CBR driving procedure, not a rule of the law. The merging driver must still let you go first (Article 54).'],
  speed: ['A little too fast.', 'You went above the 60 km/h maximum (Article 62 / sign A1). Slow down and keep to the speed of the traffic around you.'],
};
// The label on the review card: a law reference, the habit label for `hinder`, or both for `lane-end` (Article 54 and the habit of merging early).
export const reasonLabel = reason => reason === 'hinder' ? 'Safe-driving habit' : reason === 'lane-end' ? 'Rule and safe-driving habit' : 'Rule';
export function mergeFeedback(state) {
  const reason = state.result?.reason;
  if (reason === 'signal') return { title: 'Signal before you move over',
    body: `Switch on the ${state.mission.signal} indicator before you choose Merge (Article 55). Do it in good time, not at the same moment.` };
  const [title, body] = BODY[reason] ?? ['Try that again', 'Check the gap, signal and merge while the lane lasts.'];
  return { title, body };
}

const SIDE = measure => measure.ahead ? 'ahead' : 'behind', one = value => value.toFixed(1);
const OF_YOU = measure => measure.ahead ? 'ahead of you' : 'behind you';
// Names the failed measure and its number. It never prints a measure that did not fail.
export function mergeEvidence(state) {
  const evidence = state.failureSnapshot, result = state.result, measure = result?.measure;
  if (!evidence) return '';
  const speed = `Recorded: ${one(evidence.speed)} km/h`, lane = state.mission.lane;
  if (measure && result.cause === 'overlap') return 'The two vehicles overlapped. There was no gap.';
  if (measure && result.cause === 'gap-now' && lane.role === 'host') return `Gap when the lorry or car moved over: ${one(measure.headway)} s ${OF_YOU(measure)}. This game needs 1.0 s.`;
  if (measure && result.cause === 'gap-now') return `Gap at the move: ${one(measure.headway)} s ${SIDE(measure)}. This game needs 1.0 s.`;
  if (measure && result.cause === 'gap-soon') return `Gap in 2 s: ${one(measure.projected)} s. The vehicle ${SIDE(measure)} closed in at ${Math.round(measure.closing)} km/h. This game needs 0.5 s.`;
  if (measure && result.cause === 'catch-up') return `After the move the vehicle ${SIDE(measure)} caught up. Your speed: ${Math.round(measure.playerKmh)} km/h. Its speed: ${Math.round(measure.otherKmh)} km/h.`;
  if (result?.reason === 'hatched') return `${speed} · ${one(Math.max(0, evidence.distance - lane.hatch[0]))} m past the start of the hatched area`;
  if (result?.reason === 'lane-end') return `${speed} · ${one(Math.max(0, evidence.distance - lane.narrow[0]))} m after the lane started to end`;
  if (result?.reason === 'signal') return `${speed} · indicator ${evidence.signal ?? 'off'}`;
  return `${speed} · maximum 60 km/h`;
}
// The coach line of the merge lessons: the lesson text, or the feedback after a mistake.
export function mergeCoach(state) {
  const mission = state.mission;
  if (['review', 'replay'].includes(state.status)) return mergeFeedback(state).body;
  if (['success', 'complete'].includes(state.status)) return mission.success;
  if (state.status === 'question') return 'You made the driving decision. Now check the rule before we mark this mission as practised.';
  if (!usingHints(state)) return 'Read the road and the other lane. Make your own decision. A hint is available if you need one.';
  return mission.coach;
}
// Up to two coaching notes under the success text. They are advice only; they never change the result.
export const notesHtml = state => !isLaneKind(state.mission) ? '' : pickNotes(state.notes ?? [], state.mission, state.merge)
  .map(note => `<p class="coaching-note" data-note="${note.id}">${note.text}</p>`).join('');
