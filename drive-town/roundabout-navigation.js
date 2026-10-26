import { STOPS } from './roundabout-layout.js';

const CURVE = STOPS.secondExitEnd - STOPS.secondExit; // length of an entry or exit curve

// Route guidance for the roundabout chapter. Both modes get the route (straight on, signal out);
// Guided mode also names the road user to give way to.
export function roundaboutDirection(state, view, busy, base, guided) {
  const d = view.distance, right = state.signal === 'right', mission = state.mission;
  const first = d < STOPS.secondEntry - 40, entry = first ? STOPS.firstEntry : STOPS.secondEntry;
  const exit = first ? STOPS.firstExit : STOPS.secondExit;
  const yourself = 'Check signs and road users yourself';
  const conflict = guided && busy && view.actorTime !== null && mission.gate - d >= -1 && mission.gate - d <= 18;
  if (d < entry) {
    const giveWay = conflict && mission.id === 'roundabout-entry';
    return { ...base, target: `${first ? 'first' : 'second'}-roundabout`, phase: giveWay ? 'wait' : 'approach',
      arrow: giveWay ? 'Ⅱ' : '↑', title: giveWay ? 'Give way to the car on the roundabout' : 'Roundabout ahead — straight on, 2nd exit',
      detail: !guided ? yourself : giveWay ? 'Traffic on the roundabout comes from your left' : 'Shark teeth: traffic on the roundabout goes first',
      distance: Math.max(0, Math.ceil(entry - 2 - d)), distanceTarget: 'give-way line', caution: giveWay };
  }
  if (d < exit) {
    return { ...base, target: `${first ? 'first' : 'second'}-exit`, phase: right ? 'signalled' : 'signal', arrow: '↱',
      title: right ? 'Indicator on — leave at the next exit' : 'Signal right before you leave',
      detail: guided ? 'Going straight on: no signal on entry, right indicator before your exit' : yourself,
      distance: Math.max(0, Math.ceil(exit - d)), distanceTarget: 'exit', needsSignal: !right };
  }
  if (d < exit + CURVE + 2) {
    const cyclist = conflict && mission.id === 'roundabout-cyclist';
    return { ...base, target: `${first ? 'first' : 'second'}-leaving`, phase: cyclist ? 'wait' : 'leaving',
      arrow: cyclist ? 'Ⅱ' : '↱', title: cyclist ? 'Give way to the cyclist' : first ? 'Leaving the roundabout' : 'Leaving — check the cycle path',
      detail: !guided ? yourself : cyclist ? 'The cycle path around the roundabout is part of it' : right ? 'Right indicator on' : 'Use the right indicator',
      distance: null, needsSignal: !right, caution: cyclist };
  }
  return { ...base, target: 'roundabout-road', title: 'Continue straight', detail: first ? 'Another roundabout ahead' : 'Well done — keep checking',
    distance: Math.max(0, Math.ceil((first ? STOPS.secondEntry : STOPS.end) - d)), distanceTarget: first ? 'roundabout' : 'end' };
}
