import { esc } from './exam-text.js';

// The picture area of the exam: the shared WebGL canvas, the Play button and the pins. `#world` moves into #exam-stage while the exam is open
// and goes back on close. `scene` is the controller of exam-scene.js. The pins are aria-hidden shortcuts: the named list is the control.
export function createStage({ root, canvas, scene }) {
  const area = root.querySelector('#exam-scene'), stage = root.querySelector('#exam-stage'), layer = root.querySelector('#exam-pins'), play = root.querySelector('#exam-play');
  const home = { parent: canvas.parentNode, next: canvas.nextSibling };
  let buttons = new Map(), shown = false, id = null;

  function mount() { if (canvas.parentNode !== stage) stage.prepend(canvas); }
  function unmount() { if (canvas.parentNode !== stage) return; if (home.next?.parentNode === home.parent) home.parent.insertBefore(canvas, home.next); else home.parent.appendChild(canvas); }
  function show(on) { shown = on; area.hidden = !on; root.dataset.scene = on ? 'yes' : 'no'; }

  // Shows a scene. `pinsOn` false hides the pin layer (the clip viewer of the review). `watched` goes to the freeze frame at once.
  function open(sceneId, { pinsOn = true, watched = false } = {}) {
    id = sceneId; mount(); show(true);
    const loaded = scene.load(sceneId); scene.hidePins(!pinsOn); if (watched) scene.skip();
    layer.innerHTML = pinsOn ? loaded.pins.map(pin => `<button type="button" class="exam-pin" data-pin="${esc(pin.id)}" tabindex="-1" aria-hidden="true" hidden><i></i><span>${esc(pin.label)}</span></button>`).join('') : '';
    buttons = new Map([...layer.children].map(button => [button.dataset.pin, button]));
    play.hidden = scene.phase !== 'ready';
    return loaded;
  }
  // close() hides the picture and keeps the canvas here; release() gives the canvas back to the drive.
  function close() { id = null; show(false); scene.clear(); layer.innerHTML = ''; buttons.clear(); }
  function release() { close(); unmount(); }

  // One render frame: draws the scene, shows the Play button until the first play, and puts each pin where it is projected.
  function frame(dt) {
    if (!shown || !id) return;
    const pins = scene.frame(dt, { w: stage.clientWidth, h: stage.clientHeight });
    play.hidden = scene.phase !== 'ready';
    stage.dataset.phase = scene.phase;
    const byId = new Map(pins.map(pin => [pin.id, pin]));
    for (const [key, button] of buttons) {
      const pin = byId.get(key); button.hidden = !pin;
      if (pin) button.style.transform = `translate(${Math.round(pin.x)}px, ${Math.round(pin.y)}px)`;
    }
  }
  // Marks the chosen pin and shows order numbers on the pins.
  function syncPins(item, value) {
    for (const [key, button] of buttons) {
      const list = Array.isArray(value) ? value : [], n = list.indexOf(key) + 1;
      button.classList.toggle('selected', value === key || n > 0); button.firstElementChild.textContent = item.type === 'order' ? (n || '') : '';
    }
  }
  return { open, close, release, frame, syncPins, get visible() { return shown; }, get sceneId() { return id; } };
}
