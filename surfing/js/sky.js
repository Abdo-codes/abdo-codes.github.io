/* Physically based golden-hour sky (Preetham/Hoffman daylight scattering, after the three.js Sky
   example, MIT) with a drifting cloud layer. It is also captured into an environment map:
   SURF.env.cube (sharp + mip-blurred reflections for custom shaders) and scene.environment (PBR). */
(function () {
  const SURF = window.SURF;
  SURF.sunDir = new THREE.Vector3(-1, 0.085, -0.42).normalize(); // ~4.5° above the horizon: golden hour
  SURF.under = { value: 0 }; // 1 while the camera is underwater (shared uniform)

  SURF.skyGLSL = /* glsl */ `
    uniform vec3 uSunDir;
    vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }
  `;

  const vert = /* glsl */ `
    uniform vec3 uSunDir;
    uniform float uRayleigh, uTurbidity, uMie;
    varying vec3 vDir;
    varying vec3 vBetaR;
    varying vec3 vBetaM;
    varying float vSunE;
    const vec3 TOTAL_RAYLEIGH = vec3(5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5);
    const vec3 MIE_CONST = vec3(1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14);
    void main() {
      vDir = position;
      float zen = clamp(uSunDir.y, -1.0, 1.0);
      vSunE = 1000.0 * max(0.0, 1.0 - exp(-((1.6110731556870734 - acos(zen)) / 1.5)));
      vBetaR = TOTAL_RAYLEIGH * uRayleigh;
      vBetaM = 0.434 * (0.2 * uTurbidity * 1e-17) * MIE_CONST * uMie;
      vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_Position = p.xyww;
    }
  `;

  const frag = /* glsl */ `
    uniform float uTime, uUnder, uMieG, uExposure;
    varying vec3 vDir;
    varying vec3 vBetaR;
    varying vec3 vBetaM;
    varying float vSunE;
    ${SURF.skyGLSL}
    float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float s = 0.0, a = 0.5;
      for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
      return s;
    }
    vec3 atmosphere(vec3 d) {
      const float PI = 3.141592653589793;
      float zenith = acos(max(0.0, d.y));
      float inv = 1.0 / (cos(zenith) + 0.15 * pow(93.885 - zenith * 180.0 / PI, -1.253));
      vec3 fex = exp(-(vBetaR * 8.4e3 * inv + vBetaM * 1.25e3 * inv));
      float cosT = dot(d, uSunDir);
      float rPhase = 0.05968310365946075 * (1.0 + pow(cosT * 0.5 + 0.5, 2.0));
      float g2 = uMieG * uMieG;
      float mPhase = 0.07957747154594767 * (1.0 - g2) / pow(1.0 - 2.0 * uMieG * cosT + g2, 1.5);
      vec3 bR = vBetaR * rPhase, bM = vBetaM * mPhase, ratio = (bR + bM) / (vBetaR + vBetaM);
      vec3 lin = pow(vSunE * ratio * (1.0 - fex), vec3(1.5));
      lin *= mix(vec3(1.0), pow(vSunE * ratio * fex, vec3(0.5)), clamp(pow(1.0 - uSunDir.y, 5.0), 0.0, 1.0));
      vec3 l0 = vec3(0.1) * fex + vSunE * 19000.0 * fex * smoothstep(0.99986, 0.99991, cosT);
      vec3 c = pow((lin + l0) * 0.04 + vec3(0.0, 0.0003, 0.00075), vec3(1.0 / 2.4));
      if (d.y < 0.0) c *= mix(1.0, 0.25, smoothstep(0.0, -0.35, d.y)); // below the horizon: sea haze
      // golden-hour glow: warm the low sky, most of all toward the sun
      float warm = exp(-max(d.y, 0.0) * 5.0) * (0.55 + 0.45 * pow(max(cosT, 0.0), 2.0));
      c *= mix(vec3(1.0), vec3(1.32, 0.98, 0.7), warm * 0.85);
      return c * uExposure;
    }
    void main() {
      vec3 d = normalize(vDir);
      vec3 c = atmosphere(d);
      if (d.y > 0.0) {
        // a thin layer of streaky clouds, lit warm from the low sun
        vec2 uv = d.xz / (d.y + 0.1);
        float n = fbm(uv * vec2(0.5, 1.4) + vec2(uTime * 0.004, 0.0));
        float m = smoothstep(0.55, 0.85, n) * smoothstep(0.012, 0.09, d.y) * (1.0 - smoothstep(0.32, 0.7, d.y));
        float lit = pow(max(dot(d, uSunDir), 0.0), 3.0);
        vec3 horizon = atmosphere(normalize(vec3(d.x, 0.04, d.z)));
        vec3 cloud = mix(horizon * vec3(0.55, 0.45, 0.5), horizon * vec3(1.3, 1.05, 0.85) + lit * vec3(0.6, 0.35, 0.18) * uExposure, 0.35 + 0.65 * lit);
        c = mix(c, cloud, m * 0.85);
      }
      if (uUnder > 0.5) c = mix(srgb(vec3(0.01, 0.1, 0.14)), srgb(vec3(0.05, 0.3, 0.36)), smoothstep(-0.6, 0.6, d.y));
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `;

  SURF.createSky = function (scene, renderer) {
    const U = SURF.util;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: { value: SURF.sunDir }, uTime: { value: 0 }, uUnder: SURF.under,
        uRayleigh: { value: 2.4 }, uTurbidity: { value: 4.5 }, uMie: { value: 0.005 }, uMieG: { value: 0.82 }, uExposure: { value: 0.4 },
      },
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    const geo = new THREE.SphereGeometry(3000, 64, 32);
    const sky = new THREE.Mesh(geo, mat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    scene.add(sky);

    // light: the environment map provides the ambient; the low sun gives warm key light + shadows
    scene.add(new THREE.HemisphereLight(U.srgb(0xffd8b8), U.srgb(0x0b2a38), 0.18));
    const sun = (SURF.sunLight = new THREE.DirectionalLight(U.srgb(0xffc08a), 2.6));
    sun.position.copy(SURF.sunDir).multiplyScalar(40);
    scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(U.srgb(0x9cc4e0), 0.25);
    fill.position.set(60, 40, 40);
    scene.add(fill);

    /* bake the sky into a cube map once (the clouds drift too slowly to matter for reflections) */
    function captureEnv() {
      const envScene = new THREE.Scene();
      const envMat = mat.clone();
      envMat.uniforms.uUnder = { value: 0 };
      envScene.add(new THREE.Mesh(geo, envMat));
      const cubeRT = new THREE.WebGLCubeRenderTarget(256, {
        type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter,
      });
      new THREE.CubeCamera(1, 6000, cubeRT).update(renderer, envScene);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromCubemap(cubeRT.texture).texture;
      pmrem.dispose();
      scene.environment = envTex;
      SURF.env = { cube: cubeRT.texture, pmrem: envTex, mips: Math.log2(256) };
    }

    return {
      captureEnv,
      update(camera, t) { sky.position.copy(camera.position); mat.uniforms.uTime.value = t; },
    };
  };
})();
