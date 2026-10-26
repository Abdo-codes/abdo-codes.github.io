import { ROUTES, routeFor } from './routes.js';
import { MISSIONS } from './missions.js';
import { lightPhase } from './lesson-state.js';
import { usingHints } from './practice.js';
import { crossingBusy } from './road-users.js';
import { sharingDirection } from './sharing-state.js';
import { roundaboutDirection } from './roundabout-navigation.js';
import { mergeDirection } from './merge-navigation.js';
import { streetDirection } from './street-navigation.js';
import { isLightsMission, lightsDirection } from './lights-navigation.js';

const NO_TURN = { id: 'no-turn', direction: null, start: Infinity, end: Infinity };
export function routeDirection(distance, route = ROUTES.town) {
  const position = route.loop ? ((distance % route.length) + route.length) % route.length : distance;
  const turn = route.turns.find(item => position < item.end) ?? (route.loop ? route.turns[0] : undefined) ?? NO_TURN;
  const turning = position >= turn.start && position < turn.end;
  return { ...turn, turning, distance: turning ? 0 : turn.start - position };
}

export function directionAlert(state, display = null) {
  if (!['driving', 'replay'].includes(state.status)) return null;
  const view = display ?? state, mission = state.mission ?? MISSIONS[state.missionIndex];
  const turn = routeDirection(view.distance, routeFor(mission)), right = state.signal === 'right';
  const gap = mission.gate - view.distance;
  const busy = crossingBusy(state.missionIndex, { ...view, scenario: mission });
  const signal = right ? 'Right indicator on · take it slowly' : 'Use the right indicator';
  const base = { target: turn.id, phase: 'continue', arrow: '↑', title: 'Continue straight',
    distance: Math.ceil(turn.distance), distanceTarget: 'turn', detail: 'Right turn ahead', needsSignal: false, caution: false };
  if (mission.kind === 'merge') return mergeDirection(state, view, busy, base, usingHints(state));
  if (mission.kind === 'street') return streetDirection(state, view, busy, base, usingHints(state));
  if (mission.kind === 'roundabout') return roundaboutDirection(state, view, busy, base, usingHints(state));
  if (!usingHints(state) && mission.id === 'parking') return { ...base, target: 'bakery-bay', phase: 'parking-destination',
    title: 'Bakery parking on your right', arrow: '↱', distance: Math.abs(gap) <= 6 ? null : Math.max(0, Math.ceil(gap)),
    distanceTarget: 'bay', detail: 'Check signs and road users yourself' };
  if (!usingHints(state)) return { ...base, title: turn.turning ? 'Turn right now' : turn.distance <= 20 ? 'Right turn ahead' : base.title,
    phase: turn.turning ? 'turn' : 'observe', arrow: turn.turning || turn.distance <= 20 ? '↱' : '↑', distance: turn.turning ? null : base.distance,
    detail: 'Check signs and road users yourself' };
  if (isLightsMission(mission)) {
    const alert = lightsDirection(state, view, base);
    if (alert) return alert;
  }
  if (['bus', 'narrow', 'rail'].includes(mission.kind)) {
    const alert = sharingDirection(mission, view, busy, base);
    if (alert) return alert;
  }

  if (mission.kind === 'limit') {
    const signGap = mission.changeAt - view.distance;
    return { ...base, target: mission.id, phase: signGap > 0 ? 'limit-ahead' : 'new-limit', arrow: '↓',
      title: signGap > 0 ? '30 ahead — slow before the sign' : '30 maximum from here',
      detail: signGap > 0 ? 'You are on a 50 road · choose Slow or brake' : 'Drive now uses 22 km/h · watch the road',
      distance: signGap > 0 ? Math.ceil(signGap) : null, distanceTarget: 'sign', caution: signGap > 0 && signGap < 12 && view.speed > 30 };
  }
  const atRecordedLine = state.status === 'replay' && gap >= -6;
  if ((gap >= 0 || atRecordedLine) && ['light', 'stop', 'yield'].includes(mission.kind)) {
    const red = mission.kind === 'light' && lightPhase(mission, view) === 'red';
    const needsStop = mission.kind === 'stop' && !view.stoppedAtLine;
    const waiting = red || needsStop || mission.kind !== 'light' && busy;
    const title = mission.kind === 'light' ? red ? 'Red light — stop before the line' : 'Green — check ahead, then continue'
      : needsStop ? 'STOP — come to a complete stop' : waiting ? 'Give way to the crossing car' : 'Crossing road clear — check both ways';
    const detail = mission.kind === 'light' ? red ? 'Wait for green · use Stop before the white line' : 'Keep the junction clear'
      : mission.kind === 'stop' ? view.stoppedAtLine ? 'Full stop recorded · keep checking for traffic' : 'Stop close to the line, then give way'
      : busy ? 'The car from your left has priority' : 'Continue if safe · no automatic full stop required';
    return { ...base, target: mission.id, phase: needsStop ? 'full-stop' : waiting ? 'wait' : 'clear',
      arrow: waiting ? 'Ⅱ' : '↑', title, detail, distance: Math.max(0, Math.ceil(gap)), distanceTarget: mission.kind === 'yield' ? 'junction' : 'line', caution: waiting };
  }

  const crossingAfterTurn = mission.id !== 'zebra' || view.distance >= routeDirection(mission.start, routeFor(mission)).end;
  if (crossingAfterTurn && busy && view.actorTime !== null && gap >= -6 && gap <= (state.missionIndex === 4 ? 6 : 18)) {
    const title = state.missionIndex === 1 ? 'Give way ahead' : state.missionIndex === 3 ? 'Wait for the cyclist' : 'Wait for the pedestrian';
    const detail = state.missionIndex === 1 ? 'Let the car from your right pass'
      : state.missionIndex === 3 ? `Then turn right · ${right ? 'indicator on' : 'use the right indicator'}`
      : state.missionIndex === 4 ? 'Then park on your right' : 'Stop before the zebra crossing';
    return { ...base, target: mission.id, phase: 'wait', arrow: state.missionIndex === 3 ? '↱' : 'Ⅱ',
      title, detail, distance: Math.max(0, Math.ceil(state.missionIndex === 3 ? turn.distance : gap)),
      distanceTarget: state.missionIndex === 3 ? 'turn' : state.missionIndex === 4 ? 'bay' : state.missionIndex === 1 ? 'junction' : 'crossing',
      needsSignal: [3, 4].includes(state.missionIndex) && !right, caution: true };
  }
  if (state.missionIndex === 4) {
    const beside = Math.abs(gap) <= 6;
    const stopped = view.speed <= .4;
    return { ...base, target: 'bakery-bay', phase: beside ? 'park' : 'parking-approach', arrow: '↱',
      title: beside ? stopped ? 'Park on your right' : 'Stop beside the bay' : gap < -6 ? 'You passed the bay' : 'Parking on your right',
      distance: beside || gap < -6 ? null : Math.ceil(gap), distanceTarget: 'bay',
      detail: gap < -6 ? 'Choose Try again to restart this lesson' : beside && stopped ? right ? 'Path clear · select Park' : 'Use the right indicator, then select Park' : signal,
      needsSignal: !right, caution: beside && !stopped || gap < -6 };
  }
  if ([1, 2, 3].includes(state.missionIndex) && view.actorTime !== null && !busy && gap >= 0) {
    return { ...base, target: mission.id, phase: 'clear', arrow: state.missionIndex === 3 ? '↱' : '↑',
      title: 'Crossing clear — check again, then continue', detail: state.missionIndex === 3 ? signal : 'Ease forward when it is safe',
      distance: Math.ceil(gap), distanceTarget: 'crossing', needsSignal: state.missionIndex === 3 && !right };
  }
  if (turn.turning) return { ...base, phase: 'turn', arrow: '↱', title: 'Turn right now', distance: null, detail: signal, needsSignal: !right };
  if (turn.distance <= 20) return { ...base, phase: turn.distance <= 5 ? 'near-turn' : 'prepare',
    arrow: '↱', title: 'Turn right', detail: signal, needsSignal: !right };
  return base;
}
