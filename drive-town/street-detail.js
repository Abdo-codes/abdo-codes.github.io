import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';

export function streetDetail(town, firstChapter = town) {
  const blocks = [], crossingBlocks = [], curbGeometry = new THREE.BoxGeometry(1.18, .16, .22);
  for (const z of [-31.05, -20.95, 20.95, 31.05]) for (let x = -31; x < 32; x += 1.2) {
    if (z > 0 && Math.abs(x + 8) < 5.5) continue;
    if (z === 20.95 && x > -1.6 && x < 12.6) continue; // bus bay
    if (z < 0 && z > -22 && x > 6 && x < 16) continue;
    (z === -20.95 && x < -20.9 ? crossingBlocks : blocks).push([x,.22,z,0]);
  }
  for (const x of [-43.05, -32.95, 32.95, 43.05]) for (let z = -19; z < 20; z += 1.2) {
    if (x < 0 && Math.abs(z - 2) < 3) continue;
    (x < 0 && z < -13.5 ? crossingBlocks : blocks).push([x,.22,z,Math.PI / 2]);
  }
  for (const [parent, positions] of [[town, blocks], [firstChapter, crossingBlocks]]) {
    const curbs = new THREE.InstancedMesh(curbGeometry, material('#b4b3ad'), positions.length), dummy = new THREE.Object3D();
    positions.forEach(([x,y,z,rotation], i) => {
      dummy.position.set(x,y,z); dummy.rotation.y = rotation; dummy.updateMatrix(); curbs.setMatrixAt(i,dummy.matrix);
    });
    curbs.castShadow = curbs.receiveShadow = true; parent.add(curbs);
  }
  for (const [x,z] of [[5,26],[-38,-10],[38,11],[23,-26]]) {
    const cover = cylinder(town, .48, .02, x, .183, z, '#676b6c');
    cover.material = material('#676b6c', { metalness: .4, roughness: .8 });
    for (let i = -3; i < 4; i++) box(town, .55, .006, .02, x, .198, z + i * .09, '#414749', false);
  }
  for (const [x,z,rotation] of [[-24,30.8,0],[22,-30.8,0],[-42.8,12,Math.PI / 2],[42.8,-10,Math.PI / 2]]) {
    const drain = new THREE.Group(); box(drain, .65, .02, .4, 0, .18, 0, '#51575a', false);
    for (let i = 0; i < 7; i++) box(drain, .045, .01, .33, -.27 + i * .09, .195, 0, '#999d9a', false);
    drain.position.set(x,0,z); drain.rotation.y = rotation; town.add(drain);
  }
  for (const [x,z] of [[3,11],[-22,16],[21,1]]) {
    cylinder(town, .26, .8, x, .44, z, '#414e46');
    cylinder(town, .3, .055, x, .87, z, '#525e56');
    box(town, .3, .17, .02, x, .7, z + .267, '#151b18', false);
  }
}
