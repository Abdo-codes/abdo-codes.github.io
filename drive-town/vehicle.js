import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { box, material } from './art.js';

let template;
export async function loadVehicle() {
  const gltf = await new GLTFLoader().loadAsync(new URL('./assets/road-car.glb', import.meta.url).href);
  template = gltf.scene;
}
export function detailedCar(color = '#d5a629') {
  const group = new THREE.Group(), model = template.clone(true);
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.material = mesh.material.clone();
    const name = mesh.material.name;
    if (name === 'Carpaint_Pearl_Orange') {
      mesh.material.color.set(color); mesh.material.roughness = .27; mesh.material.metalness = .65;
      mesh.material.clearcoat = .8; mesh.material.clearcoatRoughness = .22;
    } else if (name.toLowerCase().includes('glass')) {
      mesh.material.envMapIntensity = 1.5;
    }
  });
  group.add(model);
  const lamps = { left: [], right: [] };
  for (const [side, x] of [['left', -.76], ['right', .76]]) {
    for (const [z, y] of [[2.1, .73], [-2.13, 1.01]]) {
      const lamp = box(group, .18, .045, .025, x, y, z, '#785723', false);
      lamp.material = material('#785723', { emissive: '#ff9d16', emissiveIntensity: 0, roughness: .25 });
      lamps[side].push(lamp);
    }
  }
  for (const z of [-2.22, 2.22]) {
    const plate = box(group, .5, .105, .018, 0, z > 0 ? .48 : .59, z, '#e3bc31', false);
    plate.material.roughness = .4;
  }
  const brakeLights = [-.55, .55].map(x => {
    const lamp = box(group, .28, .045, .025, x, 1.01, -2.14, '#ad2425', false);
    lamp.material = material('#ad2425', { emissive: '#ff2525', emissiveIntensity: .1, roughness: .3 }); return lamp;
  });
  group.userData = { lamps, brakeLights, wheels: [] };
  return group;
}
