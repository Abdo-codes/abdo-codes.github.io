import { MISSIONS } from './missions.js';
import { CHAPTERS, chapterFor } from './chapters.js';
import { lightPhase } from './lesson-state.js';
import { feedbackFor } from './attempt-feedback.js';
import { reviewOverlay } from './review-ui.js';
import { usingHints, isIndependent } from './practice.js';
import { routeDirection } from './navigation.js';
import { routeFor } from './routes.js';
import { railwayState } from './sharing-state.js';
import { mergeCoach, notesHtml } from './merge-feedback.js';
import { streetCoach } from './street-feedback.js';
import { streetSuccess } from './street-success.js';
import { termsHtml } from './lesson-terms.js';
import { isLightsMission, lightsCoach } from './lights-navigation.js';
export { feedbackFor } from './attempt-feedback.js';

// On a phone the rule starts closed, so the action buttons stay in reach of the card. Elsewhere it is open.
const phone = () => typeof matchMedia === 'function' && matchMedia('(max-width:800px)').matches;
const rule = mission => `<details class="rule-explanation" ${phone() ? '' : 'open'}><summary>Rule and source</summary><p>${mission.rule}</p>${termsHtml(mission)}<a href="${mission.source}" target="_blank" rel="noopener">${mission.reference} ↗</a></details>`;
// The first button sticks to the bottom of the card (see feedback-ui.css). The others follow in the normal flow.
const actions = (...buttons) => { const [first, ...rest] = buttons.filter(Boolean); return `<div class="card-actions">${first}</div>${rest.join('')}`; };
const primary = (text, action) => `<button class="primary-button" data-action="${action}">${text}</button>`;
const secondary = (text, action) => `<button class="secondary-button" data-action="${action}">${text}</button>`;

