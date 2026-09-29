/* Chapters: 04 types of break (beach / point / reef), 07 reading a surf forecast. */
(function () {
  const SURF = window.SURF, U = SURF.util, W = SURF.wave;
  const C = (SURF.chapters = SURF.chapters || {});

  const SPOTS = {
    beach: { peelMode: 2, H: 2.0, curl: 0.78, speed: 4, shoulder: 26, taper: 0.7, lip: 40 },
    point: { peelMode: 1, H: 2.0, curl: 0.6, speed: 5, shoulder: 110, taper: 0.3, lip: 30 },
    reef: { peelMode: 1, H: 2.7, curl: 1.0, speed: 8, shoulder: 24, taper: 0.8, lip: 90 },
  };

  C.breaks = {
    id: 'breaks', num: '04', short: 'Breaks',
    kicker: 'Where waves break',
    title: 'Beach, point or reef',
    lines: [
      'Where a wave breaks depends on what is underneath it. Surfers talk about three kinds of <b>break</b>.',
      '<b>Beach break</b> — waves break over shifting sandbars. Peaks pop up in different places and often peel both left and right: an <b>A-frame</b>.',
      '<b>Point break</b> — swell wraps around a headland and peels down the coast in long, even walls. The best for long rides.',
      '<b>Reef break</b> — waves jack up over shallow rock or coral. Hollow, powerful and consistent, but the bottom is close and sharp.',
    ],
    params: { spot: 'beach' },
    controls: [{ type: 'seg', key: 'spot', label: 'Spot', options: [['beach', 'Beach'], ['point', 'Point'], ['reef', 'Reef']] }],
    enter(S) { this.spot = null; this.labels = SURF.makeLabels([['Peak', 0, 70], ['← Goes left', 0, 40], ['Goes right →', 0, 40], ['Long, even wall', 0, 50], ['Shallow reef: hollow & heavy', 0, 60]]); },
    setup(S, spot) {
      this.spot = spot;
      const o = SPOTS[spot];
      Object.assign(S.hero, { H: o.H, X: 0, curl: o.curl, peelMode: o.peelMode, speed: o.speed, shoulder: o.shoulder, taper: o.taper, broken: 0 });
      S.hero.peakZ = S.hero.peelZ = 0;
      S.swell.A = 0.18; S.swell.L = 60; S.chop = 0.25;
      S.lipSpray = o.lip * o.curl; S.wwSpray = 80;
      Object.assign(S.sound, { surf: 0.9, wind: 0.15 });
      this.t = 0;
      this.since = 0;
      S.camSnap = true;
      S.dof = 0.2;
    },
    update(S, ct, sdt) {
      if (S.film.active) this.params.spot = ['beach', 'beach', 'point', 'reef'][Math.max(0, S.captionIndex)];
      if (this.params.spot !== this.spot) this.setup(S, this.params.spot);
      const h = S.hero;
      this.t += sdt;
      this.since += sdt;
      if (h.peelMode === 2) {
        // each set wave pops up at a slightly different peak, then peels both ways
        if (this.t > 8) { this.t = 0; h.peakZ = U.rand(-6, 6); this.since = 0; }
        h.peelZ = h.peakZ + 1.5 + h.speed * this.t;
        S.fade = Math.max(U.ss(7.4, 8, this.t), 1 - U.ss(0, 0.5, this.since));
      } else {
        h.peelZ += h.speed * sdt;
        S.fade = 1 - U.ss(0, 0.5, this.since);
      }
      const L = this.labels, pk = h.peelMode === 2 ? h.peakZ : h.peelZ;
      W.at(-0.1 * h.H, pk + (h.peelMode === 2 ? 0 : 1.5), L[0].p);
      const side = h.peelZ - h.peakZ + 5;
      W.at(0.6 * h.H, h.peakZ - side, L[1].p);
      W.at(0.6 * h.H, h.peakZ + side, L[2].p);
      W.at(0.7 * h.H, h.peelZ + 30, L[3].p);
      W.at(0.9 * h.H, h.peelZ + 6, L[4].p);
      S.labels = this.spot === 'beach' ? L.slice(0, 3) : this.spot === 'point' ? [L[0], L[3]] : [L[0], L[4]];
    },
    camera(S, ct, out) {
      const h = S.hero;
      if (h.peelMode === 2) {
        out.target.set(1.5, 0.8, h.peakZ);
        out.pos.set(21, 9, h.peakZ + Math.sin(ct * 0.1) * 5);
      } else SURF.orbitCam(S, ct, out, this.spot === 'point' ? 38 : 28);
    },
  };

  const TIDE = { low: 1.0, mid: 0.75, high: 0.45 };

  C.forecast = {
    id: 'forecast', num: '07', short: 'Forecast',
    kicker: 'Reading the surf report',
    title: 'Is it worth paddling out?',
    lines: [
      'A surf forecast is a recipe. Learn to read a few numbers and you will know if it is worth paddling out.',
      '<b>Swell height & period</b> — period is the time between waves. A long period (12 s or more) carries more energy, so waves break bigger and stronger than the height suggests.',
      '<b>Swell angle</b> — swell hitting the coast at an angle peels. Swell that hits straight on breaks all at once: a <b>closeout</b>.',
      '<b>Wind</b> — light or offshore (from land to sea) is best. Onshore wind makes it choppy and crumbly.',
      '<b>Tide</b> — changes the depth of water over the bottom. Low tide is often hollower and faster; high tide softer and fuller.',
    ],
    params: { height: 1.8, period: 13, angle: 30, wind: 10, dir: 'offshore', tide: 'mid', rider: true },
    controls: [
      { type: 'range', key: 'height', label: 'Swell height', min: 0.5, max: 3.2, step: 0.1, fmt: (v) => v.toFixed(1) + ' m' },
      { type: 'range', key: 'period', label: 'Swell period', min: 6, max: 18, step: 1, fmt: (v) => v + ' s' },
      { type: 'range', key: 'angle', label: 'Swell angle to the coast', min: 0, max: 60, step: 1, fmt: (v) => v + '°' },
      { type: 'range', key: 'wind', label: 'Wind speed', min: 0, max: 40, step: 1, fmt: (v) => v + ' km/h' },
      { type: 'seg', key: 'dir', label: 'Wind direction', options: [['offshore', 'Offshore'], ['cross', 'Cross'], ['onshore', 'Onshore']] },
      { type: 'seg', key: 'tide', label: 'Tide', options: [['low', 'Low'], ['mid', 'Mid'], ['high', 'High']] },
      { type: 'toggle', key: 'rider', label: 'Show a surfer' },
    ],
    enter(S) { SURF.setupPeel(S, 2, 0.8); S.dof = 0.35; this.tau = 6; this.pos = new THREE.Vector3(); },
    update(S, ct, sdt, dt) {
      const p = this.params, h = S.hero;
      const w = p.wind / 30;
      const sign = p.dir === 'offshore' ? -1 : p.dir === 'onshore' ? 1 : 0;
      const windHurt = sign > 0 ? 0.4 * w : sign === 0 ? 0.15 * w : -0.08 * w;
      h.H = p.height * (0.75 + p.period / 28);
      h.curl = U.clamp(TIDE[p.tide] - windHurt, 0.05, 1);
      h.speed = U.clamp(4 / Math.sin((Math.max(p.angle, 2) * Math.PI) / 180), 3.5, 45);
      const closeout = h.speed > 18;
      if (closeout) {
        // straight-on swell: the whole crest pitches at once, then collapses into whitewater
        this.co = ((this.co || 0) + sdt) % 7;
        const a = this.co;
        h.peelMode = 0;
        h.curl = h.curl * U.ss(0.5, 2, a) * (1 - U.ss(2.6, 3.6, a));
        h.broken = U.ss(2.2, 3.4, a) * (1 - U.ss(6, 7, a));
        h.H *= U.lerp(1, 0.45, U.ss(2.6, 4.5, a)) * U.lerp(0.5, 1, U.ss(0, 1.5, a) + U.ss(6, 7, a));
        S.wwSpray = 120 * h.broken;
      } else { h.peelMode = 1; h.broken = 0; S.wwSpray = 80; }
      S.swell.L = 0.55 * p.period * p.period;
      S.swell.A = 0.08 + p.period * 0.01;
      S.chop = sign > 0 ? 0.12 + 0.9 * w : sign === 0 ? 0.1 + 0.5 * w : 0.1 + 0.15 * w;
      S.wind = sign * Math.min(1, w);
      S.lipSpray = (35 + 70 * Math.max(0, -S.wind)) * h.curl;
      SURF.advancePeel(S, sdt);
      S.surferVisible = p.rider && !closeout;
      if (S.surferVisible) {
        this.tau += sdt;
        if (this.tau > 23.4) this.tau = 6;
        this.pos.copy(SURF.ride.update(S, SURF.surfer, this.tau, dt));
        S.fade = Math.max(U.ss(23, 23.4, this.tau), 1 - U.ss(6, 6.4, this.tau));
      } else S.boardSpray = null;

      let score = 1 + (p.height > 0.8 ? 1 : 0) + (p.period >= 11 ? 1 : 0) + (p.angle >= 15 && p.angle <= 50 ? 1 : 0) + (windHurt < 0.1 ? 1 : 0) - (windHurt > 0.3 ? 1 : 0);
      if (closeout) score = 1;
      score = U.clamp(score, 1, 5);
      const verdict = closeout ? 'Closing out — the whole wave breaks at once. Stay on the beach.'
        : ['', 'Flat or messy — maybe go for a coffee', 'Rideable, but nothing special', 'Fun — a good day to surf', 'Really good — get out there', 'Epic — the whole town is paddling out'][score];
      S.hud = {
        rows: [
          ['Swell', `${p.height.toFixed(1)} m @ ${p.period} s`],
          ['Angle', `${p.angle}° ${p.angle < 12 ? '(straight on)' : ''}`],
          ['Wind', `${p.wind} km/h ${p.dir}`],
          ['Tide', p.tide],
          ['Rating', '★'.repeat(score) + '☆'.repeat(5 - score)],
        ],
        state: verdict,
      };
    },
    camera(S, ct, out) {
      if (!S.surferVisible) { SURF.orbitCam(S, ct, out, 32); return; }
      const p = this.pos;
      out.target.set(p.x, p.y + 0.8, p.z);
      out.pos.set(p.x + 14, p.y + 5, p.z + 12);
    },
  };
})();
