import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';
import { textured } from './surfaces.js';

function roofMesh(parent, vertices, indices, color) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material(color)); mesh.castShadow = mesh.receiveShadow = true;
  // Explicit UVs keep photographed roof materials aligned after static batching.
  const pos = geometry.attributes.position;
  const uv = []; for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i) / 1.3, pos.getZ(i) / 1.4);
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  textured(mesh, 'roof', color); parent.add(mesh); return mesh;
}
export function roofKit(group, { width, depth, height, color, variant }) {
  const style = variant % 6, rise = width * (style === 3 ? .24 : .34);
  const roofColor = ['#514e49', '#786351', '#555a5c', '#66594d', '#5e6364', '#73574a'][style];
  if (style === 2) {
    box(group, width + .3, .24, depth + .3, 0, height + .12, 0, '#505654');
    for (const side of [-1, 1]) {
      box(group, width + .3, .45, .15, 0, height + .3, side * depth / 2, color);
      box(group, .15, .45, depth, side * width / 2, height + .3, 0, color);
    }
  } else if (style === 3) {
    const w = width / 2 + .2, d = depth / 2 + .2, y = height;
    roofMesh(group, [-w,y,-d,w,y,-d,w,y,d,-w,y,d,0,y+rise,-d*.45,0,y+rise,d*.45],
      [0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0], roofColor);
  } else {
    const shape = new THREE.Shape(); shape.moveTo(-width / 2, 0); shape.lineTo(0, rise); shape.lineTo(width / 2, 0); shape.closePath();
    const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), material(color));
    textured(gable, 'brick', color); gable.position.set(0, height, -depth / 2); gable.castShadow = gable.receiveShadow = true; group.add(gable);
    for (const side of [-1, 1]) {
      const slope = textured(box(group, Math.hypot(width / 2, rise) + .38, .13, depth + .5,
        side * width / 4, height + rise / 2 + .09, 0, roofColor), 'roof', roofColor);
      slope.rotation.z = -side * Math.atan2(rise, width / 2);
    }
    box(group, .13, .1, depth + .5, 0, height + rise + .12, 0, roofColor);
    if (style === 1 || style === 5) {
      const dormer = new THREE.Group(); dormer.position.set(width * .25, height + rise * .32, .5); group.add(dormer);
      box(dormer, 1.3, 1.05, 1.7, 0, .5, 0, '#d3d1c6');
      box(dormer, .035, .75, 1.05, .68, .55, 0, '#30404a');
      box(dormer, .04, .8, .06, .7, .55, 0, '#d9d6cb');
      box(dormer, 1.45, .12, 1.85, 0, 1.09, 0, '#555b59');
    }
    if (style === 4) {
      for (const side of [-1, 1]) for (let step = 0; step < 4; step++) {
        const w = width * (1 - step / 4);
        textured(box(group, w, .45, .19, 0, height + step * rise / 4 + .22,
          side * (depth / 2 + .04), color), 'brick', color);
        box(group, w + .12, .07, .24, 0, height + step * rise / 4 + .46, side * (depth / 2 + .04), '#b4b3a8');
      }
    }
  }
  for (const side of [-1, 1]) {
    const gutter = cylinder(group, .065, depth + .5, side * (width / 2 + .14), height - .04, 0, '#5d625e'); gutter.rotation.x = Math.PI / 2;
    cylinder(group, .04, height, side * (width / 2 - .15), height / 2, depth / 2 + .16, '#6d726d');
  }
  if (style !== 2) {
    const chimney = textured(box(group, .48, 1.2, .6, -width * .24, height + rise * .73, -.6, color), 'brick', color);
    box(group, .59, .08, .72, chimney.position.x, chimney.position.y + .64, -.6, '#82817a');
  }
  box(group, width + .2, .13, depth + .2, 0, height - .02, 0, '#cac7be');
}
