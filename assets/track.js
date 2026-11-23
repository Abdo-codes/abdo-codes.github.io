/* Counts App Store and TestFlight link clicks in Google Analytics (app_store_click, testflight_click),
   tracks section_view and scroll_depth milestones, and adds App Store campaign tokens to links to these apps
   so App Store Connect shows downloads per page. */
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
        '6806616079': 'SwingCoach',
        '6769450957': 'Nightcap Awake',
        '6821673461': 'Baba Abdo',
        '6831580861': 'Hona Elqahra'
    };
    // Mac App Store apps use media type 12; the iPhone, iPad and Apple TV apps use 8
    var MAC_APPS = { '6769450957': true };
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
        url.searchParams.set('mt', MAC_APPS[id] ? '12' : '8');
        link.href = url.toString();
    }

    function onClick(e) {
        // Ignore right-click context menu on auxclick; only count middle-click (button 1)
        if (e.type === 'auxclick' && e.button !== 1) return;
        var el = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
        var link = el && el.closest ? el.closest('a[href*="apps.apple.com"], a[href*="testflight.apple.com"]') : null;
        if (!link) return;
        var beta = link.hostname === 'testflight.apple.com';
        if (!beta) addCampaign(link);
        if (typeof gtag !== 'function') return;
        var id = beta ? link.pathname.split('/').pop() : (link.href.match(/id(\d+)/) || [])[1] || '';
        gtag('event', beta ? 'testflight_click' : 'app_store_click', {
            app_name: (beta ? BETAS[id] : APPS[id]) || 'other',
            app_id: id,
            placement: placement(link),
            language: document.documentElement.lang || 'en',
            link_url: link.href,
            transport_type: 'beacon'
        });
    }

    function initEngagement() {
        if (typeof gtag !== 'function') return;

        // Section visibility: fire once per section[id] when 20% visible (works on tall mobile sections too)
        var sections = document.querySelectorAll('section[id]');
        if (sections.length && 'IntersectionObserver' in window) {
            var SECTION_THRESHOLD = 0.2;
            var seen = {};
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    var id = entry.target.id;
                    if (entry.isIntersecting && entry.intersectionRatio >= SECTION_THRESHOLD && id && !seen[id]) {
                        seen[id] = true;
                        observer.unobserve(entry.target);
                        gtag('event', 'section_view', { section: id });
                    }
                });
            }, { threshold: SECTION_THRESHOLD });
            sections.forEach(function (sec) { observer.observe(sec); });
        }

        // Scroll depth milestones (25%, 50%, 75%, 100%)
        var depthsFired = {};
        var milestones = [25, 50, 75, 100];
        window.addEventListener('scroll', function () {
            var docH = document.documentElement.scrollHeight;
            if (docH <= 0) return;
            var pct = Math.round(100 * (window.scrollY + window.innerHeight) / docH);
            milestones.forEach(function (m) {
                if (pct >= m && !depthsFired[m]) {
                    depthsFired[m] = true;
                    gtag('event', 'scroll_depth', { percent: m });
                }
            });
        }, { passive: true });
    }

    Array.prototype.forEach.call(document.querySelectorAll('a[href*="apps.apple.com"]'), addCampaign);

    // auxclick covers middle-click, which opens the store in a new tab
    document.addEventListener('click', onClick);
    document.addEventListener('auxclick', onClick);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEngagement);
    } else {
        initEngagement();
    }
})();
