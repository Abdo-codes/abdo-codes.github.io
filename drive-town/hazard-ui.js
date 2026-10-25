import { ANSWERS, ANSWER_SECONDS, PASS_MARK, PASS_OUT_OF, clipRule } from './hazard.js';
import { topicResultHtml } from './hazard-result.js';
import { practiceFor, emptyWeak } from './weak-topics.js';

const button = (text, action, primary = true) =>
  `<button class="${primary ? 'primary-button' : 'secondary-button'}" data-hazard="${action}">${text}</button>`;
const ruleLink = clip => { const { reference, source } = clipRule(clip); return `<a class="hazard-rule" href="${source}" target="_blank" rel="noopener">${reference} ↗</a>`; };
const answerName = choice => choice ? `${ANSWERS[choice].label} · ${ANSWERS[choice].dutch}` : 'No answer in time';

export const hazardKey = test => `${test.phase}:${test.index}:${test.answers.length}`;

// `practice(topic, focus)` finds the lessons and clips of a topic for the "By topic" block of the result.
export function hazardOverlay(test, practice = (topic, focus) => practiceFor(topic, emptyWeak(), focus)) {
  const count = test.clips.length, position = `SITUATION ${test.index + 1} / ${count}`;
  if (test.phase === 'intro') {
    return `<div class="floating-card hazard-card"><span class="card-icon">!</span><span class="eyebrow">HAZARD PERCEPTION · GEVAARHERKENNING</span><h2>What would you do?</h2>
      <p>Watch ${count} short drives. When the picture freezes, choose <strong>Brake</strong>, <strong>Release accelerator</strong> or <strong>Do nothing</strong> within ${ANSWER_SECONDS} seconds.</p>
      <p class="hazard-note">This test is based on the CBR hazard test used until 6 April 2025: ${PASS_OUT_OF} questions, ${ANSWER_SECONDS} seconds each, pass mark ${PASS_MARK}. The exam today is one test of 50 questions. Some questions have a short animation.</p>
      ${button('Start the hazard test →', 'start')}${button('Back to driving', 'exit', false)}
      <span class="card-footnote">Practice only. Original situations, not CBR exam material.</span></div>`;
  }
  if (test.phase === 'watch' || test.phase === 'answer') {
    const asking = test.phase === 'answer';
    return `<section class="hazard-bar" aria-label="Hazard question">
      <div class="hazard-status"><span class="eyebrow">${position}</span><strong>${asking ? 'What do you do now?' : 'Watch the road…'}</strong><span id="hazard-speed" class="hazard-speed"></span></div>
      <div class="hazard-timer" aria-hidden="true"><span id="hazard-countdown"></span></div>
      <div class="hazard-answers" role="group" aria-label="Your answer">${Object.entries(ANSWERS).map(([id, answer]) =>
        `<button data-hazard="answer" data-choice="${id}" ${asking ? '' : 'disabled'}><strong>${answer.label}</strong><small>${answer.dutch} · ${answer.key}</small></button>`).join('')}</div>
    </section>`;
  }
  if (test.phase === 'feedback') {
    const last = test.last, clip = test.clip, final = test.index + 1 >= count;
    const verdict = last.correct ? 'Correct' : last.choice ? 'Not quite' : 'Too late';
    return `<section class="hazard-bar hazard-feedback ${last.correct ? 'correct' : 'wrong'}" aria-live="polite">
      <div class="hazard-status"><span class="eyebrow">${position} · ${clip.topic.toUpperCase()}</span><strong>${verdict}: ${ANSWERS[clip.answer].label}</strong>
      <span class="hazard-time">${last.choice ? `${last.seconds.toFixed(1)} s` : ''}</span></div>
      <p>${last.correct ? '' : `You chose: ${answerName(last.choice)}. `}${clip.explanation}</p>
      ${ruleLink(clip)}
      <div class="hazard-actions">${button('Watch again', 'replay', false)}${button(final ? 'See your result →' : 'Next situation →', 'next')}</div>
    </section>`;
  }
  const missed = test.answers.filter(answer => !answer.correct);
  const rows = missed.map(answer => {
    const clip = test.clips.find(item => item.id === answer.id);
    return `<li><div><strong>${clip.topic}: ${ANSWERS[answer.expected].label}</strong>${ruleLink(clip)}</div><span>${answerName(answer.choice)}</span></li>`;
  }).join('');
  const average = test.answers.filter(answer => answer.correct).reduce((sum, answer, _, all) => sum + answer.seconds / all.length, 0);
  const mark = test.passed === null ? '' : `<p class="hazard-pass ${test.passed ? 'above' : 'below'}"><strong>Your score is ${test.passed ? 'at or above' : 'below'} the former pass mark of ${PASS_MARK} of ${PASS_OUT_OF}.</strong> Your score counts correct answers only.</p>`;
  return `<div class="floating-card hazard-card hazard-result"><span class="eyebrow">HAZARD TEST RESULT · PRACTICE</span><h2>${test.score} of ${count} correct</h2>${mark}
    <p>${missed.length ? 'Review the situations you missed, then try again.' : 'Every situation judged correctly.'}${test.score ? ` Average time for correct answers: ${average.toFixed(1)} s (not scored).` : ''}</p>
    ${topicResultHtml(test, practice)}
    ${rows ? `<h3 class="hazard-missed-title">Missed situations</h3><ul class="hazard-missed">${rows}</ul>` : ''}
    <span class="card-footnote">Practice result only. It is based on the former CBR hazard test and does not predict your exam result.</span>
    <div class="hazard-result-actions">${button('Try the hazard test again', 'start')}${button('Back to driving', 'exit', false)}</div></div>`;
}
