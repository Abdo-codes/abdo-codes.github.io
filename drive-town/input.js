const acceleratorKeys = new Set(['KeyW', 'ArrowUp']);
const brakeKeys = new Set(['Space', 'ArrowDown']);
const TAP_MS = 220;
export class DrivingInput {
  constructor() { this.keys = new Map(); this.pointers = new Map(); }
  keyDown(code, now) { if (!this.keys.has(code)) this.keys.set(code, now); }
  keyUp(code, now) {
    const start = this.keys.get(code); this.keys.delete(code);
    if (start === undefined || now - start > TAP_MS) return null;
    if (acceleratorKeys.has(code)) return this.driveOnRelease(now);
    if (brakeKeys.has(code)) return 'stop';
    return null;
  }
  pointerDown(id, pedal, now) { this.pointers.set(id, { pedal, start: now }); }
  pointerUp(id, now, cancelled = false) {
    const pointer = this.pointers.get(id); this.pointers.delete(id);
    if (!pointer || cancelled || now - pointer.start > TAP_MS) return null;
    return pointer.pedal === 'accelerate' ? this.driveOnRelease(now) : 'stop';
  }
  driveOnRelease(now) {
    if (this.sample(now).brake || [...this.keys.keys()].some(key => acceleratorKeys.has(key))
      || [...this.pointers.values()].some(pointer => pointer.pedal === 'accelerate')) return null;
    return 'drive';
  }
  sample(now) {
    const keys = [...this.keys.keys()], pointers = [...this.pointers.values()];
    return {
      accelerate: keys.some(key => acceleratorKeys.has(key)) || pointers.some(pointer => pointer.pedal === 'accelerate' && now - pointer.start > TAP_MS),
      brake: keys.some(key => brakeKeys.has(key)) || pointers.some(pointer => pointer.pedal === 'brake'),
    };
  }
  clear() { this.keys.clear(); this.pointers.clear(); }
}
export function bindPedals(getSession) {
  const input = new DrivingInput(), buttons = ['accelerate', 'brake'].map(id => document.getElementById(id));
  const activate = action => {
    input.clear();
    if (action === 'drive') getSession().drive();
    if (action === 'stop') getSession().requestStop();
  };
  buttons.forEach(button => {
    let lastPointerEnd = -Infinity;
    button.addEventListener('pointerdown', event => {
      if (getSession().status !== 'driving') return;
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      input.pointerDown(event.pointerId, button.id, performance.now()); button.classList.add('held');
    });
    const release = (event, cancelled = false) => {
      const action = input.pointerUp(event.pointerId, performance.now(), cancelled);
      lastPointerEnd = performance.now(); button.classList.remove('held');
      if (action) activate(action);
    };
    button.addEventListener('pointerup', event => release(event));
    for (const name of ['pointercancel', 'lostpointercapture']) button.addEventListener(name, event => release(event, true));
    button.addEventListener('click', event => {
      if (event.detail === 0 && performance.now() - lastPointerEnd > 300) activate(button.id === 'accelerate' ? 'drive' : 'stop');
    });
  });
  document.addEventListener('keydown', event => {
    if (!acceleratorKeys.has(event.code) && !brakeKeys.has(event.code)) return;
    if (document.getElementById('help-dialog').open || document.getElementById('lessons-dialog').open
      || event.target?.matches?.('input, textarea, select')) return;
    event.preventDefault();
    if (!event.repeat && getSession().status === 'driving') input.keyDown(event.code, performance.now());
  });
  document.addEventListener('keyup', event => {
    const action = input.keyUp(event.code, performance.now());
    if (action && getSession().status === 'driving') activate(action);
  });
  return {
    sample: () => {
      const value = input.sample(performance.now());
      buttons.forEach(button => button.classList.toggle('held', value[button.id]));
      return value;
    },
    clear: () => { input.clear(); buttons.forEach(button => button.classList.remove('held')); },
  };
}