export function coachFor(state) {
  const mission = state.mission;
  if (mission.kind === 'merge') return mergeCoach(state);
  if (mission.kind === 'street') return streetCoach(state);
  if (['review', 'replay'].includes(state.status)) return feedbackFor(state).body;
  if (['success', 'complete'].includes(state.status)) return mission.success;
  if (state.status === 'question') return 'You made the driving decision. Now check the rule before we mark this mission as practised.';
  if (!usingHints(state)) return 'Read the signs and look for road users. Make your own decision. A hint is available if you need one.';
  if (mission.id === 'zebra' && state.distance < routeDirection(mission.start, routeFor(mission)).end) return 'First turn right slowly. After the turn, check the zebra and let the pedestrian cross before you continue.';
  if (!['driving', 'paused'].includes(state.status)) return mission.coach;
  if (isLightsMission(mission)) return lightsCoach(state);
  if (mission.kind === 'rail') return railwayState(mission, state).red
    ? 'Wait before the railway barrier while red flashes, even after the train passes or the barrier starts rising.'
    : 'Red lights are off and the barrier is fully open. Check the tracks and exit, then clear the entire crossing.';
  if (['bus', 'narrow'].includes(mission.kind) && state.actorTime !== null && !state.busy) return mission.kind === 'bus'
    ? 'The bus has left the stop. Check ahead and follow at a safe pace.'
    : 'The oncoming car is clear of the narrow passage. Check ahead, then continue if safe.';
  if (mission.kind === 'light') return lightPhase(mission, state) === 'red'
    ? 'Red: stop before the white line and wait. The timer starts as you approach the light.'
    : 'Green: check ahead, then continue if the road is clear.';
  if (mission.kind === 'stop') {
    if (!state.stoppedAtLine) return 'STOP: reach zero close to the white line before crossing. Then check both ways and give priority to the crossing road.';
    return state.busy ? 'Your full stop is recorded. Keep waiting for the crossing car to clear.'
      : 'Full stop recorded, crossing road clear. Check both ways, then ease forward.';
  }
  if (mission.kind === 'limit' && state.distance >= mission.changeAt) return 'The new 30 maximum applies now. Drive now uses 22 km/h; keep watching the road.';
  if (state.actorTime !== null && !state.busy) return mission.id === 'parking'
    ? 'The pedestrian has cleared the entrance. Stop beside the bay, keep your right indicator on, and press Park.'
    : mission.id === 'cyclist' ? 'The cyclist is clear. Keep your right indicator on and take the turn gently.'
    : 'The crossing path is clear. Check again, then ease forward when you are ready.';
  if (mission.id === 'zebra' && state.busy) return 'Now check the zebra ahead. Let the pedestrian cross before you continue.';
  return mission.coach;
}
export function overlayFor(state, practised) {
  const mission = state.mission, chapter = chapterFor(state.missionIndex);
  const ordinal = chapter.indices.indexOf(state.missionIndex) + 1, count = chapter.indices.length;
  if (state.status === 'ready') {
    const repeat = practised.includes(mission.id), first = ordinal === 1 && !repeat;
    return `<div class="floating-card ready-card"><span class="card-icon">↱</span><span class="eyebrow">${isIndependent(state) ? 'INDEPENDENT PRACTICE' : chapter.name.toUpperCase()} · ${count} MISSIONS</span><h2>${first ? chapter.ready : mission.title}</h2><p>${isIndependent(state) ? 'Decide from the road. Traffic timing changes; some roads are already clear. An Independent pass needs no hints or wrong answers. Hints give practice credit only.' : first ? chapter.description : mission.objective}</p>${mission.readyNote ? `<p class="ready-note">${mission.readyNote}</p>` : ''}<div class="card-actions">${termsHtml(mission)}${primary(repeat ? 'Practise this rule again →' : first ? 'Start this chapter →' : 'Start this lesson →', 'start')}</div><span class="card-footnote">Keyboard or touch · steering is assisted</span></div>`;
  }
  if (['review', 'replay'].includes(state.status)) return reviewOverlay(state);
  if (state.status === 'question') {
    const question = state.question;
    const feedback = state.questionFeedback;
    const previous = feedback ? `<aside class="question-feedback"><strong>Previous situation</strong><p>${feedback.prompt}</p><p class="question-error" role="alert">${feedback.explanation}</p></aside>` : '';
    return `<div class="floating-card question-card">${previous}<span class="eyebrow">${feedback ? 'Now apply it to a changed situation' : 'ONE QUICK RULE CHECK'}</span><h2>${question.prompt}</h2><div class="answer-choices">${question.choices.map((choice, index) => `<button class="answer-button" data-answer="${index}">${choice}</button>`).join('')}</div><span class="card-footnote">Apply the rule to finish this mission.</span></div>`;
  }
  const practiceNote = isIndependent(state) ? state.independentPass ? 'Independent practice pass · no hints or wrong answers this attempt.' : 'Practised with help · try again for an independent pass.' : 'Guided practice · try Independent when you are ready.';
  const helped = isIndependent(state) && !state.independentPass;
  const reasons = [state.hintUsed ? 'hint used' : '', state.questionMisses ? 'answer corrected' : ''].filter(Boolean).join(' · ');
  const credit = isIndependent(state) ? `<span class="result-credit" role="status">${helped ? `Practice credit · ${reasons}` : 'Independent pass · no hints or wrong answers'}</span>` : '';
  const independentRetry = helped ? primary('Try for an Independent pass', 'retry') : '';
  if (state.status === 'success') return `<div class="floating-card success-card"><span class="card-icon">✓</span><span class="eyebrow">ONE MORE GOOD HABIT</span>${credit}<h2>${helped ? 'Practised with help.' : 'Nicely judged.'}</h2>${independentRetry}<p>${mission.kind === 'street' ? streetSuccess(state) : mission.success}</p>${notesHtml(state)}${rule(mission)}${actions(helped ? secondary('Next little mission →', 'next') : primary('Next little mission →', 'next'))}<span class="card-footnote">${practiceNote}</span></div>`;
  if (state.status === 'paused') return `<div class="floating-card"><span class="card-icon">Ⅱ</span><span class="eyebrow">TAKE A BREATHER</span><h2>Your town can wait.</h2><p>Everything is paused. Your current mission will be right here.</p>${primary('Back to the road →', 'resume')}</div>`;
  if (state.status === 'complete') {
    const chapterComplete = chapter.indices.every(index => practised.includes(MISSIONS[index].id));
    if (!chapterComplete) return `<div class="floating-card success-card"><span class="card-icon">✓</span><span class="eyebrow">LESSON PRACTISED</span>${credit}<h2>${helped ? 'Practised with help.' : 'One more rule practised.'}</h2>${independentRetry}<p>${mission.kind === 'street' ? streetSuccess(state) : mission.success}</p>${notesHtml(state)}${rule(mission)}${actions(helped ? secondary('Choose another lesson', 'lessons') : primary('Choose another lesson', 'lessons'), !helped ? secondary('Practise this lesson again', 'retry') : '')}<span class="card-footnote">${practiceNote}</span></div>`;
    const copy = chapter.summary;
    const nextChapter = CHAPTERS[CHAPTERS.indexOf(chapter) + 1];
    return `<div class="floating-card complete-card"><span class="card-icon">✧</span><span class="eyebrow">${chapter.name.toUpperCase()} · PRACTICE COMPLETE</span>${credit}<h2>${helped ? 'Practised with help.' : 'A good driver<br>keeps learning.'}</h2>${independentRetry}<p>${copy}</p>${rule(mission)}${actions(nextChapter ? primary(`Explore ${nextChapter.name.toLowerCase()} →`, 'chapter-next') : '', secondary('Practise this chapter again', 'restart'), !isIndependent(state) ? secondary('Try Independent practice', 'independent') : '')}<span class="card-footnote">${practiceNote}</span></div>`;
  }
  return '';
}
