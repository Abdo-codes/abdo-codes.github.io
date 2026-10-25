import { directionAlert } from './navigation.js';

export class DirectionAlerts {
  constructor(onAlert = () => {}) { this.onAlert = onAlert; this.lastAlert = ''; }
  update(state, display) {
    const alert = directionAlert(state, display), card = document.getElementById('direction-alert');
    card.hidden = !alert;
    document.getElementById('distance-hint').hidden = Boolean(alert);
    const driving = state.status === 'driving';
    // Merge prompts name the indicator side (`signalSide`, empty for none). Other prompts only suggest the right indicator.
    for (const side of ['left', 'right']) document.getElementById(`signal-${side}`).classList.toggle('suggested',
      driving && Boolean(alert && 'signalSide' in alert ? alert.signalSide === side : side === 'right' && alert?.needsSignal));
    document.getElementById('park').classList.toggle('suggested', driving && Boolean(alert?.mergeSuggested));
    if (!alert) { document.getElementById('direction-announcement').textContent = ''; return; }
    card.dataset.phase = alert.phase; card.classList.toggle('caution', alert.caution);
    document.getElementById('direction-arrow').textContent = alert.arrow;
    document.getElementById('direction-title').textContent = alert.title;
    document.getElementById('direction-detail').textContent = alert.detail;
    const distance = document.getElementById('direction-distance');
    distance.hidden = alert.distance === null; distance.textContent = alert.distance === null ? '' : `${alert.distance} m\nto ${alert.distanceTarget}`;
    const pausedFrame = state.status === 'replay' && state.replayPaused ? state.replayTime.toFixed(2) : '';
    const key = `${state.missionIndex}:${state.status}:${alert.target}:${alert.phase}:${alert.countdown ? '' : alert.title}:${pausedFrame}`;
    if (key !== this.lastAlert) {
      this.lastAlert = key;
      document.getElementById('direction-announcement').textContent = `${state.status === 'replay' ? 'Replay. ' : ''}${alert.title}${alert.distance === null ? '' : `, ${alert.distance} metres to ${alert.distanceTarget}`}. ${alert.detail}.`;
      if (state.status === 'driving' && alert.phase !== 'continue') this.onAlert();
    }
  }
}
