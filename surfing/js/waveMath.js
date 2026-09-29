/* Shared scene state + wave surface math.
   The GLSL `surface()` in ocean.js mirrors `surface()` here — keep them in sync. */
(function () {
  const SURF = (window.SURF = window.SURF || {});
  const G = 9.81;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const srgb = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  SURF.util = { G, clamp, ss, lerp, rand, srgb };

  const S = (SURF.state = {
    t: 0,
    swell: { A: 0, L: 60, phase: 0 },
    hero: {},
    bed: {},
    sound: {},
    film: { active: false, lb: 0 },
    focus: new THREE.Vector3(),
    captionIndex: 99,
  });

  /* Reset everything a chapter might have touched back to a calm ocean. */
  SURF.resetScene = function () {
    S.timeScale = 1;
    S.swell.A = 0.25;
    S.swell.L = 60;
    S.chop = 0.3;
    S.wind = 0;
    Object.assign(S.hero, { H: 0, X: 0, curl: 0, peelZ: 0, peakZ: 0, peelMode: 1, broken: 0, speed: 5, shoulder: 60, taper: 0.55 });
    S.alpha = 1;
    S.cutZ = 1e5;
    Object.assign(S.bed, { visible: false, start: -40, slope: 0, far: 20, shelf: 1.2 });
    S.showOrbits = false;
    S.windStreaks = 0;
    S.lipSpray = 0;
    S.wwSpray = 0;
    S.boardSpray = null;
    S.labels = [];
    S.hud = null;
    S.activeLine = -1;
    S.fade = 0;
    S.surferVisible = false;
    S.surfer2Visible = false;
    S.rip = false;
    S.allowUnder = false;
    S.drops = 0;
    S.camSnap = false;
    S.game = null;
    S.inset = null;
    S.insetRect = null;
    S.timing = null;
    S.dof = 0; // depth of field strength for this shot (0 = everything sharp)
    S.waveShade = true; // let the wave block the sun on the surfer (off for diagrams)
    Object.assign(S.sound, { surf: 0.5, wind: 0.1, crash: 0 });
  };
  SURF.resetScene();

  /* Hero wave envelope along the crest (z): height, curl (hollowness) and whitewater. */
  const env = { H: 0, b: 0, foam: 0 };
  // no two stretches of a real crest are identical (mirrors crestVar / crestShift in ocean.js)
  const crestVar = (z) => 1 + 0.07 * Math.sin(z * 0.093 + 1.3) + 0.05 * Math.sin(z * 0.231 + 0.4) + 0.03 * Math.sin(z * 0.61 + 2.2);
  const crestShift = (z) => 0.3 * Math.sin(z * 0.071 + 0.9) + 0.12 * Math.sin(z * 0.19 + 2.4);
  function heroEnv(z) {
    heroEnvBase(z);
    env.H *= crestVar(z);
    env.b = Math.min(1, env.b * (1 + 0.1 * Math.sin(z * 0.17 + 2.0)));
    return env;
  }
  function heroEnvBase(z) {
    const h = S.hero;
    if (h.peelMode === 0) {
      env.H = h.H; env.b = h.curl; env.foam = h.broken;
      return env;
    }
    // mode 1: one peel point moving +z. mode 2 (A-frame): peels both ways away from peakZ.
    const dz = h.peelMode === 2 ? Math.abs(z - h.peakZ) - (h.peelZ - h.peakZ) : z - h.peelZ;
    if (dz >= 0) {
      env.H = h.H * (1 - h.taper * ss(10, h.shoulder, dz));
      env.b = h.curl * (1 - ss(2, 18, dz));
      env.foam = 0;
    } else {
      env.H = h.H * (1 - 0.45 * ss(0, 12, -dz));
      env.b = h.curl * (1 - ss(0, 6, -dz));
      env.foam = ss(0.5, 8, -dz);
    }
    return env;
  }

  /* Wind chop: ten waves with irregular directions and wavelengths (no grid pattern).
     Each row: wavelength (m), direction (deg from +x), amplitude, phase. ocean.js builds its
     GLSL from this same table, so the surfer and the shader always agree. */
  SURF.CHOP = [
    [13, 8, 0.4, 0], [9.5, -27, 0.3, 1.3], [7.3, 41, 0.24, 2.1], [5.9, -58, 0.18, 0.7], [4.6, 17, 0.15, 4.2],
    [3.8, -12, 0.12, 5.1], [3.1, 73, 0.09, 2.9], [2.6, -39, 0.08, 3.7], [11, -80, 0.14, 1.9], [2.2, 28, 0.06, 0.4],
  ].map(([L, deg, a, ph]) => {
    const k = (2 * Math.PI) / L, r = (deg * Math.PI) / 180;
    return { kx: k * Math.cos(r), kz: k * Math.sin(r), w: 0.8 * Math.sqrt(G * k), a: a * 0.25, ph };
  });
  function chopAt(x, z, t) {
    let s = 0;
    for (const c of SURF.CHOP) s += c.a * Math.sin(c.kx * x + c.kz * z - c.w * t + c.ph);
    return s;
  }
  function wwNoise(x, z, t) {
    return Math.sin(1.3 * x + 2.1 * t) * Math.sin(1.1 * z - 1.7 * t) + 0.5 * Math.sin(2.7 * x - 0.9 * z + 3.3 * t);
  }

  /* Surface position for a rest point (x0, z) in world space. */
  function surface(x0, z, out) {
    const e = heroEnv(z), shift = crestShift(z);
    const H = e.H, b = e.b, u = x0 - S.hero.X - shift;
    let hx = u, hy = 0;
    if (H > 0.001) {
      const sb = 1.7 * H + 0.5;
      const sf = lerp(1.0 * H + 0.4, 0.62 * H + 0.2, b);
      const s = u < 0 ? sb : sf;
      hy = H * Math.exp(-(u * u) / (2 * s * s));
      const tr = (u - 2.2 * H) / (1.2 * H + 0.3);
      hy -= H * 0.18 * Math.exp(-tr * tr);
      // the lip: points just behind the crest get thrown forward and droop down
      const q = (u + 0.35 * H) / (0.45 * H + 0.05);
      const w = Math.exp(-q * q);
      hx = u + b * 1.55 * H * w;
      hy += b * H * (0.12 * w - 0.55 * Math.pow(w, 6));
      const fr = (u - 0.3 * H) / (1.5 * H + 0.2);
      hy += e.foam * Math.exp(-fr * fr) * H * 0.1 * wwNoise(x0, z, S.t);
    }
    const k = (2 * Math.PI) / S.swell.L;
    const th = k * x0 - S.swell.phase;
    return out.set(
      S.hero.X + shift + hx - S.swell.A * Math.sin(th),
      hy + S.swell.A * Math.cos(th) + S.chop * chopAt(x0, z, S.t) * Math.exp(-Math.hypot(x0 - S.focus.x, z - S.focus.z) / 70),
      z
    );
  }

  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  SURF.wave = {
    env: heroEnv,
    surface,
    /* u is measured from the hero crest (positive = toward shore / down the face). */
    at(u, z, out) { return surface(S.hero.X + u, z, out); },
    normal(u, z, out) {
      const e = 0.08, x = S.hero.X + u;
      surface(x, z, _a); surface(x + e, z, _b); surface(x, z + e, _c);
      _b.sub(_a); _c.sub(_a);
      return out.crossVectors(_c, _b).normalize();
    },
    omega() { return Math.sqrt((G * 2 * Math.PI) / S.swell.L); },
    advance(sdt) { S.t += sdt; S.swell.phase += this.omega() * sdt; },
    /* Seabed: flat, then a ramp up to a shallow shelf (reef/sandbar), then a gentle beach. */
    bedY(x) {
      const b = S.bed;
      if (b.slope <= 0) return -b.far;
      const y = Math.min(-b.shelf, -b.far + b.slope * Math.max(0, x - b.start));
      const beach = this.beachStart();
      return x > beach ? Math.min(2.5, -b.shelf + 0.08 * (x - beach)) : y;
    },
    beachStart() { const b = S.bed; return b.start + (b.far - b.shelf) / b.slope + 25; },
    depthAt(x) { return Math.max(0, -this.bedY(x)); },
  };

  /* Label helper: chapters keep an array of {p, text, from} and update p each frame. */
  SURF.makeLabels = (list) => list.map(([text, from, lift]) => ({ text, from: from || 0, lift, p: new THREE.Vector3(), a: 0 }));
})();
