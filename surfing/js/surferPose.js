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
    ride: {
      spine: [0.3, 0, 0], neck: [-0.22, -0.95, 0],
      armN: [0.1, 0, -1.15], elbN: [0, 0, -0.35], armT: [-0.1, 0, 1.0], elbT: [0, 0, 0.45],
      legN: [-0.6, 0, -0.42], kneeN: [1.0, 0, 0], legT: [-0.5, 0, 0.44], kneeT: [1.05, 0, 0],
    },
    tuck: {
      spine: [0.72, 0, 0], neck: [-0.55, -0.9, 0],
      armN: [-0.7, 0, -0.55], elbN: [0, 0, -0.7], armT: [0.3, 0, 0.9], elbT: [0, 0, 0.3],
      legN: [-1.25, 0, -0.36], kneeN: [2.0, 0, 0], legT: [-1.1, 0, 0.38], kneeT: [2.05, 0, 0],
    },
  };
  const FK_JOINTS = Object.keys(POSES.ride);
  const THIGH = 0.45, SHIN = 0.44, ANKLE_H = 0.062;
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
    const dyn = { lean: 0, yaw: 0, compress: 0, speed: 0, lastT: -1, placeT: -1 };
    const prevX = new THREE.Vector3(1, 0, 0), prevPos = new THREE.Vector3(), prevVel = new THREE.Vector3(), vel = new THREE.Vector3();
    const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();

    /* analytic two-bone IK in body space: aim the thigh so the shin lands on `target` */
    function solveLeg(hip, target, pole) {
      H.copy(hip.position);
      u.subVectors(target, H);
      const d = U.clamp(u.length(), 0.15, THIGH + SHIN - 1e-3);
      u.normalize();
      const cosA = U.clamp((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
      pp.copy(pole).addScaledVector(u, -pole.dot(u)).normalize();
      K.copy(H).addScaledVector(u, THIGH * cosA).addScaledVector(pp, THIGH * sinA);
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

    return {
      root,
      body,
      leash,
      /* w = { paddle, ride, tuck } (any scale). time drives paddling, wobble and the balance filter. */
      setPose(w, time) {
        const tot = (w.paddle || 0) + (w.ride || 0) + (w.tuck || 0) || 1;
        const f = { paddle: (w.paddle || 0) / tot, ride: (w.ride || 0) / tot, tuck: (w.tuck || 0) / tot };
        const stand = 1 - f.paddle;
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
        const crouch = U.clamp(f.tuck / Math.max(stand, 1e-3) + dyn.compress * 0.6, 0, 1);
        parts.spine.rotation.x += (-lean * 0.45 + dyn.compress * 0.3) * stand;
        parts.spine.rotation.z += Math.sin(time * 1.7) * 0.04 * stand;
        parts.neck.rotation.y += turn * 0.3;
        parts.armN.rotation.x += lean * 0.9;
        parts.armN.rotation.z += -0.35 * T + Math.sin(time * 2.3) * 0.08 * stand;
        parts.armT.rotation.x += -lean * 0.6;
        parts.armT.rotation.z += 0.4 * T + Math.sin(time * 1.9 + 1) * 0.08 * stand;

        // body placement
        q.setFromAxisAngle(X_AXIS, lean).multiply(q2.setFromAxisAngle(Y_AXIS, U.clamp(dyn.yaw * 0.15, -0.25, 0.25) * stand)).multiply(Q_STAND);
        body.quaternion.copy(Q_PRONE).slerp(q, stand);
        const hipX = U.lerp(-0.13, -0.16, crouch);
        body.position.x = U.lerp(-0.42, hipX, stand);
        body.position.z = lean * 0.28;
        const yStand = board.deckAt(hipX, 0) + U.lerp(0.86, 0.56, crouch);
        body.position.y = stand > 0.999 ? yStand : U.lerp(settle(), yStand, stand * stand);

        // legs: plant both feet on the deck
        if (stand > 0.01) {
          body.updateMatrix();
          inv.copy(body.matrix).invert();
          for (const key of ['N', 'T']) {
            const ft = FEET[key], fx = ft.x + (key === 'N' ? 0.03 : -0.02) * crouch;
            v.set(fx, board.deckAt(fx, 0) + ANKLE_H, 0).applyMatrix4(inv);
            solveLeg(parts['leg' + key], v, key === 'N' ? poleN : poleT);
            parts['leg' + key].quaternion.slerp(hipIK, stand);
            parts['knee' + key].quaternion.slerp(kneeIK, stand);
            // foot flat on the deck, angled in a slight duck stance
            q.copy(body.quaternion).multiply(parts['leg' + key].quaternion).multiply(parts['knee' + key].quaternion).invert();
            q2.setFromAxisAngle(Y_AXIS, PI + ft.toe);
            parts['foot' + key].quaternion.identity().slerp(q.multiply(q2), stand);
          }
        } else {
          parts.footN.quaternion.identity();
          parts.footT.quaternion.identity();
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

        // balance filter: yaw rate, speed and push into the board, from the board's real motion
        const dt = dyn.lastT - dyn.placeT;
        dyn.placeT = dyn.lastT;
        if (dt > 1e-4 && dt < 0.2 && pos.distanceTo(prevPos) < 3) {
          const k = 1 - Math.exp(-dt * 6);
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
          prevVel.set(0, 0, 0);
        }
        prevX.copy(X);
        prevPos.copy(pos);
      },
    };
  };
})();
