/* Light/dark theme shared with the homepage ("theme" key). Loaded in <head> so the page paints in the right theme. */
(function () {
    var root = document.documentElement;
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) { /* storage blocked */ }
    var dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', stored || (dark ? 'dark' : 'light'));

    document.addEventListener('DOMContentLoaded', function () {
        var toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        toggle.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
        });
        document.querySelectorAll('[data-cta]').forEach(function (link) {
            link.addEventListener('click', function () {
                if (typeof gtag === 'function') gtag('event', 'app_store_click', { placement: link.getAttribute('data-cta') });
            });
        });
    });
})();
