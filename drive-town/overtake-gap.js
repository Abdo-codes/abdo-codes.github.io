// The numbers of the overtake lesson. The law gives none of them: every value here is a Drive Town design choice.
// MARGIN: bumper gap to an oncoming car, in metres. REAR: the rear bumper must be this far past the rider before the car comes back.
export const MARGIN = 12, REAR = 10, HINT_KMH = 40, LEFT = -.75, BAND = -.4, KEEP_RIGHT_S = 12, SLOW_PASS_KMH = 33, LOOK_CAP = 160;
export const RIDER = { length: 1.8 }, CAR_LENGTH = 4.5, BACK_SHIFT = 16, OVER_LINE_BACK = 10.8;
// Metres of free oncoming lane that a pass needs: the cars close at (v + oncoming) for the whole time the car is over the line.
// v, rider and oncoming are in m/s. g0 is the bumper gap to the rider when Overtake is pressed.
export function passTimes(v, rider, g0) {
  const back = Math.max(BACK_SHIFT / v, (g0 + RIDER.length + CAR_LENGTH + REAR) / (v - rider));
  return { back, end: back + OVER_LINE_BACK / v };
}
export function needGap(v, rider, g0, oncoming) {
  if (!(v > rider)) return Infinity;
  return MARGIN + (v + oncoming) * passTimes(v, rider, g0).end;
}
