/* Procedural water textures, generated once at startup (no image files):
   - ripples: a tiling normal map from ~50 small waves with whole-number wavenumbers (so it tiles),
     blended at several scales in the ocean shader. Mipmaps keep distant water from shimmering.
   - foam: tiling cellular noise. R = bubbly lace, G = foam streaks stretched along one axis. */
(function () {
  const SURF = window.SURF;

  function rng(seed) {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  function makeTexture(data, size, renderer) {
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.needsUpdate = true;
    return t;
  }

  function rippleNormals(size) {
    const rnd = rng(1234), waves = [];
    for (let i = 0; i < 56; i++) {
      const ang = rnd() * Math.PI * 2, k = 2 + Math.floor(Math.pow(rnd(), 1.7) * 34);
      const kx = Math.round(Math.cos(ang) * k), ky = Math.round(Math.sin(ang) * k);
      if (!kx && !ky) continue;
      const kk = Math.hypot(kx, ky);
      waves.push({ kx: (kx * 2 * Math.PI) / size, ky: (ky * 2 * Math.PI) / size, a: 1 / Math.pow(kk, 1.25), ph: rnd() * 6.2832 });
    }
    const dx = new Float32Array(size * size), dy = new Float32Array(size * size);
    let max = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let gx = 0, gy = 0;
        for (const w of waves) {
          const c = Math.cos(w.kx * x + w.ky * y + w.ph) * w.a;
          gx += c * w.kx;
          gy += c * w.ky;
        }
        const i = y * size + x;
        dx[i] = gx;
        dy[i] = gy;
        max = Math.max(max, Math.abs(gx), Math.abs(gy));
      }
    }
    const data = new Uint8Array(size * size * 4), s = 1 / max;
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = Math.round((dx[i] * s * 0.5 + 0.5) * 255);
      data[i * 4 + 1] = Math.round((dy[i] * s * 0.5 + 0.5) * 255);
      data[i * 4 + 2] = 255;
      data[i * 4 + 3] = 255;
    }
    return data;
  }

  /* tiling cellular noise: distance to the nearest / second-nearest feature point */
  function cells(size, n, stretchY, seed) {
    const rnd = rng(seed), pts = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) pts.push([(i + rnd()) / n, (j + rnd()) / n]);
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / size, ci = Math.floor(u * n), cj = Math.floor(v * n);
        let f1 = 9, f2 = 9;
        for (let dj = -1; dj <= 1; dj++) {
          for (let di = -1; di <= 1; di++) {
            const ii = (ci + di + n) % n, jj = (cj + dj + n) % n, p = pts[jj * n + ii];
            let ddx = p[0] - u, ddy = p[1] - v;
            ddx -= Math.round(ddx);
            ddy -= Math.round(ddy);
            const d = Math.hypot(ddx, ddy * stretchY);
            if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
          }
        }
        out[y * size + x] = (f2 - f1) * n; // ~0 on the borders between cells
      }
    }
    return out;
  }

  function foam(size) {
    const a = cells(size, 10, 1, 77), b = cells(size, 22, 1, 91), s = cells(size, 12, 0.22, 5);
    const data = new Uint8Array(size * size * 4);
    const lace = (v) => 1 - Math.min(1, v * 2.2); // bright threads along the cell borders
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = Math.round(Math.min(1, lace(a[i]) * 0.65 + lace(b[i]) * 0.55) * 255);
      data[i * 4 + 1] = Math.round(lace(s[i]) * 255);
      data[i * 4 + 2] = Math.round(Math.min(1, a[i]) * 255);
      data[i * 4 + 3] = 255;
    }
    return data;
  }

  SURF.createWaterTextures = function (renderer) {
    const size = 256;
    SURF.textures = {
      ripples: makeTexture(rippleNormals(size), size, renderer),
      foam: makeTexture(foam(size), size, renderer),
    };
    return SURF.textures;
  };
})();
