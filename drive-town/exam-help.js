import { LABELS } from './exam/labels.js';
import { esc } from './exam-text.js';

// The help of the exam. It never reuses the drive Help dialog.
export function helpHtml(prefs) {
  const words = Object.entries(LABELS).map(([, [nl, en]]) => `<dt lang="nl">${esc(nl)}</dt><dd>${esc(en)}</dd>`).join('');
  return `<button type="button" class="dialog-close" data-act="close-help" aria-label="Close help">×</button>
    <span class="eyebrow">MOCK EXAM HELP</span><h2 id="exam-help-title" tabindex="-1">How the exam works</h2>
    <p><strong>The clock keeps running</strong> while this help is open. You can go back to any question until you finish or time is up.</p>
    <ul class="exam-help-list">
      <li><b>Ja / Nee</b>: choose one of two answers.</li>
      <li><b>Multiple choice</b>: choose one answer.</li>
      <li><b>Multiple response</b>: tick all right answers. Drive Town rule: a multiple response counts only if you tick all right answers and no wrong one.</li>
      <li><b>Number</b>: type a number. The unit is shown after the field.</li>
      <li><b>Picture</b>: press Play to start the clip. It stops at the key moment. Tap a marker, or choose a name in the list.</li>
      <li><b>Order</b>: tap the choices or markers in order. Tap a numbered one to remove it.</li>
    </ul>
    <p>${prefs.singleKeys ? 'Keys: 1 to 5 choose an answer, J and N answer Ja and Nee, M marks, O opens the overview. ' : ''}Arrow keys and Enter move between questions. Escape closes a window. Escape never ends the exam.</p>
    <p>Your answers are saved in this browser. If you leave, you can resume from the start card.</p>
    <details><summary>Exam words</summary><dl class="help-controls">${words}</dl>
    <p class="help-scope">Most of these words come from a CBR sample screen. Some labels are our own wording. The current CBR screen may differ.</p></details>
    <div class="exam-actions"><button type="button" class="primary-button" data-act="close-help">Back to the exam</button></div>`;
}
