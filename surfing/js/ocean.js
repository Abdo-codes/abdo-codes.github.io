/* The ocean: one big non-uniform grid (dense near the camera focus) displaced on the GPU.
   surfaceGLSL mirrors SURF.wave.surface() in waveMath.js; the fragment shader is in oceanFrag.js. */
(function () {
  const SURF = window.SURF;

  const surfaceGLSL = /* glsl */ `
    uniform float uTime, uSwellA, uSwellK, uSwellPhase, uChop;
    uniform float uH, uHX, uCurl, uPeelZ, uPeakZ, uPeelMode, uBroken, uShoulder, uTaper, uRip;
    uniform vec2 uOrigin;

    // no two stretches of a real crest are identical: gentle height and position changes along z
    float crestVar(float z) { return 1.0 + 0.07 * sin(z * 0.093 + 1.3) + 0.05 * sin(z * 0.231 + 0.4) + 0.03 * sin(z * 0.61 + 2.2); }
    float crestShift(float z) { return 0.3 * sin(z * 0.071 + 0.9) + 0.12 * sin(z * 0.19 + 2.4); }
    vec3 heroEnvBase(float z) {
      if (uPeelMode < 0.5) return vec3(uH, uCurl, uBroken);
      float dz = uPeelMode > 1.5 ? abs(z - uPeakZ) - (uPeelZ - uPeakZ) : z - uPeelZ;
      if (dz >= 0.0) return vec3(uH * (1.0 - uTaper * smoothstep(10.0, uShoulder, dz)), uCurl * (1.0 - smoothstep(2.0, 18.0, dz)), 0.0);
      return vec3(uH * (1.0 - 0.45 * smoothstep(0.0, 12.0, -dz)), uCurl * (1.0 - smoothstep(0.0, 6.0, -dz)), smoothstep(0.5, 8.0, -dz));
    }
    vec3 heroEnv(float z) {
      vec3 e = heroEnvBase(z);
      return vec3(e.x * crestVar(z), min(1.0, e.y * (1.0 + 0.1 * sin(z * 0.17 + 2.0))), e.z);
    }
    float chopAt(vec2 p, float t) {
      return ${SURF.CHOP.map((c) => `${c.a.toFixed(4)} * sin(${c.kx.toFixed(4)} * p.x + ${c.kz.toFixed(4)} * p.y - ${c.w.toFixed(4)} * t + ${c.ph.toFixed(3)})`).join('\n        + ')};
    }
    float wwNoise(vec2 p, float t) {
      return sin(1.3 * p.x + 2.1 * t) * sin(1.1 * p.y - 1.7 * t) + 0.5 * sin(2.7 * p.x - 0.9 * p.y + 3.3 * t);
    }
    float ripBed(vec2 p) {
      float base = min(2.5, -7.0 + 0.14 * (p.x + 30.0));
      float bx = (p.x + 5.0) / 7.0, bz = p.y / 7.0;
      return base + 2.3 * exp(-bx * bx) * (1.0 - exp(-bz * bz));
    }
    // info: (curl, lip weight, whitewater, local height)   hero: (u, hero height)
    vec3 surface(vec2 rest, out vec4 info, out vec2 hero) {
      vec3 e = heroEnv(rest.y);
      float H = e.x, b = e.y;
      float shift = crestShift(rest.y);
      float u = rest.x - uHX - shift;
      float hx = u, hy = 0.0, w = 0.0, fz = 0.0;
      if (H > 0.001) {
        float sb = 1.7 * H + 0.5;
        float sf = mix(1.0 * H + 0.4, 0.62 * H + 0.2, b);
        float s = u < 0.0 ? sb : sf;
        hy = H * exp(-(u * u) / (2.0 * s * s));
        float tr = (u - 2.2 * H) / (1.2 * H + 0.3);
        hy -= H * 0.18 * exp(-tr * tr);
        float q = (u + 0.35 * H) / (0.45 * H + 0.05);
        w = exp(-q * q);
        hx = u + b * 1.55 * H * w;
        hy += b * H * (0.12 * w - 0.55 * pow(w, 6.0));
        float fr = (u - 0.3 * H) / (1.5 * H + 0.2);
        fz = e.z * exp(-fr * fr);
        hy += fz * H * 0.1 * wwNoise(rest, uTime);
      }
      float th = uSwellK * rest.x - uSwellPhase;
      if (uRip > 0.5) {
        // rip-current beach: waves break over the sandbars but not in the channel
        float bd = ripBed(rest);
        float crest = smoothstep(0.45, 1.0, cos(th));
        fz = max(fz, smoothstep(-2.5, -1.4, bd) * crest * 0.95 + smoothstep(-0.9, -0.2, bd) * 0.6);
      }
      info = vec4(b, w, fz, H);
      hero = vec2(u, hy);
      return vec3(uHX + shift + hx - uSwellA * sin(th), hy + uSwellA * cos(th) + uChop * chopAt(rest, uTime) * exp(-length(rest - uOrigin) / 70.0), rest.y);
    }
  `;

  const vert = /* glsl */ `
    varying vec3 vWorld;
    varying vec3 vNormal;
    varying vec4 vInfo;
    varying vec2 vHero;
    varying float vBed;
    varying float vTrail;
    ${surfaceGLSL}
    float p7(float s) { float s2 = s * s; return s * s2 * s2 * s2; }
    void main() {
      vec2 st = position.xz;
      vec2 lp = vec2(40.0 * st.x + 1460.0 * p7(st.x), 60.0 * st.y + 1440.0 * p7(st.y));
      vec2 rest = uOrigin + lp;
      float e = 0.05 + 0.004 * length(lp);
      vec4 info, d4; vec2 hero, d2;
      vec3 p = surface(rest, info, hero);
      vec3 px = surface(rest + vec2(e, 0.0), d4, d2);
      vec3 pz = surface(rest + vec2(0.0, e), d4, d2);
      vNormal = normalize(cross(pz - p, px - p));
      vWorld = p;
      vInfo = info;
      vHero = hero;
      vBed = uRip > 0.5 ? ripBed(rest) : -50.0;
      // foam left behind (seaward of) the rolling whitewater, thinning out over ~20 m
      vTrail = info.w > 0.05 ? heroEnv(rest.y).z * smoothstep(0.0, -0.6 * info.w, hero.x) * exp(hero.x / 22.0) : 0.0;
      gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
    }
  `;

  /* grid in [-1, 1]²; the vertex shader spreads it out, dense near the focus */
  function makeGrid(NX, NZ) {
    const pos = new Float32Array((NX + 1) * (NZ + 1) * 3);
    let i = 0;
    for (let j = 0; j <= NZ; j++) {
      for (let k = 0; k <= NX; k++) {
        pos[i++] = (k / NX) * 2 - 1;
        pos[i++] = 0;
        pos[i++] = (j / NZ) * 2 - 1;
      }
    }
    const idx = new Uint32Array(NX * NZ * 6);
    i = 0;
    for (let j = 0; j < NZ; j++) {
      for (let k = 0; k < NX; k++) {
        const a = j * (NX + 1) + k, b = a + 1, c = a + NX + 1, d = c + 1;
        idx[i++] = a; idx[i++] = c; idx[i++] = b;
        idx[i++] = b; idx[i++] = c; idx[i++] = d;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    return geo;
  }
  const GRIDS = { high: [600, 400, 3], medium: [420, 280, 2], low: [280, 190, 1] };
  const TRAIL = 24, TRAIL_LIFE = 1.6;

  SURF.createOcean = function (scene) {
    const grids = {};
    const grid = (name) => grids[name] || (grids[name] = makeGrid(GRIDS[name][0], GRIDS[name][1]));
    const tex = SURF.textures;
    const uniforms = {
      uTime: { value: 0 }, uSwellA: { value: 0 }, uSwellK: { value: 0.1 }, uSwellPhase: { value: 0 }, uChop: { value: 0 },
      uH: { value: 0 }, uHX: { value: 0 }, uCurl: { value: 0 }, uPeelZ: { value: 0 }, uPeelMode: { value: 1 }, uBroken: { value: 0 },
      uPeakZ: { value: 0 }, uShoulder: { value: 60 }, uTaper: { value: 0.55 }, uRip: { value: 0 }, uUnder: SURF.under,
      uOrigin: { value: new THREE.Vector2() }, uCamPos: { value: new THREE.Vector3() },
      uAlpha: { value: 1 }, uCutZ: { value: 1e5 }, uFogDensity: { value: 0.0021 }, uSunDir: { value: SURF.sunDir },
      uRipples: { value: tex.ripples }, uFoamTex: { value: tex.foam }, uEnv: { value: SURF.env.cube }, uDetail: { value: 3 },
      uBoard: { value: Array.from({ length: TRAIL }, () => new THREE.Vector4()) }, uBoardN: { value: 0 }, uBoardBox: { value: new THREE.Vector4() },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: SURF.oceanFrag, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(grid('high'), mat);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // the board's wake: recent tail positions while the surfer is standing
    const trail = [], tail = new THREE.Vector3();
    let lastT = -1;
    function updateTrail(S) {
      const s = SURF.surfer, now = S.t;
      if (!S.surferVisible || !s) trail.length = 0;
      else if (s.stand > 0.6 && now - lastT > 0.05) {
        lastT = now;
        s.root.localToWorld(tail.set(-0.8, 0.03, 0));
        if (trail.length && trail[0].p.distanceTo(tail) > 3) trail.length = 0; // the surfer was moved
        trail.unshift({ p: tail.clone(), t: now });
        if (trail.length > TRAIL) trail.pop();
      }
      while (trail.length && (now - trail[trail.length - 1].t > TRAIL_LIFE || now < trail[trail.length - 1].t)) trail.pop();
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      trail.forEach((pt, i) => {
        uniforms.uBoard.value[i].set(pt.p.x, pt.p.y, pt.p.z, (now - pt.t) / TRAIL_LIFE);
        x0 = Math.min(x0, pt.p.x); z0 = Math.min(z0, pt.p.z); x1 = Math.max(x1, pt.p.x); z1 = Math.max(z1, pt.p.z);
      });
      uniforms.uBoardN.value = trail.length;
      uniforms.uBoardBox.value.set(x0 - 1.2, z0 - 1.2, x1 + 1.2, z1 + 1.2);
    }

    return {
      mesh,
      setDetail(name) { mesh.geometry = grid(name); uniforms.uDetail.value = GRIDS[name][2]; },
      update(S, camera) {
        const u = uniforms, h = S.hero;
        u.uTime.value = S.t;
        u.uSwellA.value = S.swell.A;
        u.uSwellK.value = (2 * Math.PI) / S.swell.L;
        u.uSwellPhase.value = S.swell.phase;
        u.uChop.value = S.chop;
        u.uH.value = h.H; u.uHX.value = h.X; u.uCurl.value = h.curl;
        u.uPeelZ.value = h.peelZ; u.uPeelMode.value = h.peelMode; u.uBroken.value = h.broken;
        u.uPeakZ.value = h.peakZ; u.uShoulder.value = h.shoulder; u.uTaper.value = h.taper; u.uRip.value = S.rip ? 1 : 0;
        u.uOrigin.value.set(S.focus.x, S.focus.z);
        u.uCamPos.value.copy(camera.position);
        u.uAlpha.value = S.alpha;
        u.uCutZ.value = S.cutZ;
        mat.transparent = S.alpha < 0.999;
        updateTrail(S);
      },
    };
  };
})();
