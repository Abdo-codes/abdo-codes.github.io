function showLang(lang) {
    const arSection = document.getElementById('section-ar');
    const enSection = document.getElementById('section-en');
    const divider = document.getElementById('divider-en');
    const btnAr = document.getElementById('btn-ar');
    const btnEn = document.getElementById('btn-en');
    const btnBoth = document.getElementById('btn-both');

    // Reset all buttons
    btnAr.classList.remove('active');
    btnEn.classList.remove('active');
    btnBoth.classList.remove('active');

    if (lang === 'ar') {
        arSection.classList.remove('hidden');
        enSection.classList.add('hidden');
        divider.classList.add('hidden');
        btnAr.classList.add('active');
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
    } else if (lang === 'en') {
        arSection.classList.add('hidden');
        enSection.classList.remove('hidden');
        divider.classList.add('hidden');
        btnEn.classList.add('active');
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
    } else {
        arSection.classList.remove('hidden');
        enSection.classList.remove('hidden');
        divider.classList.remove('hidden');
        btnBoth.classList.add('active');
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
    }
}

// Default: show Arabic only
showLang('ar');
