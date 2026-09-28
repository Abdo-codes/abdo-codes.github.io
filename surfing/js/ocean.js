/* The ocean: one big non-uniform grid (dense near the camera focus) displaced on the GPU.
   surfaceGLSL mirrors SURF.wave.surface() in waveMath.js. */
(function () {
  const SURF = window.SURF;

  const surfaceGLSL = /* glsl */ `
    uniform float uTime, uSwellA, uSwellK, uSwellPhase, uChop;
    uniform float uH, uHX, uCurl, uPeelZ, uPeakZ, uPeelMode, uBroken, uShoulder, uTaper, uRip;
    uniform vec2 uOrigin;

    vec3 heroEnv(float z) {
      if (uPeelMode < 0.5) return vec3(uH, uCurl, uBroken);
      float dz = uPeelMode > 1.5 ? abs(z - uPeakZ) - (uPeelZ - uPeakZ) : z - uPeelZ;
      if (dz >= 0.0) return vec3(uH * (1.0 - uTaper * smoothstep(10.0, uShoulder, dz)), uCurl * (1.0 - smoothstep(2.0, 18.0, dz)), 0.0);
      return vec3(uH * (1.0 - 0.45 * smoothstep(0.0, 12.0, -dz)), uCurl * (1.0 - smoothstep(0.0, 6.0, -dz)), smoothstep(0.5, 8.0, -dz));
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
      float u = rest.x - uHX;
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
      return vec3(uHX + hx - uSwellA * sin(th), hy + uSwellA * cos(th) + uChop * chopAt(rest, uTime) * exp(-length(rest - uOrigin) / 70.0), rest.y);
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

  const frag = /* glsl */ `
    uniform vec3 uCamPos;
    uniform float uAlpha, uCutZ, uTime, uFogDensity, uUnder;
    varying vec3 vWorld;
    varying vec3 vNormal;
    varying vec4 vInfo;
    varying vec2 vHero;
    varying float vBed;
    varying float vTrail;
    uniform float uRip;
    ${SURF.skyGLSL}
    vec2 h22(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
    // animated cellular noise: ~0 at bubble centres, high along the foam lace between them
    float cells(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      float m = 1.0;
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y)), o = h22(i + g);
        o = 0.5 + 0.4 * sin(uTime * 0.8 + 6.2831 * o);
        m = min(m, length(g + o - f));
      }
      return m;
    }
    void main() {
      if (vWorld.z > uCutZ) discard;
      vec2 p = vWorld.xz;
      float dist = length(vWorld - uCamPos);
      vec3 N = normalize(vNormal);
      N = normalize(mix(N, vec3(0.0, 1.0, 0.0), 0.75 * smoothstep(60.0, 700.0, dist)));
      N.xz += 0.03 * exp(-dist / 40.0) * vec2(sin(p.x * 2.9 + p.y * 1.1 + uTime * 3.2) + 0.5 * sin(p.x * 6.3 - p.y * 4.7 + uTime * 5.3),
                           sin(-p.x * 1.7 + p.y * 3.9 + uTime * 2.7) + 0.5 * sin(p.x * 4.4 + p.y * 7.1 - uTime * 4.1));
      N = normalize(N);
      vec3 V = normalize(uCamPos - vWorld);
      if (dot(N, V) < 0.0) N = -N;
      float NdV = max(dot(N, V), 0.0);
      float fres = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);
      vec3 R = reflect(-V, N);
      R.y = abs(R.y);
      vec3 refl = skyColor(R);

      float H = vInfo.w;
      float up = H > 0.05 ? clamp(vHero.y / H, 0.0, 1.2) : 0.0;
      float front = vHero.x > -0.3 * H ? 1.0 : 0.45;
      float toSun = pow(clamp(dot(-V, uSunDir) * 0.5 + 0.5, 0.0, 1.0), 2.0);
      float sss = clamp(up * up * front * (0.4 + 0.9 * toSun), 0.0, 1.0);
      vec3 sunCol = srgb(vec3(1.0, 0.74, 0.48));
      vec3 deep = srgb(vec3(0.03, 0.17, 0.25));
      vec3 mid = srgb(vec3(0.04, 0.3, 0.37));
      vec3 glow = srgb(vec3(0.3, 0.88, 0.72));
      vec3 water = mix(deep, mid, 0.35 + 0.35 * up);
      water = mix(water, glow, sss * 0.8);
      if (uRip > 0.5) {
        // shallow sandbars glow turquoise, the deeper rip channel stays dark — that's the tell
        water = mix(srgb(vec3(0.02, 0.15, 0.27)), srgb(vec3(0.22, 0.72, 0.7)), smoothstep(-4.2, -1.2, vBed));
        water = mix(water, srgb(vec3(0.85, 0.75, 0.55)), smoothstep(-0.6, 0.1, vBed) * 0.7);
      }
      float diff = max(dot(N, uSunDir), 0.0);
      water *= vec3(0.55) + 0.6 * diff * sunCol;
      vec3 col = mix(water, refl, fres * (uRip > 0.5 ? 0.3 : 0.7));
      // widen + dim the sun glint with distance so far-off ripples don't sparkle into a pattern
      float far = smoothstep(30.0, 400.0, dist);
      float spec = pow(max(dot(R, uSunDir), 0.0), mix(220.0, 50.0, far));
      col += sunCol * spec * mix(5.0, 2.2, far);

      float n = 0.5 + 0.25 * sin(p.x * 1.7 + p.y * 0.6 + uTime * 1.3) * sin(p.y * 1.3 - uTime * 1.1)
                    + 0.25 * sin(p.x * 3.1 - p.y * 2.3 + uTime * 2.0);
      float lip = vInfo.x * smoothstep(0.9, 0.995, vInfo.y) * (0.55 + 0.45 * n);
      float f = max(max(smoothstep(0.2, 0.7, lip), vInfo.z * 1.15), vTrail * 0.6);
      float foam = 0.0;
      if (f > 0.02) {
        // lacy foam: solid in the whitewater core, bubbles and threads toward its edges
        vec2 fp = p * 1.7 + vec2(uTime * 0.6, uTime * 0.2);
        float lace = 0.6 * cells(fp) + 0.4 * cells(fp * 2.4 + 7.0);
        foam = smoothstep(0.32, 0.62, f + (lace - 0.45) * (0.9 - 0.5 * f)) * min(1.0, f * 3.0);
      }
      vec3 foamCol = srgb(vec3(0.95, 0.93, 0.9)) * (0.6 + 0.45 * diff) + sunCol * 0.12;
      col = mix(col, foamCol, foam);

      float fog = 1.0 - exp(-pow(dist * uFogDensity, 1.6));
      col = mix(col, skyColor(normalize(vec3(-V.x, 0.015, -V.z))), fog);
      if (uUnder > 0.5) {
        // seen from below: bright Snell's window overhead, total internal reflection elsewhere
        float win = smoothstep(0.5, 0.85, NdV);
        vec3 through = skyColor(normalize(vec3(-V.x * 0.5, 1.0, -V.z * 0.5))) * 0.8;
        col = mix(srgb(vec3(0.04, 0.3, 0.36)) * (0.7 + 0.6 * abs(N.x) + 0.3 * sss), through, win);
        col = mix(col, srgb(vec3(0.8, 0.9, 0.9)), foam * 0.5);
        col = mix(col, srgb(vec3(0.02, 0.16, 0.22)), 1.0 - exp(-dist * 0.035));
      }

      gl_FragColor = vec4(col, clamp(uAlpha + fres * 0.5 + foam, 0.0, 1.0));
      #include <tonemapping_fragment>
      #include <encodings_fragment>
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
  const GRIDS = { high: [600, 400], medium: [420, 280], low: [280, 190] };

  SURF.createOcean = function (scene) {
    const grids = {};
    const grid = (name) => grids[name] || (grids[name] = makeGrid(...GRIDS[name]));
    const geo = grid('high');

    const uniforms = {
      uTime: { value: 0 }, uSwellA: { value: 0 }, uSwellK: { value: 0.1 }, uSwellPhase: { value: 0 }, uChop: { value: 0 },
      uH: { value: 0 }, uHX: { value: 0 }, uCurl: { value: 0 }, uPeelZ: { value: 0 }, uPeelMode: { value: 1 }, uBroken: { value: 0 },
      uPeakZ: { value: 0 }, uShoulder: { value: 60 }, uTaper: { value: 0.55 }, uRip: { value: 0 }, uUnder: SURF.under,
      uOrigin: { value: new THREE.Vector2() }, uCamPos: { value: new THREE.Vector3() },
      uAlpha: { value: 1 }, uCutZ: { value: 1e5 }, uFogDensity: { value: 0.0021 }, uSunDir: { value: SURF.sunDir },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);

    return {
      mesh,
      setDetail(name) { mesh.geometry = grid(name); },
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
      },
    };
  };
})();
