/* Game input: keyboard (arrows / WASD + Space), touch (drag to steer, tap to pump) and, on phones,
   tilt steering from the motion sensor (calibrated to however the phone is being held). */
(function () {
  const SURF = window.SURF;
  const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };

  SURF.createGameInput = function (dom) {
    const I = { active: false, up: false, down: false, left: false, right: false, pump: false, touch: null, touchUsed: false };

    addEventListener('keydown', (e) => {
      if (!I.active || e.target.tagName === 'INPUT') return;
      if (KEYS[e.code]) { I[KEYS[e.code]] = true; e.preventDefault(); }
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!e.repeat) I.pump = true;
        e.preventDefault();
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      }
    });
    addEventListener('keyup', (e) => { if (KEYS[e.code]) I[KEYS[e.code]] = false; });
    addEventListener('blur', () => { I.up = I.down = I.left = I.right = false; });

    dom.addEventListener('pointerdown', (e) => {
      if (!I.active) return;
      I.touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: performance.now() };
      I.touchUsed = e.pointerType !== 'mouse';
    });
    dom.addEventListener('pointermove', (e) => {
      if (I.touch && I.touch.id === e.pointerId) { I.touch.x = e.clientX; I.touch.y = e.clientY; }
    });
    const end = (e) => {
      const t = I.touch;
      if (!t || t.id !== e.pointerId) return;
      if (performance.now() - t.t < 250 && Math.hypot(t.x - t.x0, t.y - t.y0) < 12) I.pump = true;
      I.touch = null;
    };
    dom.addEventListener('pointerup', end);
    dom.addEventListener('pointercancel', end);

    // ---- tilt ----
    const T = (I.tilt = { on: false, sx: 0, sy: 0, bx: null, by: null });
    I.canTilt = 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches;
    const screenAngle = () => {
      const a = screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle : window.orientation || 0;
      return ((a % 360) + 360) % 360;
    };
    function onOrient(e) {
      if (e.beta == null || e.gamma == null) return;
      const a = screenAngle(), b = e.beta, g = e.gamma;
      // sx: right edge of the screen dips (+); sy: top of the screen tips away from you (+)
      if (a === 90) { T.sx = b; T.sy = -g; } else if (a === 270) { T.sx = -b; T.sy = g; } else if (a === 180) { T.sx = -g; T.sy = -b; } else { T.sx = g; T.sy = b; }
      if (T.bx === null) I.calibrate();
    }
    I.calibrate = () => { T.bx = T.sx; T.by = T.sy; };
    /* must be called from a tap: iOS asks for motion permission. Resolves to an error message or null. */
    I.enableTilt = async () => {
      if (!I.canTilt) return 'Tilt needs a phone or tablet';
      if (!window.isSecureContext) return 'Tilt needs the page on HTTPS';
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const r = await DeviceOrientationEvent.requestPermission();
          if (r !== 'granted') return 'Motion access was declined';
        }
      } catch (err) {
        return 'Motion access unavailable';
      }
      T.bx = null;
      addEventListener('deviceorientation', onOrient);
      T.on = true;
      return null;
    };
    I.disableTilt = () => { removeEventListener('deviceorientation', onOrient); T.on = false; };
    const tiltAxis = (d, range) => {
      const dead = 2.5, m = Math.max(0, Math.abs(d) - dead) * Math.sign(d);
      return SURF.util.clamp(m / range, -1, 1);
    };
    I.buzz = (pattern) => { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* unsupported */ } };

    /* -1 = climb toward the lip, +1 = drop toward the bottom */
    I.vertical = () => {
      if (I.touch) return SURF.util.clamp((I.touch.y - I.touch.y0) / 70, -1, 1);
      if (T.on && T.bx !== null) return tiltAxis(T.sy - T.by, 14);
      return (I.down ? 1 : 0) - (I.up ? 1 : 0);
    };
    /* -1 = race ahead (screen-left, toward the shoulder), +1 = stall (toward the curl) */
    I.horizontal = () => {
      if (I.touch) return SURF.util.clamp((I.touch.x - I.touch.x0) / 90, -1, 1);
      if (T.on && T.bx !== null) return tiltAxis(T.sx - T.bx, 16);
      return (I.right ? 1 : 0) - (I.left ? 1 : 0);
    };
    I.takePump = () => { const p = I.pump; I.pump = false; return p; };
    I.reset = () => { I.up = I.down = I.left = I.right = I.pump = false; I.touch = null; };
    return I;
  };
})();
