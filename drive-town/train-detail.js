import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';

export function trainCab(parent, rear = false) {
  const cab = new THREE.Group(); cab.position.z = rear ? -8.22 : 8.22; cab.rotation.y = rear ? Math.PI : 0; parent.add(cab);
  const shape = new THREE.Shape(); shape.moveTo(0, .48); shape.lineTo(-.75, .48); shape.lineTo(-.75, 1.35);
  shape.quadraticCurveTo(-.7, 2.4, -.3, 3.22); shape.lineTo(0, 3.3); shape.closePath();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 2.68, bevelEnabled: true,
    bevelThickness: .04, bevelSize: .04, bevelSegments: 3, curveSegments: 16 }), material('#d5b94e', { metalness: .28, roughness: .35 }));
  body.rotation.y = Math.PI / 2; body.position.x = -1.34; body.castShadow = body.receiveShadow = true; cab.add(body);
  const windscreen = box(cab, 2.35, 1.05, .05, 0, 2.29, .62, '#233941');
  windscreen.rotation.x = -.28; windscreen.material = material('#233941', { metalness: .4, roughness: .16 });
  for (const x of [-.55, .55]) {
    const wiper = box(cab, .025, .42, .03, x, 1.99, .77, '#333c40'); wiper.rotation.z = .18;
  }
  for (const x of [-.91, .91]) {
    const lamp = cylinder(cab, .095, .045, x, 1.32, .79, rear ? '#a33831' : '#f1edda'); lamp.rotation.x = Math.PI / 2;
  }
  box(cab, 2.38, .17, .13, 0, .73, .72, '#4d5b60');
  box(cab, .27, .24, .35, 0, .47, .75, '#38454b');
}
export function trainBogie(parent, z) {
  box(parent, 2.25, .27, 1.35, 0, .55, z, '#374247');
  for (const side of [-1, 1]) {
    box(parent, .09, .15, 1.2, side * 1.18, .48, z, '#596365');
    for (const dz of [-.43, .43]) {
      const spring = cylinder(parent, .12, .27, side * 1.17, .57, z + dz, '#424c4f');
      spring.material.roughness = .65;
    }
  }
}
