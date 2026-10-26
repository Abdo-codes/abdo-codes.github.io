import { MISSIONS } from './missions.js';
import { withVariant } from './mission-variants.js';

const MODE_KEY = 'drive-town-mode-v1';
const clearSuccess = {
  'traffic-light': 'You continued through the light on green.',
  'right-of-way': 'You checked the junction and continued when the crossing road was clear.',
  zebra: 'You checked the zebra for pedestrians and continued through a clear crossing.',
  cyclist: 'You signalled, checked beside and behind, and turned through a clear path.',
  parking: 'You signalled, checked the clear entrance, and parked safely beside the bakery.',
  'stop-sign': 'You stopped completely at the line, checked both ways, and continued through a clear crossing.',
  'yield-sign': 'You respected the signed priority, checked the clear crossing road, and continued safely.',
};
export const isIndependent = state => state.mode === 'independent';
export const usingHints = state => !isIndependent(state) || state.hintUsed;
export function loadMode(storage) {
  try { return storage?.getItem(MODE_KEY) === 'independent' ? 'independent' : 'guided'; } catch { return 'guided'; }
}
export function saveMode(storage, mode) {
  try { storage?.setItem(MODE_KEY, mode === 'independent' ? mode : 'guided'); } catch { /* Still usable without storage. */ }
}
export function practiceMission(index, mode = 'guided', variation = 0) {
  const mission = MISSIONS[index];
  if (mode === 'independent' && mission.lane?.variants) {
    // A variant is a traffic array (chapter 05) or { traffic, mission?, zones?, go?, sign? } (chapter 07: it may change the start and the gate).
    const v = mission.lane.variants[Math.abs(Math.trunc(variation)) % 6];
    if (Array.isArray(v)) return { ...mission, lane: { ...mission.lane, traffic: v } };
    return { ...mission, ...v.mission, lane: { ...mission.lane, traffic: v.traffic, zones: v.zones ?? mission.lane.zones, go: v.go ?? mission.lane.go, sign: v.sign } };
  }
  if (mission.variants) return withVariant(mission, mission.variants[mode === 'independent' ? Math.abs(Math.trunc(variation)) % mission.variants.length : 0]);
  if (mode !== 'independent' || !mission.duration) return mission;
  const variant = Math.abs(Math.trunc(variation)) % 6;
  const duration = mission.duration + variant % 3 * 2;
  // Change arrival timing without changing topology, sign meanings or collision envelopes.
  // Alternate clear-road practice still requires a full STOP, but never invents a mandatory yield stop.
  return { ...mission, duration, initialActorTime: variant % 2 ? duration : null,
    trigger: variant % 2 ? Infinity : mission.trigger,
    success: variant % 2 ? mission.clearSuccess ?? clearSuccess[mission.id] ?? mission.success : mission.success,
    approachDelay: mission.approachDelay ?? 0 };
}
