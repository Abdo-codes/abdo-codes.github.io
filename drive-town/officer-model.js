import * as THREE from './vendor/three.module.js';
import { box, sphere, label } from './art.js';
import { batchTown } from './batching.js';

// A police officer in a dark uniform and a yellow vest. The officer faces -Z, so heading 0 turns to a learner who drives north.
// The right arm is a separate group that turns up (stop) or hangs down.
export function officer() {
  const person = new THREE.Group();
  for (const x of [-.12, .12]) box(person, .17, .85, .2, x, .43, 0, '#1f2a3a');
  box(person, .42, .62, .24, 0, 1.17, 0, '#1f2a3a');
  box(person, .46, .5, .27, 0, 1.2, 0, '#e8d12a');                    // yellow vest
  for (const y of [1.05, 1.28]) box(person, .475, .05, .28, 0, y, 0, '#d9dedb');
  sphere(person, .12, 0, 1.64, 0, '#d9a98a'); box(person, .27, .09, .27, 0, 1.76, 0, '#1b2535'); box(person, .26, .035, .28, 0, 1.72, -.02, '#e6e8ea');
  box(person, .1, .62, .12, -.29, 1.18, 0, '#1f2a3a');                // left arm hangs
  const arm = new THREE.Group(); arm.position.set(.27, 1.42, 0); person.add(arm);
  box(arm, .1, .62, .12, 0, -.3, 0, '#1f2a3a'); box(arm, .13, .14, .14, 0, -.66, 0, '#f2f2ee');
  batchTown(person, { exclude: [arm] });
  const tag = label('Officer: stop', 9, '#c53732', '#ffffff');
  tag.material.depthTest = false; tag.renderOrder = 10; tag.position.y = 3.3; person.add(tag);
  person.userData = { arm, label: tag };
  return person;
}
// Arm up (about 170 degrees, the white glove above the head) while the officer shows stop.
export function officerPose(person, up) {
  person.userData.arm.rotation.z = up ? Math.PI * .94 : .06;
  person.userData.label.visible = up;
}
