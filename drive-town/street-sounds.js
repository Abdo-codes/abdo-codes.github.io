import { soundsBetween } from './street-cue.js';

// Tram sounds, made with the page audio context (no audio files). `bell` is two tones (1320 and 1760 Hz, 0.18 s each); `chime` is one (880 Hz).
// The game also shows a cue for each sound (street-cue.js, street-hud.js). `update(state, enabled)` runs every frame.
export const TONES = { bell: [[1320, 0], [1760, .2]], chime: [[880, 0]] };
export function createStreetSounds(getContext) {
  let last = null, mission = null;
  function play(name, context) {
    for (const [hertz, delay] of TONES[name]) {
      const oscillator = context.createOscillator(), gain = context.createGain(), start = context.currentTime + delay;
      oscillator.type = 'sine'; oscillator.frequency.value = hertz;
      gain.gain.setValueAtTime(.05, start); gain.gain.exponentialRampToValueAtTime(.001, start + .18);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + .22);
    }
  }
  function update(state, enabled) {
    const time = state.status === 'driving' && state.mission.kind === 'street' ? state.snapshot().actorTime ?? null : null;
    if (state.mission !== mission) { mission = state.mission; last = null; }
    const events = enabled ? soundsBetween(state.mission, last, time) : [];
    last = time;
    if (!events.length) return;
    try { const context = getContext(); events.forEach(name => play(name, context)); } catch { /* the sound is optional */ }
  }
  return { update };
}
