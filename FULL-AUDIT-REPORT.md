# SEO Audit Report — yoloabdo.com

**Audit Date:** 2026-03-14
**Domain:** yoloabdo.com (GitHub Pages)
**Business Type:** App Landing Page (Sajda — Quran app for Apple TV)
**Pages Crawled:** 5

---

## Executive Summary

### SEO Health Score: 70/100

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Technical SEO | 60/100 | 25% | 15.0 |
| Content Quality | 70/100 | 25% | 17.5 |
| On-Page SEO | 75/100 | 20% | 15.0 |
| Schema / Structured Data | 70/100 | 10% | 7.0 |
| Performance | 75/100 | 10% | 7.5 |
| Images | 65/100 | 5% | 3.25 |
| AI Search Readiness | 90/100 | 5% | 4.5 |

### Top 5 Critical Issues

1. **Homepage is invisible to search engines** — React SPA renders client-side only; crawlers see empty `<div id="root"></div>`
2. **4 of 5 pages missing meta descriptions** — only `/sajda/` has one
3. **4 of 5 pages missing canonical tags** — risk of duplicate content issues
4. **Hreflang URLs point to query-param pages** — `?lang=ar` etc. are JavaScript-switched, not real alternate pages
5. **No `width`/`height` on images** — causes Cumulative Layout Shift (CLS)

### Top 5 Quick Wins

1. Add meta descriptions to `/sajda/privacy/`, `/sajda/support/`, and `/sajda/privacy/ar/`
2. Add canonical tags to all pages missing them
3. Add `width` and `height` attributes to all `<img>` tags
4. Add `/sajda/privacy/ar/` to the sitemap
5. Convert screenshots to WebP format (save ~30-50% file size)

---

## Pages Analyzed

| URL | Title | Status |
|---|---|---|
| `/` | Abdelrahman Eita - Contact | JS-rendered SPA, empty to crawlers |
| `/sajda/` | Sajda - Quran, Prayer Times & Athan for Apple TV | Well-optimized |
| `/sajda/privacy/` | Sajda - Privacy Policy | Basic, missing meta |
| `/sajda/support/` | Sajda - Support | Basic, missing meta |
| `/sajda/privacy/ar/` | سجدة - سياسة الخصوصية | Basic, missing from sitemap |

---

## Technical SEO (60/100)

### Crawlability

| Check | Status | Details |
|---|---|---|
| robots.txt | ✅ Pass | `Allow: /`, sitemap reference correct |
| Sitemap | ⚠️ Partial | 4 URLs listed, missing `/sajda/privacy/ar/` |
| Sitemap `<lastmod>` | ❌ Missing | No `<lastmod>` dates on any URL |
| HTTPS | ✅ Pass | GitHub Pages enforces HTTPS |
| JavaScript rendering | ❌ Critical | Homepage (`/`) is empty without JS |

### Indexability

| Check | Status | Details |
|---|---|---|
| Canonical — `/` | ❌ Missing | No canonical tag |
| Canonical — `/sajda/` | ✅ Present | `https://yoloabdo.com/sajda/` |
| Canonical — `/sajda/privacy/` | ❌ Missing | No canonical tag |
| Canonical — `/sajda/support/` | ❌ Missing | No canonical tag |
| Canonical — `/sajda/privacy/ar/` | ❌ Missing | No canonical tag |
| `meta robots` | ✅ Pass | `index, follow` on `/sajda/` |
| Hreflang | ⚠️ Problematic | See below |

### Hreflang Issues

The `/sajda/` page declares hreflang alternates for 10 languages plus x-default. However:

- **Alternate URLs use query params** (`?lang=ar`, `?lang=tr`, etc.) which rely on JavaScript to switch content
- **No reciprocal hreflang tags** — the query-param pages don't declare hreflang back
- **Search engines can't index JS-switched content** as separate language versions
- **Recommendation:** Either create separate static pages per language (e.g., `/sajda/ar/`, `/sajda/tr/`) or remove hreflang tags to avoid sending conflicting signals

### Security

| Check | Status |
|---|---|
| HTTPS enforced | ✅ |
| Mixed content | ✅ None detected |
| External links use `rel="noopener"` | ✅ |

---

## Content Quality (70/100)

### E-E-A-T Assessment

| Signal | Status | Details |
|---|---|---|
| Author attribution | ✅ | "Abdo Elrhman" in schema + page |
| Contact information | ✅ | Email clearly provided |
| Privacy policy | ✅ | Detailed, bilingual (EN/AR) |
| Support page | ✅ | FAQ + contact form |
| Domain authority | ⚠️ | GitHub Pages subdomain pattern |

### Content Depth

