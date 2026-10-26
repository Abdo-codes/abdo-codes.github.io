import * as THREE from './vendor/three.module.js';
import { box, cylinder } from './art.js';
import { textured } from './surfaces.js';
import { windowGlass } from './facade-detail.js';

// Low-detail terraces give the playable neighbourhood a town beyond its edges.
// They are static scenery; the road network and traffic remain in the foreground.
export function distantTown(parent) {
  const brick = ['#ad9181', '#a38b78', '#a49e92', '#b9a18e'];
  const blocks = [];
  for (let i = 0; i < 11; i++) {
    blocks.push([-55 + i * 10, -77 - i % 3 * 3, 0, i]);
    blocks.push([-53 + i * 10, 73 + i % 2 * 4, Math.PI, i + 2]);
  }
  for (let i = 0; i < 5; i++) {
    blocks.push([83 + i % 2 * 4, -38 + i * 18, -Math.PI / 2, i + 1]);
    blocks.push([-91 - i % 2 * 4, -38 + i * 18, Math.PI / 2, i + 3]);
  }
  for (const [x, z, facing, seed] of blocks) {
    const group = new THREE.Group(), width = 7.5 + seed % 3, depth = 7, height = 7 + seed % 4;
    textured(box(group, width, height, depth, 0, height / 2, 0, brick[seed % 4]), 'brick', brick[seed % 4]);
    const rise = width * .36;
    const shape = new THREE.Shape(); shape.moveTo(-width / 2, 0); shape.lineTo(0, rise); shape.lineTo(width / 2, 0); shape.closePath();
    const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }));
    textured(gable, 'brick', brick[seed % 4]); gable.position.set(0, height, -depth / 2); gable.castShadow = gable.receiveShadow = true; group.add(gable);
    for (const side of [-1, 1]) {
      const slope = textured(box(group, Math.hypot(width / 2, rise) + .28, .13, depth + .35,
        side * width / 4, height + rise / 2, 0, '#756e66'), 'roof', '#756e66');
      slope.rotation.z = -side * Math.atan2(rise, width / 2);
    }
    for (let floor = 0; floor < 3; floor++) for (let col = -1; col <= 1; col++) {
      const frame = box(group, 1.24, 1.64, .08, col * width / 3, (floor + .5) * height / 3, depth / 2 + .045, '#d2cec4');
      const glass = box(group, 1.05, 1.45, .05, frame.position.x, frame.position.y, depth / 2 + .10, '#566263', false);
      glass.material = windowGlass(seed + col + floor);
    }
    cylinder(group, .12, .4, width * .25, height + rise + .1, -.5, '#6f7370');
    group.position.set(x, .1, z); group.rotation.y = facing; parent.add(group);
  }
}
