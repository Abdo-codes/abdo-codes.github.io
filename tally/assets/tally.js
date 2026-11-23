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
    // section_view and scroll_depth are tracked site-wide in /assets/track.js
})();
