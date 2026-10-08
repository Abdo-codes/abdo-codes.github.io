/* Sajdah landing page behavior: language switcher, FAQ, scroll reveal, gallery, sticky App Store bar. */
(function () {
    var rtl = ['ar', 'ur'];
    var order = ['en', 'ar', 'tr', 'fr', 'es', 'ur', 'bn', 'id', 'ru', 'sv', 'zh'];

    function stored() { try { return localStorage.getItem('sajda-lang'); } catch (e) { return null; } }
    function remember(code) { try { localStorage.setItem('sajda-lang', code); } catch (e) { /* storage blocked */ } }

    var urlLang = new URLSearchParams(window.location.search).get('lang');
    var lang = urlLang && T[urlLang] ? urlLang : stored() || (navigator.language || '').split('-')[0] || 'en';
    if (!T[lang]) lang = 'en';

    var toggle = document.getElementById('lang-toggle');
    var dropdown = document.getElementById('lang-dropdown');

    function closeDropdown() { dropdown.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }

    function buildDropdown() {
        while (dropdown.firstChild) dropdown.removeChild(dropdown.firstChild);
        order.forEach(function (code) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'lang-option' + (code === lang ? ' active' : '');
            btn.textContent = T[code].label;
            btn.lang = code;
            btn.addEventListener('click', function () { setLang(code); });
            dropdown.appendChild(btn);
        });
    }

    function apply() {
        var t = T[lang];
        document.documentElement.lang = lang;
        document.documentElement.dir = rtl.indexOf(lang) >= 0 ? 'rtl' : 'ltr';
        document.getElementById('current-lang-label').textContent = t.label;
        var els = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < els.length; i++) {
            var value = t[els[i].getAttribute('data-i18n')];
            if (value) els[i].textContent = value;
        }
    }

    function setLang(code) {
        lang = code;
        remember(code);
        apply();
        closeDropdown();
        buildDropdown();
    }

    toggle.addEventListener('click', function () {
        var open = dropdown.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.lang-bar')) closeDropdown(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDropdown(); });

    buildDropdown();
    apply();

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

    // Screenshot gallery buttons
    var gallery = document.getElementById('gallery');
    document.querySelectorAll('.gallery-nav button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var step = gallery.firstElementChild.getBoundingClientRect().width + 20;
            var dir = Number(btn.getAttribute('data-dir')) * (document.documentElement.dir === 'rtl' ? -1 : 1);
            gallery.scrollBy({ left: dir * step, behavior: reduced ? 'auto' : 'smooth' });
        });
    });

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

    // Measure App Store clicks per placement (existing GA property).
    document.querySelectorAll('[data-cta]').forEach(function (link) {
        link.addEventListener('click', function () {
            if (typeof gtag === 'function') gtag('event', 'app_store_click', { placement: link.getAttribute('data-cta'), language: lang });
        });
    });
})();
