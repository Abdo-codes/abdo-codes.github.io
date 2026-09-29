/* Seabed + the "aquarium" cutaway: a slice through the water at z = cutZ so you can see
   what happens below the surface (orbits, shoaling over the bottom). */
(function () {
  const SURF = window.SURF;

  function strip(cols, colorTop, colorBottom) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array((cols + 1) * 6);
    const idx = [];
    for (let i = 0; i < cols; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(idx);
    if (colorTop) {
      const col = new Float32Array((cols + 1) * 6);
      for (let i = 0; i <= cols; i++) {
        col.set([colorTop.r, colorTop.g, colorTop.b, colorBottom.r, colorBottom.g, colorBottom.b], i * 6);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    return geo;
  }

  SURF.createSeabed = function (scene) {
    const S = SURF.state, W = SURF.wave, U = SURF.util;
    const group = new THREE.Group();
    scene.add(group);

    // sandy bottom (behind the cut)
    const bedGeo = new THREE.PlaneGeometry(700, 500, 350, 1);
    bedGeo.rotateX(-Math.PI / 2);
    bedGeo.translate(0, 0, -250);
    const bed = new THREE.Mesh(bedGeo, new THREE.MeshStandardMaterial({ color: U.srgb(0xc9a877), roughness: 1, emissive: U.srgb(0x3a2c1c) }));
    group.add(bed);

    // sand cross-section at the cut
    const SC = 350;
    const sandGeo = strip(SC);
    const sand = new THREE.Mesh(sandGeo, new THREE.MeshStandardMaterial({ color: U.srgb(0x8c6b47), roughness: 1, side: THREE.DoubleSide, emissive: U.srgb(0x4a3421) }));
    group.add(sand);

    // water cross-section: a translucent gradient curtain under the surface line
    const WC = 1400;
    const tx = new Float32Array(WC + 1), ty = new Float32Array(WC + 1);
    const waterGeo = strip(WC, U.srgb(0x0a5563), U.srgb(0x01060d));
    // stencil: where the folded lip makes triangles overlap, each pixel is still drawn only once
    const water = new THREE.Mesh(waterGeo, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false, side: THREE.DoubleSide,
      stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
    }));
    water.renderOrder = 2;
    group.add(water);

    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((WC + 1) * 3), 3));
    const edge = new THREE.Line(edgeGeo, new THREE.LineBasicMaterial({ color: 0xe9fdff, transparent: true, opacity: 0.75 }));
    edge.renderOrder = 3;
    group.add(edge);

    let sig = '';
    const v = new THREE.Vector3();

    function rebuild() {
      const p = bedGeo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, W.bedY(p.getX(i)));
      p.needsUpdate = true;
      bedGeo.computeVertexNormals();
      const s = sandGeo.attributes.position;
      for (let i = 0; i <= SC; i++) {
        const x = -350 + (700 * i) / SC;
        s.setXYZ(i * 2, x, W.bedY(x), 0);
        s.setXYZ(i * 2 + 1, x, -45, 0);
      }
      s.needsUpdate = true;
      sandGeo.computeVertexNormals();
      sandGeo.computeBoundingSphere();
    }

    return {
      group,
      update() {
        const cut = S.cutZ < 1e4;
        group.visible = S.bed.visible || cut;
        if (!group.visible) return;
        bed.visible = S.bed.visible;
        sand.visible = cut && S.bed.visible;
        water.visible = edge.visible = cut;
        const b = S.bed;
        const next = `${b.start}|${b.slope}|${b.far}|${b.shelf}`;
        if (next !== sig) { sig = next; rebuild(); }
        sand.position.z = cut ? S.cutZ : 0;
        if (!cut) return;

        const wp = waterGeo.attributes.position, ep = edgeGeo.attributes.position;
        const x0 = S.focus.x - 95;
        for (let i = 0; i <= WC; i++) {
          W.surface(x0 + (190 * i) / WC, S.cutZ, v);
          tx[i] = v.x;
          ty[i] = v.y;
        }
        // Where the lip curls over, the profile folds back on itself. Those columns are a thin
        // sheet of water with air (the tube) beneath, so don't fill them down to the seabed.
        let foldEnd = -1;
        for (let i = 1; i <= WC; i++) if (tx[i] < tx[i - 1] - 1e-4) foldEnd = i;
        let lipFrom = WC + 1;
        if (foldEnd > 0) {
          const xWall = tx[foldEnd];
          lipFrom = foldEnd;
          while (lipFrom > 0 && tx[lipFrom - 1] > xWall) lipFrom--;
        }
        const thin = 0.1 + 0.12 * S.hero.H;
        for (let i = 0; i <= WC; i++) {
          // the first lip column still reaches the seabed, so the water behind the tube has no gap
          let bottom = i > lipFrom && i < foldEnd ? ty[i] - thin : S.bed.visible ? W.bedY(tx[i]) : -30;
          if (bottom > ty[i]) bottom = ty[i];
          wp.setXYZ(i * 2, tx[i], ty[i], S.cutZ);
          wp.setXYZ(i * 2 + 1, tx[i], bottom, S.cutZ);
          ep.setXYZ(i, tx[i], ty[i] + 0.02, S.cutZ + 0.01);
        }
        wp.needsUpdate = true;
        ep.needsUpdate = true;
        waterGeo.computeBoundingSphere();
        edgeGeo.computeBoundingSphere();
      },
    };
  };
})();
