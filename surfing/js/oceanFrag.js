/* Ocean fragment shader: multi-scale ripple normals, sky reflections from the baked environment map,
   depth/angle-based water colour with light glowing through thin water, sun glitter, textured foam,
   foam streaks drawn up the face, and the white wake the board leaves behind. */
(function () {
  const SURF = window.SURF;

  SURF.oceanFrag = /* glsl */ `
    uniform vec3 uCamPos;
    uniform float uAlpha, uCutZ, uTime, uFogDensity, uUnder, uRip, uDetail;
    uniform sampler2D uRipples, uFoamTex;
    uniform samplerCube uEnv;
    uniform vec4 uBoard[24];
    uniform float uBoardN;
    uniform vec4 uBoardBox;
    varying vec3 vWorld;
    varying vec3 vNormal;
    varying vec4 vInfo;
    varying vec2 vHero;
    varying float vBed;
    varying float vTrail;
    ${SURF.skyGLSL}

    vec3 env(vec3 d, float lod) { return textureCubeLodEXT(uEnv, d, lod).rgb; }

    vec2 ripple(vec2 p, float dist) {
      vec2 n = (texture2D(uRipples, p * 0.085 + uTime * vec2(0.011, 0.004)).xy * 2.0 - 1.0) * 0.6;
      if (uDetail > 1.5) n += (texture2D(uRipples, p * 0.23 + uTime * vec2(-0.012, 0.017)).xy * 2.0 - 1.0) * 0.38;
      if (uDetail > 2.5) n += (texture2D(uRipples, p * 0.67 + uTime * vec2(0.028, -0.021)).xy * 2.0 - 1.0) * 0.24 * exp(-dist / 60.0);
      return n;
    }

    /* foam along the path the board just carved; it widens and fades as it ages */
    float boardWake() {
      if (uBoardN < 1.5) return 0.0;
      vec2 q = vWorld.xz;
      if (q.x < uBoardBox.x || q.x > uBoardBox.z || q.y < uBoardBox.y || q.y > uBoardBox.w) return 0.0;
      float best = 0.0;
      for (int i = 0; i < 23; i++) {
        if (float(i) >= uBoardN - 1.0) break;
        vec4 a = uBoard[i], b = uBoard[i + 1];
        vec3 ab = b.xyz - a.xyz;
        float t = clamp(dot(vWorld - a.xyz, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
        float age = mix(a.w, b.w, t), width = 0.14 + 0.55 * age;
        float d = length(vWorld - (a.xyz + ab * t));
        best = max(best, (1.0 - smoothstep(width * 0.35, width, d)) * (1.0 - age) * (1.0 - age));
      }
      return best;
    }

    void main() {
      if (vWorld.z > uCutZ) discard;
      vec2 p = vWorld.xz;
      float dist = length(vWorld - uCamPos);
      float far = smoothstep(40.0, 500.0, dist);
      vec3 V = normalize(uCamPos - vWorld);
      vec3 N = normalize(vNormal);
      float steep = 1.0 - abs(N.y); // on the face and lip, project foam from the side, not from above
      N = normalize(mix(N, vec3(0.0, 1.0, 0.0), 0.7 * far));
      vec2 rp = ripple(p, dist) * mix(0.32, 0.12, far) * (1.0 - 0.7 * clamp(vInfo.z * 1.5, 0.0, 1.0));
      N = normalize(N + vec3(rp.x, 0.0, rp.y));
      if (dot(N, V) < 0.0) N = -N;
      float NdV = max(dot(N, V), 0.0);
      float fres = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);
      vec3 R = reflect(-V, N);
      R.y = abs(R.y);
      vec3 refl = env(R, 3.0 * far + clamp(vInfo.z, 0.0, 1.0));

      // body colour: deep water absorbs, the top layer scatters, thin water glows when backlit
      float H = vInfo.w;
      float up = H > 0.05 ? clamp(vHero.y / H, 0.0, 1.2) : 0.0;
      float front = vHero.x > -0.3 * H ? 1.0 : 0.45;
      float toSun = pow(clamp(dot(-V, uSunDir) * 0.5 + 0.5, 0.0, 1.0), 2.0);
      float sss = clamp(up * up * front * (0.35 + 0.95 * toSun), 0.0, 1.0);
      vec3 sunCol = srgb(vec3(1.0, 0.74, 0.5));
      vec3 deep = srgb(vec3(0.01, 0.065, 0.095));
      vec3 scatter = srgb(vec3(0.03, 0.22, 0.25));
      vec3 thin = srgb(vec3(0.2, 0.6, 0.5));
      float graze = pow(1.0 - NdV, 2.0);
      vec3 water = mix(deep, scatter, clamp(0.2 + 0.45 * up + 0.25 * graze, 0.0, 1.0));
      water = mix(water, thin, sss * 0.75);
      if (uRip > 0.5) {
        // shallow sandbars glow turquoise, the deeper rip channel stays dark — that's the tell
        water = mix(srgb(vec3(0.02, 0.15, 0.27)), srgb(vec3(0.22, 0.72, 0.7)), smoothstep(-4.2, -1.2, vBed));
        water = mix(water, srgb(vec3(0.85, 0.75, 0.55)), smoothstep(-0.6, 0.1, vBed) * 0.7);
      }
      float diff = max(dot(N, uSunDir), 0.0);
      water *= 0.45 + 0.75 * sunCol * (0.3 + 0.7 * diff);
      vec3 col = mix(water, refl, fres * (uRip > 0.5 ? 0.35 : 1.0));
      float rs = max(dot(R, uSunDir), 0.0);
      col += sunCol * (pow(rs, mix(1200.0, 200.0, far)) * mix(14.0, 5.0, far) + pow(rs, 80.0) * 0.35);

      // foam: whitewater, the lip's edge, the trail behind the break, and the board's wake
      float lipW = vInfo.x * vInfo.x * smoothstep(0.95, 0.999, vInfo.y); // just the fringe at the tip
      float f = max(max(lipW, vInfo.z * 1.15), vTrail * 0.6);
      f = max(f, boardWake());
      float foam = 0.0;
      if (f > 0.02) {
        vec2 fq = mix(p, vec2(vWorld.z, vWorld.y * 1.2 + vWorld.x * 0.4), smoothstep(0.45, 0.75, steep));
        vec2 fp = fq * 0.33 + vec2(uTime * 0.05, uTime * 0.017);
        float lace = texture2D(uFoamTex, fp).r * 0.6 + texture2D(uFoamTex, fp * 2.6 + 0.37).r * 0.5;
        foam = smoothstep(0.35, 0.62, f + (lace - 0.55) * (0.95 - 0.55 * f)) * min(1.0, f * 3.0);
      }
      vec3 foamCol = env(N, 5.0) * 0.9 + sunCol * (0.25 + 1.1 * diff) * 0.55;
      col = mix(col, foamCol, foam);

      float fog = 1.0 - exp(-pow(dist * uFogDensity, 1.6));
      col = mix(col, env(normalize(vec3(-V.x, 0.02, -V.z)), 4.0), fog);
      if (uUnder > 0.5) {
        // seen from below: bright Snell's window overhead, total internal reflection elsewhere
        float win = smoothstep(0.5, 0.85, NdV);
        vec3 through = env(normalize(vec3(-V.x * 0.5, 1.0, -V.z * 0.5)), 3.0) * 0.8;
        col = mix(srgb(vec3(0.04, 0.3, 0.36)) * (0.7 + 0.6 * abs(N.x) + 0.3 * sss), through, win);
        col = mix(col, srgb(vec3(0.8, 0.9, 0.9)), foam * 0.5);
        col = mix(col, srgb(vec3(0.02, 0.16, 0.22)), 1.0 - exp(-dist * 0.035));
      }
      gl_FragColor = vec4(col, clamp(uAlpha + fres * 0.5 + foam, 0.0, 1.0));
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `;
})();
