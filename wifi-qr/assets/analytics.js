/* No Google Analytics on local hosts or on a device opted out with ?notrack (undo with ?track) */
(function(){var q=location.search,off=/^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname)||/[?&]notrack\b/.test(q);try{if(/[?&]notrack\b/.test(q))localStorage.setItem("notrack","1");if(/[?&]track\b/.test(q))localStorage.removeItem("notrack");off=off||!!localStorage.getItem("notrack")}catch(e){}if(off)window["ga-disable-G-MKWK9CX2JJ"]=true})();
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-MKWK9CX2JJ');
(function(){var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-MKWK9CX2JJ';document.head.appendChild(s)})();
