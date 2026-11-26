/* Progressive enhancement for Hona Elqahra landing and station directory pages. */
(function () {
    'use strict';

    function initHeroStages() {
        document.querySelectorAll('[data-stage-switcher]').forEach(function (tablist) {
            var stage = tablist.closest('.hero-stage');
            var frame = stage ? stage.querySelector('.stage-frame') : null;
            var img = frame ? frame.querySelector('img') : null;
            var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
            if (!frame || !img || !tabs.length) return;

            function activate(tab) {
                tabs.forEach(function (btn) {
                    var active = btn === tab;
                    btn.setAttribute('aria-selected', active ? 'true' : 'false');
                    btn.setAttribute('tabindex', active ? '0' : '-1');
                });
                var nextSrc = tab.getAttribute('data-src');
                var nextAlt = tab.getAttribute('data-alt');
                var nextW = tab.getAttribute('data-w');
                var nextH = tab.getAttribute('data-h');
                var isWide = tab.getAttribute('data-wide') === 'true';
                if (nextSrc) img.src = nextSrc;
                if (nextAlt) img.alt = nextAlt;
                if (nextW) img.setAttribute('width', nextW);
                if (nextH) img.setAttribute('height', nextH);
                frame.classList.toggle('is-wide', isWide);
            }

            tabs.forEach(function (tab, index) {
                tab.addEventListener('click', function () { activate(tab); });
                tab.addEventListener('keydown', function (e) {
                    var rtl = document.documentElement.dir === 'rtl';
                    var next = null;
                    if (e.key === 'ArrowRight') next = rtl ? index - 1 : index + 1;
                    else if (e.key === 'ArrowLeft') next = rtl ? index + 1 : index - 1;
                    else if (e.key === 'Home') next = 0;
                    else if (e.key === 'End') next = tabs.length - 1;
                    if (next === null) return;
                    e.preventDefault();
                    if (next < 0) next = tabs.length - 1;
                    if (next >= tabs.length) next = 0;
                    activate(tabs[next]);
                    tabs[next].focus();
                });
            });
        });
    }

    function playDetentSound(withHiss) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        try {
            if (!playDetentSound.ctx) playDetentSound.ctx = new Ctx();
            var ctx = playDetentSound.ctx;
            if (ctx.state === 'suspended') ctx.resume();
            var now = ctx.currentTime;
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.035);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.045);

            if (withHiss) {
                var size = Math.floor(ctx.sampleRate * 0.12);
                var buf = ctx.createBuffer(1, size, ctx.sampleRate);
                var ch = buf.getChannelData(0);
                for (var i = 0; i < size; i++) ch[i] = (Math.random() * 2 - 1) * 0.06;
                var noise = ctx.createBufferSource();
                noise.buffer = buf;
                var filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1400;
                var nGain = ctx.createGain();
                nGain.gain.setValueAtTime(0.18, now);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                noise.connect(filter);
                filter.connect(nGain);
                nGain.connect(ctx.destination);
                noise.start(now);
            }
        } catch (e) {}
    }

    function initRadioSims() {
        document.querySelectorAll('[data-radio-sim]').forEach(function (sim) {
            var dataEl = sim.querySelector('script[data-sim-presets]');
            if (!dataEl) return;
            var data;
            try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
            var presets = data.presets || [];
            if (!presets.length) return;

            var statusEl = sim.querySelector('[data-sim-status]');
            var nameEl = sim.querySelector('[data-sim-name]');
            var metaEl = sim.querySelector('[data-sim-meta]');
            var slotEl = sim.querySelector('[data-sim-slot]');
            var knobBtn = sim.querySelector('[data-sim-knob]');
            var prevBtn = sim.querySelector('[data-sim-prev]');
            var nextBtn = sim.querySelector('[data-sim-next]');
            var soundBtn = sim.querySelector('[data-sim-sound]');
            var presetBtns = Array.prototype.slice.call(sim.querySelectorAll('[data-sim-preset]'));

            var slot = 0;
            var playing = true;
            var soundOn = false;
            var tuningTimer = null;

            function render(animateTune) {
                var current = presets[slot];
                sim.style.setProperty('--slot', String(slot));
                sim.classList.toggle('is-playing', playing);
                if (nameEl) nameEl.textContent = current.name;
                if (metaEl) metaEl.textContent = current.meta;
                if (slotEl) slotEl.textContent = current.slotLabel;
                if (knobBtn) knobBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');

                presetBtns.forEach(function (btn, idx) {
                    btn.setAttribute('aria-pressed', idx === slot ? 'true' : 'false');
                });

                if (tuningTimer) {
                    clearTimeout(tuningTimer);
                    tuningTimer = null;
                }
                if (animateTune && playing && statusEl) {
                    statusEl.textContent = data.tuningLabel;
                    tuningTimer = setTimeout(function () {
                        if (statusEl) statusEl.textContent = playing ? data.onAirLabel : data.readyLabel;
                    }, 180);
                } else if (statusEl) {
                    statusEl.textContent = playing ? data.onAirLabel : data.readyLabel;
                }
            }

            if (knobBtn) {
                knobBtn.addEventListener('click', function () {
                    playing = !playing;
                    if (soundOn) playDetentSound(false);
                    render(false);
                });
            }

            presetBtns.forEach(function (btn, idx) {
                btn.addEventListener('click', function () {
                    var changed = idx !== slot;
                    slot = idx;
                    playing = true;
                    if (soundOn) playDetentSound(changed);
                    render(changed);
                });
            });

            if (prevBtn) {
                prevBtn.addEventListener('click', function () {
                    if (slot <= 0) return;
                    slot -= 1;
                    playing = true;
                    if (soundOn) playDetentSound(true);
                    render(true);
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', function () {
                    if (slot >= presets.length - 1) return;
                    slot += 1;
                    playing = true;
                    if (soundOn) playDetentSound(true);
                    render(true);
                });
            }

            if (soundBtn) {
                soundBtn.addEventListener('click', function () {
                    soundOn = !soundOn;
                    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
                    soundBtn.textContent = soundOn ? data.soundOnLabel : data.soundOffLabel;
                    if (soundOn) playDetentSound(false);
                });
            }

            render(false);
        });
    }

    function normalizeSearch(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
            .replace(/[أإآ]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
            .trim();
    }

    function initDirectory() {
        var root = document.querySelector('[data-station-directory]');
        if (!root) return;

        var input = root.querySelector('[data-dir-search]');
        var countEl = root.querySelector('[data-dir-count]');
        var countTpl = root.getAttribute('data-count-tpl') || '{n} stations';
        var filterBtns = Array.prototype.slice.call(root.querySelectorAll('[data-dir-cat]'));
        var rows = Array.prototype.slice.call(root.querySelectorAll('.station-row'));
        var sections = Array.prototype.slice.call(root.querySelectorAll('.dir-cat-section'));
        var emptyEl = root.querySelector('[data-dir-empty]');
        var resetBtn = root.querySelector('[data-dir-reset]');

        var activeCat = 'all';

        function apply() {
            var q = normalizeSearch(input ? input.value : '');
            var tokens = q ? q.split(/\s+/) : [];
            var visible = 0;

            rows.forEach(function (row) {
                var catOk = activeCat === 'all' || row.getAttribute('data-cat') === activeCat;
                var hay = row.getAttribute('data-search') || '';
                var textOk = !tokens.length || tokens.every(function (t) { return hay.indexOf(t) !== -1; });
                var show = catOk && textOk;
                row.hidden = !show;
                if (show) visible += 1;
            });

            sections.forEach(function (sec) {
                var anyVisible = sec.querySelector('.station-row:not([hidden])') !== null;
                sec.hidden = !anyVisible;
            });

            if (countEl) countEl.textContent = countTpl.replace('{n}', String(visible));
            if (emptyEl) emptyEl.hidden = visible > 0;
        }

        if (input) input.addEventListener('input', apply);

        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                activeCat = btn.getAttribute('data-dir-cat') || 'all';
                filterBtns.forEach(function (b) {
                    b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
                });
                apply();
            });
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                activeCat = 'all';
                if (input) input.value = '';
                filterBtns.forEach(function (b) {
                    b.setAttribute('aria-pressed', b.getAttribute('data-dir-cat') === 'all' ? 'true' : 'false');
                });
                apply();
            });
        }

        apply();
    }

    initHeroStages();
    initRadioSims();
    initDirectory();
})();
