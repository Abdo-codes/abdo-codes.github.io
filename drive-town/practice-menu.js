// The Practice button in the header opens a short list: Mock exam and Hazard test. A disclosure, not an ARIA menu:
// the button has aria-expanded, Escape closes the list, and focus leaving the menu closes it.
export function bindPracticeMenu(doc = document) {
  const button = doc.getElementById('practice-open'), list = doc.getElementById('practice-list');
  if (!button || !list) return null;
  const set = open => { list.hidden = !open; button.setAttribute('aria-expanded', String(open)); };
  button.addEventListener('click', () => set(list.hidden));
  list.addEventListener('click', () => set(false));
  doc.addEventListener('keydown', event => { if (event.key === 'Escape' && !list.hidden) { event.preventDefault(); set(false); button.focus(); } });
  doc.addEventListener('click', event => { if (!list.hidden && !event.target.closest?.('.practice-menu')) set(false); });
  button.parentElement.addEventListener('focusout', event => { if (!list.hidden && event.relatedTarget && !button.parentElement.contains(event.relatedTarget)) set(false); });
  return { close: () => set(false) };
}
