// Scroll reveal with IntersectionObserver
(function() {
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });
        reveals.forEach(function(el) {
            observer.observe(el);
        });
    } else {
        // Fallback: show all
        reveals.forEach(function(el) {
            el.classList.add('visible');
        });
    }
})();

// Nav scroll state
(function() {
    var nav = document.getElementById('nav');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 40) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });
})();

// ============================================
// ANALYTICS EVENTS
// ============================================
(function() {
    function track(event, params) {
        if (typeof gtag === 'function') gtag('event', event, params);
    }

    // App Store button clicks
    document.querySelectorAll('a[href*="apps.apple.com"], a[href*="apple.com/app-store"]').forEach(function(link) {
        link.addEventListener('click', function() {
            track('app_store_click', {
                link_url: link.href,
                link_text: (link.textContent || '').trim().slice(0, 50)
            });
        });
    });

    // Nav link clicks
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.addEventListener('click', function() {
            track('nav_click', { link_text: link.textContent.trim() });
        });
    });

    // FAQ expand/collapse
    document.querySelectorAll('.faq-item summary').forEach(function(q) {
        q.addEventListener('click', function() {
            var text = q.textContent.trim().slice(0, 80);
            var isOpen = q.parentElement.open;
            track('faq_toggle', { question: text, action: isOpen ? 'close' : 'open' });
        });
    });

    // Section visibility — fire once per section when 50% visible
    var sectionsSeen = {};
    var sections = ['features', 'scoreboard', 'sports', 'game-night', 'roadmap', 'faq'];
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && !sectionsSeen[entry.target.id]) {
                    sectionsSeen[entry.target.id] = true;
                    track('section_view', { section: entry.target.id });
                }
            });
        }, { threshold: 0.5 });
        sections.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) observer.observe(el);
        });
    }

    // Scroll depth milestones (25%, 50%, 75%, 100%)
    var depthsFired = {};
    window.addEventListener('scroll', function() {
        var scrollPct = Math.round(100 * (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight);
        [25, 50, 75, 100].forEach(function(milestone) {
            if (scrollPct >= milestone && !depthsFired[milestone]) {
                depthsFired[milestone] = true;
                track('scroll_depth', { percent: milestone });
            }
        });
    }, { passive: true });
})();
