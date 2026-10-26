import { usingHints } from './practice.js';
import { streetHint } from './street-hint.js';
import { streetSuccess } from './street-success.js';
import { MARGIN, REAR } from './overtake-gap.js';

// Feedback strings of the street lessons (pure). They name the number that failed and never print one that did not fail.
// A (D) point says "design choice" or "habit". The words "hinder" and "headway" are not used (street-copy test).
const NAMES = { walker: 'passenger', tram: 'tram', cyclist: 'cyclist', moped: 'rider', van: 'van', car: 'car' };
const BODY = {
  passengers: ['Give the passengers time', 'The doors were open and people were on the road. You drove on. Stop and let them reach the pavement (Article 52). Go on when they have left the road.'],
  'tram-way': ['The tram goes first', 'A tram has priority at a junction, also from the left (Article 15 paragraph 2 part b). Stop at the line. Go on when the tram has gone.'],
  oncoming: ['Wait for a free road', `An oncoming car came too close while you were on the other side. Article 19 says to stop within the free distance that you can see, and an oncoming car takes that distance. This game keeps ${MARGIN} m free. This is a design choice.`],
  'cut-in': ['Move back with room', `You moved back too soon after the cyclist. This game asks for ${REAR} m between your rear bumper and the cyclist. This is a habit, not a rule of the law.`],
  'overtake-zebra': ['No overtaking at a zebra crossing', 'You were on the other side of the road near a zebra crossing. Do not overtake just before or on a pedestrian crossing (Article 12). Wait until you are past it.'],
  'solid-line': ['A solid line stays closed', 'You crossed a solid line between lanes. Do not cross it (Article 76 paragraph 1). Stay behind the cyclist until the line is broken.'],
  'no-return': ['Move back before the road ends', 'You stayed on the other side of the road. The practice road ends here. Move back as soon as you are clear of the cyclist. This is a lesson limit.'],
};
// What the amber ring marks in the review: the road user of the mistake.
export const streetActorName = state => state.result?.reason === 'passengers' ? 'passenger' : state.result?.reason === 'tram-way' ? 'tram'
  : state.result?.reason === 'oncoming' ? 'oncoming car' : state.result?.reason === 'cut-in' ? 'cyclist' : NAMES[state.result?.measure?.other] ?? 'road user';
// The label on the review card: a law reference, or the kind of rule that is not a law.
export const reasonLabel = reason => reason === 'cut-in' ? 'Safe-driving habit' : reason === 'no-return' ? 'Drive Town rule' : reason === 'oncoming' ? 'Rule and Drive Town margin' : reason === 'collision' ? 'Safety' : 'Rule';
export function streetFeedback(state) {
  const reason = state.result?.reason, mission = state.mission, other = NAMES[state.result?.measure?.other] ?? 'road user';
  if (reason === 'signal') return { title: 'Signal before you move out', body: `Switch on the ${mission.signal} indicator before you choose Overtake (Article 55). Do it in good time, not at the same moment.` };
  if (reason === 'collision') return { title: 'You touched a road user', body: `Your car touched the ${other}. Slow down early and keep clear of people, riders and trams.` };
  if (reason === 'speed') return { title: 'A little too fast.', body: `You went above the ${mission.speedLimit} km/h maximum (Article 62 / sign A1). Slow down and keep to the speed of the road.` };
  const [title, body] = BODY[reason] ?? ['Try that again', 'Look at the road ahead before you move.'];
  return { title, body };
}
const one = value => value.toFixed(1), whole = value => Math.round(value);
// Names the failed measure and its number.
export function streetEvidence(state) {
  const evidence = state.failureSnapshot, result = state.result, measure = result?.measure;
  if (!evidence) return '';
  const speed = `Recorded: ${one(evidence.speed)} km/h`;
  if (result?.reason === 'passengers') return `${speed} · doors open · people on the road`;
  if (result?.reason === 'tram-way') return result.cause === 'overlap' ? 'Your car was in the path of the tram.' : `${speed} · the tram was still crossing`;
  if (result?.reason === 'oncoming') {
    const press = measure?.press;
    if (result.cause === 'overlap') return 'Your car and the oncoming car met on the road.';
    return `Gap to the oncoming car: ${whole(measure.gap)} m. This game keeps ${MARGIN} m.${press?.gap != null && press.need != null ? ` At the press it was ${whole(press.gap)} m. This game needed ${whole(press.need)} m at your speed.` : ''}`;
  }
  if (result?.reason === 'cut-in') return `Room behind the cyclist: ${one(Math.max(0, measure.past))} m. This game asks for ${REAR} m.`;
  if (result?.reason === 'overtake-zebra') return `${speed} · over the line at a zebra crossing`;
  if (result?.reason === 'solid-line') return `${speed} · over a solid line`;
  if (result?.reason === 'no-return') return `${speed} · still on the other side at the end of the road`;
  if (result?.reason === 'signal') return `${speed} · indicator ${evidence.signal ?? 'off'}`;
  if (result?.reason === 'collision') return `${speed} · touched the ${NAMES[measure?.other] ?? 'road user'}`;
  return result?.reason === 'speed' ? `${speed} · maximum ${state.mission.speedLimit} km/h` : speed;
}
// The coach line: the lesson text, the hint of the guided mode, or the feedback after a mistake.
export function streetCoach(state) {
  const mission = state.mission;
  if (['review', 'replay'].includes(state.status)) return streetFeedback(state).body;
  if (['success', 'complete'].includes(state.status)) return streetSuccess(state);
  if (state.status === 'question') return 'You made the driving decision. Now check the rule before we mark this mission as practised.';
  if (!usingHints(state)) return 'Read the road and the other road users. Make your own decision. A hint is available if you need one.';
  const view = state.snapshot();
  return ['driving', 'paused'].includes(state.status) && streetHint(mission, view) || mission.coach;
}
