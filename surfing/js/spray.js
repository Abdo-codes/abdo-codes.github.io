/* Spray & mist: thrown off the lip, kicked up by whitewater and by the surfer's board. */
(function () {
  const SURF = window.SURF;

  const vert = /* glsl */ `
    attribute float aAlpha;
    attribute float aSize;
    uniform float uScale;
    varying float vAlpha;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float want = aSize * uScale / max(-mv.z, 1.5);
      // don't let drops right at the lens balloon, and fade what would draw bigger than the size cap
      // (a capped puff of mist near the camera reads as a solid white ball)
      vAlpha = aAlpha * smoothstep(1.5, 4.0, -mv.z) * pow(min(1.0, 90.0 / want), 1.5);
      gl_PointSize = min(want, 90.0);
      gl_Position = projectionMatrix * mv;
    }
  `;
  const frag = /* glsl */ `
    varying float vAlpha;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float a = smoothstep(0.5, 0.0, length(c)) * vAlpha;
      if (a < 0.01) discard;
      gl_FragColor = vec4(vec3(1.0, 0.96, 0.9), a);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `;

  SURF.createSpray = function (scene) {
    const S = SURF.state, W = SURF.wave, U = SURF.util, R = U.rand;
    const N = 1600;
    const pos = new Float32Array(N * 3).fill(-999);
    const vel = new Float32Array(N * 3);
    const life = new Float32Array(N), maxLife = new Float32Array(N).fill(1);
    const alpha = new Float32Array(N), size = new Float32Array(N);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 300 } }, vertexShader: vert, fragmentShader: frag,
      transparent: true, depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = 4;
    scene.add(points);

    let head = 0, lipAcc = 0, wwAcc = 0, boardAcc = 0;
    const tmp = new THREE.Vector3();

    function emit(x, y, z, vx, vy, vz, l, s) {
      const i = head; head = (head + 1) % N;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
      life[i] = maxLife[i] = l;
      size[i] = s;
    }

    function spanZ() {
      const h = S.hero;
      if (h.peelMode) return null;
      return [S.focus.z - 45, Math.min(S.focus.z + 25, S.cutZ - 0.6)];
    }

    function emitLip(sdt) {
      const h = S.hero, windX = S.wind * 5, span = spanZ();
      lipAcc = Math.min(lipAcc + S.lipSpray * sdt, 120);
      while (lipAcc >= 1) {
        lipAcc -= 1;
        const z = span ? R(span[0], span[1]) : h.peelZ + R(-3, 14);
        const e = W.env(z), H = e.H, b = e.b;
        if (b < 0.3 || H < 0.3) continue;
        W.at(-0.38 * H + R(-0.1, 0.1) * H, z, tmp);
        if (Math.random() < 0.25) {
          // mist: a faint haze of fine spray drifting with the wind
          emit(tmp.x, tmp.y + 0.2, tmp.z, 1.2 * b + windX * 1.1 + R(-0.4, 0.4), R(0.4, 1.4), R(-0.4, 0.4), R(1.4, 2.6), R(2.2, 4.2));
        } else {
          // droplets: small and bright, thrown off a few at a time
          for (let k = 0; k < 3; k++) {
            emit(tmp.x + R(-0.15, 0.15), tmp.y + R(-0.1, 0.1), tmp.z + R(-0.3, 0.3),
              2.2 * b + windX * 0.8 + R(-0.6, 0.6), R(1.0, 3.2), R(-0.5, 0.5), R(0.7, 1.4), R(0.04, 0.11));
          }
        }
      }
    }

    function emitWhitewater(sdt) {
      const h = S.hero, span = spanZ();
      wwAcc = Math.min(wwAcc + S.wwSpray * sdt, 160);
      while (wwAcc >= 1) {
        wwAcc -= 1;
        const z = span ? R(span[0], span[1]) : h.peelZ + R(-16, -0.5);
        const e = W.env(z), H = e.H, f = e.foam;
        if (f < 0.3 || H < 0.2) continue;
        W.at(R(-0.2, 1.0) * H, z, tmp);
        const drop = Math.random() < 0.6; // mostly droplets, some soft spray
        emit(tmp.x, tmp.y, tmp.z, R(1.5, 3.5) + S.wind * 1.5, R(1.2, 3.6) * Math.min(1.4, H), R(-0.8, 0.8), R(0.6, 1.3), drop ? R(0.05, 0.13) : R(0.5, 1.2));
      }
    }

    /* the board: a faint trickle of droplets off the tail while trimming, and a fan thrown off the
       outside rail when it turns (the harder the turn, the bigger and higher the fan) */
    const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), bv = new THREE.Vector3();
    function emitBoard(sdt) {
      const b = S.boardSpray, s = SURF.surfer;
      if (!b || b.rate <= 0 || !s) return;
      const c = U.clamp(s.carve || 0, -1.2, 1.2), C = Math.abs(c), q = s.root.quaternion;
      bx.set(1, 0, 0).applyQuaternion(q);
      by.set(0, 1, 0).applyQuaternion(q);
      bz.set(0, 0, c < 0 ? -1 : 1).applyQuaternion(q); // away from the centre of the turn
      boardAcc = Math.min(boardAcc + (b.rate / 80) * (8 + 260 * C * C) * sdt, 80);
      while (boardAcc >= 1) {
        boardAcc -= 1;
        const k = C * R(0.3, 1);
        tmp.copy(b.p).addScaledVector(bx, R(-0.15, 0.55)).addScaledVector(bz, 0.2);
        bv.copy(bx).multiplyScalar(-R(0.4, 1.4)).addScaledVector(bz, 0.5 + 5.5 * k).addScaledVector(by, 0.9 + 4.5 * k);
        emit(tmp.x, tmp.y, tmp.z, bv.x + R(-0.3, 0.3), bv.y + R(-0.2, 0.3), bv.z + R(-0.3, 0.3), R(0.35, 0.9), R(0.025, 0.07));
      }
    }

    return {
      update(dt, sdt) {
        if (sdt > 0) { emitLip(sdt); emitWhitewater(sdt); emitBoard(sdt); }
        if (S.burst) {
          const b = S.burst;
          for (let i = 0; i < 160; i++) emit(b.x + R(-0.6, 0.6), b.y + R(0, 0.8), b.z + R(-0.6, 0.6), R(-3, 3), R(2, 6), R(-3, 3), R(0.7, 1.5), i % 2 ? R(0.05, 0.13) : R(0.4, 1.1));
          S.burst = null;
        }
        const windX = S.wind * 3;
        const drag = Math.exp(-sdt * 1.2);
        for (let i = 0; i < N; i++) {
          if (life[i] <= 0) { alpha[i] = 0; continue; }
          life[i] -= sdt;
          const j = i * 3;
          vel[j] = vel[j] * drag + windX * sdt;
          vel[j + 1] = vel[j + 1] * drag - 5.5 * sdt;
          vel[j + 2] *= drag;
          pos[j] += vel[j] * sdt; pos[j + 1] += vel[j + 1] * sdt; pos[j + 2] += vel[j + 2] * sdt;
          const k = life[i] / maxLife[i], mist = size[i] > 1.4;
          if (mist) vel[j + 1] += 5.2 * sdt; // mist barely falls
          alpha[i] = life[i] > 0 ? Math.min(1, k * 2.2) * Math.min(1, (1 - k) * 6) * (mist ? 0.06 : size[i] < 0.2 ? 0.7 : 0.22) : 0;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aAlpha.needsUpdate = true;
        geo.attributes.aSize.needsUpdate = true;
      },
      setScale(pxHeight, fov) { mat.uniforms.uScale.value = pxHeight / (2 * Math.tan((fov * Math.PI) / 360)); },
    };
  };
})();
