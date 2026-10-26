import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

let asset;
export async function loadCyclist() {
  asset = await new GLTFLoader().loadAsync(new URL('./assets/city-cyclist.glb', import.meta.url).href);
}
export function cityCyclist() {
  const group = new THREE.Group(), model = asset.scene;
  model.traverse(mesh => {
    if (mesh.isMesh) { mesh.castShadow = mesh.receiveShadow = true; }
  });
  group.add(model);
  const mixer = new THREE.AnimationMixer(model);
  asset.animations.forEach(clip => mixer.clipAction(clip).play());
  const wheels = [];
  model.traverse(node => { if (node.name.startsWith('Articulated_wheel_')) wheels.push(node); });
  group.userData = { cycleMixer: mixer, cycleDuration: asset.animations[0]?.duration ?? 5, cycleWheels: wheels };
  animateCycle(group, 0);
  return group;
}
export function animateCycle(actor, time) {
  if (!actor.userData.cycleMixer) return;
  const distance = time * 34 / 9;
  actor.userData.cycleMixer.setTime(distance / 3.8 * actor.userData.cycleDuration);
  // The human pose loops; wheel rotation follows cumulative travel without resetting.
  actor.userData.cycleWheels.forEach(wheel => { wheel.rotation.x = -distance / .35; });
}
