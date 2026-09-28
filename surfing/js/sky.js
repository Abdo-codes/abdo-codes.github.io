/* Golden-hour sky dome + lights. skyGLSL is shared with the ocean for reflections and fog. */
(function () {
  const SURF = window.SURF;
  SURF.sunDir = new THREE.Vector3(-1, 0.13, -0.42).normalize();
  SURF.under = { value: 0 }; // 1 while the camera is underwater (shared uniform)

  SURF.skyGLSL = /* glsl */ `
    uniform vec3 uSunDir;
    vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }
    vec3 skyColor(vec3 d) {
      vec3 zen = srgb(vec3(0.12, 0.2, 0.38));
      vec3 mid = srgb(vec3(0.62, 0.5, 0.62));
      vec3 hor = srgb(vec3(1.0, 0.68, 0.45));
      float e = d.y;
      vec3 c;
      if (e >= 0.0) {
        c = mix(hor, mid, smoothstep(0.0, 0.2, e));
        c = mix(c, zen, smoothstep(0.14, 0.7, e));
      } else {
        c = mix(hor, srgb(vec3(0.05, 0.12, 0.18)), smoothstep(0.0, 0.35, -e));
      }
      float s = max(dot(d, uSunDir), 0.0);
      c += srgb(vec3(1.0, 0.55, 0.28)) * pow(s, 5.0) * 0.8;
      c += vec3(1.0, 0.78, 0.5) * pow(s, 60.0) * 1.4;
      c += vec3(9.0, 7.5, 5.0) * smoothstep(0.9992, 0.9996, s);
      return c;
    }
  `;

  const vert = /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = position;
      vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_Position = p.xyww;
    }
  `;

  const frag = /* glsl */ `
    uniform float uTime, uUnder;
    varying vec3 vDir;
    ${SURF.skyGLSL}
    float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float s = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
      return s;
    }
    void main() {
      vec3 d = normalize(vDir);
      vec3 c = skyColor(d);
      if (d.y > 0.0) {
        vec2 uv = d.xz / (d.y + 0.12);
        float n = fbm(uv * vec2(0.55, 1.6) + vec2(uTime * 0.004, 0.0));
        float m = smoothstep(0.52, 0.82, n) * smoothstep(0.015, 0.1, d.y) * (1.0 - smoothstep(0.3, 0.65, d.y));
        float lit = pow(max(dot(d, uSunDir), 0.0), 3.0);
        vec3 cc = mix(srgb(vec3(0.78, 0.45, 0.48)), srgb(vec3(1.0, 0.78, 0.55)), lit);
        c = mix(c, cc, m * 0.75);
      }
      if (uUnder > 0.5) c = mix(srgb(vec3(0.01, 0.1, 0.14)), srgb(vec3(0.05, 0.3, 0.36)), smoothstep(-0.6, 0.6, d.y));
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `;

  SURF.createSky = function (scene) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uSunDir: { value: SURF.sunDir }, uTime: { value: 0 }, uUnder: SURF.under },
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), mat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    scene.add(sky);

    const U = SURF.util;
    scene.add(new THREE.HemisphereLight(U.srgb(0xffd2ad), U.srgb(0x0d3346), 1.1));
    const sun = new THREE.DirectionalLight(U.srgb(0xffc48c), 2.4);
    sun.position.copy(SURF.sunDir).multiplyScalar(200);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(U.srgb(0x9cc4e0), 0.7);
    fill.position.set(60, 40, 40);
    scene.add(fill);

    return {
      update(camera, t) { sky.position.copy(camera.position); mat.uniforms.uTime.value = t; },
    };
  };
})();
