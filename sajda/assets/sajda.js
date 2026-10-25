/* Sajdah landing page behavior: language menu, FAQ, scroll reveal, gallery, sticky App Store bar. */
(function () {
    // Each language is a static page (/sajda/ for English, /sajda/<code>/ for the rest).
    // The language menu is plain links in the HTML; this script only opens and closes it.
    var pages = { en: '/sajda/', ar: '/sajda/ar/', tr: '/sajda/tr/', fr: '/sajda/fr/', es: '/sajda/es/', ur: '/sajda/ur/', bn: '/sajda/bn/', id: '/sajda/id/', ru: '/sajda/ru/', sv: '/sajda/sv/', zh: '/sajda/zh/' };

    // Old links such as /sajda/?lang=ar go to the matching static page.
    var legacy = new URLSearchParams(window.location.search).get('lang');
    if (legacy && pages[legacy] && pages[legacy] !== window.location.pathname) window.location.replace(pages[legacy]);

    var toggle = document.getElementById('lang-toggle');
    var dropdown = document.getElementById('lang-dropdown');

    function closeDropdown() { dropdown.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }

    toggle.addEventListener('click', function () {
        var open = dropdown.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.lang-bar')) closeDropdown(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDropdown(); });

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
})();