| Page | Word Count (approx) | Assessment |
|---|---|---|
| `/sajda/` | ~2,500+ | Excellent — rich features, FAQ, prayer section |
| `/sajda/privacy/` | ~300 | Adequate for privacy policy |
| `/sajda/support/` | ~150 | Thin — could expand FAQ section |
| `/sajda/privacy/ar/` | ~250 | Adequate (Arabic mirror) |
| `/` | 0 (JS-rendered) | Critical — no indexable content |

### Readability

- `/sajda/`: Good. Short paragraphs, clear headings, scannable FAQ accordion
- Privacy/Support: Good. Clean layout, easy to read

### Duplicate / Thin Content

- The `/sajda/support/` page is fairly thin with only 4 FAQ items
- The FAQ in structured data (12 questions) is richer than the visible FAQ (12 questions) — good parity

---

## On-Page SEO (75/100)

### Title Tags

| Page | Title | Length | Assessment |
|---|---|---|---|
| `/` | Abdelrahman Eita - Contact | 27 chars | ⚠️ Not keyword-optimized |
| `/sajda/` | Sajda - Quran, Prayer Times & Athan for Apple TV | 50 chars | ✅ Excellent |
| `/sajda/privacy/` | Sajda - Privacy Policy | 22 chars | ✅ Adequate |
| `/sajda/support/` | Sajda - Support | 15 chars | ⚠️ Short |
| `/sajda/privacy/ar/` | سجدة - سياسة الخصوصية | 21 chars | ✅ Adequate |

### Meta Descriptions

| Page | Status | Assessment |
|---|---|---|
| `/` | ❌ Missing | Critical — add description |
| `/sajda/` | ✅ 195 chars | Excellent, keyword-rich |
| `/sajda/privacy/` | ❌ Missing | Add description |
| `/sajda/support/` | ❌ Missing | Add description |
| `/sajda/privacy/ar/` | ❌ Missing | Add description |

### Heading Structure

**`/sajda/` (main landing page):**
- H1: "Sajda — Quran for Apple TV" ✅
- H2: Features, See It in Action, Powerful Player, Prayer Times & Athan, FAQ, And So Much More, Your Living Room Transformed ✅
- H3: Feature cards ✅
- Good hierarchy, no skipped levels ✅

### Internal Linking

| From | To | Status |
|---|---|---|
| `/sajda/` | `/sajda/support/` | ✅ |
| `/sajda/` | `/sajda/privacy/` | ✅ |
| `/sajda/privacy/` | `/sajda/` | ✅ |
| `/sajda/privacy/` | `/sajda/support/` | ✅ |
| `/sajda/privacy/ar/` | `/sajda/` | ✅ |
| `/sajda/privacy/ar/` | `/sajda/support/` | ✅ |
| `/sajda/privacy/ar/` | `/sajda/privacy/` | ✅ |
| `/sajda/support/` | Other pages | ❌ No footer nav |
| `/` | Any subpage | ❌ JS-rendered, unknown |

### Keywords

Primary keywords well-targeted on `/sajda/`:
- "Quran Apple TV" ✅
- "Quran app" ✅
- "prayer times Apple TV" ✅
- "athan Apple TV" ✅
- "Islamic app" ✅
- Arabic keywords in meta keywords tag ✅

---

## Schema & Structured Data (70/100)

### `/sajda/` — SoftwareApplication

```json
✅ Present and valid
- @type: SoftwareApplication
- name, description, operatingSystem, applicationCategory
- offers (Free)
- author
- downloadUrl, screenshot
```

**Missing fields (recommended):**
- `aggregateRating` — add when you have App Store ratings
- `datePublished`
- `softwareVersion`

### `/sajda/` — FAQPage

```json
✅ Present and valid
- 12 Question/Answer pairs
- Covers long-tail keywords
- Well-structured for rich results
```

### Missing Schema on Other Pages

| Page | Recommended Schema |
|---|---|
| `/sajda/privacy/` | None needed |
| `/sajda/support/` | `FAQPage` for the 4 FAQ items |
| All pages | `BreadcrumbList` |
| `/sajda/` | `WebPage` with `breadcrumb` |

---

## Performance (75/100)

### Resource Sizes

| Resource | Size | Assessment |
|---|---|---|
| `/sajda/index.html` | ~45 KB | ⚠️ Large (inline CSS + i18n JS) |
| `/sajda/screenshot-player.jpg` | 217 KB | ✅ OK |
| `/sajda/screenshot-prayer.jpg` | 207 KB | ✅ OK |
| `/sajda/screenshot-reciters.jpg` | 199 KB | ✅ OK |
| `/sajda/screenshot-surahs.jpg` | 153 KB | ✅ OK |
| `/sajda/og-image.png` | 414 KB | ⚠️ Large, convert to WebP |
| Google Fonts (4 families) | ~200+ KB | ⚠️ Heavy load |
| `/assets/index-5e6dca26.js` | 226 KB | ⚠️ Homepage JS bundle |

