import { lightPhase, sirenOn, sirenBusy, armUp, stopNeed } from './lights-state.js';
import { routeAt } from './route.js';
import { actorContext, actorIndexFor } from './road-users.js';

// Prompts, coach lines, evidence and the decision view of chapter 06 (amber light, siren, officer). All pure.
export const LIGHTS_KINDS = ['amber', 'siren', 'priority'];
export const isLightsMission = mission => LIGHTS_KINDS.includes(mission?.kind);
const LIGHT_NAME = { green: 'green', amber: 'amber', red: 'red' };
// The side the siren comes from. The red-hold variant has the ambulance behind you in the oncoming lane.
export const sirenSide = mission => mission.actor.path.type === 'route-offset' ? 'behind' : mission.flip ? 'right' : 'left';
const sirenTitle = mission => { const side = sirenSide(mission); return side === 'behind' ? 'Siren behind you' : `Siren on your ${side}`; };

// What a driver sees or hears. It gives no advice, so it shows in both practice modes.
export function lampText(mission, view) { return `Light: ${LIGHT_NAME[lightPhase(mission, view)]}`; }
export function sirenCue(state, view) {
  const mission = state.mission;
  if (mission.kind !== 'siren' || !['driving', 'replay'].includes(state.status) || !sirenOn(mission, view.actorTime)) return null;
  const side = sirenSide(mission), passed = !sirenBusy(mission, view.actorTime);
  return { side, passed, text: passed ? 'The ambulance has passed' : sirenTitle(mission) };
}

// The officer shows stop: a line for the HUD, because on a phone the prompt card can hide the label above the officer.
export function officerCue(state, view) {
  const mission = state.mission;
  if (mission.kind !== 'priority' || !['driving', 'replay'].includes(state.status) || !armUp(mission, view.actorTime)) return null;
  return { side: 'ahead', passed: false, kind: 'officer', text: 'The officer shows stop' };
}
export const lightsCue = (state, view) => sirenCue(state, view) ?? officerCue(state, view);

// The navigation card of the hint layer. It returns null when nothing special happens, so the normal prompt shows.
export function lightsDirection(state, view, base) {
  const m = state.mission, t = view.actorTime, gap = m.gate - view.distance, phase = lightPhase(m, view);
  if (gap < 0) return null;
  const card = fields => ({ ...base, target: m.id, distance: Math.ceil(gap), distanceTarget: 'line', needsSignal: false, ...fields });
  if (phase === 'red') return card({ phase: 'wait', arrow: 'Ⅱ', title: 'Red light — stop before the line', detail: 'Wait for green · use Stop before the white line', caution: true });
  if (m.kind === 'amber' && phase === 'amber') return view.canStop
    ? card({ phase: 'wait', arrow: 'Ⅱ', title: 'Amber — stop before the line', detail: 'You can stop in a safe way · Slow, then Stop', caution: true })
    : card({ phase: 'go-on', arrow: '↑', title: 'Amber — too close to stop', detail: 'Keep your speed and drive on', caution: false });
  if (m.kind === 'siren' && sirenBusy(m, t)) return card({ phase: 'wait', arrow: 'Ⅱ', title: sirenTitle(m), detail: 'Slow, then Stop before the line', caution: true });
  if (m.kind === 'siren' && sirenOn(m, t)) return card({ phase: 'clear', arrow: '↑', title: 'The ambulance has passed', detail: 'Check the junction, then go on', caution: false });
  if (m.kind === 'priority' && armUp(m, t)) return card({ phase: 'wait', arrow: 'Ⅱ', title: 'The officer shows stop', detail: 'The officer ranks above the green light · stop before the line', caution: true });
  return null;
}

// One coach line in the hint layer, or null for the normal line.
export function lightsCoach(state) {
  const m = state.mission, t = state.actorTime, gap = m.gate - state.distance, phase = lightPhase(m, state);
  if (m.kind === 'amber') {
    if (gap < 0) return 'You are past the line. Check the junction and drive on.';
    return phase === 'red' ? 'Red. Wait before the line until the light is green.'
      : phase === 'amber' ? state.canStop ? 'Amber. You can stop in a safe way. Use Slow, then Stop before the line.'
        : 'Amber. You are too close to stop in a safe way. Keep your speed and drive on.'
      : 'The light is green. Watch the lamp. It will turn amber.';
  }
  if (m.kind === 'siren') {
    if (phase === 'red' && gap >= 0) return 'The light is red. Stay behind the line, also when an ambulance passes you.';
    if (sirenBusy(m, t)) return `${sirenTitle(m)}. An ambulance comes. Use Slow, then Stop before the line. Let it pass.`;
    return 'The ambulance has passed. Check the junction, then go on.';
  }
  if (t === null) return 'An officer stands ahead. Watch the officer and the light.';
  if (armUp(m, t)) return 'The officer shows stop. The light is green. The officer ranks first. Stop before the line.';
  return m.arm ? 'The officer shows no stop now. Check the road, then go on.'
    : 'The officer stands at the kerb and gives no instruction. The light is green. Check the junction, then go on.';
}

// "Recorded: ..." line of the review card. It names only the fact that failed: a speed fault shows the limit, an amber run shows the numbers of the stop model.
export function lightsEvidence(state) {
  const e = state.failureSnapshot, m = state.mission, reason = state.result?.reason;
  if (!e) return '';
  if (reason === 'speed') return `Recorded: ${e.speed.toFixed(1)} km/h · maximum ${e.limit ?? m.speedLimit} km/h`;
  const gap = e.lineGap, place = Math.abs(gap) < .1 ? 'at the decision line' : `${Math.abs(gap).toFixed(1)} m ${gap > 0 ? 'before' : 'past'} the decision line`;
  const phase = lightPhase(m, e), light = `light ${LIGHT_NAME[phase]}`;
  const more = reason === 'amber-run' && e.canStop ? ` · stop possible: the gap at the amber was ${Math.round(e.onsetGap)} m and a stop at ${Math.round(e.onsetSpeed ?? e.speed)} km/h needs about ${Math.round(stopNeed(e.onsetSpeed ?? e.speed))} m (Drive Town value)`
    : reason === 'siren-yield' ? ' · ambulance still coming'
    : reason === 'officer-ignored' && armUp(m, e.actorTime) ? ' · officer showing stop' : '';
  return `Recorded: ${e.speed.toFixed(1)} km/h · ${place} · ${light}${more}`;
}

// The point the decision view fits: the lamp pole for a light mistake, the ambulance or the officer for a conflict.
export function decisionActor(state, view) {
  const m = state.mission, reason = state.result?.reason;
  if (['amber-run', 'red-light'].includes(reason)) {
    const p = routeAt(m.gate + 2.25); return { x: p.x - p.dz * 3.6, z: p.z + p.dx * 3.6 };
  }
  if (['siren-yield', 'officer-ignored'].includes(reason)) return actorContext(actorIndexFor(state.missionIndex), view, state.missionIndex).point;
  return null;
}

// What the siren sound needs while a siren lesson drives: the distance to the ambulance and the side it comes from. Null when it is silent.
export function sirenLevel(state, view, player) {
  const m = state.mission;
  if (m.kind !== 'siren' || state.status !== 'driving' || !sirenOn(m, view.actorTime)) return null;
  const a = actorContext(actorIndexFor(state.missionIndex), view, state.missionIndex).point;
  return { distance: Math.hypot(a.x - player.x, a.z - player.z), side: sirenSide(m) };
}
