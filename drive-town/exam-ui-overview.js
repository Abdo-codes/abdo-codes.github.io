import { esc, word } from './exam-text.js';

// The Overzicht screen: a grid of tiles. A tile shows its number and a state in text and shape (not colour alone).
export const FILTERS = [['all', 'All'], ['open', 'Not answered'], ['marked', 'Marked']];

export function tileState(session, i) {
  return { answered: session.isAnswered(i), marked: session.marked.has(i), current: i === session.index };
}
export const tileLabel = (session, i, prefs) => {
  const { answered, marked, current } = tileState(session, i);
  return `${prefs.dutch ? 'Vraag' : 'Question'} ${i + 1}: ${answered ? 'answered' : 'not answered'}${marked ? ', marked' : ''}${current ? ', current' : ''}`;
};

export function overviewHtml(session, filter, view) {
  const { prefs } = view, total = session.items.length, answered = session.answeredCount, open = total - answered;
  const tiles = session.items.map((_, i) => {
    const state = tileState(session, i);
    if (filter === 'open' && state.answered) return '';
    if (filter === 'marked' && !state.marked) return '';
    return `<button type="button" class="exam-tile ${state.answered ? 'answered' : 'open'} ${state.marked ? 'marked' : ''}" data-goto="${i}" ${state.current ? 'aria-current="true"' : ''} aria-label="${esc(tileLabel(session, i, prefs))}">
      <b>${i + 1}</b><span class="tile-state" aria-hidden="true">${state.answered ? '✓' : '○'}${state.marked ? '⚑' : ''}</span><small aria-hidden="true">${state.marked ? esc(prefs.dutch ? 'Gemarkeerd' : 'Marked') : state.answered ? '' : '–'}</small></button>`;
  }).join('');
  return `<div class="exam-overview">
    <h2 id="exam-heading" tabindex="-1">${word('overview', prefs)}</h2>
    <p class="exam-summary"><strong>${answered} of ${total}</strong> answered · ${open} not answered · ${session.marked.size} marked</p>
    <div class="exam-filters" role="group" aria-label="Show questions">${FILTERS.map(([id, text]) => `<button type="button" class="exam-filter" data-filter="${id}" aria-pressed="${id === filter}">${text}</button>`).join('')}</div>
    <div class="exam-tiles">${tiles || '<p class="exam-empty">No questions match.</p>'}</div>
    <div class="exam-actions">
      <button type="button" class="secondary-button" data-act="close-overview">Back to question ${session.index + 1}</button>
      <button type="button" class="primary-button" data-act="finish-ask">Finish exam</button>
      <button type="button" class="secondary-button" data-act="exit-ask">Exit</button>
    </div></div>`;
}
