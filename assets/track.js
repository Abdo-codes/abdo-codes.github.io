/* Counts App Store and TestFlight link clicks in Google Analytics (app_store_click, testflight_click) on every page. */
(function () {
    var APPS = {
        '6759179587': 'Sajdah',
        '6760623633': 'Tally',
        '6760822504': 'Tateemi',
        '6766263673': 'Capybara Rush',
        '6776169783': 'Wi-Fi QR',
        '6819626561': 'Angry Nona',
        '6768992579': 'ColorTalk',
        '6806616079': 'SwingCoach'
    };
    var BETAS = {
        'Yk2ZgDkn': 'SwingCoach',
        '4jjubyD7': 'ColorTalk',
        'bvBDeeQ5': 'Angry Nona'
    };

    function placement(link) {
        var marked = link.closest('[data-cta]');
        if (marked) return marked.getAttribute('data-cta');
        var area = link.closest('section, article, header, nav, aside, footer');
        if (!area) return 'page';
        return area.id || area.classList[0] || area.tagName.toLowerCase();
    }

    function onClick(e) {
        var link = e.target.closest && e.target.closest('a[href*="apps.apple.com"], a[href*="testflight.apple.com"]');
        if (!link || typeof gtag !== 'function') return;
        var beta = link.hostname === 'testflight.apple.com';
        var id = beta ? link.pathname.split('/').pop() : (link.href.match(/id(\d+)/) || [])[1] || '';
        gtag('event', beta ? 'testflight_click' : 'app_store_click', {
            app_name: (beta ? BETAS[id] : APPS[id]) || 'other',
            app_id: id,
            placement: placement(link),
            language: document.documentElement.lang || 'en',
            link_url: link.href
        });
    }

    // auxclick covers middle-click, which opens the store in a new tab
    document.addEventListener('click', onClick);
    document.addEventListener('auxclick', onClick);
})();
