import * as THREE from './vendor/three.module.js';

export function decisionPoints(player, focus, actor = null, phone = false) {
  const points = [];
  for (const [point, radius, top] of [[player, 3, 3], [focus, 3, 1], ...(actor ? [[actor, phone ? 4 : 3, 4]] : [])]) {
    for (const x of [-radius, radius]) for (const z of [-radius, radius]) for (const y of [0, top]) {
      points.push(new THREE.Vector3(point.x + x, y, point.z + z));
    }
  }
  return points;
}

// Fit recorded cars, road markings and actor labels in the unobstructed scene.
export function frameDecision(camera, { player, forward, focus, actor, width, height, reservedRight = 0 }) {
  const points = decisionPoints(player, focus, actor, reservedRight === 0);
  const target = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
  const back = new THREE.Vector3(-forward.x, 1.1, -forward.z).normalize();
  if (reservedRight) camera.setViewOffset(width, height, reservedRight / 2, 0, width, height);
  else camera.clearViewOffset();
  const left = -1 + 32 / width, right = 1 - 2 * (reservedRight + 16) / width;
  const bottom = -1 + 32 / height, top = 1 - 144 / height;
  let distance = 18;
  for (let step = 0; step < 48; step++) {
    camera.position.copy(target).addScaledVector(back, distance); camera.lookAt(target); camera.updateMatrixWorld();
    if (points.every(point => {
      const projected = point.clone().project(camera);
      return projected.x >= left && projected.x <= right && projected.y >= bottom && projected.y <= top;
    })) break;
    distance *= 1.08;
  }
  return points;
}
