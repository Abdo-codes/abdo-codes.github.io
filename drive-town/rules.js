import { speedLimit, lightPhase } from './lesson-state.js';
import { railwayState } from './sharing-state.js';
import { evaluateMerge } from './merge-rules.js';
import { evaluateStreet } from './street-rules.js';
import { lightsDecision } from './priority-rules.js';
export function evaluateDecision(mission, before, after, context) {
  if (after.speed > speedLimit(mission, after.distance)) return { type: 'mistake', reason: 'speed' };
  if (mission.kind === 'merge') return evaluateMerge(mission, before, after, context);
  if (mission.kind === 'street') return evaluateStreet(mission, before, after, context);
  if (['amber', 'siren', 'priority'].includes(mission.kind)) return lightsDecision(mission, before, after);
  const entering = before.distance < mission.gate && after.distance >= mission.gate;
  if (entering && mission.kind === 'light' && lightPhase(mission, after) !== 'green') return { type: 'mistake', reason: 'red-light' };
  if (entering && mission.kind === 'rail' && (railwayState(mission, after).red || !railwayState(mission, after).barrierOpen)) return { type: 'mistake', reason: 'railway' };
  if (entering && mission.kind === 'stop' && !after.stoppedAtLine) return { type: 'mistake', reason: 'stop' };
  if (entering && mission.signal === 'right' && !context.rightSignal && !(mission.duration && context.busy)) return { type: 'mistake', reason: 'signal' };
  if (entering && mission.duration && mission.id !== 'parking') {
    if (context.busy && mission.kind !== 'light') return { type: 'mistake', reason: 'yield' };
    if (mission.id === 'cyclist' && !context.rightSignal) return { type: 'mistake', reason: 'signal' };
  }
  if (mission.id === 'parking') {
    if (after.distance > mission.gate + 6) return { type: 'mistake', reason: 'bay' };
    if (context.parkingRequested) {
      if (Math.abs(after.distance - mission.gate) > 6) return { type: 'hint', message: 'Drive closer to the bakery bay first.' };
      if (after.speed > 0.4) return { type: 'hint', message: 'Come to a full stop before parking.' };
      if (context.busy) return { type: 'mistake', reason: 'yield' };
      if (!context.rightSignal) return { type: 'mistake', reason: 'signal' };
      return { type: 'success' };
    }
    return null;
  }
  if (after.distance >= mission.end) return { type: 'success' };
  return null;
}
