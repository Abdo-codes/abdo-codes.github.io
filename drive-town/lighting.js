import * as THREE from './vendor/three.module.js';
import { renderProfile } from './render-profile.js';
import { HDRLoader } from './vendor/HDRLoader.js';

let sky;
export async function loadDaylight() {
  sky = await new HDRLoader().loadAsync(new URL('./assets/daylight.hdr', import.meta.url).href);
  sky.mapping = THREE.EquirectangularReflectionMapping;
}
export function daylight(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer), environment = pmrem.fromEquirectangular(sky);
  scene.background = sky; scene.backgroundIntensity = .55;
  scene.environment = environment.texture; scene.environmentIntensity = .7;
  scene.backgroundRotation.y = scene.environmentRotation.y = .9;
  scene.fog = new THREE.Fog('#c4ced0', 110, 245);
  scene.add(new THREE.HemisphereLight('#dce9f2', '#746957', .38));
  const sun = new THREE.DirectionalLight('#fff2db', 2.05); sun.position.set(-45, 62, 28);
  sun.castShadow = true; sun.shadow.mapSize.set(renderProfile(window.innerWidth).shadowSize, renderProfile(window.innerWidth).shadowSize);
  Object.assign(sun.shadow.camera, { left: -82, right: 82, top: 82, bottom: -82, near: 1, far: 180 });
  sun.shadow.normalBias = .018; sun.shadow.bias = -.00012; sun.shadow.radius = 2;
  scene.add(sun, sun.target); pmrem.dispose();
  return sun;
}
