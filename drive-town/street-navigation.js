import { streetPhase } from './street-hint.js';

// Route prompts of the street lessons (pure). Guided names the phase. Independent gives one neutral prompt and never says if the road is clear.
// Titles have at most 6 words. `signalSide` is the indicator button to highlight; `mergeSuggested` highlights the Overtake or Back button.
const YOURSELF = 'Check signs and road users yourself';
const PROMPTS = {
  tram: { approach: ['Tram stop ahead', 'Slow down early', '↓'], wait: ['Doors open · wait', 'Passengers cross the road', 'Ⅱ'], closing: ['Doors closing · wait', 'Let the tram leave', 'Ⅱ'],
    go: ['Clear · drive on', 'Pass slowly', '↑'], cross: ['Tram crossing', 'Let the tram go first', 'Ⅱ'] },
  cycle: { van: ['Van on the cycle strip', 'Slow down early', '↓'], out: ['Cyclist moves out', 'Give room', 'Ⅱ'], pair: ['Cyclists ahead', 'Stay behind them', 'Ⅱ'], clear: ['Clear · drive on', 'Keep watching the strip', '↑'] },
  overtake: { follow: ['Cyclist ahead', 'Check line, zebra, oncoming', '↑'], zebra: ['No pass here', 'Stay behind', 'Ⅱ'], solid: ['No pass here', 'Stay behind', 'Ⅱ'], oncoming: ['No pass here', 'Stay behind', 'Ⅱ'],
    speed: ['Clear · speed up', 'Reach 40 km/h, then signal left', '↑'], signal: ['Clear · signal left', 'Then tap Overtake', '↰'], go: ['Tap Overtake', 'The strip is green', '↰'], back: ['Past the cyclist', 'Signal right · tap Back', '↱'] },
};
export function streetDirection(state, view, busy, base, guided) {
  const mission = state.mission, role = mission.lane.role, flow = { signalSide: '', mergeSuggested: false, ...base, target: mission.id, distance: null };
  if (!guided) return { ...flow, phase: 'observe', title: role === 'overtake' ? 'Cyclist ahead' : 'Watch the street', detail: YOURSELF };
  const phase = streetPhase(mission, view), [title, first, arrow] = PROMPTS[role][phase] ?? ['Drive on', 'Keep watching the road', '↑'];
  const detail = role === 'overtake' && phase === 'speed' && view.signal === mission.signal ? 'Reach 40 km/h, then tap Overtake' : first; // the indicator is already on
  const signalSide = role === 'overtake' && phase === 'signal' ? 'left' : role === 'overtake' && phase === 'back' && view.signal !== 'right' ? 'right' : '';
  return { ...flow, phase, arrow, title, detail, caution: ['wait', 'closing', 'cross', 'out', 'pair', 'zebra', 'solid', 'oncoming'].includes(phase), signalSide,
    mergeSuggested: role === 'overtake' && (phase === 'go' || phase === 'back') && !signalSide };
}