### Loading Optimizations

| Check | Status | Details |
|---|---|---|
| Lazy loading images | ✅ | `loading="lazy"` on screenshots |
| Font `display=swap` | ✅ | Prevents FOIT |
| Font `preconnect` | ✅ | `fonts.googleapis.com` + `fonts.gstatic.com` |
| CSS inline | ✅ | No external CSS on sajda page (fast FCP) |
| Minified assets | ✅ | Hashed filenames suggest build tool |

### CLS Risk

- ❌ No `width`/`height` on `<img>` tags — images cause layout shift as they load
- ❌ External App Store badge image has no dimensions

---

## Images (65/100)

### Alt Text

| Image | Alt Text | Assessment |
|---|---|---|
| screenshot-reciters.jpg | "Sajda reciters screen showing 236 Quran reciters on Apple TV" | ✅ Excellent, descriptive + keyword |
| screenshot-surahs.jpg | "Sajda surah list with Play All and Shuffle options on Apple TV" | ✅ Excellent |
| screenshot-player.jpg | "Sajda Quran player with cloud background on Apple TV" | ✅ Excellent |
| screenshot-prayer.jpg | "Sajda prayer times and Qibla direction on Apple TV" | ✅ Excellent |
| App Store badge | "Download Sajda on the App Store" | ✅ Good |

### Format & Optimization

| Check | Status | Details |
|---|---|---|
| WebP format | ❌ | All JPG/PNG — should provide WebP |
| Responsive images (`srcset`) | ❌ | Single resolution only |
| Image dimensions in HTML | ❌ | No `width`/`height` attributes |
| File sizes | ✅ | All under 220 KB (except OG image) |
| OG image | ⚠️ | 414 KB PNG — should be under 300 KB |

---

## AI Search Readiness (90/100)

### llms.txt

✅ **Present and well-structured** — includes:
- App description
- Key features list
- Pricing breakdown (free vs premium)
- Platform info
- Developer contact
- Links to all pages

### AI Crawler Access

| Check | Status |
|---|---|
| robots.txt allows all crawlers | ✅ |
| No GPTBot/ClaudeBot blocks | ✅ |
| `<link rel="help" href="llms.txt">` in HTML | ✅ |

### Citability

| Signal | Status | Details |
|---|---|---|
| Direct Q&A pairs | ✅ | 12 FAQ items — perfect for AI extraction |
| Structured data backing | ✅ | FAQPage schema matches visible FAQ |
| Clear factual claims | ✅ | "200+ reciters", "13 athan voices", "11 languages" |
| Authoritative tone | ✅ | First-party product information |

### Missing

- No `llms-full.txt` for deeper context (optional)
- Could add more technical details for AI to cite

---

## Priority Action Plan

### 🔴 Critical (Fix Immediately)

1. **Make homepage crawlable** — Either add server-side rendering, use a static HTML fallback with real content, or redirect `/` to `/sajda/` if the homepage is just a personal page
2. **Add meta descriptions** to all 4 pages missing them:
   - `/sajda/privacy/`: "Sajda privacy policy — we don't collect personal data. Your preferences stay on your Apple TV device."
   - `/sajda/support/`: "Get help with Sajda, the Quran app for Apple TV. FAQ, troubleshooting, and contact information."
   - `/sajda/privacy/ar/`: Arabic equivalent of privacy description
3. **Fix hreflang implementation** — either create real static pages per language or remove hreflang tags

### 🟠 High (Fix Within 1 Week)

4. **Add canonical tags** to `/sajda/privacy/`, `/sajda/support/`, and `/sajda/privacy/ar/`
5. **Add `width` and `height` attributes** to all `<img>` tags to prevent CLS
6. **Add `<lastmod>` dates** to sitemap.xml
7. **Add `/sajda/privacy/ar/` to sitemap**
8. **Add FAQPage schema** to `/sajda/support/` for its 4 FAQ items

### 🟡 Medium (Fix Within 1 Month)

9. **Convert images to WebP** — provide WebP with JPG fallback using `<picture>` element
10. **Compress OG image** — 414 KB → target under 200 KB
11. **Add `BreadcrumbList` schema** to all Sajda subpages
12. **Add footer navigation** to `/sajda/support/` (links to Home, Privacy)
13. **Expand support page FAQ** — add more questions to increase content depth
14. **Add `srcset` responsive images** for screenshots

### 🟢 Low (Backlog)

15. **Reduce Google Fonts** — consider self-hosting or loading fewer weights
16. **Add `aggregateRating`** to SoftwareApplication schema when ratings are available
17. **Add `datePublished`** to SoftwareApplication schema
18. **Consider a blog/articles section** for content marketing (e.g., "Best Islamic Apps for Apple TV")
19. **Add OpenGraph tags** to privacy and support pages
