import { laneState } from './lane-change.js';
import { hostTimes } from './merge-gap.js';

// Route prompts of the merge lessons (pure). Guided names the phase and the gap. Independent has few phases and never says whether a gap is open.
// `signalSide` is the indicator button to highlight; `mergeSuggested` highlights the Merge button.
const YOURSELF = 'Check signs and road users yourself', FAST = 42, LATE = 20;
const SIGNAL_TITLE = { right: 'Use the right indicator', left: 'Use the left indicator' };
const ARROW = { right: '↱', left: '↰' };

function host(state, view, busy, base, guided) {
  const mission = state.mission, { car, tc } = hostTimes(mission), after = (view.actorTime ?? 0) > tc;
  const name = car.model === 'lorry' ? 'lorry' : 'car', seconds = Math.max(1, Math.ceil(tc - (view.actorTime ?? 0)));
  if (after) return { ...base, target: mission.id, phase: 'merged', title: 'Merged · keep your distance', detail: guided ? 'Well done' : YOURSELF, distance: null };
  if (!guided) return { ...base, target: mission.id, phase: 'approach', title: 'Watch the acceleration lane', detail: YOURSELF, distance: null };
  return busy ? { ...base, target: mission.id, phase: 'ease', arrow: '↓', title: 'Slow down to make room', detail: `Tap Drive for ${mission.driveSpeed} or use Slow`, distance: null, caution: true }
    : { ...base, target: mission.id, phase: 'watch', title: `A ${name} joins in ${seconds} s`, detail: 'Keep your lane and speed', distance: null, countdown: true };
}
function merger(state, view, busy, base, guided) {
  const mission = state.mission, lane = mission.lane, side = mission.signal;
  if (lane.role === 'host') return host(state, view, busy, base, guided);
  const progress = view.merge ? laneState(mission, view.merge, view.distance, view.time ?? 0).progress : null, signalled = view.signal === side;
  const zipper = lane.openAt !== undefined, start = zipper ? lane.openAt : 100, flow = { ...base, target: mission.id, distance: null };
  const joined = zipper ? 'Merged · keep your distance' : 'Joined · keep your distance';
  if (progress !== null) {
    const lit = view.signal !== null && view.signal !== undefined, slow = view.speed < mission.driveSpeed - 1; // a Slow or braked merge: tap Drive to keep up
    const detail = !guided ? YOURSELF : lit ? slow ? 'Switch off the indicator, then tap Drive' : 'Switch off the indicator' : slow ? `Tap Drive to ${zipper ? 'follow the queue' : 'match the road speed'}` : 'Well done';
    return guided && progress < 1 ? { ...flow, phase: 'moving', title: 'Moving over', detail: 'Keep the indicator on until you are across' }
      : { ...flow, phase: 'merged', title: joined, detail, signalSide: guided && lit ? view.signal : '' };
  }
  if (!guided) {
    const title = view.distance < start ? zipper ? 'Your lane ends ahead' : 'Build speed on the lane' : !signalled ? 'Signal in good time' : 'Choose your moment';
    return { ...flow, phase: view.distance < start ? 'approach' : !signalled ? 'signal' : 'window', title, detail: YOURSELF };
  }
  const late = mission.gate - view.distance <= LATE, arrow = ARROW[side], seen = view.distance >= start;
  if (!signalled && !late && zipper && !seen) return { ...flow, phase: 'approach', arrow: '↑', title: 'Your lane ends ahead', detail: 'Tap Drive to match the queue' };
  if (!signalled && !late && !zipper && view.speed < FAST) return { ...flow, phase: 'build-speed', arrow: '↗', title: 'Speed up on the lane', detail: 'Tap Drive to reach the road speed' };
  if (!signalled && !late) return { ...flow, phase: 'signal', arrow, title: SIGNAL_TITLE[side], detail: zipper ? 'The sub-sign Ritsen vanaf hier is here' : 'Signal before you move over', signalSide: side, needsSignal: false };
  if (late) return { ...flow, phase: 'late', arrow, title: 'Merge before the ' + (zipper ? 'hatched area' : 'lane ends'), detail: 'Slow down if no gap is open', caution: true,
    signalSide: signalled ? '' : side, mergeSuggested: signalled && !busy };
  return busy ? { ...flow, phase: 'wait', arrow: 'Ⅱ', title: 'Car beside you · let it go first', detail: 'Slow down to reach the next gap', caution: true }
    : { ...flow, phase: 'merge', arrow, title: 'Gap open · choose Merge', detail: 'Tap Merge', mergeSuggested: true };
}
export function mergeDirection(state, view, busy, base, guided) {
  const alert = state.mission.lane.role === 'host' ? host(state, view, busy, base, guided) : merger(state, view, busy, base, guided);
  return { signalSide: '', mergeSuggested: false, ...alert };
}
