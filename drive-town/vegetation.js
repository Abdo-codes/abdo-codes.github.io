import * as THREE from './vendor/three.module.js';
import { random } from './surfaces.js';

let leaves;
const bark = new THREE.MeshStandardMaterial({ color: '#61584a', roughness: 1 });
function foliageMaterial() {
  if (leaves) return leaves;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'), rand = random(591);
  for (let i = 0; i < 720; i++) {
    const angle = rand() * Math.PI * 2, radius = Math.sqrt(rand());
    const x = 128 + Math.cos(angle) * radius * 119, y = 128 + Math.sin(angle) * radius * 107;
    const light = 25 + rand() * 24;
    ctx.fillStyle = `hsl(${88 + rand() * 25},${23 + rand() * 20}%,${light}%)`;
    ctx.beginPath(); ctx.ellipse(x, y, 3 + rand() * 6, 2 + rand() * 3, angle, 0, Math.PI * 2); ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  leaves = new THREE.MeshStandardMaterial({ map, alphaTest: .48, side: THREE.DoubleSide, roughness: .95 });
  return leaves;
}
function branch(parent, from, to, bottom, top) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), delta = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, delta.length(), 8),
    bark);
  mesh.position.copy(a.add(b).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
}
export function tree(parent, x, z, size = 1) {
  const group = new THREE.Group(), rand = random(Math.round((x + 100) * 417 + (z + 100) * 93));
  branch(group, [0,0,0], [.12,4.3,-.09], .21, .065);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399;
    branch(group, [.04,2 + i * .25,0], [Math.cos(a) * 1.45,4.1 + rand() * 1.3,Math.sin(a) * 1.45], .07, .014);
  }
  const cards = Math.abs(z) > 60 ? 32 : 64;
  const crown = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.5, 2.2), foliageMaterial(), cards);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  for (let i = 0; i < cards; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * (1.35 + Math.abs(x % 3) * .17);
    dummy.position.set(Math.cos(a) * r, 3.4 + rand() * 2.7, Math.sin(a) * r);
    dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    dummy.scale.setScalar(.5 + rand() * .46); dummy.updateMatrix(); crown.setMatrixAt(i, dummy.matrix);
    color.setRGB(.8 + rand() * .2, .85 + rand() * .15, .72 + rand() * .18); crown.setColorAt(i, color);
  }
  crown.castShadow = true; crown.receiveShadow = true; group.add(crown);
  group.position.set(x, .04, z); group.scale.setScalar(size); parent.add(group);
  return group;
}

export function hedge(parent, x, z, length = 2.6, height = .55) {
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(.65, .48), foliageMaterial(), 36);
  const rand = random(Math.round((x + 100) * 213 + (z + 100) * 41)), dummy = new THREE.Object3D();
  for (let i = 0; i < 36; i++) {
    dummy.position.set((rand() - .5) * length, .2 + rand() * Math.max(.1, height - .3), (rand() - .5) * .38);
    dummy.rotation.set((rand() - .5) * Math.PI, rand() * Math.PI, (rand() - .5) * .4);
    dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix);
  }
  leaves.position.set(x, .2, z); leaves.castShadow = leaves.receiveShadow = true; parent.add(leaves);
  return leaves;
}
