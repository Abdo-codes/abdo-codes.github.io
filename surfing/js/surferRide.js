/* The ride choreography: a 26-second loop from paddling to kick-out, expressed in wave coordinates
   (u = distance down the face in wave heights, dz = distance ahead of the peel point). */
(function () {
  const SURF = window.SURF, U = SURF.util, W = SURF.wave;

  //          time   u/H   dz
  const KEYS = [
    [0, 2.4, 4], [3, 1.7, 4], [4.5, 1.15, 4.5], [5.6, 1.35, 5.5], [6.9, 1.75, 7],
    [8.3, 0.75, 9.5], [9.8, 1.5, 8], [11.2, 0.7, 5.5], [12.6, 1.45, 4.5], [14, 0.85, 2.8],
    [15.6, 0.95, 0.6], [17.6, 0.9, -0.2], [19.4, 1.0, 2.4], [21, 1.5, 6], [22.8, 0.25, 13],
    [24.2, -0.9, 17], [26, -1.8, 18],
  ];
  const PERIOD = 26;
  const PHASES = [0, 4.5, 6, 8, 15, 20]; // paddle, pop-up, drop, trim, barrel, kick-out

  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }
  function sample(tau, out) {
    tau = U.clamp(tau, 0, PERIOD - 1e-4);
    let i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1][0] <= tau) i++;
    const a = KEYS[Math.max(0, i - 1)], b = KEYS[i], c = KEYS[i + 1], d = KEYS[Math.min(KEYS.length - 1, i + 2)];
    const t = (tau - b[0]) / (c[0] - b[0]);
    out.u = catmull(a[1], b[1], c[1], d[1], t);
    out.dz = catmull(a[2], b[2], c[2], d[2], t);
    return out;
  }
  function weights(tau) {
    const pop = U.ss(4.5, 5.6, tau);
    const kick = U.ss(24.3, 25.3, tau);
    const tuck = U.ss(15, 15.8, tau) * (1 - U.ss(19.2, 20.2, tau)) + 0.5 * U.ss(4.6, 5.0, tau) * (1 - U.ss(5.0, 5.7, tau));
    const paddle = Math.max(1 - pop, kick);
    return { paddle, ride: (1 - paddle) * (1 - Math.min(1, tuck)), tuck: (1 - paddle) * Math.min(1, tuck) };
  }

  const a = {}, b = {};
  const p = new THREE.Vector3(), p2 = new THREE.Vector3(), n = new THREE.Vector3();
  const tangent = new THREE.Vector3(), want = new THREE.Vector3();
  const PADDLE_DIR = new THREE.Vector3(1, 0, 0.25).normalize();
  const makeState = () => ({ heading: new THREE.Vector3(1, 0, 0), spray: { rate: 0, p: new THREE.Vector3(), v: new THREE.Vector3() } });
  const mainState = makeState();

  SURF.ride = {
    PERIOD,
    sample,
    weights,
    makeState,
    phase(tau) { let i = 0; while (i < PHASES.length - 1 && tau >= PHASES[i + 1]) i++; return i; },
    /* Places the surfer on the wave for ride-time tau. Returns the surfer's world position. */
    update(S, surfer, tau, dt, st) {
      st = st || mainState;
      const heading = st.heading, spray = st.spray;
      const h = S.hero, H = Math.max(0.5, h.H);
      sample(tau, a);
      sample(tau + 0.12, b);
      const z = h.peelZ + a.dz;
      W.at(a.u * H, z, p);
      W.at(b.u * H, h.peelZ + h.speed * 0.12 + b.dz, p2);
      W.normal(a.u * H, z, n);
      tangent.subVectors(p2, p);
      if (tangent.lengthSq() < 1e-6) tangent.copy(PADDLE_DIR);
      tangent.normalize();
      const k = U.ss(4.3, 6.2, tau) * (1 - U.ss(24.4, 25.6, tau));
      want.copy(PADDLE_DIR).lerp(tangent, k).normalize();
      heading.lerp(want, 1 - Math.exp(-dt * 7)).normalize();

      const w = weights(tau);
      if (w.paddle > 0.5) p.addScaledVector(n, -0.03);
      surfer.setPose(w, S.t);
      surfer.place(p, heading, n);

      const standing = 1 - w.paddle;
      spray.rate = standing * 80 * (1 - 0.4 * w.tuck);
      spray.p.copy(p).addScaledVector(heading, -0.85).addScaledVector(n, 0.05);
      spray.v.copy(heading).multiplyScalar(-1.5).addScaledVector(n, 1.8);
      if (st === mainState) S.boardSpray = spray;
      return p;
    },
  };
})();
