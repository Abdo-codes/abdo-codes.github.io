/* Records the film to a video file: composites the 3D canvas + overlay canvas every frame
   into one canvas, captures it with MediaRecorder, and downloads the result. */
(function () {
  const SURF = window.SURF;
  const TYPES = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

  SURF.createRecorder = function (gl, ov, audio) {
    const R = {
      active: false,
      startedAt: 0,
      supported: typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream,
    };
    let comp, ctx, rec, chunks, mime;

    R.start = function () {
      if (!R.supported || R.active) return false;
      comp = document.createElement('canvas');
      comp.width = gl.width;
      comp.height = gl.height;
      ctx = comp.getContext('2d');
      const stream = comp.captureStream(60);
      if (audio.enabled && audio.stream) audio.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      mime = TYPES.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      chunks = [];
      const opts = { videoBitsPerSecond: 16e6 };
      if (mime) opts.mimeType = mime;
      try {
        rec = new MediaRecorder(stream, opts);
      } catch (err) {
        console.warn('MediaRecorder failed', err);
        return false;
      }
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = save;
      rec.start(500);
      R.active = true;
      R.startedAt = performance.now();
      return true;
    };

    R.frame = function () {
      if (!R.active) return;
      ctx.drawImage(gl, 0, 0, comp.width, comp.height);
      ctx.drawImage(ov, 0, 0, comp.width, comp.height);
    };

    R.stop = function () {
      if (!R.active) return;
      R.active = false;
      rec.stop();
    };

    function save() {
      const type = rec.mimeType || mime || 'video/webm';
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      const url = URL.createObjectURL(new Blob(chunks, { type }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'how-surfing-works.' + ext;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    return R;
  };
})();
