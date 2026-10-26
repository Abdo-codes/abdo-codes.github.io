import * as THREE from './vendor/three.module.js';
import { box, cylinder, material } from './art.js';
import { textured } from './surfaces.js';
import { roofKit } from './roof-kit.js';
import { windowGlass, shopSign } from './facade-detail.js';

const glass = new THREE.MeshStandardMaterial({ color: '#465662', metalness: .4, roughness: .18, envMapIntensity: 1.3 });
function windowFrame(group, x, y, z, width = 1.15, height = 1.45, variation = 0) {
  box(group, width + .2, height + .2, .075, x, y, z, '#5b5852');
  const pane = box(group, width, height, .045, x, y, z + .06, '#465662', false); pane.material = windowGlass(variation);
  for (const side of [-1, 1]) {
    box(group, .075, height + .14, .1, x + side * (width + .07) / 2, y, z + .095, '#d6d3c8');
    box(group, width + .14, .07, .1, x, y + side * (height + .07) / 2, z + .095, '#d6d3c8');
    box(group, .13, height - .08, .018, x + side * (width / 2 - .14), y, z + .09, '#a6a299', false);
  }
  box(group, .045, height, .1, x, y, z + .105, '#d6d3c8');
  box(group, width, .045, .1, x, y + .12, z + .105, '#d6d3c8');
  box(group, width + .3, .09, .27, x, y - height / 2 - .08, z + .08, '#b7b5ad');
  box(group, width + .22, .12, .075, x, y + height / 2 + .16, z, '#c0b3a1');
}
function door(group, x, z, color) {
  box(group, 1.13, 2.3, .1, x, 1.15, z, '#c6c2b8');
  textured(box(group, .94, 2.16, .11, x, 1.08, z + .04, color), 'wood', color);
  const pane = box(group, .61, .68, .025, x, 1.54, z + .12, '#465662', false); pane.material = glass;
  for (const y of [.4, .85]) box(group, .68, .3, .025, x, y, z + .115, color);
  box(group, .025, .16, .035, x + .32, 1.03, z + .145, '#b4a78a');
  box(group, 1.3, .13, .48, x, .06, z + .15, '#aaa7a0');
}
export function building(parent, { x, z, width = 6, depth = 7, height = 8, color = '#b68e79', facing = 0, shop = '', variant = 0 }) {
  const group = new THREE.Group(), front = depth / 2 + .04;
  textured(box(group, width + .45, .14, depth + .45, 0, -.07, 0, '#a9aaa2', false), 'paving', '#a9aaa2');
  textured(box(group, width, height, depth, 0, height / 2, 0, color), 'brick', color);
  textured(box(group, width + .03, .48, depth + .03, 0, .24, 0, '#a5a29b'), 'brick', '#a5a29b');
  const floors = Math.max(2, Math.floor(height / 2.55)), columns = Math.max(2, Math.floor(width / 2.2));
  for (const direction of [1, -1]) {
    const facade = new THREE.Group(); facade.rotation.y = direction === 1 ? 0 : Math.PI; group.add(facade);
    for (let floor = 0; floor < floors; floor++) for (let column = 0; column < columns; column++) {
      const wx = (column - (columns - 1) / 2) * width / columns, wy = (floor + .5) * height / floors;
      if (floor === 0 && column === columns - 1 && direction === 1 && !shop) door(facade, wx, front, '#394a47');
      else windowFrame(facade, wx, wy, front, shop && floor === 0 ? width / columns - .35 : 1.12, shop && floor === 0 ? 2 : 1.43, x + z + floor * 3 + column + direction);
    }
  }
  for (const side of [-1, 1]) {
    const facade = new THREE.Group(); facade.rotation.y = side * Math.PI / 2; group.add(facade);
    const count = Math.max(1, Math.floor(depth / 2.7));
    for (let floor = 0; floor < floors; floor++) for (let column = 0; column < count; column++) {
      windowFrame(facade, (column - (count - 1) / 2) * depth / count, (floor + .5) * height / floors,
        width / 2 + .04, .95, 1.35, x - z + floor + column * 3);
    }
  }
  roofKit(group, { width, depth, height, color, variant });
  if (shop) {
    box(group, width - .45, .48, .08, 0, 2.8, front + .08, '#344740');
    shopSign(group, shop, width - .7, .43, 0, 2.8, front + .135);
    const awning = box(group, width + .05, .06, 1.1, 0, 2.48, front + .5, '#878878'); awning.rotation.x = -.1;
    for (let i = 0; i < width * 2; i++) box(group, .19, .06, 1.11, -width / 2 + .2 + i * .5, 2.47, front + .5, '#d7d3c5');
  }
  if (!shop) {
    const entrance = (columns - 1) * width / columns / 2;
    textured(box(group, 1.2, .04, 2.5, entrance, -.04, front + 1.2, '#bfbcb3', false), 'paving', '#bfbcb3');
    for (const side of [-1, 1]) {
      const gardenWall = textured(box(group, width / 2 - .8, .43, .18, side * (width / 4 + .2), .21, front + 2.35, color), 'brick', color);
      box(group, width / 2 - .7, .07, .24, gardenWall.position.x, .46, front + 2.35, '#a6a49b');
      for (let i = 0; i < 5; i++) cylinder(group, .015, .44, gardenWall.position.x - width / 4 + .58 + i * .35, .71, front + 2.35, '#424946');
      box(group, width / 2 - .75, .025, .025, gardenWall.position.x, .94, front + 2.35, '#424946');
    }
  }
  group.position.set(x, .22, z); group.rotation.y = facing; parent.add(group);
  return group;
}
