#!/usr/bin/env python3
"""Build the static localized Sajdah landing pages (/sajda/<code>/index.html).

Source of truth: sajda/index.html (English) and the strings in sajda/assets/i18n*.js.
Run from the repo root after changing either one:  python3 sajda/tools/build_i18n.py
Text is copied from the existing strings. A key with no translation stays in English.
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
    """Replace content="..." of the meta tag whose opening text is `selector`."""
    pattern = re.compile(r'(' + re.escape(selector) + r' content=")[^"]*(")')
    assert pattern.search(page), selector
    return pattern.sub(lambda m: m[1] + attr(value) + m[2], page, count=1)


def localize_jsonld(page, code, t, title, desc, page_url):
    match = re.search(r'(<script type="application/ld\+json">\s*)(\{.*?\})(\s*</script>)', page, re.S)
    data = json.loads(match[2])
    faq_keys = re.findall(r'data-i18n="(faqQ\d+)"', page)
    for node in data['@graph']:
        kind = node['@type']
        if kind == 'WebPage':
            node.update({'@id': page_url + '#webpage', 'url': page_url, 'name': title, 'inLanguage': LANGS[code][0],
                         'breadcrumb': {'@id': page_url + '#breadcrumb'}})
        elif kind == 'BreadcrumbList':
            node['@id'] = page_url + '#breadcrumb'
            node['itemListElement'][-1]['item'] = page_url
        elif kind == 'SoftwareApplication':
            node['description'] = t['tagline']  # @id stays the English app entity
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
    title = f"Sajdah: {t['stickyNote']}"
    desc = f"{t['tagline']} {t['heroNote']}"
    page = source.replace('<html lang="en" dir="ltr">', f'<html lang="{hl}" dir="{direction}">', 1)
    page = re.sub(r'<title>.*?</title>', lambda m: f'<title>{esc(title)}</title>', page, count=1)
    page = set_meta(page, '<meta name="description"', desc)
    for sel in ('<meta property="og:title"', '<meta name="twitter:title"'):
        page = set_meta(page, sel, title)
    for sel in ('<meta property="og:description"', '<meta name="twitter:description"'):
        page = set_meta(page, sel, desc)
    page = set_meta(page, '<meta property="og:locale"', locale)
    page = page.replace('<link rel="canonical" href="https://yoloabdo.com/sajda/">', f'<link rel="canonical" href="{page_url}">', 1)
    page = page.replace('<meta property="og:url" content="https://yoloabdo.com/sajda/">', f'<meta property="og:url" content="{page_url}">', 1)
    page = page.replace('class="lang-option active" href="/sajda/" hreflang="en" lang="en" aria-current="true"',
                        'class="lang-option" href="/sajda/" hreflang="en" lang="en"', 1)  # English is not current here
    page = re.sub(r'(<a class="lang-option)(" href="/sajda/%s/")' % code, r'\1 active\2 aria-current="true"', page, count=1)
    page = page.replace('<span id="current-lang-label">English</span>', f'<span id="current-lang-label">{esc(t["label"])}</span>', 1)

    def swap(m):
        value = t.get(m[3])
        return f'<{m[1]}{m[2]}data-i18n="{m[3]}"{m[4]}>{esc(value) if value else m[5]}</{m[1]}>'
    page = re.sub(r'<(\w+)([^>]*?)data-i18n="(\w+)"([^>]*)>(.*?)</\1>', swap, page, flags=re.S)
    page = page.replace('class="card app-card fade-in"', 'class="card app-card fade-in" lang="en" dir="ltr"')  # other apps' copy is English only
    if code == 'ar':  # the Arabic privacy policy exists; other languages keep the English one
        page = page.replace('<a href="/sajda/privacy/" data-i18n="footerPrivacy"', '<a href="/sajda/privacy/ar/" data-i18n="footerPrivacy"', 1)
    return localize_jsonld(page, code, t, title, desc, page_url)


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
