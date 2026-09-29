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
    // wet materials, lit by the sky's environment map: neoprene, lycra, skin, resin-coated board
    const phys = (hex, o) => new THREE.MeshPhysicalMaterial(Object.assign({ color: U.srgb(hex) }, o));
    const suit = phys(0x17191c, { roughness: 0.62, clearcoat: 0.22, clearcoatRoughness: 0.45, sheen: 0.5, sheenRoughness: 0.7, sheenColor: U.srgb(0x3a4650) });
    const vest = phys(C.vest, { roughness: 0.52, clearcoat: 0.3, clearcoatRoughness: 0.45, sheen: 0.6, sheenRoughness: 0.5, sheenColor: U.srgb(0xbfe9e6) });
    const skin = phys(0xc0856a, { roughness: 0.5, clearcoat: 0.22, clearcoatRoughness: 0.4, sheen: 0.25, sheenRoughness: 0.8, sheenColor: U.srgb(0xffc4a3) });
    const hair = phys(0x21150c, { roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.5, sheen: 0.6, sheenRoughness: 0.4, sheenColor: U.srgb(0x6a4a30) });
    const dark = phys(0x0e0f10, { roughness: 0.2, clearcoat: 1 });
    const boardMat = phys(C.board, { roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.07, side: THREE.DoubleSide });
    const accent = phys(C.stripe, { roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    const pad = phys(0x383c43, { roughness: 0.95 });

    const root = new THREE.Group();
    scene.add(root);
    const add = (parent, obj, x, y, z) => { obj.position.set(x || 0, y || 0, z || 0); parent.add(obj); return obj; };
    const group = (parent, x, y, z) => add(parent, new THREE.Group(), x, y, z);
    const ball = (r, mat, sx, sy, sz) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat); m.scale.set(sx || 1, sy || 1, sz || 1); return m; };

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
    // limbs are lathed from muscle profiles ([fraction along the bone, radius]), not plain tubes
    const muscle = (profile, len, mat, sx, sz) => {
      const pts = profile.slice().reverse().map(([t, r]) => new THREE.Vector2(r, -t * len));
      const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 16), mat);
      m.scale.set(sx || 1, 1, sz || 1);
      return m;
    };
    const THIGH = [[0, 0.083], [0.12, 0.087], [0.35, 0.081], [0.6, 0.069], [0.85, 0.057], [1, 0.053]];
    const SHIN = [[0, 0.052], [0.1, 0.056], [0.26, 0.061], [0.44, 0.052], [0.7, 0.04], [0.92, 0.032], [1, 0.033]];
    const UPPER = [[0, 0.056], [0.15, 0.055], [0.4, 0.05], [0.75, 0.042], [1, 0.038]];
    const FORE = [[0, 0.039], [0.2, 0.044], [0.5, 0.038], [0.85, 0.029], [1, 0.027]];
    const rnd = ((seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(42);

    const body = group(root);
    body.rotation.order = 'YXZ';
    const parts = {};
    add(body, ball(0.15, suit, 1.12, 0.78, 0.82));
    parts.spine = group(body, 0, 0.05, 0);
    const prof = [[0.001, 0], [0.12, 0.01], [0.14, 0.07], [0.13, 0.15], [0.122, 0.21], [0.138, 0.3], [0.155, 0.38], [0.15, 0.44], [0.12, 0.49], [0.07, 0.525], [0.045, 0.545], [0.001, 0.55]];
    const torso = add(parts.spine, new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 22), vest));
    torso.scale.set(1.2, 1, 0.72);
    for (const sx of [-1, 1]) add(parts.spine, ball(0.07, vest, 1, 0.8, 0.45), sx * 0.065, 0.38, 0.068); // chest
    add(parts.spine, ball(0.09, vest, 1.6, 0.5, 0.8), 0, 0.5, -0.012); // trapezius
    const chest = group(parts.spine, 0, 0.47, 0);

    parts.neck = group(chest, 0, 0.05, 0);
    add(parts.neck, muscle([[0, 0.05], [0.5, 0.045], [1, 0.047]], 0.1, skin), 0, 0.1, 0);
    const head = group(parts.neck, 0, 0.13, 0.01);
    add(head, ball(0.1, skin, 0.92, 1.05, 1));
    add(head, ball(0.075, skin, 0.9, 0.8, 0.95), 0, -0.045, 0.025);
    add(head, ball(0.022, skin, 0.8, 1, 1.6), 0, -0.005, 0.097);
    add(head, ball(0.06, skin, 1.3, 0.35, 0.6), 0, 0.03, 0.07); // brow
    for (const sx of [-1, 1]) {
      add(head, ball(0.022, skin, 0.5, 1, 0.8), sx * 0.093, -0.005, -0.005);
      add(head, ball(0.011, dark), sx * 0.035, 0.012, 0.09);
    }
    const cap = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.107, 20, 14, 0, 2 * PI, 0, 0.6 * PI), hair), 0, 0.012, -0.008);
    cap.rotation.x = -0.4;
    for (let i = 0; i < 7; i++) { // messy wet tufts
      const a = rnd() * PI * 2, e = 0.35 + rnd() * 0.5;
      const t = add(head, ball(0.034 + rnd() * 0.014, hair, 1, 0.5, 1.3), Math.cos(a) * Math.cos(e) * 0.09, 0.02 + Math.sin(e) * 0.09, Math.sin(a) * Math.cos(e) * 0.09 - 0.02);
      t.rotation.set(rnd() - 0.5, rnd() * PI, rnd() - 0.5);
    }

    function arm(side, key) {
      const sh = (parts['arm' + key] = group(chest, side * 0.2, -0.02, 0));
      add(sh, ball(0.064, vest, 1, 1.1, 1));
      add(sh, muscle(UPPER, 0.29, vest));
      const el = (parts['elb' + key] = group(sh, 0, -0.3, 0));
      add(el, ball(0.037, skin));
      add(el, muscle(FORE, 0.25, skin, 1.12, 0.92));
      const hand = group(el, 0, -0.265, 0);
      add(hand, ball(0.028, skin));
      add(hand, ball(0.045, skin, 0.5, 1.15, 1.05), 0, -0.035, 0);
      const fingers = add(hand, new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.045, 4, 8), skin), 0, -0.085, 0.004);
      fingers.scale.set(0.8, 1, 2.1);
      const thumb = add(hand, new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.028, 4, 8), skin), side * -0.012, -0.04, 0.038);
      thumb.rotation.x = 0.5;
    }
    arm(-1, 'N');
    arm(1, 'T');

    const contacts = [];
    function leg(side, key) {
      const hip = (parts['leg' + key] = group(body, side * 0.1, -0.03, 0));
      add(hip, ball(0.08, suit));
      add(hip, muscle(THIGH, 0.45, suit, 1, 1.08));
      const knee = (parts['knee' + key] = group(hip, 0, -0.45, 0));
      add(knee, ball(0.055, suit));
      const shin = add(knee, muscle(SHIN, 0.44, skin, 1, 1.05));
      shin.position.z = -0.006;
      const foot = (parts['foot' + key] = group(knee, 0, -0.44, 0));
      add(foot, ball(0.036, skin));
      add(foot, ball(0.038, skin, 1, 0.9, 1.1), 0, -0.036, -0.018); // heel
      const sole = add(foot, new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.13, 4, 10), skin), 0, -0.043, 0.058);
      sole.rotation.x = PI / 2;
      sole.scale.set(1.25, 1, 0.62);
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

    root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { root, body, parts, contacts, leash, board: SURF.board };
  };
})();
