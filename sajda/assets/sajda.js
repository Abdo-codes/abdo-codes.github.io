/* Sajdah landing page behavior: language menu, interactive TV switchers, copy helper,
   FAQ accordion, scroll reveal, sticky App Store bar, and live Umm al-Qura Ramadan countdown. */
(function () {
    var pages = { en: '/sajda/', ar: '/sajda/ar/', tr: '/sajda/tr/', fr: '/sajda/fr/', es: '/sajda/es/', ur: '/sajda/ur/', bn: '/sajda/bn/', id: '/sajda/id/', ru: '/sajda/ru/', sv: '/sajda/sv/', zh: '/sajda/zh/' };

    // Old links such as /sajda/?lang=ar redirect to the matching static page.
    var legacy = new URLSearchParams(window.location.search).get('lang');
    if (legacy && pages[legacy] && pages[legacy] !== window.location.pathname) window.location.replace(pages[legacy]);

    // Language switcher menu
    var toggle = document.getElementById('lang-toggle');
    var dropdown = document.getElementById('lang-dropdown');
    function closeDropdown() { if (!dropdown) return; dropdown.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    if (toggle && dropdown) {
        toggle.addEventListener('click', function () {
            var open = dropdown.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) { if (!e.target.closest('.lang-bar')) closeDropdown(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDropdown(); });
    }

    // Interactive TV screen switchers (Hero TV showcase & Prayer Screen style stage)
    document.querySelectorAll('[data-tv-switcher]').forEach(function (tablist) {
        var img = document.getElementById(tablist.getAttribute('data-tv-switcher'));
        if (!img) return;
        var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
        function selectTab(btn) {
            tabs.forEach(function (t) {
                var active = t === btn;
                t.setAttribute('aria-selected', active ? 'true' : 'false');
                t.tabIndex = active ? 0 : -1;
            });
            var src1280 = btn.getAttribute('data-img-1280');
            var src640 = btn.getAttribute('data-img-640');
            var alt = btn.getAttribute('data-alt');
            if (!src1280 || img.getAttribute('src') === src1280) return;
            img.classList.add('switching');
            setTimeout(function () {
                img.src = src1280;
                if (src640) img.srcset = src640 + ' 640w, ' + src1280 + ' 1280w';
                if (alt) img.alt = alt;
                img.classList.remove('switching');
            }, 90);
        }
        tabs.forEach(function (btn, idx) {
            btn.addEventListener('click', function () { selectTab(btn); });
            btn.addEventListener('keydown', function (e) {
                var dir = document.documentElement.dir === 'rtl' ? -1 : 1;
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    var step = (e.key === 'ArrowRight' ? 1 : -1) * dir;
                    var next = tabs[(idx + step + tabs.length) % tabs.length];
                    next.focus();
                    selectTab(next);
                }
            });
        });
    });

    // Copy "Sajdah" helper for visitors browsing on iPhone/Mac before opening Apple TV
    document.querySelectorAll('[data-copy-text]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var text = btn.getAttribute('data-copy-text') || 'Sajdah';
            var labelEl = btn.querySelector('.copy-label');
            var copiedTpl = document.getElementById('tpl-copied');
            var original = labelEl ? labelEl.textContent : '';
            function flash() {
                btn.classList.add('copied');
                if (labelEl && copiedTpl) labelEl.textContent = copiedTpl.textContent;
                setTimeout(function () {
                    btn.classList.remove('copied');
                    if (labelEl) labelEl.textContent = original;
                }, 2000);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(flash, flash);
            } else {
                flash();
            }
        });
    });

    // FAQ accordion
    document.querySelectorAll('.faq-q').forEach(function (q) {
        q.addEventListener('click', function () {
            var open = this.parentElement.classList.toggle('open');
            this.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    });

    // Scroll reveal
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reveal = document.querySelectorAll('.fade-in');
    if (reduced || !('IntersectionObserver' in window)) {
        reveal.forEach(function (el) { el.classList.add('visible'); });
    } else {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        reveal.forEach(function (el) { observer.observe(el); });
    }

    // Sticky App Store bar: visible once the hero leaves the viewport, hidden near the footer.
    var sticky = document.getElementById('sticky-cta');
    var hero = document.getElementById('top');
    var footer = document.querySelector('.footer');
    if (sticky && hero && 'IntersectionObserver' in window) {
        var heroVisible = true, footerVisible = false;
        var update = function () {
            var show = !heroVisible && !footerVisible;
            sticky.classList.toggle('show', show);
            sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
            sticky.querySelector('a').tabIndex = show ? 0 : -1;
        };
        new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; update(); }).observe(hero);
        new IntersectionObserver(function (e) { footerVisible = e[0].isIntersecting; update(); }).observe(footer);
    }
})();

/* Ramadan countdown pill: days until Ramadan (or the night of Ramadan) from Umm al-Qura calendar. */
(function () {
    var count = document.getElementById('ramadan-count');
    var label = document.getElementById('ramadan-label');
    function tpl(id) { var el = document.getElementById(id); return el ? el.textContent : ''; }
    var fmt = null;
    try {
        fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
        if (!/^islamic/.test(fmt.resolvedOptions().calendar)) fmt = null;
    } catch (e) { fmt = null; }
    function hijri(date) {
        var parts = {};
        fmt.formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
        return { day: parseInt(parts.day, 10), month: parseInt(parts.month, 10), year: parseInt(parts.year || parts.relatedYear, 10) };
    }
    if (count && label && fmt) {
        var now = new Date();
        var day = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
        var today = hijri(day);
        if (today.month === 9 && today.day) {
            count.textContent = tpl('tpl-night').replace('{n}', today.day);
            label.textContent = tpl('tpl-mubarak');
        } else if (today.month) {
            for (var n = 1; n <= 360; n++) {
                day.setUTCDate(day.getUTCDate() + 1);
                var h = hijri(day);
                if (h.month === 9) {
                    count.textContent = tpl('tpl-days').replace('{n}', n);
                    label.textContent = tpl('tpl-until').replace('{y}', h.year);
                    break;
                }
            }
        }
    }
})();
