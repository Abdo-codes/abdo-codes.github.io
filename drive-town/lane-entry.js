import { clamp, smooth } from './lane-change.js';

// The path of one road user as plain data (see lane-traffic.js). The chapter 05 fields: s0, speed (m/s), lateral, wrap, shifts.
// Chapter 07 adds: speed < 0 (oncoming), stop { at, decel, wait, accel, doors } (cruise, stop at `at`, stand, leave),
// drift { t0, t1, to } (lateral moves linearly to `to`), turn (extra heading), appear / vanish (the entry exists only in that span), clock 2 (reads `time2`).
const mod = (value, size) => ((value % size) + size) % size;
// Door lamp of a standing vehicle: green while the doors are open, amber while they close (DOOR_* in seconds after the stop).
export const DOOR_OPEN = 1, DOOR_WARN = 5.25, DOOR_SHUT = 6.25;
export function stopTimes(car) {
  const { s0, speed: v, stop } = car, brakeAt = (stop.at - s0 - v * v / (2 * stop.decel)) / v, arrive = brakeAt + v / stop.decel;
  return { brakeAt, arrive, depart: arrive + stop.wait };
}
// { s, v, standing, lamp } of a stopping vehicle at `time`. lamp is 'green', 'amber' or 'off'.
export function stopState(car, time) {
  const { speed: v, s0, stop } = car, { brakeAt, arrive, depart } = stopTimes(car);
  if (time < brakeAt) return { s: s0 + v * time, v, standing: false, lamp: 'off' };
  if (time < arrive) { const u = time - brakeAt; return { s: s0 + v * brakeAt + v * u - stop.decel * u * u / 2, v: v - stop.decel * u, standing: false, lamp: 'off' }; }
  if (time < depart) {
    const u = time - arrive, lamp = !stop.doors ? 'off' : u < DOOR_OPEN ? 'off' : u < DOOR_WARN ? 'green' : u < DOOR_SHUT ? 'amber' : 'off';
    return { s: stop.at, v: 0, standing: true, lamp };
  }
  const u = time - depart, ramp = v / stop.accel;
  return u < ramp ? { s: stop.at + stop.accel * u * u / 2, v: stop.accel * u, standing: false, lamp: 'off' }
    : { s: stop.at + v * v / (2 * stop.accel) + v * (u - ramp), v, standing: false, lamp: 'off' };
}
// How far the doors of a stopping vehicle are open: 0 closed, 1 open. They open just before the lamp turns green and close while it is amber (drawing only).
export function doorOpen(car, time) {
  if (!car.stop?.doors) return 0;
  const u = time - stopTimes(car).arrive;
  return clamp((u - .2) / (DOOR_OPEN - .2)) * (1 - clamp((u - DOOR_WARN) / (DOOR_SHUT - DOOR_WARN)));
}
export const exists = (car, time) => time !== null && time !== undefined && (car.appear === undefined || time >= car.appear) && (car.vanish === undefined || time < car.vanish);
export function entryAt(car, time) {
  let s = car.s0 + car.speed * time, lateral = car.lateral, slope = 0, speed = car.speed, standing = false, lamp = 'off';
  if (car.stop) ({ s, v: speed, standing, lamp } = stopState(car, time));
  if (car.wrap) s = car.wrap.lo + mod(s - car.wrap.lo, car.wrap.span);
  for (const shift of car.shifts ?? []) {
    const p = clamp((s - shift.at) / shift.over);
    lateral += shift.by * smooth(p); slope += shift.by * 6 * p * (1 - p) / shift.over;
  }
  if (car.drift) lateral += (car.drift.to - lateral) * clamp((time - car.drift.t0) / (car.drift.t1 - car.drift.t0));
  return { s, lateral, yaw: -Math.atan(slope), speed, standing, lamp };
}
