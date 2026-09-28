/* Cinematic post-processing: HDR render → bloom → one grading pass (sun rays, underwater tint,
   lens droplets, ACES tone mapping, split-tone grade, vignette, grain). Falls back to a plain
   render if the three.js effect scripts did not load. */
(function () {
  const SURF = window.SURF;

  const GradeShader = {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uExposure: { value: 1.05 },
      uUnder: { value: 0 },
      uDrops: { value: 0 },
      uSun: { value: new THREE.Vector2(0.5, 0.5) },
      uSunVis: { value: 0 },
      uVignette: { value: 0.5 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float uTime, uExposure, uUnder, uDrops, uSunVis, uVignette;
      uniform vec2 uRes, uSun;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
      vec3 fit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.432951) + 0.238081; return a / b; }
      vec3 aces(vec3 c) {
        const mat3 inM = mat3(vec3(0.59719, 0.076, 0.0284), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
        const mat3 outM = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
        return clamp(outM * fit(inM * (c * uExposure / 0.6)), 0.0, 1.0);
      }
      vec3 toSRGB(vec3 c) { return mix(1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, 12.92 * c, step(c, vec3(0.0031308))); }

      // water droplets on the lens: returns uv offset in xy, highlight in z
      vec3 drops(vec2 uv, float scale, float seed) {
        vec2 g = uv * vec2(uRes.x / uRes.y, 1.0) * scale;
        g.y += uTime * 0.04 * (1.0 + seed);
        vec2 id = floor(g), f = fract(g) - 0.5;
        float h = hash(id + seed);
        vec2 c = vec2(hash(id + 3.1 + seed), hash(id + 7.7 + seed)) - 0.5;
        c *= 0.5;
        float r = 0.12 + 0.18 * hash(id + 1.3);
        vec2 d = f - c;
        float l = length(d);
        float m = smoothstep(r, r * 0.8, l) * step(1.0 - uDrops * 0.22, h);
        float rim = smoothstep(r * 0.55, r * 0.85, l) * m; // light only catches the edge of a drop
        return vec3(-d * m * 0.9 / scale, rim);
      }

      void main() {
        vec2 uv = vUv;
        uv += uUnder * 0.003 * vec2(sin(uv.y * 38.0 + uTime * 1.8), cos(uv.x * 31.0 + uTime * 1.5));
        vec3 dr = vec3(0.0);
        if (uDrops > 0.01) { dr = drops(uv, 6.0, 0.0) + drops(uv, 13.0, 4.0) * 0.8; uv += dr.xy; }
        vec3 col = texture2D(tDiffuse, uv).rgb;

        // light shafts from the sun (screen-space radial blur of the brightest pixels)
        if (uSunVis > 0.01) {
          vec2 st = (uSun - vUv) / 22.0;
          vec2 p = vUv;
          float acc = 0.0, decay = 1.0;
          for (int i = 0; i < 22; i++) {
            p += st;
            vec3 s = texture2D(tDiffuse, p).rgb;
            acc += max(dot(s, vec3(0.333)) - 1.1, 0.0) * decay;
            decay *= 0.93;
          }
          col += vec3(1.0, 0.72, 0.45) * acc * 0.035 * uSunVis;
        }

        if (uUnder > 0.01) {
          float shafts = pow(0.5 + 0.5 * sin((vUv.x + vUv.y * 0.35) * 26.0 + sin(vUv.x * 7.0 + uTime * 0.7) * 2.0 + uTime * 0.4), 6.0);
          vec3 uw = col * vec3(0.35, 0.8, 0.95) + vec3(0.0, 0.035, 0.05) + shafts * vec3(0.05, 0.12, 0.12) * vUv.y;
          col = mix(col, uw, uUnder);
        }

        col = aces(col);
        float l = dot(col, vec3(0.299, 0.587, 0.114));
        col *= mix(vec3(0.9, 1.0, 1.06), vec3(1.05, 1.0, 0.94), smoothstep(0.1, 0.8, l)); // teal shadows, warm highlights
        col *= 1.0 + dr.z * 0.18;
        vec2 q = vUv - 0.5;
        col *= 1.0 - uVignette * dot(q, q) * 1.5;
        col = toSRGB(clamp(col, 0.0, 1.0));
        col += (hash(vUv * uRes + fract(uTime)) - 0.5) * 0.014;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  };

  SURF.createPost = function (renderer, scene, camera) {
    if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass || !THREE.ShaderPass) return null;
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, stencilBuffer: true });
    rt.samples = 4;
    const composer = new THREE.EffectComposer(renderer, rt);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(4, 4), 0.38, 0.65, 0.95);
    composer.addPass(bloom);
    const grade = new THREE.ShaderPass(GradeShader);
    grade.material.toneMapped = false;
    composer.addPass(grade);
    const u = grade.uniforms;
    const sp = new THREE.Vector3(), camDir = new THREE.Vector3();

    return {
      enabled: true,
      /* quality hook: turn the whole chain on/off and change MSAA samples */
      configure(on, samples) {
        this.enabled = on;
        if (rt.samples !== samples) {
          rt.samples = composer.renderTarget2.samples = samples;
          rt.dispose();
          composer.renderTarget2.dispose();
        }
      },
      setSize(w, h) { composer.setSize(w, h); u.uRes.value.set(w, h); },
      render(S, dt, under) {
        u.uTime.value += dt;
        u.uUnder.value = under;
        u.uDrops.value = S.drops;
        u.uVignette.value = S.film.active ? 0.62 : 0.45;
        sp.copy(camera.position).addScaledVector(SURF.sunDir, 1000).project(camera);
        camera.getWorldDirection(camDir);
        const facing = camDir.dot(SURF.sunDir);
        const off = Math.max(Math.abs(sp.x), Math.abs(sp.y));
        u.uSun.value.set(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5);
        u.uSunVis.value = facing > 0 ? (1 - SURF.util.ss(1.0, 1.6, off)) * (1 - under) : 0;
        bloom.strength = under > 0.5 ? 0.22 : 0.38;
        composer.render(dt);
      },
    };
  };
})();
