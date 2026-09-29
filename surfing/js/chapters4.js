/* Chapter 08: lineup etiquette (who has right of way) and rip-current safety. */
(function () {
  const SURF = window.SURF, U = SURF.util, W = SURF.wave;
  const C = (SURF.chapters = SURF.chapters || {});

  const p = new THREE.Vector3(), p2 = new THREE.Vector3(), n = new THREE.Vector3(), dir = new THREE.Vector3();

  /* Put a surfer on the wave at (u in wave heights, dz from the peel) facing `want`. */
  function placeOnWave(S, surfer, st, uN, dz, want, w, dt) {
    const H = Math.max(0.5, S.hero.H), z = S.hero.peelZ + dz;
    W.at(uN * H, z, p);
    W.normal(uN * H, z, n);
    st.heading.lerp(want, 1 - Math.exp(-dt * 5)).normalize();
    if (w.paddle > 0.5) p.addScaledVector(n, -0.03);
    surfer.setPose(w, S.t + 1.3);
    surfer.place(p, st.heading, n);
    return p;
  }

  C.safety = {
    id: 'safety', num: '08', short: 'Safety',
    kicker: 'In the lineup',
    title: 'Surf smart, surf safe',
    lines: [
      '<b>Right of way:</b> the surfer closest to the breaking part of the wave (the peak) has priority. Everyone else waits.',
      '<b>Never drop in.</b> Taking off in front of someone already riding is the number-one rule broken in the water. It is dangerous and rude.',
      '<b>Rip currents</b> are rivers of water rushing back out to sea. Waves pile water onto the beach, and it escapes through deeper gaps between the sandbars.',
      '<b>Spot one</b> by the calm-looking, darker gap where waves are not breaking — often with foam or sand drifting outward.',
      '<b>Caught in one?</b> Do not swim against it. Stay calm, float, swim parallel to the beach until you are out of the pull, then let the waves bring you in.',
    ],
    params: { topic: 'priority', dropIn: false },
    controls: [
      { type: 'seg', key: 'topic', label: 'Topic', options: [['priority', 'Right of way'], ['rip', 'Rip currents']] },
      { type: 'toggle', key: 'dropIn', label: 'Show a drop-in (what not to do)' },
    ],
    enter(S) {
      this.topic = null;
      this.labels = SURF.makeLabels([
        ['Closest to the peak = priority', 0, 70], ['Waits their turn ✓', 0, 50], ['Drops in ✗', 0, 50],
        ['Rip current: the calm, dark gap', 0, 95], ['Sandbar: waves break here', 0, 40], ['Sandbar', 0, 40],
        ['1 · Don’t fight it', 0, 40], ['2 · Swim parallel to the beach', 0, 40], ['3 · Let the waves bring you in', 0, 40],
      ]);
      this.stA = SURF.ride.makeState();
      this.stB = SURF.ride.makeState();
    },
    setup(S, topic) {
      this.topic = topic;
      SURF.resetScene();
      S.camSnap = true;
      this.since = 0;
      if (topic === 'priority') {
        SURF.setupPeel(S, 2.3, 0.85);
        S.hero.speed = 6;
        S.surferVisible = true;
        S.surfer2Visible = true;
        S.dof = 0.25;
        this.tau = 5;
      } else {
        S.rip = true;
        S.swell.A = 0.35;
        S.swell.L = 24;
        S.chop = 0.15;
        Object.assign(S.sound, { surf: 0.7, wind: 0.2 });
      }
    },
    update(S, ct, sdt, dt) {
      if (S.film.active) {
        this.params.topic = S.captionIndex >= 2 ? 'rip' : 'priority';
        this.params.dropIn = S.captionIndex === 1;
      }
      if (this.params.topic !== this.topic) this.setup(S, this.params.topic);
      this.since += sdt;
      S.fade = 1 - U.ss(0, 0.5, this.since);
      const L = this.labels;
      if (this.topic === 'rip') {
        const r = SURF.rip;
        L[3].p.set(-24, 0.4, 0);
        L[4].p.set(-5, 0.4, 24);
        L[5].p.set(-5, 0.4, -24);
        L[6 + r.phase].p.copy(r.swimmer).y += 0.6;
        S.labels = [L[3], L[4], L[5], L[6 + r.phase]];
        return;
      }
      SURF.advancePeel(S, sdt);
      this.tau += sdt;
      if (this.tau > 24) this.tau = 5;
      S.fade = Math.max(S.fade, U.ss(23.5, 24, this.tau), 1 - U.ss(5, 5.5, this.tau));
      const a = SURF.ride.update(S, SURF.surfer, this.tau, dt, this.stA);
      this.posA = (this.posA || new THREE.Vector3()).copy(a);
      const t = this.tau, drop = this.params.dropIn;
      let b;
      if (drop && t > 8) {
        const pop = U.ss(8, 9, t);
        const uN = U.lerp(1.5, 0.95 + 0.25 * Math.sin(t * 1.4), pop);
        b = placeOnWave(S, SURF.surfer2, this.stB, uN, 12 - (t - 8) * 0.25, dir.set(0.15, 0, 1).normalize(), { paddle: 1 - pop, ride: pop }, dt);
      } else {
        b = placeOnWave(S, SURF.surfer2, this.stB, 1.7, 16, dir.set(-1, 0, 0.2).normalize(), { paddle: 1 }, dt);
      }
      this.posB = (this.posB || new THREE.Vector3()).copy(b);
      L[0].p.copy(this.posA).y += 1.8;
      L[1].p.copy(this.posB).y += 0.9;
      L[2].p.copy(this.posB).y += 1.8;
      S.labels = [L[0], drop && t > 8 ? L[2] : L[1]];
    },
    camera(S, ct, out) {
      if (this.topic === 'rip') {
        out.target.set(-10, 0, 3);
        out.pos.set(46, 44, 8 + Math.sin(ct * 0.08) * 8);
        return;
      }
      const a = this.posA || p, b = this.posB || p2;
      out.target.set((a.x + b.x) / 2, 1, (a.z + b.z) / 2);
      out.pos.set(out.target.x + 22, 7, out.target.z + 8);
    },
  };
})();
