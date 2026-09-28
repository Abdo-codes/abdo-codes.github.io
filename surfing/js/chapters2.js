/* Chapters: 03 anatomy, 05 riding, and the film outro. */
(function () {
  const SURF = window.SURF, U = SURF.util, W = SURF.wave;
  const C = (SURF.chapters = SURF.chapters || {});
  const tmp = new THREE.Vector3();

  function orbitCam(S, ct, out, r, zRef) {
    const z = (zRef === undefined ? S.hero.peelZ : zRef) + 9;
    out.target.set(1.5, 0.8, z);
    const az = 0.42 + 0.14 * Math.sin(ct * 0.12), el = 0.13;
    out.pos.set(1.5 + r * Math.cos(el) * Math.cos(az), 1 + r * Math.sin(el), z + r * Math.cos(el) * Math.sin(az));
  }
  SURF.orbitCam = orbitCam;
  function waveLabel(L, uN, dz, S, lift) {
    const z = S.hero.peelZ + dz, H = W.env(z).H;
    W.at(uN * H, z, L.p);
    if (lift) L.p.y += lift;
  }

  C.anatomy = {
    id: 'anatomy', num: '03', short: 'Anatomy',
    kicker: 'Reading the wave',
    title: 'Anatomy of a wave',
    lines: [
      'Great waves do not break all at once. They <b>peel</b>: the break runs along the crest like a zipper. That is what lets you ride across it.',
      '<b>Peak</b> — the highest point, where it starts to break. This is where surfers take off.',
      '<b>Pocket</b> — the steep part right beside the curl, where the wave has the most power and speed.',
      '<b>Face</b> and <b>shoulder</b> — the open, unbroken wall ahead of you. It gets softer the further it is from the curl.',
      '<b>Lip</b> and <b>barrel</b> — on hollow waves the lip throws out over the face and leaves a tube of air: the barrel.',
      '<b>Whitewater</b> — the foam left behind the curl. Beginners learn here: it simply pushes you toward the beach.',
    ],
    params: { hollow: 0.92, speed: 1 },
    controls: [
      { type: 'range', key: 'hollow', label: 'Hollowness', min: 0.2, max: 1, step: 0.01, fmt: (v) => (v < 0.45 ? 'Mellow' : v < 0.8 ? 'Punchy' : 'Barrelling') },
      { type: 'range', key: 'speed', label: 'Time', min: 0, max: 1, step: 0.05, fmt: (v) => (v === 0 ? 'Frozen' : v < 1 ? 'Slow motion' : 'Real time') },
    ],
    enter(S) {
      SURF.setupPeel(S, 2.3, this.params.hollow);
      this.labels = SURF.makeLabels([
        ['Peels this way →', 0, -40], ['Peak', 1, 70], ['Pocket', 2, -60], ['Face', 3, 50], ['Shoulder', 3],
        ['Lip', 4, 40], ['Barrel', 4, -30], ['Whitewater', 5, 60],
      ]);
    },
    update(S, ct, sdt) {
      const p = this.params, L = this.labels;
      S.timeScale = p.speed;
      S.hero.curl = p.hollow;
      S.lipSpray = 55 * p.hollow;
      SURF.advancePeel(S, sdt);
      const z = S.hero.peelZ, H = S.hero.H;
      L[0].p.set(4.5, 0.4, z + 24);
      const a = tmp.copy(L[0].p).project(SURF.camera).x, b = tmp.set(4.5, 0.4, z + 30).project(SURF.camera).x;
      L[0].text = b < a ? '← Peels this way' : 'Peels this way →';
      waveLabel(L[1], -0.15, 1.5, S, 0.25);
      waveLabel(L[2], 0.95, 6, S);
      waveLabel(L[3], 0.9, 17, S);
      waveLabel(L[4], 0.5, 36, S);
      waveLabel(L[5], -0.4, 4, S);
      W.at(-0.38 * H, z + 1.5, tmp);
      W.at(0.6 * H, z + 1.5, L[6].p);
      L[6].p.lerp(tmp, 0.45);
      waveLabel(L[7], 0.3, -12, S, 0.6);
      S.labels = L;
    },
    camera(S, ct, out) { orbitCam(S, ct, out, 32); },
  };

  C.ride = {
    id: 'ride', num: '05', short: 'Riding',
    kicker: 'Catching & riding',
    title: 'How to ride a wave',
    steps: true,
    lines: [
      '<b>Paddle.</b> Lie on the board, chest up, and paddle hard toward shore. You must match the wave’s speed so it can pick you up.',
      '<b>Pop up.</b> Hands under your chest, push, and spring to your feet in one move — front foot between your hands, knees bent.',
      '<b>Drop and turn.</b> Angle along the face instead of going straight to the beach, then lean into a bottom turn.',
      '<b>Trim the pocket.</b> Stay close to the curl where it is steepest. Rise and fall on the face to keep your speed.',
      '<b>Get barrelled.</b> If the lip throws over you, crouch low, hold your line, and ride out with the spray.',
      '<b>Kick out.</b> When the wave ends, turn up and over the back of it — then paddle back out for the next one.',
    ],
    params: { cam: 'follow', speed: 1 },
    controls: [
      { type: 'seg', key: 'cam', label: 'Camera', options: [['follow', 'Follow'], ['wide', 'Wide']] },
      { type: 'range', key: 'speed', label: 'Speed', min: 0.25, max: 1, step: 0.05, fmt: (v) => (v >= 1 ? 'Real time' : v.toFixed(2) + '×') },
    ],
    enter(S) {
      SURF.setupPeel(S, 2.4, 0.9);
      S.hero.speed = 6;
      S.surferVisible = true;
      this.tau = 0;
      this.pos = new THREE.Vector3();
      this.offset = new THREE.Vector3();
    },
    update(S, ct, sdt, dt) {
      S.timeScale = this.params.speed;
      this.tau += sdt;
      if (this.tau >= SURF.ride.PERIOD) this.tau -= SURF.ride.PERIOD;
      const tau = this.tau, grow = U.ss(0, 4.5, tau);
      S.hero.H = 2.4 * (0.5 + 0.5 * grow);
      S.hero.curl = 0.9 * (0.3 + 0.7 * grow);
      S.lipSpray = 50 * S.hero.curl;
      SURF.advancePeel(S, sdt);
      this.pos.copy(SURF.ride.update(S, SURF.surfer, tau, dt));
      S.activeLine = SURF.ride.phase(tau);
      S.fade = Math.max(1 - U.ss(0, 0.6, tau), U.ss(25.3, 26, tau));
      S.sound.surf = 0.6 + 0.4 * grow;
      S.allowUnder = this.params.cam === 'follow';
      S.drops = this.params.cam === 'follow' ? U.ss(16.5, 17.5, tau) * (1 - U.ss(20.5, 23, tau)) : 0;
    },
    captionIndex(S) { return S.activeLine; },
    camera(S, ct, out) {
      const p = this.pos, tau = this.tau;
      if (this.params.cam === 'wide') {
        out.target.set(p.x, p.y + 0.8, p.z);
        out.pos.set(p.x + 24, 8, p.z + 16);
        return;
      }
      const pad = 1 - U.ss(4.5, 6.5, tau);
      const barrel = U.ss(14.6, 15.8, tau) * (1 - U.ss(19.2, 20.4, tau));
      const kick = U.ss(22.5, 24, tau);
      const under = U.ss(10.4, 11.2, tau) * (1 - U.ss(13.2, 14.2, tau)); // look up at the board from underwater
      const o = this.offset.set(10, 3, 9);
      o.lerp(tmp.set(7.5, 2, 3.5), pad);
      o.lerp(tmp.set(3.6, -2.9, 4.5), under);
      o.lerp(tmp.set(3.4, 0.9, 7.5), barrel);
      o.lerp(tmp.set(13, 5, 5), kick);
      out.target.set(p.x, p.y + 0.9, p.z);
      out.pos.copy(out.target).add(o);
    },
  };

  C.outro = {
    id: 'outro',
    kicker: 'Now go surf',
    title: 'The ocean does the work.',
    subtitle: 'You just have to be in the right spot.',
    enter(S) {
      SURF.setupPeel(S, 2.4, 0.9);
      S.hero.speed = 6;
      S.surferVisible = true;
      this.tau = 8;
      this.pos = new THREE.Vector3();
    },
    update(S, ct, sdt, dt) {
      this.tau += sdt;
      SURF.advancePeel(S, sdt);
      this.pos.copy(SURF.ride.update(S, SURF.surfer, Math.min(this.tau, 14), dt));
    },
    camera(S, ct, out) {
      const p = this.pos;
      out.target.set(p.x, p.y + 1, p.z);
      out.pos.set(p.x + 14 + ct * 1.6, p.y + 4 + ct * 1.4, p.z + 10 + ct * 2.2);
    },
  };
})();
