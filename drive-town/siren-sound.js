// A two-tone siren: one oscillator that alternates 440 Hz and 587 Hz every 0.55 s. The game also draws a cue for it (lights-hud.js).
// `getContext` returns the one AudioContext of the page. `update` gets { distance, side } while the siren is heard, else null.
export const TONES = [440, 587], TONE_SECONDS = .55;
export const sirenGain = distance => Math.min(.16, 6 / (6 + Math.max(distance, 0)));
export const sirenPan = side => side === 'left' ? -.8 : side === 'right' ? .8 : 0;
export function createSiren(getContext) {
  let live = null, context = null;
  function stop() {
    if (!live) return;
    try { live.oscillator.stop(); live.oscillator.disconnect(); live.gain.disconnect(); live.pan?.disconnect(); } catch { /* the nodes are already gone */ }
    live = null;
  }
  function update(level) {
    if (!level) { stop(); return; }
    try { context ??= getContext(); } catch { stop(); return; }
    if (!live) {
      const oscillator = context.createOscillator(), gain = context.createGain(), pan = context.createStereoPanner?.() ?? null;
      oscillator.type = 'triangle'; gain.gain.value = 0;
      oscillator.connect(gain); if (pan) { gain.connect(pan); pan.connect(context.destination); } else gain.connect(context.destination);
      oscillator.start(); live = { oscillator, gain, pan, tone: -1 };
    }
    const tone = Math.floor(context.currentTime / TONE_SECONDS) % 2;
    if (tone !== live.tone) { live.tone = tone; live.oscillator.frequency.setValueAtTime(TONES[tone], context.currentTime); }
    live.gain.gain.setTargetAtTime(sirenGain(level.distance), context.currentTime, .05);
    if (live.pan) live.pan.pan.value = sirenPan(level.side);
  }
  return { update, stop, get playing() { return live !== null; } };
}
