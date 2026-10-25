import { esc } from './exam-text.js';
import { label } from './exam/labels.js';

// Answer controls for the six question types and the text of answers. Pure builders plus one in-place sync (syncAnswer).
// Native radio buttons and check boxes carry the semantics. The pins on the picture are aria-hidden shortcuts for the same list.
export const ORDINAL = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
const signText = (id, view) => view.sign?.alt(id) ?? `Sign ${id}`;

export function choiceHtml(choice, view) {
  if (typeof choice === 'string') return esc(choice);
  const svg = view.sign?.svg(choice.sign) ?? '';
  return `<span class="exam-sign-choice" aria-hidden="true">${svg}</span><span class="sr-only">${esc(signText(choice.sign, view))}</span>`;
}
const choiceName = (choice, view) => typeof choice === 'string' ? choice : signText(choice.sign, view);
// Entries of a list control in screen order: [{ key, html, name }].
export function entriesOf(item, session, i, view) {
  const scene = item.scene ? view.scenes[item.scene] : null;
  if (item.choices) return session.perms[i].map(key => ({ key, html: choiceHtml(item.choices[key], view), name: choiceName(item.choices[key], view) }));
  return (scene?.pins ?? []).map(pin => ({ key: pin.id, html: esc(pin.label), name: pin.label }));
}

const radio = (name, key, html, on, locked, extra = '') => `<label class="exam-choice"><input type="radio" name="${name}" value="${key}" ${on ? 'checked' : ''} ${locked ? 'disabled' : ''} ${extra}><span>${html}</span></label>`;
const check = (name, key, html, on, locked) => `<label class="exam-choice"><input type="checkbox" name="${name}" value="${key}" ${on ? 'checked' : ''} ${locked ? 'disabled' : ''}><span>${html}</span></label>`;

export function answerHtml(item, session, i, view) {
  const value = session.answers[i], locked = session.isChecked(i), name = `a${i}`, { prefs } = view;
  const group = (role, inner, hint = '') => `<div class="exam-answers" role="${role}" aria-labelledby="exam-heading">${hint}${inner}</div>`;
  switch (item.type) {
    case 'yesno': return group('radiogroup', [['0', 'yes'], ['1', 'no']].map(([key, id]) =>
      radio(name, key, `${prefs.dutch ? `<b lang="nl">${label(id, true)}</b> <small>${label(id, false)}</small>` : `<b>${label(id, false)}</b>`}`, value === Number(key), locked)).join(''));
    case 'choice': return group('radiogroup', entriesOf(item, session, i, view).map(e => radio(name, e.key, e.html, value === e.key, locked)).join(''));
    case 'multi': return group('group', entriesOf(item, session, i, view).map(e => check(name, e.key, e.html, value?.includes(e.key), locked)).join(''),
      prefs.chooseN ? `<p class="exam-choose">Choose ${item.correct.length}</p>` : '');
    case 'fill': return `<div class="exam-fill"><label for="exam-fill">Your answer</label><span class="exam-fill-row"><input id="exam-fill" type="text" inputmode="decimal" maxlength="40" enterkeyhint="next" autocomplete="off" autocapitalize="off" spellcheck="false" ${locked ? 'disabled' : ''} value="${esc(value ?? '')}" aria-describedby="exam-fill-note"><span class="exam-unit">${esc(item.unit)}</span></span>
      <p id="exam-fill-note" class="exam-fill-note" role="status"></p><button type="button" class="secondary-button next-inline" data-act="next">${esc(label('next', prefs.dutch))} →</button></div>`;
    case 'hotspot': return group('radiogroup', entriesOf(item, session, i, view).map(e => radio(name, e.key, e.html, value === e.key, locked)).join(''),
      '<p class="exam-choose">Tap a marker in the picture, or choose a name in this list.</p>');
    case 'order': return `<div class="exam-answers exam-order" role="group" aria-labelledby="exam-heading"><p class="exam-choose">Tap in order: first, second, third. Tap a number again to remove it.</p>
      ${entriesOf(item, session, i, view).map(e => `<button type="button" class="exam-choice exam-order-btn" data-order="${esc(e.key)}" data-name="${esc(e.name)}" ${locked ? 'disabled' : ''}><b class="order-no" aria-hidden="true"></b><span>${e.html}</span></button>`).join('')}
      <button type="button" class="exam-link" data-act="clear-order">Clear</button><p class="sr-only" id="exam-order-live" role="status"></p></div>`;
    default: return '';
  }
}

// Text for an answer value, for the review and the feedback. `session` gives the item's choices, `view` the sign text.
export function answerText(item, value, view) {
  const scene = item.scene ? view.scenes[item.scene] : null, pin = id => scene?.pins.find(p => p.id === id)?.label ?? String(id);
  const choice = index => item.choices ? choiceName(item.choices[index], view) : pin(index);
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)) return 'No answer';
  switch (item.type) {
    case 'yesno': return value === 0 ? 'Ja (yes)' : 'Nee (no)';
    case 'choice': return choice(value);
    case 'multi': return value.map(choice).join('; ');
    case 'fill': return `${value} ${item.unit}`;
    case 'hotspot': return pin(value);
    case 'order': return value.map((key, n) => `${n + 1}. ${item.choices ? choice(key) : pin(key)}`).join(' ');
    default: return String(value);
  }
}
export const correctText = (item, view) => answerText(item, item.type === 'fill' ? String(item.correct[0]) : item.correct, view);

// Updates controls in place when the answer changes by another route (shortcut key, pin tap, restore). No rebuild, so focus stays.
export function syncAnswer(root, item, session, i) {
  const value = session.answers[i];
  for (const input of root.querySelectorAll('input[type=radio], input[type=checkbox]')) {
    const key = item.type === 'yesno' || item.choices ? Number(input.value) : input.value;
    input.checked = Array.isArray(value) ? value.includes(key) : value === key;
  }
  if (item.type !== 'order') return;
  const list = Array.isArray(value) ? value : [];
  for (const button of root.querySelectorAll('[data-order]')) {
    const key = item.choices ? Number(button.dataset.order) : button.dataset.order, n = list.indexOf(key) + 1;
    button.querySelector('.order-no').textContent = n || ''; button.classList.toggle('numbered', n > 0);
    button.setAttribute('aria-label', n ? `${ORDINAL[n - 1]}: ${button.dataset.name}` : `${button.dataset.name}: not numbered`);
  }
}
