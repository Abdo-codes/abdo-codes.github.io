/* Real people for the surfers: Microsoft Rocketbox avatars (MIT, see models/LICENSE-Rocketbox.txt)
   replace the sculpted bodies once they have loaded. The sculpted rig keeps doing all the posing
   (poses, balance, IK); every frame the model's skeleton copies its joint rotations, with the spine
   bend spread over three vertebrae, and re-solves the legs with the model's own proportions so the
   feet stay planted on the deck. If loading fails (e.g. opened from file://) the sculpted surfer stays. */
(function () {
  const SURF = window.SURF;
  const DOWN = new THREE.Vector3(0, -1, 0), FWD = new THREE.Vector3(0, 0, 1);
  // from surferPose.js: pelvis height standing, ankle height of the IK target, foot-to-hip reach along the board
  const RIG_STAND = 0.76, RIG_ANKLE = 0.062, STANCE = 0.35;
  const BEND = 0.85; // standing hip-to-ankle distance as a fraction of the leg's length (knees soft, as the rig's)

  // model bone ← rig joint whose rotation it copies; the number is its share of that joint's own bend
  const MAP = [
    ['Pelvis', 'body'],
    ['Spine', 'spine', 0.35], ['Spine1', 'spine', 0.7], ['Spine2', 'spine'],
    ['Neck', 'neck', 0.5], ['Head', 'neck'],
    ['R Clavicle', 'spine'], ['L Clavicle', 'spine'],
    ['R UpperArm', 'armN'], ['R Forearm', 'elbN'], ['R Hand', 'elbN'],
    ['L UpperArm', 'armT'], ['L Forearm', 'elbT'], ['L Hand', 'elbT'],
    ['R Thigh', 'legN'], ['R Calf', 'kneeN'], ['R Foot', 'footN'],
    ['L Thigh', 'legT'], ['L Calf', 'kneeT'], ['L Foot', 'footT'],
  ];
  const JOINTS = ['body', 'spine', 'neck', 'armN', 'elbN', 'armT', 'elbT', 'legN', 'kneeN', 'footN', 'legT', 'kneeT', 'footT'];

  /* wet skin and swimwear: a clear wet film over the textured skin, a soft warm sheen at grazing angles */
  function wetMaterial(src) {
    const U = SURF.util;
    if (src.map) src.map.anisotropy = 4;
    return new THREE.MeshPhysicalMaterial({
      map: src.map, normalMap: src.normalMap, normalScale: src.normalScale.clone(), side: src.side,
      roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3,
      sheen: 0.3, sheenRoughness: 0.7, sheenColor: U.srgb(0xffb58f),
    });
  }

  /* position of a rig part in its surfer's root space */
  function rootPos(o, root, out) {
    out.set(0, 0, 0);
    for (; o !== root; o = o.parent) out.applyQuaternion(o.quaternion).add(o.position);
    return out;
  }

  function attach(surfer, model) {
    const bone = {};
    model.traverse((o) => { if (o.name.startsWith('Bip01')) bone[o.name.replace(/_/g, ' ').slice(6) || 'root'] = o; });
    for (const [n] of MAP) if (!bone[n]) throw new Error('missing bone ' + n);
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.material = wetMaterial(o.material);
      o.castShadow = o.receiveShadow = true;
      o.frustumCulled = false; // the skinned bounds don't follow the pose
    });

    // rest pose in the rig's own rest: standing straight, arms hanging, legs straight, feet forward
    const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), qa = new THREE.Quaternion(), qw = new THREE.Quaternion();
    function aim(name, childName, dir, flat) {
      model.updateMatrixWorld(true);
      const d = bone[childName].getWorldPosition(v1).sub(bone[name].getWorldPosition(v2));
      if (flat) d.y = 0;
      qa.setFromUnitVectors(d.normalize(), dir);
      bone[name].getWorldQuaternion(qw).premultiply(qa);
      bone[name].quaternion.copy(bone[name].parent.getWorldQuaternion(qa).invert().multiply(qw));
    }
    for (const s of ['R', 'L']) {
      model.updateMatrixWorld(true);
      const sole = bone[s + ' Foot'].getWorldQuaternion(new THREE.Quaternion()); // flat on the ground
      aim(s + ' UpperArm', s + ' Forearm', DOWN);
      aim(s + ' Forearm', s + ' Hand', DOWN);
      aim(s + ' Thigh', s + ' Calf', DOWN);
      aim(s + ' Calf', s + ' Foot', DOWN);
      model.updateMatrixWorld(true);
      bone[s + ' Foot'].quaternion.copy(bone[s + ' Calf'].getWorldQuaternion(qa).invert().multiply(sole));
      aim(s + ' Foot', s + ' Toe0', FWD, true);
    }
    // relaxed hands: the fingers curl a little toward the palm (which faces the thigh once the arm hangs)
    for (const s of ['R', 'L']) {
      const axis = new THREE.Vector3(0, 0, s === 'R' ? 1 : -1);
      for (let f = 1; f <= 4; f++) {
        for (const [seg, a] of [['', 0.3], ['1', 0.5], ['2', 0.4]]) {
          const b = bone[s + ' Finger' + f + seg];
          if (!b) continue;
          model.updateMatrixWorld(true);
          b.getWorldQuaternion(qw).premultiply(qa.setFromAxisAngle(axis, a * (0.8 + 0.1 * f)));
          b.quaternion.copy(b.parent.getWorldQuaternion(qa).invert().multiply(qw));
        }
      }
    }
    model.updateMatrixWorld(true);
    const rest = {}, pos = {};
    for (const [n] of MAP) {
      rest[n] = bone[n].getWorldQuaternion(new THREE.Quaternion());
      pos[n] = bone[n].getWorldPosition(new THREE.Vector3());
    }

    // bones in hierarchy order, each with the root-space rotation it gets this frame
    const bip = bone.root, bipS = bip.getWorldScale(new THREE.Vector3()).x;
    const bipQ = bip.quaternion.clone(), bipQi = bipQ.clone().invert(), bipP = bip.position.clone();
    const entry = new Map([[bip, { q: bipQ }]]);
    const list = MAP.map(([n, joint, share]) => {
      const b = bone[n], parent = entry.get(b.parent);
      if (!parent) throw new Error('unexpected parent for ' + n);
      const e = { name: n, b, joint, share, rest: rest[n], q: new THREE.Quaternion(), parent };
      entry.set(b, e);
      return e;
    });
    const E = Object.fromEntries(list.map((e) => [e.name, e]));

    // shorter legs than the rig's: sit the pelvis lower so the knees bend about as much
    const legs = ['R', 'L'].map((s) => ({
      key: s === 'R' ? 'N' : 'T', thigh: E[s + ' Thigh'], calf: E[s + ' Calf'],
      off: pos[s + ' Thigh'].clone().sub(pos.Pelvis),
      lt: pos[s + ' Calf'].distanceTo(pos[s + ' Thigh']), lc: pos[s + ' Foot'].distanceTo(pos[s + ' Calf']),
    }));
    const ankleH = pos['R Foot'].y, reach = legs[0].lt + legs[0].lc;
    const pelvisOff = new THREE.Vector3(0, Math.sqrt(Math.max(0, (BEND * reach) ** 2 - STANCE ** 2)) + ankleH - legs[0].off.y - RIG_STAND, 0);
    const spineOff = pos.Spine.clone().sub(pos.Pelvis), spineS = bone.Spine.getWorldScale(new THREE.Vector3()).x;

    const { parts, body, root } = surfer;
    const P = {}, pelvisPos = new THREE.Vector3(), spinePos = new THREE.Vector3();
    for (const j of JOINTS) P[j] = new THREE.Quaternion();
    const tq = new THREE.Quaternion(), r1 = new THREE.Quaternion(), r2 = new THREE.Quaternion(), I = new THREE.Quaternion();
    const H = new THREE.Vector3(), A = new THREE.Vector3(), K = new THREE.Vector3(), u = new THREE.Vector3(), pp = new THREE.Vector3();
    const hp = new THREE.Vector3(), kp = new THREE.Vector3(), dT = new THREE.Vector3(), dC = new THREE.Vector3(), f = new THREE.Vector3();

    /* two-bone IK for one model leg: aim thigh and shin at the rig's ankle, knee in the rig's knee plane */
    function solveLeg(g, w) {
      const k = g.key;
      H.copy(g.off).applyQuaternion(P.body).add(pelvisPos); // hips ride with the pelvis, not the lower spine
      g.thigh.b.position.copy(H).sub(spinePos).applyQuaternion(tq.copy(E.Spine.q).invert()).divideScalar(spineS);
      if (w < 1e-3) return;
      rootPos(parts['leg' + k], root, hp);
      rootPos(parts['knee' + k], root, kp);
      rootPos(parts['foot' + k], root, A);
      pp.subVectors(kp, hp);
      u.subVectors(A, hp).normalize();
      pp.addScaledVector(u, -pp.dot(u));
      if (pp.lengthSq() < 1e-8) pp.set(0, 0, 1).applyQuaternion(P['leg' + k]);
      A.y += ankleH - RIG_ANKLE; // the model's ankle sits higher above the sole
      u.subVectors(A, H);
      const d = SURF.util.clamp(u.length(), 0.1, g.lt + g.lc - 1e-3);
      u.normalize();
      pp.addScaledVector(u, -pp.dot(u)).normalize();
      const cosA = SURF.util.clamp((g.lt * g.lt + d * d - g.lc * g.lc) / (2 * g.lt * d), -1, 1);
      K.copy(H).addScaledVector(u, g.lt * cosA).addScaledVector(pp, g.lt * Math.sqrt(1 - cosA * cosA));
      dT.subVectors(K, H).normalize();
      dC.copy(H).addScaledVector(u, d).sub(K).normalize();
      r1.setFromUnitVectors(f.copy(DOWN).applyQuaternion(P['leg' + k]), dT);
      r1.copy(I.identity().slerp(r1, w));
      r2.setFromUnitVectors(f.copy(DOWN).applyQuaternion(P['knee' + k]).applyQuaternion(r1), dC);
      r2.copy(I.identity().slerp(r2, w));
      g.thigh.q.premultiply(r1);
      g.calf.q.premultiply(r1).premultiply(r2);
    }

    function sync() {
      P.body.copy(body.quaternion);
      P.spine.multiplyQuaternions(P.body, parts.spine.quaternion);
      P.neck.multiplyQuaternions(P.spine, parts.neck.quaternion);
      for (const k of ['N', 'T']) {
        P['arm' + k].multiplyQuaternions(P.spine, parts['arm' + k].quaternion);
        P['elb' + k].multiplyQuaternions(P['arm' + k], parts['elb' + k].quaternion);
        P['leg' + k].multiplyQuaternions(P.body, parts['leg' + k].quaternion);
        P['knee' + k].multiplyQuaternions(P['leg' + k], parts['knee' + k].quaternion);
        P['foot' + k].multiplyQuaternions(P['knee' + k], parts['foot' + k].quaternion);
      }
      for (const e of list) {
        if (e.share === undefined) e.q.copy(P[e.joint]);
        else e.q.copy(e.joint === 'spine' ? P.body : P.spine).multiply(tq.identity().slerp(parts[e.joint].quaternion, e.share));
        e.q.multiply(e.rest);
      }
      pelvisPos.copy(pelvisOff).applyQuaternion(P.body).add(body.position);
      spinePos.copy(spineOff).applyQuaternion(P.body).add(pelvisPos);
      bone.Pelvis.position.copy(pelvisPos).sub(bipP).applyQuaternion(bipQi).divideScalar(bipS);
      for (const g of legs) solveLeg(g, surfer.legIK);
      for (const e of list) e.b.quaternion.copy(tq.copy(e.parent.q).invert()).multiply(e.q);
    }

    root.add(model);
    body.visible = false; // the sculpted body keeps posing, unseen
    surfer.hideables.push(model);
    surfer.human = { model, sync, pelvisOff };
  }

  /* load a model for a surfer in the background; resolves with true once it has replaced the sculpted body */
  SURF.loadHuman = function (surfer, url) {
    if (!THREE.GLTFLoader || location.protocol === 'file:') return Promise.resolve(false);
    return new Promise((resolve) => {
      new THREE.GLTFLoader().load(url, (gltf) => {
        try { attach(surfer, gltf.scene); resolve(true); } catch (e) { console.warn('surfer model: ' + e.message); resolve(false); }
      }, undefined, () => { console.warn('surfer model failed to load; keeping the sculpted surfer'); resolve(false); });
    });
  };
})();
