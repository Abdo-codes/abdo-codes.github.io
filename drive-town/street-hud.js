import { streetCue } from './street-cue.js';
import { streetMarkers } from './street-markers.js';
import { streetMapSvg } from './street-map.js';

// The street parts of the HUD (index.html): the cue chip for each sound, and the street shapes of the minimap. Both read the snapshot on show
// (`display ?? state.snapshot()`), so a replay frame shows its own cue and positions.
const element = id => document.getElementById(id);
const text = (node, value) => { if (node.textContent !== value) node.textContent = value; };
export function updateStreetHud(state, view) {
  const chip = element('street-cue'), map = element('map-street');
  if (!chip || !map) return;
  const mission = state.mission, street = mission.kind === 'street', live = ['driving', 'paused', 'review', 'replay'].includes(state.status);
  const cue = street && live ? streetCue(mission, view) : null;
  chip.hidden = !cue;
  if (cue) { chip.dataset.cue = cue.id; text(chip.querySelector('span'), cue.text); }
  const svg = street ? streetMapSvg(streetMarkers(mission, view)) : '';
  if (map.dataset.svg !== svg) { map.dataset.svg = svg; map.innerHTML = svg; }
}
