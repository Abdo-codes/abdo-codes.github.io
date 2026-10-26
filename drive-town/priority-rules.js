import { lightPhase, sirenBusy, armUp } from './lights-state.js';

// Chapter 06 decisions (amber light, siren, officer). A mistake can only happen when the car centre crosses the gate.
export function lightsDecision(mission, before, after) {
  const entering = before.distance < mission.gate && after.distance >= mission.gate;
  if (entering) {
    const phase = lightPhase(mission, after), t = after.actorTime;
    const reason = mission.kind === 'amber' ? phase === 'red' ? 'red-light' : phase === 'amber' && after.canStop ? 'amber-run' : null
      : mission.kind === 'siren' ? phase !== 'green' ? 'red-light' : sirenBusy(mission, t) ? 'siren-yield' : null
      : armUp(mission, t) ? 'officer-ignored' : null;
    if (reason) return { type: 'mistake', reason };
  }
  return after.distance >= mission.end ? { type: 'success' } : null;
}
