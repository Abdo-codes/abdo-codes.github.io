/* Counts App Store and TestFlight link clicks in Google Analytics (app_store_click, testflight_click) on every page,
   and adds an App Store campaign to links to these apps, so App Store Connect shows the downloads per page. */
(function () {
    var PROVIDER = '118222814';
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

    // App Store Connect keeps campaign names to 30 characters and hides campaigns with fewer than 5 installs,
    // so the name is the page only: web-home, web-wifi-qr-airbnb-wifi-sign, web-wifi-qr-story.
    function campaign() {
        var parts = location.pathname.replace(/index\.html$/, '').toLowerCase().split('/').filter(Boolean);
        if (parts[0] === 'blog' && parts.length > 1) parts.shift();
        return ('web-' + (parts.join('-') || 'home')).replace(/[^a-z0-9-]+/g, '-').slice(0, 30).replace(/-+$/, '');
    }

    function addCampaign(link) {
        var id = (link.href.match(/id(\d+)/) || [])[1];
        if (!APPS[id] || /[?&]ct=/.test(link.search)) return;
        var url = new URL(link.href);
        url.searchParams.set('pt', PROVIDER);
        url.searchParams.set('ct', campaign());
        url.searchParams.set('mt', '8');
        link.href = url.toString();
    }

    Array.prototype.forEach.call(document.querySelectorAll('a[href*="apps.apple.com"]'), addCampaign);

    // auxclick covers middle-click, which opens the store in a new tab
    document.addEventListener('click', onClick);
    document.addEventListener('auxclick', onClick);
})();
