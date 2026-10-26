import { actorProgress } from './actor-paths.js';

// Chapter 06 state as pure functions of a mission and the road-user clock `t` (seconds, null before the clock starts).
// Stop need: 1 s reaction, 5 m/s² braking, 8 m margin. A design model of the game, not a number from the law.
export const stopNeed = kmh => { const v = kmh / 3.6; return v + v * v / 10 + 8; };
export const SIREN_LEAD = 4; // seconds the siren is heard before the ambulance appears
export function lightPhase(m, s) {
  const t = s.actorTime, ph = m.phases;
  if (!ph) return t !== null && t >= m.duration ? 'green' : 'red'; // lesson 6: red until the road user has gone
  return t === null || t < 0 ? m.before ?? 'green' : ph.find(([a, b]) => t >= a && t < b)?.[2] ?? 'green';
}
export const sirenOn = (m, t) => t !== null && t >= -SIREN_LEAD && actorProgress(m, Math.max(t, 0)) < 1;
export const sirenBusy = (m, t) => sirenOn(m, t) && actorProgress(m, Math.max(t, 0)) < m.actor.clearAt;
export const armUp = (m, t) => Boolean(m.arm) && t !== null && t >= m.arm[0] && t < m.arm[1];
