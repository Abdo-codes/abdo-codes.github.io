/* Chapter 06: when to pop up. A cut through the middle of the wave shows where the surfer sits on it,
   a picture-in-picture shows what the surfer sees, and a timing bar marks too early / now / too late.
   "Watch" plays three takes; "Try it" lets you choose the moment yourself. */
(function () {
  const SURF = window.SURF, U = SURF.util, W = SURF.wave;
  const C = (SURF.chapters = SURF.chapters || {});
  const H0 = 2.3, CW = 6.2, EARLY = 1.3, LATE = 0.5, ZS = -0.9;
  const DEMO = [{ at: 2.0, line: 2 }, { at: 0.95, line: 3 }, { at: 0.33, line: 4 }];
  const RESULT = {
    early: { kind: 'early', title: 'Too early', sub: 'The wave rolled under you', color: '#9cc8e0' },
    sweet: { kind: 'sweet', title: 'Perfect timing!', sub: 'It picked you up — now angle down the line', color: '#3fd6c4' },
    late: { kind: 'late', title: 'Too late', sub: 'The lip threw you over the falls', color: '#ff7a59' },
    wait: { kind: 'late', title: 'Too late', sub: 'You waited and the lip took you', color: '#ff7a59' },
  };
  const p = new THREE.Vector3(), n = new THREE.Vector3(), head = new THREE.Vector3(), dir = new THREE.Vector3();
  const tmp = new THREE.Vector3(), want = new THREE.Vector3(), ax = new THREE.Vector3(0, 0, 1), q = new THREE.Quaternion();
  const FWD = new THREE.Vector3(1, 0, 0), LINE = new THREE.Vector3(0.35, 0, -1).normalize(), BACK = new THREE.Vector3(-1, 0.24, 0.32).normalize();

  C.timing = {
    id: 'timing', num: '06', short: 'Timing', noOrbit: true,
    kicker: 'Catching the wave',
    title: 'When to pop up',
    lines: [
      'Timing is everything. Pop up too early and the wave rolls under you; too late and it throws you over the falls.',
      'Look back as it comes and paddle hard — you want to already be moving when the wave reaches you.',
      '<b>Too early:</b> the wave has not picked you up yet. You stand on flat water, lose speed, and it rolls under you.',
      '<b>Just right:</b> the tail lifts and the board starts to glide down the face on its own. That is the moment — pop up.',
      '<b>Too late:</b> you are at the very top as the lip pitches. The nose digs in and you go over the falls.',
      '<b>Your turn:</b> choose <b>Try it</b>, then press Space or tap to pop up. Watch the surfer’s view and the timing bar.',
    ],
    params: { mode: 'watch' },
    controls: [{ type: 'seg', key: 'mode', label: 'Mode', options: [['watch', 'Watch 3 takes'], ['try', 'Try it']] }],
    enter(S) {
      S.cutZ = 0;
      Object.assign(S.bed, { visible: true, start: -50, slope: 0.18, far: 12, shelf: 2.2 });
      Object.assign(S.hero, { peelMode: 0, H: H0 * 0.8, curl: 0, broken: 0 });
      S.swell.A = 0.06;
      S.swell.L = 50;
      S.chop = 0.1;
      S.surferVisible = true;
      S.waveShade = false;
      S.inset = {
        cam: this.cam || (this.cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 6000)),
        label: 'Surfer’s view',
        hide: SURF.surfer.hideables,
      };
      S.timing = { uN: 5, pop: null, result: null, kind: null };
      this.labels = SURF.makeLabels([['You', 0, 46]]);
      this.st = SURF.ride.makeState();
      this.input = SURF.gameInput;
      this.input.active = true;
      this.input.reset();
      this.mode = this.params.mode;
      this.take = 0;
      this.newRun(S);
    },
    leave() { this.input.active = false; },
    newRun(S) {
      this.r = { state: 'wait', v: 0, xs: 0, zs: ZS, popT: 0, resT: 0, turn: 0, beta: 0, u0: 0, y0: 0, splash: false };
      S.hero.X = -5.4 * H0; // the crest starts ~12 m behind the surfer
      S.hero.broken = 0;
      Object.assign(S.timing, { pop: null, result: null, kind: null, uN: 5 });
      this.demo = this.mode === 'watch' ? DEMO[this.take % 3] : null;
      this.since = 0;
      this.look = 0;
      this.st.heading.copy(FWD);
      S.boardSpray = null;
      S.camSnap = true;
    },
    pop(S, uN, forced) {
      const r = this.r, T = S.timing;
      T.pop = Math.max(0, uN);
      T.kind = forced ? 'wait' : uN > EARLY ? 'early' : uN < LATE ? 'late' : 'sweet';
      r.state = T.kind === 'sweet' ? 'ride' : T.kind === 'early' ? 'stand' : 'tumble';
      r.popT = 0;
      r.u0 = r.xs - S.hero.X;
      r.y0 = p.y;
      if (r.state === 'tumble') S.sound.crash = 0.9;
    },
    update(S, ct, sdt, dt) {
      if (S.film.active) this.params.mode = 'watch';
      if (this.params.mode !== this.mode) { this.mode = this.params.mode; this.take = 0; this.newRun(S); }
      const r = this.r, h = S.hero, T = S.timing, I = this.input;
      this.since += dt;
      h.X += CW * sdt;
      const H = (h.H = H0 * (0.8 + 0.2 * U.ss(8 * H0, 0, r.xs - h.X)));
      const u = r.xs - h.X, uN = u / H;
      const waiting = r.state === 'wait' || r.state === 'paddle';

      if (waiting) {
        T.uN = uN;
        if (this.demo ? uN <= this.demo.at : I.takePump()) this.pop(S, uN);
        else if (uN < 0.28) this.pop(S, uN, true); // never popped: the lip takes you
      } else I.takePump();

      // how hollow the wave is where the surfer is
      if (r.state === 'wait' || r.state === 'paddle') r.beta = 0.95 * U.ss(3.4, 0.3, uN);
      else if (T.kind === 'early') r.beta += (0.2 - r.beta) * (1 - Math.exp(-sdt * 1.5));
      else r.beta = Math.min(1, r.beta + sdt * (T.kind === 'sweet' ? 0.25 : 1.6));
      h.curl = r.beta;

      this.move(S, sdt, dt, u, uN, H);

      // slow motion around the take-off, real time for the aftermath
      const near = !T.result && uN < 2.4 && (waiting || r.popT < 1.2);
      S.timeScale = near ? (this.demo ? 0.45 : 0.6) : 1;
      if (T.result) {
        r.resT += dt;
        S.fade = U.ss(2.4, 3.0, r.resT);
        if (r.resT > 3.0) { this.take++; this.newRun(S); }
      }
      S.fade = Math.max(S.fade, 1 - U.ss(0, 0.45, this.since));
      S.activeLine = this.demo ? this.demo.line : 5;
      this.labels[0].p.copy(p).y += 1.9;
      S.labels = T.result ? [] : this.labels;
      S.sound.surf = 0.4 + 0.5 * r.beta;
    },
    move(S, sdt, dt, u, uN, H) {
      const r = this.r, st = this.st, T = S.timing, surfer = SURF.surfer;
      r.popT += sdt;
      let w;
      this.look = 0;
      if (r.state === 'tumble') {
        // carried up with the lip, then thrown forward and down into the trough
        const k1 = U.ss(0, 0.35, r.popT), k2 = U.ss(0.3, 1.3, r.popT);
        W.at(-0.38 * H, r.zs, tmp);
        p.set(S.hero.X + r.u0, r.y0, r.zs).lerp(tmp, k1);
        p.x += k2 * 1.8 * H;
        p.y = U.lerp(p.y, -0.4, Math.pow(k2, 1.5));
        r.xs = p.x;
        surfer.setPose({ paddle: 0.5, tuck: 0.5 }, S.t * 3);
        surfer.place(p, FWD, n.set(0, 1, 0));
        surfer.root.quaternion.premultiply(q.setFromAxisAngle(ax, -(k1 * 0.9 + k2 * 2.6)));
        if (k2 > 0.9 && !r.splash) { r.splash = true; S.burst = p.clone(); }
        if (r.popT > 1.6 && !T.result) T.result = RESULT[T.kind];
        S.boardSpray = null;
        this.pov(S, 1, true);
        return;
      }
      if (r.state === 'wait' || r.state === 'paddle') {
        if (uN < 4.2) r.state = 'paddle';
        r.v += ((r.state === 'paddle' ? 1.8 : 0) - r.v) * (1 - Math.exp(-sdt * 2));
        W.normal(u, r.zs, n);
        r.v = Math.min(r.v + 9.81 * Math.max(0, n.x) * 0.9 * sdt, CW - 1.2); // the face pushes you
        w = { paddle: 1 };
        this.look = U.ss(1.6, 2.6, uN); // glance back at the wave
      } else if (r.state === 'ride') {
        const k = U.ss(0, 0.5, r.popT);
        r.v = CW + U.clamp((1.35 * H - u) * 1.2, -1.5, 2.5); // drop to the bottom, then hold the face
        r.turn = U.ss(0.9, 2.2, r.popT);
        r.zs -= 4.5 * r.turn * sdt;
        w = { paddle: 1 - k, ride: k, tuck: 0.25 * k };
        if (r.popT > 3.4 && !T.result) T.result = RESULT.sweet;
      } else {
        const k = U.ss(0, 0.5, r.popT);
        r.v *= Math.exp(-sdt * 1.4); // standing on flat water: no speed
        w = { paddle: 1 - k, ride: k };
        if (u < -1.4 * H && !T.result) T.result = RESULT.early;
      }
      r.xs += r.v * sdt;
      const uu = r.xs - S.hero.X;
      W.at(uu, r.zs, p);
      W.normal(uu, r.zs, n);
      if (w.paddle > 0.5) p.addScaledVector(n, -0.03);
      want.copy(FWD).lerp(LINE, r.turn).normalize();
      st.heading.lerp(want, 1 - Math.exp(-dt * 6)).normalize();
      surfer.setPose(Object.assign(w, { look: this.look * 1.35, lookUp: -0.25 * this.look }), S.t);
      surfer.place(p, st.heading, n);
      const sp = st.spray;
      sp.rate = r.state === 'ride' ? 80 * U.ss(0.4, 0.8, r.popT) : 0;
      sp.p.copy(p).addScaledVector(st.heading, -0.85).addScaledVector(n, 0.05);
      sp.v.copy(st.heading).multiplyScalar(-1.5).addScaledVector(n, 1.8);
      S.boardSpray = sp;
      this.pov(S, r.state === 'wait' || r.state === 'paddle' ? 0 : U.ss(0, 0.5, r.popT), false);
    },
    /* the surfer's-eye camera: over the shoulder while the wave comes, then down the face */
    pov(S, standK, tumbling) {
      const cam = S.inset.cam;
      // look along the board (on a steep face that already points down the drop)
      const boardFwd = tmp.set(1, 0, 0).applyQuaternion(SURF.surfer.root.quaternion);
      head.copy(p).addScaledVector(n, U.lerp(0.42, 1.45, standK)).addScaledVector(boardFwd, U.lerp(0.3, -0.05, standK));
      dir.copy(boardFwd);
      dir.y += U.lerp(0.16, 0.4, standK); // eyes up: see the drop and the horizon, not just water
      dir.normalize().lerp(BACK, this.look).normalize();
      cam.position.copy(head);
      cam.up.set(0, 1, 0);
      cam.lookAt(tmp.copy(head).add(dir));
      if (tumbling) cam.rotateZ(this.r.popT * 5);
    },
    captionIndex(S) { return S.activeLine; },
    camera(S, ct, out) {
      const x = this.r ? this.r.xs : 0, portrait = SURF.camera.aspect < 0.8;
      out.target.set(x + 1.5, portrait ? 0.9 : -0.3, -1);
      out.pos.set(x + 0.6, portrait ? 2.8 : 2.2, portrait ? 19 : 15.5);
    },
  };
})();
