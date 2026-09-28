/* Picture-in-picture: renders a second camera (the surfer's eyes) into the top-right corner, straight
   after the main image so recordings include it. The cutaway is switched off for this view. */
(function () {
  const SURF = window.SURF;

  SURF.createInset = function ({ renderer, scene, ocean, seabed, sky, canvas }) {
    return {
      render(S, u) {
        const I = S.inset;
        if (!I) { S.insetRect = null; return; }
        const W = canvas.width, H = canvas.height, portrait = W < H;
        const w = Math.round(portrait ? W * 0.52 : Math.min(W * 0.3, 560 * u)), h = Math.round((w * 9) / 16);
        const top = S.film.active ? Math.round(H * 0.075 + 24 * u) : Math.round((portrait ? 62 : 70) * u);
        const x = W - w - Math.round(24 * u);
        S.insetRect = { x, y: top, w, h, label: I.label };

        const cam = I.cam;
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
        const uni = ocean.mesh.material.uniforms, cut = uni.uCutZ.value, bedVis = seabed.group.visible;
        uni.uCutZ.value = 1e5;
        uni.uCamPos.value.copy(cam.position);
        seabed.group.visible = false;
        const hidden = (I.hide || []).filter((o) => o.visible);
        hidden.forEach((o) => { o.visible = false; }); // e.g. the surfer's own body in their eye view
        sky.update(cam, S.t);

        const glY = H - top - h;
        const autoClear = renderer.autoClear;
        renderer.setScissorTest(true);
        renderer.setViewport(x, glY, w, h);
        renderer.setScissor(x, glY, w, h);
        renderer.autoClear = false;
        renderer.clear();
        renderer.render(scene, cam);
        renderer.autoClear = autoClear;
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, W, H);

        uni.uCutZ.value = cut;
        seabed.group.visible = bedVis;
        hidden.forEach((o) => { o.visible = true; });
      },
    };
  };
})();
