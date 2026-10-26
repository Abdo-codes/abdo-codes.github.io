import { FEEDBACK } from './missions.js';
import { speedLimit } from './lesson-state.js';
import { routeDirection } from './navigation.js';
import { routeFor } from './routes.js';
import { railwayState } from './sharing-state.js';
import { mergeFeedback, mergeEvidence } from './merge-feedback.js';
import { isLightsMission, lightsEvidence } from './lights-navigation.js';
import { streetFeedback, streetEvidence } from './street-feedback.js';

export function recordFailure(state) {
  const snapshot = state.snapshot(), mission = state.mission;
  const line = mission.kind === 'limit' ? mission.changeAt : mission.gate;
  const stopGap = state.lastStopDistance == null ? null : mission.gate - state.lastStopDistance;
  const stopCause = stopGap !== null && stopGap > 6 ? 'too-early' : stopGap !== null && stopGap < .15 ? 'too-late' : 'rolling';
  return { ...snapshot, limit: speedLimit(mission, snapshot.distance), lineGap: line - snapshot.distance,
    stopGap, stopCause, occupied: state.busy, rightSignal: state.signal === 'right' };
}
export function feedbackFor(state) {
  if (state.mission.kind === 'merge') return mergeFeedback(state);
  if (state.mission.kind === 'street') return streetFeedback(state);
  const reason = state.result?.reason, evidence = state.failureSnapshot;
  if (reason === 'speed') return { title: 'A little too fast.',
    body: `You exceeded the ${evidence?.limit ?? speedLimit(state.mission, state.distance)} km/h maximum. Slow before the sign or hazard, then check your speed.` };
  if (reason === 'stop' && evidence) {
    if (evidence.stopCause === 'too-early') return { title: 'Your stop was too far back.',
      body: `Your last full stop was ${evidence.stopGap.toFixed(1)} m before the line. You then crossed without stopping at the line. Approach slowly and stop again before crossing.` };
    if (evidence.stopCause === 'too-late') return { title: 'You stopped after the line.',
      body: 'Your car crossed the line before a valid full stop was recorded. Brake earlier and reach zero before the white line.' };
    return { title: 'You crossed without a full stop.',
      body: `The recorded decision shows ${evidence.speed.toFixed(1)} km/h as you crossed the line. A rolling approach does not fulfil STOP. Reach zero before crossing, then give way.` };
  }
  if (reason === 'yield' && evidence && ['zebra', 'parking'].includes(state.mission.id)) return { ...FEEDBACK.yield,
    body: `You entered the ${state.mission.id === 'parking' ? 'bay entrance' : 'crossing'} before the pedestrian had cleared it. Wait for anyone crossing or clearly about to cross, then check again.` };
  if (reason === 'yield' && evidence && state.mission.id === 'cyclist') return { ...FEEDBACK.yield,
    body: 'You reached the turn approach while the cyclist was still passing beside you. Let them continue straight before you turn.' };
  if (reason === 'railway') return { title: 'Red still means wait.', body: 'You entered while the railway red lights were active. Wait before the barrier until red is off and it is fully open, then check that you can clear the tracks.' };
  if (reason === 'yield' && state.mission.kind === 'bus') return { title: 'Make room for the bus.', body: 'You reached the departure path before the signalling bus had pulled away. Inside this built-up area, give it room to leave its stop before following.' };
  if (reason === 'yield' && state.mission.kind === 'narrow') return { title: 'The oncoming car goes first.', body: 'F5 gives oncoming traffic priority. You entered before the oncoming car cleared the narrow passage. Wait before the narrowing, then check again.' };
  if (reason === 'yield' && evidence) return { ...FEEDBACK.yield,
    body: `You entered the occupied ${state.mission.id === 'parking' ? 'bay entrance' : 'crossing path'} before the ${state.mission.actor?.name ?? (state.mission.id === 'cyclist' ? 'cyclist' : state.mission.id === 'zebra' || state.mission.id === 'parking' ? 'pedestrian' : 'crossing car')} cleared. Wait before entering and check again.` };
  return FEEDBACK[reason];
}
export function evidenceText(state) {
  if (state.mission.kind === 'merge') return mergeEvidence(state);
  if (state.mission.kind === 'street') return streetEvidence(state);
  if (isLightsMission(state.mission) && state.failureSnapshot) return lightsEvidence(state);
  const evidence = state.failureSnapshot;
  if (!evidence) return '';
  if (state.mission.id === 'cyclist' && state.result?.reason === 'yield') {
    const turn = routeDirection(evidence.distance, routeFor(state.mission));
    const position = turn.turning ? 'at the right turn' : `${turn.distance.toFixed(1)} m before the right turn`;
    return `Recorded: ${evidence.speed.toFixed(1)} km/h · ${position} · cyclist still passing`;
  }
  const gap = evidence.lineGap, position = Math.abs(gap) < .1 ? 'at the decision line'
    : `${Math.abs(gap).toFixed(1)} m ${gap > 0 ? 'before' : 'past'} the ${state.mission.kind === 'limit' ? 'sign' : 'decision line'}`;
  const crossing = ['zebra', 'parking'].includes(state.mission.id) ? 'pedestrian crossing not clear'
    : state.mission.kind === 'bus' ? 'bus departing' : state.mission.kind === 'narrow' ? 'oncoming passage occupied' : 'path occupied';
  const railway = state.mission.kind === 'rail' && state.result?.reason === 'railway' ? railwayState(state.mission, evidence) : null;
  const signals = railway ? ` · railway red ${railway.red ? 'active' : 'off'} · barrier ${railway.barrierOpen ? 'open' : 'not fully open'}` : '';
  return `Recorded: ${evidence.speed.toFixed(1)} km/h · ${position}${evidence.occupied && state.result?.reason === 'yield' ? ` · ${crossing}` : ''}${signals}`;
}
