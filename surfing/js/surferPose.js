/* Surfer posing: blended poses (paddle / ride / tuck), two-bone leg IK that keeps the feet planted
   on the deck, and procedural balance (lean into turns, counter-swinging arms, compression on
   bottom turns) derived from how the board actually moves. */
(function () {
  const SURF = window.SURF;
  const PI = Math.PI;

  // FK rotations per joint. "N" = limb on the nose side, "T" = tail side. Legs only matter
  // for paddling; standing legs are solved by IK.
  const POSES = {
    paddle: {
      spine: [-0.28, 0, 0], neck: [-0.75, 0, 0],
      armN: [0, 0, -0.15], elbN: [0, 0, 0], armT: [0, 0, 0.15], elbT: [0, 0, 0],
      legN: [-0.14, 0, -0.07], kneeN: [0.06, 0, 0], legT: [-0.12, 0, 0.07], kneeT: [0.1, 0, 0],
    },
    ride: { // athletic stance: chest turned down the line, lead arm reaching forward, elbows soft
      spine: [0.14, -0.3, 0], neck: [-0.36, -0.85, 0],
      armN: [-0.35, 0, -0.85], elbN: [-0.6, 0, 0], armT: [0.15, 0, 0.7], elbT: [-0.5, 0, 0],
      legN: [-0.6, 0, -0.42], kneeN: [1.0, 0, 0], legT: [-0.5, 0, 0.44], kneeT: [1.05, 0, 0],
    },
    tuck: {
      spine: [0.45, -0.25, 0], neck: [-0.55, -0.85, 0],
      armN: [-0.75, 0, -0.5], elbN: [-0.5, 0, 0], armT: [0.2, 0, 0.6], elbT: [-0.6, 0, 0],
      legN: [-1.25, 0, -0.36], kneeN: [2.0, 0, 0], legT: [-1.1, 0, 0.38], kneeT: [2.05, 0, 0],
    },
  };
  const FK_JOINTS = Object.keys(POSES.ride);
  const THIGH = 0.45, SHIN = 0.44, ANKLE_H = 0.062;
  const STAND_H = 0.76, TUCK_H = 0.52; // pelvis height above the deck, standing and crouched
  const UPRIGHT = 0.75; // how much of the face's slope the rider stands up against (0 = square to the board)
  const FEET = { N: { x: 0.2, toe: -0.32 }, T: { x: -0.5, toe: 0.12 } }; // stance on the deck
  const X_AXIS = new THREE.Vector3(1, 0, 0), Y_AXIS = new THREE.Vector3(0, 1, 0);
  const Q_PRONE = new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2, PI / 2, 0, 'YXZ'));
  const Q_STAND = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, PI, 0, 'YXZ'));

  SURF.createSurfer = function (scene, colors) {
    const U = SURF.util, rig = SURF.buildSurferRig(scene, colors);
    const { root, body, parts, contacts, leash, board } = rig;

    const v = new THREE.Vector3(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
    const inv = new THREE.Matrix4(), m4 = new THREE.Matrix4();
    const H = new THREE.Vector3(), A = new THREE.Vector3(), u = new THREE.Vector3(), pp = new THREE.Vector3();
    const K = new THREE.Vector3(), t = new THREE.Vector3(), s = new THREE.Vector3();
    const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3();
    const poleN = new THREE.Vector3(-0.35, 0, 1).normalize(), poleT = new THREE.Vector3(-0.65, 0, 1).normalize();
    const hipIK = new THREE.Quaternion(), kneeIK = new THREE.Quaternion();
    const hand = new THREE.Vector3(), pole = new THREE.Vector3(), legFK = [0, 1, 2, 3].map(() => new THREE.Quaternion());
    const dyn = { lean: 0, yaw: 0, compress: 0, speed: 0, grav: 0, lastT: -1, placeT: -1 };
    const prevX = new THREE.Vector3(1, 0, 0), prevPos = new THREE.Vector3(), prevVel = new THREE.Vector3(), vel = new THREE.Vector3();
    const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();

    /* analytic two-bone IK in the joint's parent space: aim the upper bone so the lower one lands on
       `target`, bending toward `pole` (legs: thigh + shin; arms: upper arm + forearm) */
    function solveLeg(hip, target, pole, L1 = THIGH, L2 = SHIN) {
      H.copy(hip.position);
      u.subVectors(target, H);
      const d = U.clamp(u.length(), 0.15, L1 + L2 - 1e-3);
      u.normalize();
      const cosA = U.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
      pp.copy(pole).addScaledVector(u, -pole.dot(u)).normalize();
      K.copy(H).addScaledVector(u, L1 * cosA).addScaledVector(pp, L1 * sinA);
      A.copy(H).addScaledVector(u, d);
      t.subVectors(K, H).normalize();
      s.subVectors(A, K).normalize();
      by.copy(t).negate();
      bz.copy(pp).addScaledVector(t, -pp.dot(t)).normalize();
      bx.crossVectors(by, bz);
      hipIK.setFromRotationMatrix(m4.makeBasis(bx, by, bz));
      kneeIK.setFromAxisAngle(X_AXIS, Math.atan2(-s.dot(bz), -s.dot(by)));
    }

    function settle() {
      body.position.y = 0;
      root.updateMatrixWorld(true);
      let min = Infinity;
      for (const [o, r] of contacts) {
        o.getWorldPosition(v);
        root.worldToLocal(v);
        min = Math.min(min, v.y - r);
      }
      return board.deckAt(body.position.x, 0) - min;
    }

    function updateLeash() {
      parts.footT.getWorldPosition(v);
      root.worldToLocal(v);
      const x0 = board.TAIL + 0.08, y0 = board.deckAt(x0, 0) + 0.005, p = leash.geometry.attributes.position;
      const dist = Math.hypot(v.x - x0, v.y - y0, v.z), sag = Math.max(0, 1.3 - dist) * 0.12;
      for (let i = 0; i < 16; i++) {
        const k = i / 15, x = U.lerp(x0, v.x, k), z = v.z * k;
        let y = U.lerp(y0, v.y - 0.03, k) - sag * Math.sin(PI * k);
        if (x > board.TAIL && x < board.NOSE && Math.abs(z) < 0.25) y = Math.max(y, board.deckAt(x, z) + 0.008);
        p.setXYZ(i, x, y, z);
      }
      p.needsUpdate = true;
    }

    const api = {
      root,
      body,
      parts,
      leash,
      hideables: [body, leash], // hidden in the rider's own eye view (a loaded human model adds itself)
      stand: 0,
      legIK: 0, // how far the legs are planted on the deck (0 lying down, 1 standing)
      carve: 0,
      /* w = { paddle, ride, tuck } (any scale). time drives paddling, wobble and the balance filter. */
      setPose(w, time) {
        const tot = (w.paddle || 0) + (w.ride || 0) + (w.tuck || 0) || 1;
        const f = { paddle: (w.paddle || 0) / tot, ride: (w.ride || 0) / tot, tuck: (w.tuck || 0) / tot };
        const stand = 1 - f.paddle;
        api.stand = stand;
        // the pop-up, in three beats: hands on the deck push the chest up while the hips stay down,
        // the feet tuck in under the body and it swings up into a deep crouch, then the rider rises out of it
        const push = U.ss(0, 0.4, stand), tuckIn = U.ss(0.28, 0.62, stand), hop = U.ss(0.42, 0.8, stand);
        const legW = U.ss(0.22, 0.32, stand); // legs switch to IK early; their feet then follow tuckIn's path
        const plant = U.ss(0.02, 0.2, stand) * (1 - U.ss(0.6, 0.76, stand));
        const low = stand < 1 ? 1 - U.ss(0.8, 1, stand) : 0; // still crouched deep from landing
        api.legIK = legW;
        dyn.lastT = time;

        for (const j of FK_JOINTS) {
          let x = 0, y = 0, z = 0;
          for (const k in POSES) { const r = POSES[k][j]; x += r[0] * f[k]; y += r[1] * f[k]; z += r[2] * f[k]; }
          parts[j].rotation.set(x, y, z);
        }
        if (f.paddle > 0.01) {
          const a = time * 4.4, wrap = (x) => -PI + (((x % (2 * PI)) + 2 * PI) % (2 * PI));
          parts.armN.rotation.x = U.lerp(parts.armN.rotation.x, wrap(a), f.paddle);
          parts.armT.rotation.x = U.lerp(parts.armT.rotation.x, wrap(a + PI), f.paddle);
        }

        parts.neck.rotation.y += w.look || 0; // e.g. glancing back at the wave
        parts.neck.rotation.x += w.lookUp || 0;

        // balance: lean into the turn, counter-swing the arms, absorb compression
        const lean = dyn.lean * stand, turn = U.clamp(dyn.yaw / 1.2, -1, 1) * stand, T = Math.abs(turn);
        const crouch = Math.max(low, U.clamp(f.tuck / Math.max(stand, 1e-3) + dyn.compress * 0.6, 0, 1));
        parts.spine.rotation.x += (-lean * 0.25 + dyn.compress * 0.22) * stand - 0.75 * push * (1 - hop); // the push: chest up, hips stay on the board
        parts.spine.rotation.z += Math.sin(time * 1.7) * 0.04 * stand;
        parts.neck.rotation.y += turn * 0.3;
        parts.armN.rotation.x += lean * 0.9;
        parts.armN.rotation.z += -0.35 * T + Math.sin(time * 2.3) * 0.08 * stand;
        parts.armT.rotation.x += -lean * 0.6;
        parts.armT.rotation.z += 0.4 * T + Math.sin(time * 1.9 + 1) * 0.08 * stand;

        // body placement: stand up against the slope of the face rather than square to the tilted
        // board, lean into the turn, pivot about the feet so the hips stay over them, hinge at the hips
        const tilt = lean + U.clamp(dyn.grav, -0.7, 0.7) * UPRIGHT * stand;
        q.setFromAxisAngle(X_AXIS, tilt).multiply(q2.setFromAxisAngle(Y_AXIS, U.clamp(dyn.yaw * 0.15, -0.25, 0.25) * stand)).multiply(Q_STAND);
        q.multiply(q2.setFromAxisAngle(X_AXIS, U.lerp(0.2, 0.34, crouch)));
        body.quaternion.copy(Q_PRONE).slerp(q, hop);
        const hipX = U.lerp(-0.13, -0.16, crouch), h = U.lerp(STAND_H, TUCK_H, crouch);
        body.position.x = U.lerp(-0.42, hipX, hop);
        body.position.z = (h * Math.sin(tilt) + 0.04) * hop;
        const yStand = board.deckAt(hipX, 0) + h * Math.cos(tilt);
        body.position.y = stand > 0.999 ? yStand : U.lerp(settle(), yStand, hop * hop);

        // legs: plant both feet on the deck (they swing in during the hop)
        const plantLegs = () => {
          body.updateMatrix();
          inv.copy(body.matrix).invert();
          ['N', 'T'].forEach((key, i) => {
            const ft = FEET[key], fx = ft.x + (key === 'N' ? 0.03 : -0.02) * crouch;
            // each foot sweeps low over the deck from behind the hips to its spot in the stance
            const x = U.lerp(body.position.x - 0.75, fx, tuckIn), z = (key === 'N' ? 0.12 : -0.12) * (1 - tuckIn);
            v.set(x, board.deckAt(x, z) + ANKLE_H + 0.14 * Math.sin(PI * tuckIn), z).applyMatrix4(inv);
            pole.copy(key === 'N' ? poleN : poleT);
            pole.x *= hop; // knees straight under the body while tucking in; the stance's splay comes once up
            solveLeg(parts['leg' + key], v, pole.normalize());
            parts['leg' + key].quaternion.copy(legFK[i * 2]).slerp(hipIK, legW);
            parts['knee' + key].quaternion.copy(legFK[i * 2 + 1]).slerp(kneeIK, legW);
            // foot flat on the deck, angled in a slight duck stance
            q.copy(body.quaternion).multiply(parts['leg' + key].quaternion).multiply(parts['knee' + key].quaternion).invert();
            q2.setFromAxisAngle(Y_AXIS, PI + ft.toe);
            parts['foot' + key].quaternion.identity().slerp(q.multiply(q2), legW);
          });
        };
        if (legW > 0.001) {
          legFK.forEach((fq, i) => fq.copy(parts[['legN', 'kneeN', 'legT', 'kneeT'][i]].quaternion));
          plantLegs();
          // mid pop-up the tucked knees decide how high the body must be: settle again with them, re-plant
          if (stand < 0.999) { body.position.y = U.lerp(settle(), yStand, hop * hop); plantLegs(); }
        } else {
          parts.footN.quaternion.identity();
          parts.footT.quaternion.identity();
        }
        // arms: during the push the hands are planted on the deck beside the chest, elbows back
        if (plant > 0.001) {
          root.updateMatrixWorld(true);
          for (const key of ['N', 'T']) {
            const sh = parts['arm' + key], chest = sh.parent;
            root.worldToLocal(sh.getWorldPosition(hand));
            const hz = Math.sign(hand.z || 1) * 0.2;
            hand.set(hand.x - 0.04, board.deckAt(hand.x, hz) + 0.05, hz);
            chest.worldToLocal(root.localToWorld(hand));
            pole.set(sh.position.x * 3, -1, -0.4).normalize(); // elbows toward the feet, a little out
            solveLeg(sh, hand, pole, 0.3, 0.3);
            sh.quaternion.slerp(hipIK, plant);
            parts['elb' + key].quaternion.slerp(kneeIK, plant);
          }
        }
        updateLeash();
      },
      place(pos, heading, normal) {
        Y.copy(normal);
        X.copy(heading).addScaledVector(Y, -heading.dot(Y));
        if (X.lengthSq() < 1e-6) X.set(1, 0, 0);
        X.normalize();
        Z.crossVectors(X, Y);
        root.quaternion.setFromRotationMatrix(m4.makeBasis(X, Y, Z));
        root.position.copy(pos);

        // balance filter: yaw rate, speed and push into the board, from the board's real motion;
        // grav = how far world-up leans across the board, rail to rail
        const dt = dyn.lastT - dyn.placeT, grav = Math.atan2(Z.y, Y.y);
        dyn.placeT = dyn.lastT;
        if (dt > 1e-4 && dt < 0.2 && pos.distanceTo(prevPos) < 3) {
          const k = 1 - Math.exp(-dt * 6);
          dyn.grav += (grav - dyn.grav) * k;
          const yawRate = Math.asin(U.clamp(v.crossVectors(prevX, X).dot(Y), -1, 1)) / dt;
          dyn.yaw += (U.clamp(yawRate, -3, 3) - dyn.yaw) * k;
          vel.subVectors(pos, prevPos).divideScalar(dt);
          dyn.speed += (vel.length() - dyn.speed) * k;
          const push = v.subVectors(vel, prevVel).divideScalar(dt).dot(Y);
          dyn.compress += (U.clamp(push / 18, 0, 0.7) - dyn.compress) * k * 0.6;
          const want = -U.clamp(Math.atan((dyn.speed * dyn.yaw) / 9.81) * 0.9, -0.55, 0.55);
          dyn.lean += (want - dyn.lean) * k;
          prevVel.copy(vel);
        } else if (dt >= 0.2 || dt < 0) {
          dyn.yaw = dyn.lean = dyn.compress = 0;
          dyn.grav = grav;
          prevVel.set(0, 0, 0);
        }
        api.carve = (dyn.speed * dyn.yaw) / 9.81; // sideways g of the turn, + when turning toward the toes
        prevX.copy(X);
        prevPos.copy(pos);
      },
    };
    return api;
  };
})();
