import { lampText, lightsCue, isLightsMission } from './lights-navigation.js';
import { lightPhase } from './lights-state.js';

// The lamp chip and the siren cue (index.html). They show what a driver sees or hears, so they never depend on sound or hints.
const element = id => document.getElementById(id);
export function updateLightsHud(state, view) {
  const chip = element('lamp-chip'), cue = element('siren-cue');
  if (!chip || !cue) return;
  const mission = state.mission, chipOn = isLightsMission(mission) && ['driving', 'paused', 'review', 'replay'].includes(state.status);
  chip.hidden = !chipOn;
  if (chipOn) {
    chip.dataset.light = lightPhase(mission, view);
    const text = lampText(mission, view);
    if (element('lamp-text').textContent !== text) element('lamp-text').textContent = text;
  }
  const alert = lightsCue(state, view);
  cue.hidden = !alert;
  if (!alert) return;
  cue.dataset.side = alert.side; cue.dataset.passed = String(alert.passed); cue.dataset.kind = alert.kind ?? 'siren';
  if (element('siren-text').textContent !== alert.text) element('siren-text').textContent = alert.text;
}
