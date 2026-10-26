import * as THREE from './vendor/three.module.js';
import { box, cylinder, material, label } from './art.js';

export { building } from './architecture.js';

export function streetLamp(parent, x, z, rotation = 0) {
  const group = new THREE.Group();
  cylinder(group, .065, 4.8, 0, 2.4, 0, '#52605b');
  box(group, 1, .08, .08, .45, 4.75, 0, '#52605b');
  box(group, .42, .12, .4, .9, 4.68, 0, '#f3dcac');
  group.position.set(x, 0, z); group.rotation.y = rotation; parent.add(group);
}

export function bench(parent, x, z, rotation = 0) {
  const group = new THREE.Group();
  for (let i = 0; i < 4; i++) box(group, 2, .1, .13, 0, .55, i * .15, '#b69064');
  box(group, 2, .4, .12, 0, .9, -.1, '#b69064');
  for (const bx of [-.7, .7]) box(group, .12, .5, .6, bx, .25, .18, '#52635c');
  group.position.set(x, 0, z); group.rotation.y = rotation; parent.add(group);
}

export function speedSign(parent, x, z, rotation = 0, limit = 30) {
  const group = new THREE.Group(); cylinder(group, .055, 2.5, 0, 1.25, 0, '#7a837c');
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#bd2726'; ctx.beginPath(); ctx.arc(128, 128, 121, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f7f7f4'; ctx.beginPath(); ctx.arc(128, 128, 92, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#16191c'; ctx.font = 'bold 106px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(limit), 128, 134);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
  const back = new THREE.Mesh(new THREE.CircleGeometry(.72, 24), material('#8c9686', { side: THREE.DoubleSide }));
  back.position.set(0, 2.35, -.02); group.add(back);
  face.position.set(0, 2.35, .02); group.add(face); group.position.set(x, 0, z); group.rotation.y = rotation; parent.add(group);
}

export function landmark(parent, title, x, z, width = 5) {
  const tag = label(title, width); tag.position.set(x, 5, z); parent.add(tag); return tag;
}
