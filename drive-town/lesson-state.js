export function speedLimit(mission, distance) {
  return mission.kind === 'limit' && distance >= mission.changeAt ? mission.nextLimit : mission.speedLimit ?? 30;
}
export const driveTarget = (mission, distance) => mission.driveSpeed ?? (speedLimit(mission, distance) <= 30 ? 22 : 40);
export { lightPhase, stopNeed, SIREN_LEAD, sirenOn, sirenBusy, armUp } from './lights-state.js';
export const besideStopLine = (mission, snapshot) => snapshot.distance >= mission.gate - 6 && snapshot.distance <= mission.gate - .15;
