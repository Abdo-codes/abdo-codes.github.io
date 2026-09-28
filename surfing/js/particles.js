/* Chapter 1 visuals: water particles tracing orbits inside the cutaway, and wind streaks. */
(function () {
  const SURF = window.SURF;

  SURF.createParticles = function (scene) {
    const S = SURF.state, U = SURF.util;
    const COLS = 25, ROWS = 10, DX = 2, DY = 1.8, TRAIL = 80, STREAKS = 110;
    const group = new THREE.Group();
    scene.add(group);

    const dots = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.13, 10, 8),
      new THREE.MeshBasicMaterial({ color: U.srgb(0xdff8ff) }),
      COLS * ROWS
    );
    dots.frustumCulled = false;
    group.add(dots);

    const hero = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), new THREE.MeshBasicMaterial({ color: U.srgb(0xffb347) }));
    group.add(hero);

    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(TRAIL * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: U.srgb(0xffb347), transparent: true, opacity: 0.85 }));
    trail.frustumCulled = false;
    group.add(trail);
    let trailInit = false;

    const circle = [];
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; circle.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0)); }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(circle);
    const ringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    const rings = [];
    for (let r = 0; r < ROWS; r++) { const ring = new THREE.Line(ringGeo, ringMat); rings.push(ring); group.add(ring); }

    const baseGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-26, 0, 0), new THREE.Vector3(26, 0, 0)]);
    const base = new THREE.Line(baseGeo, new THREE.LineDashedMaterial({ color: U.srgb(0xffe2b0), dashSize: 0.8, gapSize: 0.6, transparent: true, opacity: 0.8 }));
    base.computeLineDistances();
    group.add(base);

    // wind streaks
    const streakGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(STREAKS * 6);
    streakGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const streakMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    const streaks = new THREE.LineSegments(streakGeo, streakMat);
    streaks.frustumCulled = false;
    scene.add(streaks);
    const st = [];
    for (let i = 0; i < STREAKS; i++) st.push({ x: U.rand(-45, 45), y: U.rand(0.8, 8), z: U.rand(-50, 0), len: U.rand(1.5, 4.5), sp: U.rand(0.7, 1.3) });

    const m = new THREE.Matrix4();

    function updateOrbits() {
      const k = (2 * Math.PI) / S.swell.L, A = S.swell.A, ph = S.swell.phase, z = S.cutZ + 0.08;
      let n = 0;
      for (let r = 0; r < ROWS; r++) {
        const y0 = -0.6 - r * DY, rad = A * Math.exp(k * y0);
        for (let c = 0; c < COLS; c++) {
          const x0 = (c - (COLS - 1) / 2) * DX, th = k * x0 - ph;
          m.makeTranslation(x0 - rad * Math.sin(th), y0 + rad * Math.cos(th), z);
          dots.setMatrixAt(n++, m);
        }
        rings[r].position.set(0, y0, z + 0.05);
        const sc = Math.max(1e-4, rad);
        rings[r].scale.set(sc, sc, 1);
      }
      dots.instanceMatrix.needsUpdate = true;
      const th = -ph, rad0 = A * Math.exp(k * -0.6);
      hero.position.set(-rad0 * Math.sin(th), -0.6 + rad0 * Math.cos(th), z + 0.1);
      if (!trailInit) { for (let i = 0; i < TRAIL; i++) hero.position.toArray(trailPos, i * 3); trailInit = true; }
      trailPos.copyWithin(3, 0, (TRAIL - 1) * 3);
      hero.position.toArray(trailPos, 0);
      trailGeo.attributes.position.needsUpdate = true;
      base.position.set(0, -S.swell.L / 2, z);
    }

    function updateStreaks(dt) {
      const w = S.windStreaks, zMax = Math.min(S.focus.z + 12, S.cutZ + 8), fx = S.focus.x;
      streakMat.opacity += (0.75 * w - streakMat.opacity) * Math.min(1, dt * 3);
      streaks.visible = streakMat.opacity > 0.01;
      if (!streaks.visible) return;
      for (let i = 0; i < STREAKS; i++) {
        const s = st[i];
        s.x += (8 + 16 * w) * s.sp * dt;
        if (s.x > fx + 45 || s.x < fx - 60 || s.z > zMax) {
          s.x = fx - 45 - U.rand(0, 10); s.y = U.rand(1.2, 7); s.z = U.rand(S.focus.z - 40, zMax);
        }
        sp.set([s.x, s.y + S.swell.A, s.z, s.x + s.len * (0.6 + w), s.y + S.swell.A, s.z], i * 6);
      }
      streakGeo.attributes.position.needsUpdate = true;
    }

    return {
      hero: hero.position,
      update(dt) {
        group.visible = S.showOrbits;
        if (S.showOrbits) updateOrbits(); else trailInit = false;
        updateStreaks(dt);
      },
    };
  };
})();
