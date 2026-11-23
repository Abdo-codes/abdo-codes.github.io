#!/usr/bin/env python3
"""Build the static localized Sajdah landing pages (/sajda/<code>/index.html).

Source of truth: sajda/index.html (English) and the strings in sajda/assets/i18n*.js.
Run from the repo root after changing either one:  python3 sajda/tools/build_i18n.py
Supports dedicated per-locale SEO metadata (seoTitle, seoDesc, seoAppDesc, seoKeywords,
seoOffersDesc, seoAppAltNames), data-i18n-alt, data-i18n-label, and native Arabic 1.9 screens.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = 'https://yoloabdo.com'
# code -> (html lang / hreflang, og:locale, direction)
LANGS = {
    'ar': ('ar', 'ar_AR', 'rtl'), 'tr': ('tr', 'tr_TR', 'ltr'), 'fr': ('fr', 'fr_FR', 'ltr'),
    'es': ('es', 'es_ES', 'ltr'), 'ur': ('ur', 'ur_PK', 'rtl'), 'bn': ('bn', 'bn_BD', 'ltr'),
    'id': ('id', 'id_ID', 'ltr'), 'ru': ('ru', 'ru_RU', 'ltr'), 'sv': ('sv', 'sv_SE', 'ltr'),
    'zh': ('zh-Hans', 'zh_CN', 'ltr'),
}
AR_SCREENS = [
    'sajdah-ramadan-iftar-countdown-apple-tv',
    'sajdah-ramadan-suhoor-countdown-apple-tv',
    'sajdah-jumuah-alkahf-today-apple-tv',
    'sajdah-prayer-screen-horizon-apple-tv',
    'sajdah-prayer-screen-timetable-apple-tv',
    'sajdah-prayer-screen-rosette-apple-tv',
    'sajdah-prayer-screen-board-apple-tv',
    'sajdah-playlists-friday-alkahf-apple-tv',
    'sajdah-morning-adhkar-apple-tv',
]
APPLE_BADGES = {
    'ar': 'ar-ar', 'tr': 'tr-tr', 'fr': 'fr-fr', 'es': 'es-es',
    'id': 'id-id', 'ru': 'ru-ru', 'sv': 'sv-se', 'zh': 'zh-cn',
}


def read_strings():
    base = (ROOT / 'sajda/assets/i18n.js').read_text(encoding='utf-8')
    extra = (ROOT / 'sajda/assets/i18n-extra.js').read_text(encoding='utf-8')
    strings = {m[1]: json.loads(m[2]) for m in re.finditer(r'^\s+(\w+): (\{.*\}),?\s*$', base, re.M)}
    for m in re.finditer(r'^Object\.assign\(T\.(\w+), (\{.*\})\);\s*$', extra, re.M):
        strings[m[1]].update(json.loads(m[2]))
    return strings


def esc(value):
    return html.escape(value, quote=False)


def attr(value):
    return html.escape(value, quote=True)


def set_meta(page, selector, value):
    pattern = re.compile(r'(' + re.escape(selector) + r' content=")[^"]*(")')
    assert pattern.search(page), selector
    return pattern.sub(lambda m: m[1] + attr(value) + m[2], page, count=1)


def localize_jsonld(page, code, t, title, page_url):
    match = re.search(r'(<script type="application/ld\+json">\s*)(\{.*?\})(\s*</script>)', page, re.S)
    data = json.loads(match[2])
    faq_keys = re.findall(r'data-i18n="(faqQ\d+)"', page)
    og_img = f'{SITE}/sajda/og-image-ar.jpg' if code == 'ar' else f'{SITE}/sajda/og-image.jpg'
    for node in data['@graph']:
        kind = node['@type']
        if kind == 'WebPage':
            node.update({'@id': page_url + '#webpage', 'url': page_url, 'name': title, 'inLanguage': LANGS[code][0],
                         'primaryImageOfPage': og_img, 'breadcrumb': {'@id': page_url + '#breadcrumb'}})
        elif kind == 'BreadcrumbList':
            node['@id'] = page_url + '#breadcrumb'
            node['itemListElement'][-1]['item'] = page_url
            if code == 'ar':
                node['itemListElement'][0]['name'] = 'الرئيسية'
                node['itemListElement'][1]['name'] = 'التطبيقات'
                node['itemListElement'][2]['name'] = 'سجدة'
        elif kind == 'SoftwareApplication':
            node['description'] = t.get('seoAppDesc') or t.get('heroRamadanSub') or t['tagline']
            if t.get('seoAppAltNames'):
                node['alternateName'] = [x.strip() for x in t['seoAppAltNames'].split('|') if x.strip()]
            if t.get('seoOffersDesc') and isinstance(node.get('offers'), dict):
                node['offers']['description'] = t['seoOffersDesc']
            if code == 'ar' and isinstance(node.get('screenshot'), list):
                shots = []
                for u in node['screenshot']:
                    for name in AR_SCREENS:
                        u = u.replace(f'{name}-1280.webp', f'{name}-ar-1280.webp')
                    shots.append(u)
                node['screenshot'] = shots
        elif kind == 'FAQPage':
            node['@id'] = page_url + '#faq'
            node['mainEntity'] = [{'@type': 'Question', 'name': t[k], 'acceptedAnswer': {'@type': 'Answer', 'text': t['faqA' + k[4:]]}}
                                  for k in faq_keys]
    lines = ',\n'.join('            ' + json.dumps(n, ensure_ascii=False) for n in data['@graph'])
    body = '{\n        "@context": "https://schema.org",\n        "@graph": [\n' + lines + '\n        ]\n    }'
    assert '</' not in body
    return page[:match.start(2)] + body + page[match.end(2):]


def build(code, source, strings):
    hl, locale, direction = LANGS[code]
    t = {**strings['en'], **strings[code]}
    page_url = f'{SITE}/sajda/{code}/'
    title = t.get('seoTitle') or f"Sajdah: {t['stickyNote']}"
    desc = t.get('seoDesc') or f"{t['tagline']} {t['heroNote']}"
    page = source.replace('<html lang="en" dir="ltr">', f'<html lang="{hl}" dir="{direction}">', 1)
    page = re.sub(r'<title>.*?</title>', lambda m: f'<title>{esc(title)}</title>', page, count=1)
    page = set_meta(page, '<meta name="description"', desc)
    for sel in ('<meta property="og:title"', '<meta name="twitter:title"'):
        page = set_meta(page, sel, title)
    for sel in ('<meta property="og:description"', '<meta name="twitter:description"'):
        page = set_meta(page, sel, desc)
    if t.get('seoKeywords'):
        page = set_meta(page, '<meta name="keywords"', t['seoKeywords'])
    if t.get('seoOgAlt'):
        page = set_meta(page, '<meta property="og:image:alt"', t['seoOgAlt'])
    page = set_meta(page, '<meta property="og:locale"', locale)
    page = page.replace('<link rel="canonical" href="https://yoloabdo.com/sajda/">', f'<link rel="canonical" href="{page_url}">', 1)
    page = page.replace('<meta property="og:url" content="https://yoloabdo.com/sajda/">', f'<meta property="og:url" content="{page_url}">', 1)
    page = page.replace('class="lang-option active" href="/sajda/" hreflang="en" lang="en" aria-current="true"',
                        'class="lang-option" href="/sajda/" hreflang="en" lang="en"', 1)
    page = re.sub(r'(<a class="lang-option)(" href="/sajda/%s/")' % code, r'\1 active\2 aria-current="true"', page, count=1)
    page = page.replace('<span id="current-lang-label">English</span>', f'<span id="current-lang-label">{esc(t["label"])}</span>', 1)
    # Language strip aria-current
    page = page.replace('<a href="/sajda/" hreflang="en" lang="en" aria-current="page">English</a>',
                        '<a href="/sajda/" hreflang="en" lang="en">English</a>', 1)
    page = re.sub(r'(<a href="/sajda/%s/" hreflang="[^"]+" lang="[^"]+)(">)' % code, r'\1" aria-current="page\2', page, count=1)

    def swap(m):
        value = t.get(m[3])
        return f'<{m[1]}{m[2]}data-i18n="{m[3]}"{m[4]}>{esc(value) if value else m[5]}</{m[1]}>'
    page = re.sub(r'<(\w+)([^>]*?)data-i18n="(\w+)"([^>]*)>(.*?)</\1>', swap, page, flags=re.S)

    # Localize data-i18n-alt -> sibling alt="..." / data-alt="..." (keep data-i18n-alt key intact!)
    def swap_alt(m):
        tag = m.group(0)
        key = m.group(1)
        val = t.get(key)
        if not val:
            return tag
        tag = re.sub(r'(?<=[\s])alt="[^"]*"', f'alt="{attr(val)}"', tag, count=1)
        tag = re.sub(r'(?<=[\s])data-alt="[^"]*"', f'data-alt="{attr(val)}"', tag, count=1)
        return tag
    page = re.sub(r'<[^>]+\bdata-i18n-alt="(\w+)"[^>]*>', swap_alt, page)

    # Localize data-i18n-label -> sibling data-label="..." (for responsive mobile table labels)
    def swap_label(m):
        tag = m.group(0)
        key = m.group(1)
        val = t.get(key)
        if not val:
            return tag
        return re.sub(r'(?<=[\s])data-label="[^"]*"', f'data-label="{attr(val)}"', tag, count=1)
    page = re.sub(r'<[^>]+\bdata-i18n-label="(\w+)"[^>]*>', swap_label, page)

    # Localize App Store badge alt & aria-label
    if t.get('stickyCta'):
        cta_label = attr(t['stickyCta'])
        page = page.replace('aria-label="Download Sajdah on the App Store"', f'aria-label="Sajdah — {cta_label}"')
        page = page.replace('alt="Download on the App Store"', f'alt="{cta_label}"')

    page = page.replace('class="card app-card fade-in"', 'class="card app-card fade-in" lang="en" dir="ltr"')
    if code in APPLE_BADGES:
        page = page.replace('/badges/download-on-the-app-store/black/en-us', f'/badges/download-on-the-app-store/black/{APPLE_BADGES[code]}')
    if code == 'ar':
        page = page.replace('<a href="/sajda/privacy/" data-i18n="footerPrivacy"', '<a href="/sajda/privacy/ar/" data-i18n="footerPrivacy"', 1)
        page = page.replace('https://yoloabdo.com/sajda/og-image.jpg', 'https://yoloabdo.com/sajda/og-image-ar.jpg')
        for name in AR_SCREENS:
            page = page.replace(f'{name}-1280.webp', f'{name}-ar-1280.webp')
            page = page.replace(f'{name}-640.webp', f'{name}-ar-640.webp')
    return localize_jsonld(page, code, t, title, page_url)


def main():
    source = (ROOT / 'sajda/index.html').read_text(encoding='utf-8')
    strings = read_strings()
    for code in LANGS:
        out = ROOT / 'sajda' / code / 'index.html'
        out.parent.mkdir(exist_ok=True)
        out.write_text(build(code, source, strings), encoding='utf-8')
        print('wrote', out.relative_to(ROOT))


if __name__ == '__main__':
    main()
