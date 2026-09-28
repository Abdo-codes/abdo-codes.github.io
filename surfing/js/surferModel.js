/* Sculpted surfer + shortboard geometry (spring suit, rash vest, rockered board with rails,
   three fins, tail pad and leash). Posing, IK and balance live in surferPose.js.
   Root frame: +x = board nose, +y = board normal. The rider stands sideways, facing -z. */
(function () {
  const SURF = window.SURF;
  const PI = Math.PI;

  // ---------- board shape: x runs from the tail (-1.0) to the nose (1.03) ----------
  const TAIL = -1.0, NOSE = 1.03, LEN = NOSE - TAIL;
  function halfWidth(x) {
    const s = (x - TAIL) / LEN;
    if (s >= 0.44) { const k = (s - 0.44) / 0.56; return 0.262 * Math.pow(Math.max(0, 1 - k * k), 0.62); }
    const k = (0.44 - s) / 0.44;
    return 0.262 * (1 - 0.42 * k * k); // squash tail stays ~30 cm wide
  }
  function thickness(x) { const s = (x - TAIL) / LEN; return 0.012 + 0.05 * Math.max(0, 1 - ((s - 0.46) / 0.56) ** 2); }
  function rocker(x) {
    const n = Math.max(0, (x - 0.25) / (NOSE - 0.25)), t = Math.max(0, (-0.35 - x) / 0.65);
    return 0.13 * n * n + 0.035 * t * t;
  }
  /* height of the deck at (x, z) — the deck is slightly domed toward the rails */
  function deckAt(x, z) {
    const w = Math.max(1e-3, halfWidth(x)), t = thickness(x);
    const c = Math.min(1, Math.pow(Math.min(1, Math.abs(z) / w), 1 / 0.55));
    return rocker(x) + t * 0.5 + t * 0.5 * Math.pow(Math.sqrt(1 - c * c), 0.8);
  }
  SURF.board = { TAIL, NOSE, deckAt, rocker };

  function boardGeometry() {
    const NS = 64, NR = 24, pos = [], idx = [];
    for (let i = 0; i <= NS; i++) {
      const x = TAIL + (i / NS) * LEN, w = i === NS ? 0 : halfWidth(x), t = thickness(x), yb = rocker(x);
      for (let j = 0; j < NR; j++) {
        const a = (j / NR) * 2 * PI, c = Math.cos(a), sn = Math.sin(a);
        const z = w * Math.sign(c) * Math.pow(Math.abs(c), 0.55);
        const y = yb + t * 0.5 + t * 0.5 * Math.sign(sn) * Math.pow(Math.abs(sn), 0.8);
        pos.push(x, y, z);
      }
    }
    for (let i = 0; i < NS; i++) {
      for (let j = 0; j < NR; j++) {
        const a = i * NR + j, b = i * NR + ((j + 1) % NR), c = a + NR, d = b + NR;
        idx.push(a, c, b, b, c, d);
      }
    }
    const ci = pos.length / 3;
    pos.push(TAIL - 0.004, rocker(TAIL) + thickness(TAIL) * 0.5, 0);
    for (let j = 0; j < NR; j++) idx.push(ci, (j + 1) % NR, j);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* a ribbon lying on the deck: stringer line, tail pad */
  function deckPatch(x0, x1, half, cols, lift) {
    const NS = 24, pos = [], idx = [];
    for (let i = 0; i <= NS; i++) {
      const x = x0 + ((x1 - x0) * i) / NS, hw = half(x);
      for (let j = 0; j <= cols; j++) {
        const z = -hw + (2 * hw * j) / cols;
        pos.push(x, deckAt(x, z) + lift, z);
      }
    }
    for (let i = 0; i < NS; i++) {
      for (let j = 0; j < cols; j++) {
        const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function finGeometry(h) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(-0.11 * h, 0);
    s.bezierCurveTo(-0.1 * h, -0.05 * h, -0.12 * h, -0.09 * h, -0.14 * h, -0.115 * h);
    s.bezierCurveTo(-0.07 * h, -0.095 * h, -0.005 * h, -0.05 * h, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 10 });
    g.translate(0, 0, -0.003);
    return g;
  }

  SURF.buildSurferRig = function (scene, colors) {
    const U = SURF.util;
    const C = Object.assign({ vest: 0x1fa3a0, stripe: 0xe8552f, board: 0xf5f0e5 }, colors);
    const std = (hex, rough) => new THREE.MeshStandardMaterial({ color: U.srgb(hex), roughness: rough });
    const suit = new THREE.MeshPhysicalMaterial({ color: U.srgb(0x15171b), roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.35 });
    const vest = std(C.vest, 0.55), skin = std(0xc98d68, 0.62), hair = std(0x24160c, 0.85), dark = std(0x121314, 0.5);
    const boardMat = new THREE.MeshPhysicalMaterial({ color: U.srgb(C.board), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide });
    const accent = std(C.stripe, 0.4), pad = std(0x1d1f24, 0.95);

    const root = new THREE.Group();
    scene.add(root);
    const add = (parent, obj, x, y, z) => { obj.position.set(x || 0, y || 0, z || 0); parent.add(obj); return obj; };
    const group = (parent, x, y, z) => add(parent, new THREE.Group(), x, y, z);
    const ball = (r, mat, sx, sy, sz) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat); m.scale.set(sx || 1, sy || 1, sz || 1); return m; };
    // tapered limb from the joint (y = 0) down to y = -len
    const limb = (r0, r1, len, mat) => {
      const g = new THREE.CylinderGeometry(r0, r1, len, 14, 1);
      g.translate(0, -len / 2, 0);
      return new THREE.Mesh(g, mat);
    };

    // ---------- board ----------
    add(root, new THREE.Mesh(boardGeometry(), boardMat));
    add(root, new THREE.Mesh(deckPatch(-0.93, 0.95, () => 0.006, 1, 0.0015), accent));
    add(root, new THREE.Mesh(deckPatch(-0.96, -0.6, (x) => halfWidth(x) * 0.82, 6, 0.004), pad));
    const fin = finGeometry(1);
    add(root, new THREE.Mesh(fin, accent), -0.84, rocker(-0.84) + 0.004, 0);
    for (const side of [-1, 1]) {
      const f = add(root, new THREE.Mesh(fin, accent), -0.66, rocker(-0.66) + 0.006, side * 0.185);
      f.rotation.set(-side * 0.12, side * 0.06, 0); // cant out, toe in
    }

    // ---------- body ----------
    const body = group(root);
    body.rotation.order = 'YXZ';
    const parts = {};
    add(body, ball(0.15, suit, 1.12, 0.78, 0.82));
    parts.spine = group(body, 0, 0.05, 0);
    const prof = [[0.001, 0], [0.12, 0.01], [0.14, 0.07], [0.13, 0.15], [0.122, 0.21], [0.138, 0.3], [0.155, 0.38], [0.15, 0.44], [0.12, 0.49], [0.07, 0.525], [0.045, 0.545], [0.001, 0.55]];
    const torso = add(parts.spine, new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 22), vest));
    torso.scale.set(1.2, 1, 0.72);
    const chest = group(parts.spine, 0, 0.47, 0);

    parts.neck = group(chest, 0, 0.05, 0);
    add(parts.neck, limb(0.045, 0.048, 0.1, skin), 0, 0.1, 0);
    const head = group(parts.neck, 0, 0.13, 0.01);
    add(head, ball(0.1, skin, 0.92, 1.05, 1));
    add(head, ball(0.075, skin, 0.9, 0.8, 0.95), 0, -0.045, 0.025);
    add(head, ball(0.022, skin, 0.8, 1, 1.6), 0, -0.005, 0.097);
    for (const sx of [-1, 1]) {
      add(head, ball(0.022, skin, 0.5, 1, 0.8), sx * 0.093, -0.005, -0.005);
      add(head, ball(0.011, dark), sx * 0.035, 0.012, 0.09);
    }
    const cap = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.107, 20, 14, 0, 2 * PI, 0, 0.6 * PI), hair), 0, 0.012, -0.008);
    cap.rotation.x = -0.4;

    function arm(side, key) {
      const sh = (parts['arm' + key] = group(chest, side * 0.2, -0.02, 0));
      add(sh, ball(0.062, vest, 1, 1.1, 1));
      add(sh, limb(0.052, 0.042, 0.29, vest));
      const el = (parts['elb' + key] = group(sh, 0, -0.3, 0));
      add(el, ball(0.038, skin));
      add(el, limb(0.04, 0.03, 0.25, skin));
      const hand = group(el, 0, -0.27, 0);
      add(hand, ball(0.045, skin, 0.55, 1.15, 1));
      add(hand, ball(0.018, skin, 1, 1.6, 1), side * -0.018, 0.01, 0.03);
    }
    arm(-1, 'N');
    arm(1, 'T');

    const contacts = [];
    function leg(side, key) {
      const hip = (parts['leg' + key] = group(body, side * 0.1, -0.03, 0));
      add(hip, ball(0.078, suit));
      add(hip, limb(0.08, 0.056, 0.45, suit));
      const knee = (parts['knee' + key] = group(hip, 0, -0.45, 0));
      add(knee, ball(0.057, suit));
      add(knee, limb(0.054, 0.037, 0.44, skin));
      add(knee, ball(0.05, skin, 0.9, 1.7, 1), 0, -0.15, -0.014);
      const foot = (parts['foot' + key] = group(knee, 0, -0.44, 0));
      add(foot, ball(0.04, skin));
      add(foot, ball(0.09, skin, 0.46, 0.3, 1.28), 0, -0.035, 0.045);
      contacts.push([foot, 0.06], [knee, 0.06]);
    }
    leg(-1, 'N');
    leg(1, 'T');
    contacts.push([body, 0.13], [chest, 0.15], [head, 0.11]);

    // leash: tail plug → back ankle, updated every frame by the poser
    const leashGeo = new THREE.BufferGeometry();
    leashGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    const leash = new THREE.Line(leashGeo, new THREE.LineBasicMaterial({ color: U.srgb(0x0e0f12) }));
    leash.frustumCulled = false;
    root.add(leash);

    return { root, body, parts, contacts, leash, board: SURF.board };
  };
})();
