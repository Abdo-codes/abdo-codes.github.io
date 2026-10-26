import * as THREE from './vendor/three.module.js';

let walkGeometry, shirtColor;
export async function loadPeople() {
  const [metaResponse, meshResponse] = await Promise.all([
    fetch(new URL('./assets/pedestrian-walk.json', import.meta.url)),
    fetch(new URL('./assets/pedestrian-walk.bin', import.meta.url))
  ]);
  if (!metaResponse.ok || !meshResponse.ok) throw new Error('Walking character assets could not load');
  const meta = await metaResponse.json(), data = new Float32Array(await meshResponse.arrayBuffer());
  if (data.length !== meta.vertexCount * meta.strideFloats) throw new Error('Walking character mesh is incomplete');
  const positions = new Float32Array(meta.vertexCount * 3), normals = positions.slice(), colors = positions.slice();
  const poses = Array.from({ length: 4 }, () => positions.slice());
  for (let i = 0; i < meta.vertexCount; i++) {
    const offset = i * meta.strideFloats, vertex = i * 3;
    const convert = (target, start) => { target[vertex] = -data[start]; target[vertex + 1] = data[start + 2]; target[vertex + 2] = data[start + 1]; };
    convert(positions, offset); convert(normals, offset + 3);
    colors.set(data.subarray(offset + 6, offset + 9), vertex);
    poses.forEach((pose, phase) => convert(pose, offset + 10 + phase * 3));
  }
  walkGeometry = new THREE.BufferGeometry();
  walkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  walkGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  walkGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  walkGeometry.morphAttributes.position = poses.map(pose => new THREE.BufferAttribute(pose, 3));
  walkGeometry.computeBoundingSphere();
  shirtColor = meta.materials.find(material => material.name === 'Shirt').baseColor;
}
export function walkingPerson(shirt = '#c2a65e') {
  const geometry = walkGeometry.clone(), colors = geometry.attributes.color, tint = new THREE.Color(shirt);
  for (let i = 0; i < colors.count; i++) {
    if (Math.abs(colors.getX(i) - shirtColor[0]) < .001 && Math.abs(colors.getY(i) - shirtColor[1]) < .001) {
      colors.setXYZ(i, tint.r, tint.g, tint.b);
    }
  }
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .86 }));
  mesh.castShadow = mesh.receiveShadow = true;
  const group = new THREE.Group(); group.add(mesh); group.userData.walkMesh = mesh;
  return group;
}
export function animateWalk(actor, time) {
  const mesh = actor.userData.walkMesh;
  if (!mesh) return;
  const phase = ((time * 4.4) % 4 + 4) % 4, index = Math.floor(phase), blend = phase - index;
  mesh.morphTargetInfluences.fill(0); mesh.morphTargetInfluences[index] = 1 - blend;
  mesh.morphTargetInfluences[(index + 1) % 4] = blend;
}
