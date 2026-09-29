/* Chapter 09: play. You steer the surfer on the peeling wave. Stay in the pocket for a
   multiplier, stall into the barrel for big points, and don't get caught by the curl. */
(function () {
  const SURF = window.SURF, U = SURF.util, W = SURF.wave;
  const C = (SURF.chapters = SURF.chapters || {});
  const LEVELS = {
    mellow: { H: 1.8, curl: 0.75, speed: 5 },
    pumping: { H: 2.4, curl: 0.9, speed: 6.2 },
    heavy: { H: 3.1, curl: 1.0, speed: 7.6 },
  };
  const RUN = 45; // seconds per wave
  const p = new THREE.Vector3(), p2 = new THREE.Vector3(), n = new THREE.Vector3(), fwd = new THREE.Vector3();
  const ax = new THREE.Vector3(), q = new THREE.Quaternion();

  function loadBest() { try { return parseInt(localStorage.getItem('surf-best') || '0', 10) || 0; } catch (e) { return 0; } }
  function saveBest(v) { try { localStorage.setItem('surf-best', String(v)); } catch (e) { /* storage blocked */ } }

  C.play = {
    id: 'play', num: '09', short: 'Surf it', noOrbit: true,
    kicker: 'Your turn',
    title: 'Surf it yourself',
    lines: [
      '<b>Space</b> or <b>tap</b> to paddle into the wave. On a phone you can also turn on <b>Tilt to steer</b>.',
      '<b>↑ / ↓</b> (or drag up and down) to climb and drop on the face. Dropping gives you speed.',
      '<b>Space</b> or <b>tap</b> while riding to pump for extra speed.',
      '<b>→</b> stalls you back toward the curl, <b>←</b> races ahead. Stay in the <b>pocket</b> for a multiplier; stall into the <b>barrel</b> for big points.',
      'Fall behind the curl or climb too high under the lip and you wipe out.',
    ],
    params: { level: 'pumping' },
    controls: [{ type: 'seg', key: 'level', label: 'Conditions', options: [['mellow', 'Mellow'], ['pumping', 'Pumping'], ['heavy', 'Heavy']] }],
    enter(S) {
      this.input = SURF.gameInput;
      this.input.active = true;
      this.input.reset();
      this.st = SURF.ride.makeState();
      this.g = { state: 'ready', score: 0, best: loadBest(), mult: 1, time: 0, msg: '', msgT: 0, zone: '', speed: 0 };
      this.level = null;
      this.pos = new THREE.Vector3();
      S.surferVisible = true;
      S.dof = 0.4;
    },
    leave(S) { this.input.active = false; this.input.reset(); },
    setLevel(S) {
      this.level = this.params.level;
      const L = LEVELS[this.level];
      SURF.setupPeel(S, L.H, L.curl);
      S.hero.speed = L.speed;
      S.lipSpray = 60 * L.curl;
      this.reset(S);
    },
    reset(S) {
      const g = this.g;
      Object.assign(g, { state: 'ready', score: 0, mult: 1, time: 0, zone: '', pocketT: 0, tubeT: 0, pumpCd: 0, pumpT: 0, tau: 0, wipeT: 0, readyT: 0 });
      this.u = 2.2; this.dz = 5; this.v = S.hero.speed; this.vu = 0;
      S.fade = 0;
    },
    say(text, t) { this.g.msg = text; this.g.msgT = t || 1.6; },
    update(S, ct, sdt, dt) {
      if (this.params.level !== this.level) this.setLevel(S);
      const g = this.g, I = this.input, h = S.hero, L = LEVELS[this.level];
      SURF.advancePeel(S, sdt);
      g.msgT = Math.max(0, g.msgT - dt);
      S.game = g;
      S.drops = Math.max(0, S.drops - dt * 0.35);

      if (g.state === 'ready' || g.state === 'dropin') {
        // scripted paddle + take-off, borrowed from the ride choreography
        if (g.state === 'ready') {
          g.readyT += dt;
          S.fade = 1 - U.ss(0, 0.6, g.readyT);
          g.tau = (g.tau + sdt) % 4.2;
          if (I.takePump()) { g.state = 'dropin'; g.tau = Math.max(g.tau, 3.6); I.calibrate(); }
        } else {
          g.tau += sdt;
          if (g.tau >= 6.9) {
            g.state = 'ride';
            const k = SURF.ride.sample(6.9, {});
            this.u = k.u; this.dz = k.dz; this.v = h.speed + 1.5; this.vu = 0;
            this.say('Go!', 1);
          }
        }
        h.H = L.H * (g.state === 'ready' ? 0.55 + 0.1 * Math.sin(ct) : U.lerp(0.6, 1, U.ss(3.6, 5, g.tau)));
        this.pos.copy(SURF.ride.update(S, SURF.surfer, g.tau, dt, this.st));
        S.boardSpray = this.st.spray;
        return;
      }
      h.H = L.H;
      if (g.state === 'wipe' || g.state === 'done') { this.after(S, sdt, dt); return; }

      // --- riding physics in wave coordinates ---
      const vert = I.vertical(), hor = I.horizontal();
      this.vu += (vert * 1.15 - this.vu) * (1 - Math.exp(-sdt * 6));
      this.u = U.clamp(this.u + this.vu * sdt, 0.3, 2.3);
      const steep = Math.exp(-(((this.u - 0.85) / 0.6) ** 2));
      const base = h.speed * (0.72 + 0.62 * steep) - 0.18 * Math.max(0, this.dz - 8);
      this.v += (base - this.v) * sdt * 0.7 + this.vu * 3.2 * sdt;
      if (hor < 0) this.v += 1.6 * -hor * steep * sdt;
      if (hor > 0) this.v -= 4.5 * hor * sdt;
      g.pumpCd -= sdt;
      g.pumpT = Math.max(0, g.pumpT - sdt);
      if (I.takePump() && g.pumpCd <= 0) { this.v += 1.9 * (0.35 + steep); g.pumpCd = 0.55; g.pumpT = 0.3; }
      this.v = U.clamp(this.v, 1, h.speed + 9);
      this.dz += (this.v - h.speed) * sdt;
      g.speed = this.v;
      g.time += sdt;

      const tube = this.dz > -3.8 && this.dz < 1.2 && this.u > 0.68 && this.u < 1.28 && h.curl > 0.7;
      const pocket = !tube && this.dz > 0.3 && this.dz < 7 && this.u > 0.45 && this.u < 1.45;
      g.zone = tube ? 'barrel' : pocket ? 'pocket' : this.dz > 14 ? 'shoulder' : '';
      g.score += 2 * this.v * sdt;
      if (pocket) { g.pocketT += sdt; g.score += 25 * g.mult * sdt; } else g.pocketT = Math.max(0, g.pocketT - 2 * sdt);
      g.mult = 1 + Math.min(4, Math.floor(g.pocketT / 2));
      if (tube) {
        if (g.tubeT === 0) { this.say('BARREL!', 1.2); this.input.buzz(35); }
        g.tubeT += sdt;
        g.score += 150 * g.mult * sdt;
        S.drops = Math.min(1, S.drops + sdt * 0.8);
      } else if (g.tubeT > 0) {
        if (g.tubeT > 0.8) { const b = Math.round(400 * g.tubeT); g.score += b; this.say(`Spat out! +${b}`, 1.8); S.drops = 1; }
        g.tubeT = 0;
      }
      S.sound.surf = 0.7 + 0.3 * steep;

      if (this.dz < -4.5) this.wipe(S, 'The barrel closed on you');
      else if (this.dz < -1.0 && !tube) this.wipe(S, 'Caught by the whitewater');
      else if (this.u < 0.4 && this.dz < 6 && h.curl > 0.5) this.wipe(S, 'Over the falls!');
      else if (g.time > RUN || this.dz > 45) this.finish(S);
      this.place(S, dt, tube, hor);
    },
    place(S, dt, tube, hor) {
      const g = this.g, H = S.hero.H, z = S.hero.peelZ + this.dz;
      W.at(this.u * H, z, p);
      W.at((this.u + this.vu * 0.1) * H, z + this.v * 0.1, p2);
      W.normal(this.u * H, z, n);
      fwd.subVectors(p2, p).normalize();
      this.st.heading.lerp(fwd, 1 - Math.exp(-dt * 8)).normalize();
      const crouch = tube ? 1 : Math.max(0.15, hor > 0 ? 0.5 : 0, g.pumpT * 2);
      SURF.surfer.setPose({ ride: 1 - crouch, tuck: crouch }, S.t);
      SURF.surfer.place(p, this.st.heading, n);
      this.pos.copy(p);
      const sp = this.st.spray;
      sp.rate = 70 + 40 * g.pumpT;
      sp.p.copy(p).addScaledVector(this.st.heading, -0.85).addScaledVector(n, 0.05);
      sp.v.copy(this.st.heading).multiplyScalar(-1.5).addScaledVector(n, 1.8);
      S.boardSpray = sp;
    },
    wipe(S, why) {
      const g = this.g;
      g.state = 'wipe';
      g.wipeT = 0;
      this.say(why, 2.4);
      S.burst = this.pos.clone();
      S.sound.crash = 1;
      S.boardSpray = null;
      this.input.buzz([90, 50, 180]);
      this.end(g);
    },
    finish(S) {
      const g = this.g;
      g.state = 'done';
      g.wipeT = 0;
      this.say('Kicked out — nice wave!', 2.6);
      this.end(g);
    },
    end(g) {
      g.score = Math.round(g.score);
      if (g.score > g.best) { g.best = g.score; g.newBest = true; saveBest(g.best); } else g.newBest = false;
    },
    after(S, sdt, dt) {
      const g = this.g;
      g.wipeT += dt;
      if (g.state === 'wipe') {
        // tumble in the whitewater, carried along with the wave
        const H = S.hero.H, z = S.hero.peelZ + this.dz;
        W.at(Math.min(1.6, this.u + g.wipeT * 0.6) * H, z, p);
        p.y -= Math.min(1.2, g.wipeT * 0.8);
        SURF.surfer.setPose({ paddle: 0.5, tuck: 0.5 }, S.t * 3);
        SURF.surfer.place(p, this.st.heading, n.set(0, 1, 0));
        ax.set(1, 0, 0).applyQuaternion(SURF.surfer.root.quaternion);
        q.setFromAxisAngle(ax, g.wipeT * 7);
        SURF.surfer.root.quaternion.premultiply(q);
        this.pos.copy(p);
      } else {
        this.u = Math.max(-1.5, this.u - dt * 1.4);
        this.vu = -1.4;
        this.place(S, dt, false, 0);
      }
      S.fade = U.ss(2.4, 3, g.wipeT);
      if (g.wipeT > 3.2) {
        const best = g.best, nb = g.newBest, last = g.score;
        this.reset(S);
        Object.assign(g, { best, newBest: nb, last });
      }
    },
    camera(S, ct, out) {
      const pp = this.pos;
      out.target.set(pp.x, pp.y + 0.6, pp.z);
      out.pos.set(pp.x + 12, pp.y + 4, pp.z - 3);
    },
  };
})();
