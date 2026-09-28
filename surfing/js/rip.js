/* Rip-current scene: a beach with two sandbars and a deeper channel between them, flow particles
   showing where the water goes, and a swimmer demonstrating how to escape. */
(function () {
  const SURF = window.SURF;

  // mirrors ripBed() in ocean.js
  function ripBed(x, z) {
    const base = Math.min(2.5, -7 + 0.14 * (x + 30));
    const bx = (x + 5) / 7, bz = z / 7;
    return base + 2.3 * Math.exp(-bx * bx) * (1 - Math.exp(-bz * bz));
  }

  function flow(x, z, out) {
    const U = SURF.util, az = Math.abs(z);
    const ch = Math.exp(-(z * z) / 30);
    const inner = U.ss(-14, -4, x) * (1 - U.ss(12, 18, x));
    let vx = 0.4 * (1 - ch) * inner + 0.2 * (1 - inner) * (1 - ch);
    let vz = -Math.sign(z) * 1.2 * inner * U.ss(2, 8, az) * (1 - U.ss(26, 45, az)) * U.ss(-6, 6, x);
    vx -= 2.6 * ch * U.ss(-42, -20, x) * (1 - U.ss(12, 17, x));
    vz += z * 0.05 * (1 - U.ss(-32, -16, x));
    out.x = vx;
    out.z = vz;
    return out;
  }

  function dotTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  SURF.createRip = function (scene) {
    const S = SURF.state, U = SURF.util, R = U.rand;
    const group = new THREE.Group();
    group.visible = false;
    scene.add(group);

    // seabed with sandbars
    const geo = new THREE.PlaneGeometry(200, 200, 200, 200);
    geo.rotateX(-Math.PI / 2);
    geo.translate(-20, 0, 0);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
    const deep = U.srgb(0x6e5b3e), shallow = U.srgb(0xe8cf9c), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = ripBed(pos.getX(i), pos.getZ(i));
      pos.setY(i, y);
      c.copy(deep).lerp(shallow, U.ss(-7, 0.5, y)).toArray(col, i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })));

    // flow particles
    const N = 1100;
    const pp = new Float32Array(N * 3), pc = new Float32Array(N * 3), life = new Float32Array(N);
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    pgeo.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    const pts = new THREE.Points(pgeo, new THREE.PointsMaterial({
      size: 1.3, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true,
    }));
    pts.frustumCulled = false;
    group.add(pts);
    const calm = U.srgb(0xe8fbff), fast = U.srgb(0xff5a3c), v = { x: 0, z: 0 };
    function spawn(i) {
      pp[i * 3] = R(-50, 16);
      pp[i * 3 + 2] = R(-45, 45);
      life[i] = R(4, 12);
    }
    for (let i = 0; i < N; i++) spawn(i);

    // swimmer (big enough to read from above) + escape route
    const swimmer = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: U.srgb(0xc98d68), roughness: 0.7 });
    const cap = new THREE.MeshStandardMaterial({ color: U.srgb(0xffd23f), roughness: 0.5 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), cap);
    head.position.y = 0.2;
    swimmer.add(head);
    const arms = [0, 1].map((k) => {
      const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.5, 4, 8), skin);
      swimmer.add(a);
      return a;
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 40), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    swimmer.add(ring);
    swimmer.scale.setScalar(1.8);
    group.add(swimmer);

    const route = [[12, 0], [-20, 1], [-20, 20], [12, 20]];
    const routeGeo = new THREE.BufferGeometry().setFromPoints(route.map(([x, z]) => new THREE.Vector3(x, 0.35, z)));
    const routeLine = new THREE.Line(routeGeo, new THREE.LineDashedMaterial({ color: 0xffd23f, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.85 }));
    routeLine.computeLineDistances();
    group.add(routeLine);

    const api = { swimmer: swimmer.position, phase: 0, t: 0, bed: ripBed };
    const segT = [0, 6, 10, 16];

    api.update = function (dt, sdt) {
      group.visible = S.rip;
      if (!S.rip) return;
      const k = (2 * Math.PI) / S.swell.L;
      for (let i = 0; i < N; i++) {
        const j = i * 3;
        life[i] -= sdt;
        flow(pp[j], pp[j + 2], v);
        pp[j] += v.x * sdt * 2.2;
        pp[j + 2] += v.z * sdt * 2.2;
        if (life[i] <= 0 || pp[j] > 17 || pp[j] < -55 || Math.abs(pp[j + 2]) > 50) spawn(i);
        pp[j + 1] = 0.15 + S.swell.A * Math.cos(k * pp[j] - S.swell.phase);
        c.copy(calm).lerp(fast, U.ss(0.8, 2.2, Math.hypot(v.x, v.z))).toArray(pc, j);
      }
      pgeo.attributes.position.needsUpdate = true;
      pgeo.attributes.color.needsUpdate = true;

      api.t = (api.t + sdt) % 16;
      let s = 0;
      while (s < 2 && api.t >= segT[s + 1]) s++;
      api.phase = s;
      const f = (api.t - segT[s]) / (segT[s + 1] - segT[s]);
      const a = route[s], b = route[s + 1];
      swimmer.position.set(U.lerp(a[0], b[0], f), 0.1 + S.swell.A * Math.cos(k * a[0] - S.swell.phase) * 0.6, U.lerp(a[1], b[1], f));
      swimmer.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      const stroke = api.t * (s === 0 ? 7 : 4.5);
      arms.forEach((arm, i) => {
        const ph = stroke + i * Math.PI;
        arm.position.set((i ? 0.28 : -0.28), 0.15 + Math.max(0, Math.sin(ph)) * 0.25, Math.cos(ph) * 0.3);
        arm.rotation.set(Math.PI / 2 + Math.sin(ph) * 0.6, 0, 0);
      });
      ring.scale.setScalar(1 + 0.15 * Math.sin(api.t * 4));
    };
    return api;
  };
})();
