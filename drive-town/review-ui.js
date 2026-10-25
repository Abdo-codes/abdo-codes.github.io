import { feedbackFor, evidenceText } from './attempt-feedback.js';
import { CONFLICT_REASONS } from './road-users.js';
import { termsHtml } from './lesson-terms.js';
import { streetActorName } from './street-feedback.js';

const button = (text, action, primary = false) => `<button class="${primary ? 'primary' : 'secondary'}-button" data-action="${action}">${text}</button>`;
export function reviewOverlay(state) {
  const feedback = feedbackFor(state), mission = state.mission;
  const pedestrian = ['zebra', 'parking'].includes(mission.id);
  const actor = mission.actor?.name ?? (pedestrian ? 'pedestrian' : mission.id === 'cyclist' ? 'cyclist'
    : mission.kind === 'bus' ? 'departing bus' : mission.kind === 'narrow' ? 'oncoming car' : mission.kind === 'rail' ? 'train' : mission.kind === 'street' ? streetActorName(state) : mission.kind === 'merge' ? state.result?.reason === 'hinder' ? 'merging vehicle' : 'other vehicle' : 'crossing car');
  const marker = CONFLICT_REASONS.includes(state.result?.reason) ? `<p class="scene-legend">Amber ring: ${actor}.${pedestrian ? ' Shaded area: crossing.' : ''}</p>` : '';
  const evidence = `<p class="attempt-evidence">${evidenceText(state)}</p>${marker}`;
  if (state.status === 'replay') return `<div class="floating-card replay-card"><span class="eyebrow">REPLAY · HALF SPEED</span>${evidence}
    <label class="replay-timeline">Replay position<input type="range" data-replay-seek min="0" max="${Math.round(state.replayDuration * 30)}" step="1" value="${Math.floor(state.replayTime * 30)}" aria-label="Replay position"></label>
    <output id="replay-clock"></output><div class="review-actions">${button(state.replayPaused ? 'Play replay' : 'Pause replay', 'replay-toggle')}${button('Show decision frame', 'replay-decision')}</div>
    ${button('Try again →', 'retry', true)}${button('Back to explanation', 'replay-exit')}</div>`;
  return `<div class="floating-card feedback-card"><span class="eyebrow">RECORDED DECISION</span><h2>${feedback.title}</h2>${evidence}<p>${feedback.body}</p>
    <details class="rule-details"><summary>Why this rule applies</summary><p>${mission.rule}</p>${termsHtml(mission)}<a href="${mission.source}" target="_blank" rel="noopener">${mission.reference} ↗</a></details>
    ${button('Replay this decision', 'replay', true)}${button('Try again →', 'retry')}</div>`;
}
