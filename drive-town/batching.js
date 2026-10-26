import * as THREE from './vendor/three.module.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

// Consolidate only static town geometry. Traffic, walking rigs and foliage remain independent.
export function batchTown(town, { exclude = [] } = {}) {
  town.updateMatrixWorld(true);
  const batches = new Map(), meshes = [], inverse = town.matrixWorld.clone().invert();
  const exclusions = new Set(exclude);
  town.traverse(mesh => {
    if (!mesh.isMesh || mesh.isInstancedMesh || Array.isArray(mesh.material)) return;
    for (let node = mesh; node && node !== town; node = node.parent) if (exclusions.has(node)) return;
    const attributes = Object.keys(mesh.geometry.attributes).sort().join(',');
    const key = `${mesh.material.uuid}/${mesh.castShadow}/${mesh.receiveShadow}/${attributes}`;
    if (!batches.has(key)) batches.set(key, { material: mesh.material, cast: mesh.castShadow, receive: mesh.receiveShadow, geometries: [] });
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geometry.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld)); batches.get(key).geometries.push(geometry); meshes.push(mesh);
  });
  for (const batch of batches.values()) {
    const geometry = mergeGeometries(batch.geometries);
    if (!geometry) throw new Error('Static town surfaces could not be assembled');
    const mesh = new THREE.Mesh(geometry, batch.material);
    mesh.castShadow = batch.cast; mesh.receiveShadow = batch.receive; town.add(mesh);
    batch.geometries.forEach(part => part.dispose());
  }
  meshes.forEach(mesh => { mesh.removeFromParent(); mesh.geometry.dispose(); });
}
