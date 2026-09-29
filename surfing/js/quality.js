/* Automatic quality: watches real frame times and steps render resolution, ocean mesh density
   and post-processing up or down, with hysteresis so it doesn't flicker between levels.
   Phones start one level lower. Locked to high while a video is being recorded. */
(function () {
  const SURF = window.SURF;
  const LEVELS = [
    { name: 'low', scale: 0.7, dpr: 1.25, grid: 'low', post: false, samples: 0, dof: false, shadow: 0 },
    { name: 'medium', scale: 0.85, dpr: 1.5, grid: 'medium', post: true, samples: 0, dof: false, shadow: 512 },
    { name: 'high', scale: 1, dpr: 1.75, grid: 'high', post: true, samples: 4, dof: true, shadow: 1024 },
  ];

  SURF.createQuality = function ({ ocean, post, main, recorder }) {
    const coarse = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    const Q = { level: coarse ? 1 : 2, avg: 1 / 60, slowT: 0, fastT: 0, cooldown: 3, ups: 0, locked: false, saved: 2 };

    function apply() {
      const L = LEVELS[Q.level];
      main.setRender(L.scale, L.dpr);
      ocean.setDetail(L.grid);
      main.setShadows(L.shadow);
      if (post) post.configure(L.post, L.samples, L.dof);
      Q.name = L.name;
    }

    /* called once per animation frame with the real (unclamped) frame time */
    Q.frame = function (dt) {
      if (recorder.active) {
        if (!Q.locked) { Q.locked = true; Q.saved = Q.level; Q.level = 2; apply(); }
        return;
      }
      if (Q.locked) { Q.locked = false; Q.level = Q.saved; apply(); Q.cooldown = 3; }
      if (document.hidden || dt <= 0 || dt > 0.25) return;
      Q.avg += (dt - Q.avg) * 0.05;
      Q.cooldown -= dt;
      if (Q.cooldown > 0) return;
      if (Q.avg > 1 / 42) Q.slowT += dt; else Q.slowT = Math.max(0, Q.slowT - dt * 0.5);
      if (Q.avg < 1 / 57) Q.fastT += dt; else Q.fastT = 0;
      if (Q.slowT > 2 && Q.level > 0) {
        Q.level--;
        apply();
        Q.slowT = 0;
        Q.cooldown = 4;
      } else if (Q.fastT > 8 && Q.level < 2 && Q.ups < 2) {
        Q.level++;
        Q.ups++;
        apply();
        Q.fastT = 0;
        Q.cooldown = 4;
      }
    };

    apply();
    return Q;
  };
})();
