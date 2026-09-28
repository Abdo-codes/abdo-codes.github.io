/* Camera rig: chapters set a desired shot, the user can orbit/zoom around it, and everything is eased. */
(function () {
  const SURF = window.SURF;

  SURF.createRig = function (camera, dom) {
    const U = SURF.util;
    const panel = document.getElementById('panel');
    const up = new THREE.Vector3(0, 1, 0), off = new THREE.Vector3(), axis = new THREE.Vector3(), goal = new THREE.Vector3();
    const rig = {
      desiredPos: new THREE.Vector3(0, 5, 30),
      desiredTarget: new THREE.Vector3(),
      pos: new THREE.Vector3(0, 5, 30),
      target: new THREE.Vector3(),
      yaw: 0, pitch: 0, zoom: 1,
      interactive: true,
      orbit: true,
      snap: true,
      reset() { this.yaw = 0; this.pitch = 0; this.zoom = 1; },
      update(dt) {
        off.subVectors(this.desiredPos, this.desiredTarget);
        if (this.yaw) off.applyAxisAngle(up, this.yaw);
        if (this.pitch) {
          const el = Math.asin(U.clamp(off.y / off.length(), -1, 1));
          const p = U.clamp(this.pitch, -0.35 - el, 1.35 - el);
          axis.crossVectors(off, up).normalize();
          off.applyAxisAngle(axis, p);
        }
        off.multiplyScalar(this.zoom);
        goal.addVectors(this.desiredTarget, off);
        if (this.snap) {
          this.pos.copy(goal);
          this.target.copy(this.desiredTarget);
          this.snap = false;
        } else {
          this.pos.lerp(goal, 1 - Math.exp(-dt * 3.2));
          this.target.lerp(this.desiredTarget, 1 - Math.exp(-dt * 12)); // tight, so the subject stays centred
        }
        camera.position.copy(this.pos);
        camera.lookAt(this.target);
        this.frame(dt);
      },
      /* Centre the shot in the part of the screen the chapter panel doesn't cover. */
      ox: 0, oy: 0,
      frame(dt) {
        const W = dom.clientWidth, H = dom.clientHeight;
        let ox = 0, oy = 0;
        const free = (SURF.freeRect = SURF.freeRect || {});
        Object.assign(free, { x0: 0, y0: 0, x1: W, y1: H }); // stage area not covered by the panel (CSS px)
        if (this.interactive && !document.body.classList.contains('film')) {
          const r = panel.getBoundingClientRect(), s = dom.getBoundingClientRect();
          if (r.width < W * 0.6) { ox = -r.right / 2; free.x0 = Math.max(0, r.right - s.left); }
          else { oy = Math.max(0, H - r.top) / 2; free.y1 = Math.min(H, r.top - s.top); }
        }
        const k = 1 - Math.exp(-dt * 5);
        this.ox += (ox - this.ox) * k;
        this.oy += (oy - this.oy) * k;
        camera.setViewOffset(W, H, this.ox, this.oy, W, H);
      },
    };

    const pts = new Map();
    let lastDist = 0;
    dom.addEventListener('pointerdown', (e) => {
      if (!rig.orbit) return;
      dom.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    dom.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (pts.size === 1) {
        rig.yaw -= dx * 0.005;
        rig.pitch = U.clamp(rig.pitch + dy * 0.004, -1.5, 1.5);
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastDist) rig.zoom = U.clamp((rig.zoom * lastDist) / d, 0.35, 2.5);
        lastDist = d;
      }
    });
    const end = (e) => { pts.delete(e.pointerId); lastDist = 0; };
    dom.addEventListener('pointerup', end);
    dom.addEventListener('pointercancel', end);
    dom.addEventListener('wheel', (e) => {
      if (!rig.orbit) return;
      e.preventDefault();
      rig.zoom = U.clamp(rig.zoom * Math.exp(e.deltaY * 0.001), 0.35, 2.5);
    }, { passive: false });
    dom.addEventListener('dblclick', () => rig.reset());
    return rig;
  };
})();
