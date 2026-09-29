/* Chapters: intro, 01 origins (wind → swell → orbits), 02 breaking (shoaling over a seabed).
   Each chapter: enter(S, film), update(S, ct, sdt, dt), camera(S, ct, out). */
(function () {
  const SURF = window.SURF, U = SURF.util, W = SURF.wave;
  const C = (SURF.chapters = SURF.chapters || {});

  /* A peeling point-break wave, used by several chapters. */
  SURF.setupPeel = function (S, H, curl) {
    Object.assign(S.hero, { H, X: 0, curl, peelZ: 0, peelMode: 1, broken: 0, speed: 5.5 });
    S.swell.A = 0.18;
    S.swell.L = 70;
    S.chop = 0.3;
    S.lipSpray = 55 * curl;
    S.wwSpray = 80;
    Object.assign(S.sound, { surf: 0.9, wind: 0.15 });
  };
  SURF.advancePeel = (S, sdt) => { S.hero.peelZ += S.hero.speed * sdt; };

  C.intro = {
    id: 'intro',
    kicker: 'A short film',
    title: 'How Surfing Works',
    subtitle: 'From a distant storm to riding the barrel',
    enter(S) { SURF.setupPeel(S, 2.3, 0.92); S.dof = 0.3; },
    update(S, ct, sdt) { SURF.advancePeel(S, sdt); },
    camera(S, ct, out) {
      const z = S.hero.peelZ, k = U.ss(0, 7.5, ct);
      out.target.set(1.5, U.lerp(3, 1.2, k), z + U.lerp(26, 8, k));
      out.pos.set(U.lerp(60, 17, k), U.lerp(22, 3, k), z + U.lerp(80, 26, k));
    },
  };

  C.wind = {
    id: 'wind', num: '01', short: 'Origins',
    kicker: 'Where waves come from',
    title: 'Born in a storm',
    lines: [
      'Every wave you surf began as <b>wind</b> — often a storm thousands of kilometres away.',
      'Wind drags on the sea: ripples grow into chop, chop into <b>swell</b>. Stronger wind, blowing longer over more open water, builds bigger swell.',
      'Swell sorts itself into long, smooth lines that can cross whole oceans while losing surprisingly little energy.',
      'The twist: the water does not travel with the wave. Each drop just <b>loops in a circle</b> — only the energy moves forward.',
      'The loops shrink with depth. About half a wavelength down (the <b>wave base</b>) the water is almost still.',
    ],
    params: { wind: 0.6, orbits: true },
    controls: [
      { type: 'range', key: 'wind', label: 'Wind strength', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.3 ? 'Breeze' : v < 0.7 ? 'Strong wind' : 'Storm') },
      { type: 'toggle', key: 'orbits', label: 'Show water particles' },
    ],
    enter(S) {
      S.cutZ = 0;
      Object.assign(S.bed, { visible: true, start: 1e4, slope: 0, far: 21 });
      S.swell.L = 36;
      S.swell.A = 0.1;
      this.ramp = 0;
      this.labels = SURF.makeLabels([
        ['Wind', 0], ['Energy travels this way →', 1], ['One drop of water: it just loops', 3], ['Wave base ≈ ½ wavelength — calm below', 4, 30],
      ]);
    },
    update(S, ct, sdt) {
      const p = this.params;
      this.ramp = Math.min(1, this.ramp + sdt / 6);
      const r = U.ss(0, 1, this.ramp);
      S.swell.A = (0.35 + 1.25 * p.wind) * (0.2 + 0.8 * r);
      S.chop = 0.12 + 0.7 * p.wind * r;
      S.windStreaks = 0.25 + 0.75 * p.wind;
      S.showOrbits = p.orbits;
      S.sound.wind = 0.25 + 0.75 * p.wind;
      S.sound.surf = 0.25;
      const L = this.labels;
      L[0].p.set(-9, 2.6, 2);
      L[1].p.set(10, S.swell.A + 1.2, 0.1);
      L[2].p.copy(SURF.particles.hero).y += 0.3;
      L[3].p.set(-13, -S.swell.L / 2 + 0.2, 0.1);
      S.labels = p.orbits ? L : L.slice(0, 2);
    },
    camera(S, ct, out) {
      out.target.set(0, -6.5, -2);
      out.pos.set(Math.sin(ct * 0.06) * 5, 3.5, 33);
    },
  };

  C.breaking = {
    id: 'breaking', num: '02', short: 'Breaking',
    kicker: 'Meeting the shore',
    title: 'Why waves break',
    lines: [
      'In deep water a swell never touches the bottom. It rolls along at full speed.',
      'As the seabed rises, the water loops scrape the bottom. The wave <b>slows down and grows taller</b> — this is called shoaling.',
      'The base drags while the crest keeps going, so the face gets steeper and steeper…',
      'When the height reaches about <b>0.8 × the water depth</b> it can no longer hold its shape. The crest pitches forward: the wave breaks.',
      'A <b>gentle slope</b> makes soft, crumbling waves. A <b>sudden reef</b> makes hollow, powerful ones. Try the seabed slider.',
    ],
    params: { slope: 0.6, size: 1.3 },
    controls: [
      { type: 'range', key: 'slope', label: 'Seabed', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.35 ? 'Gentle sandbar' : v < 0.7 ? 'Medium slope' : 'Sudden reef') },
      { type: 'range', key: 'size', label: 'Swell height', min: 0.6, max: 1.8, step: 0.05, fmt: (v) => v.toFixed(1) + ' m' },
    ],
    slope() { return U.lerp(0.06, 0.3, this.params.slope); },
    enter(S) {
      S.cutZ = 0;
      S.swell.A = 0.08;
      S.swell.L = 50;
      S.chop = 0.12;
      S.bed.visible = true;
      Object.assign(S.hero, { peelMode: 0, H: 0, curl: 0, broken: 0 });
      this.labels = SURF.makeLabels([['Seabed', 1, 30], ['Beach', 0, 40]]);
      this.reset(S);
    },
    reset(S) {
      const sl = this.slope();
      Object.assign(S.bed, { start: -40, slope: sl, far: 12 });
      S.hero.X = -40 + 1 / sl - 22;
      S.hero.broken = 0;
      this.broke = false;
      this.age = 0;
      this.since = 0;
      this.done = 0;
    },
    update(S, ct, sdt) {
      const h = S.hero, p = this.params;
      if (!this.broke) S.bed.slope = this.slope();
      const d = Math.max(0.25, W.depthAt(h.X));
      h.X += 0.8 * Math.sqrt(U.G * d) * sdt;
      this.since += sdt;
      if (!this.broke) {
        h.H = p.size * Math.pow(12 / d, 0.3) * U.ss(0, 1.2, this.since);
        const r = h.H / d;
        h.curl = 0.3 * U.ss(0.45, 0.78, r);
        if (r >= 0.78) {
          this.broke = true;
          this.age = 0;
          this.Hb = h.H;
          this.style = U.lerp(0.3, 1.0, U.ss(0.25, 0.8, p.slope));
          S.sound.crash = 0.5 + 0.5 * this.style;
        }
        S.lipSpray = 0;
        S.wwSpray = 0;
      } else {
        this.age += sdt;
        const a = this.age, st = this.style, tp = U.lerp(0.5, 1.0, st);
        h.curl = Math.max(0.3 * (1 - U.ss(0, 0.5, a)), st * U.ss(0, tp, a) * (1 - U.ss(tp + 0.4, tp + 1.3, a)));
        h.broken = U.ss(tp * 0.6, tp + 0.9, a);
        h.H = U.lerp(this.Hb, Math.max(0.15, 0.55 * d), U.ss(tp * 0.7, tp + 1.8, a));
        S.lipSpray = 110 * h.curl * st;
        S.wwSpray = 140 * h.broken * Math.min(1, h.H);
      }
      S.timeScale = this.broke && this.age < 2.4 ? 0.4 : 1; // slow-motion while it breaks
      if (W.bedY(h.X) > -0.3) this.done += sdt;
      S.fade = Math.max(U.ss(0, 0.6, this.done), 1 - U.ss(0, 0.5, this.since));
      if (this.done > 0.7) this.reset(S);
      S.sound.surf = 0.35 + 0.5 * h.broken;

      const r = h.H / Math.max(d, 0.01);
      let state = 'Deep water — the wave barely feels the bottom';
      if (this.broke) state = h.broken > 0.6 ? 'Whitewater — the broken wave rolls to shore' : st2(this.style);
      else if (r > 0.55) state = 'Steepening — about to break!';
      else if (r > 0.2) state = 'Shoaling — slowing down and growing taller';
      S.hud = {
        rows: [['Water depth', d.toFixed(1) + ' m'], ['Wave height', h.H.toFixed(1) + ' m'], ['Wave speed', Math.round(Math.sqrt(U.G * d) * 3.6) + ' km/h']],
        meter: Math.min(1, r), mark: 0.78, mlabel: 'height ÷ depth', mnote: 'breaks ≈ 0.78',
        state,
      };
      const L = this.labels, sx = h.X + 14, beachX = W.beachStart() + S.bed.shelf / 0.08 + 8;
      L[0].p.set(sx, W.bedY(sx) + 0.1, -0.5);
      L[1].p.set(beachX, W.bedY(beachX) + 0.2, -3);
      S.labels = L;
    },
    camera(S, ct, out) {
      const x = S.hero.X;
      out.target.set(x + 4, -1.6, -1);
      out.pos.set(x + 1, 3, 21);
    },
  };

  function st2(style) {
    return style > 0.65 ? 'Plunging! The lip throws forward and crashes' : 'Spilling — the crest crumbles down the face';
  }
})();
