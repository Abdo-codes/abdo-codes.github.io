# SEO Action Plan — yoloabdo.com

**Generated:** 2026-03-14
**Overall Score:** 70/100

---

## 🔴 Critical — Fix Immediately

### 1. Homepage is invisible to search engines
**Page:** `/index.html`
**Issue:** React SPA renders client-side only — crawlers see `<div id="root"></div>` with zero content
**Fix:** Either:
- (a) Replace with a static HTML page with real content, or
- (b) Redirect `/` → `/sajda/` if the homepage serves no SEO purpose, or
- (c) Add server-side rendering (not practical on GitHub Pages)
**Impact:** The homepage cannot be indexed at all

### 2. Add meta descriptions to 4 pages
**Pages:** `/`, `/sajda/privacy/`, `/sajda/support/`, `/sajda/privacy/ar/`
**Fix:** Add `<meta name="description" content="...">` to each `<head>`
**Suggested descriptions:**
- `/sajda/privacy/`: "Sajda privacy policy. We don't collect personal data — your preferences stay on your Apple TV device."
- `/sajda/support/`: "Get help with Sajda, the Quran app for Apple TV. FAQ, troubleshooting, and contact support."
- `/sajda/privacy/ar/`: "سياسة خصوصية سجدة. لا نجمع بيانات شخصية — تفضيلاتك تبقى على جهازك."
**Impact:** Meta descriptions drive click-through rates from search results

### 3. Fix or remove hreflang tags
**Page:** `/sajda/index.html`
**Issue:** Hreflang alternates point to `?lang=xx` URLs that use JavaScript switching — not real alternate pages
**Fix:** Remove hreflang tags OR create actual static pages per language (`/sajda/ar/`, `/sajda/tr/`, etc.)
**Impact:** Broken hreflang sends conflicting signals to Google

---

## 🟠 High — Fix Within 1 Week

### 4. Add canonical tags to all pages
**Fix:** Add `<link rel="canonical" href="...">` to:
- `/sajda/privacy/index.html` → `https://yoloabdo.com/sajda/privacy/`
- `/sajda/support/index.html` → `https://yoloabdo.com/sajda/support/`
- `/sajda/privacy/ar/index.html` → `https://yoloabdo.com/sajda/privacy/ar/`
**Impact:** Prevents duplicate content issues

### 5. Add image dimensions to prevent CLS
**Fix:** Add `width` and `height` attributes to all `<img>` tags in `/sajda/index.html`
**Impact:** Prevents layout shift, improves Core Web Vitals CLS score

### 6. Add `<lastmod>` to sitemap
**Fix:** Add `<lastmod>2026-03-14</lastmod>` (or actual dates) to each `<url>` in `sitemap.xml`
**Impact:** Helps search engines prioritize fresh crawling

### 7. Add Arabic privacy page to sitemap
**Fix:** Add `<url><loc>https://yoloabdo.com/sajda/privacy/ar/</loc></url>` to `sitemap.xml`
**Impact:** Ensures Arabic privacy page is discovered and indexed

### 8. Add FAQPage schema to support page
**Fix:** Add JSON-LD `FAQPage` structured data to `/sajda/support/index.html` for its 4 FAQ items
**Impact:** Enables FAQ rich results in search

---

## 🟡 Medium — Fix Within 1 Month

### 9. Convert images to WebP
**Fix:** Generate WebP versions of all JPG screenshots, use `<picture>` element with JPG fallback
**Impact:** 30-50% smaller files, faster page load

### 10. Compress OG image
**Fix:** Optimize `/sajda/og-image.png` from 414 KB to under 200 KB
**Impact:** Faster social sharing preview loads

### 11. Add BreadcrumbList schema
**Fix:** Add JSON-LD `BreadcrumbList` to `/sajda/privacy/`, `/sajda/support/`, `/sajda/privacy/ar/`
**Impact:** Breadcrumb rich results in search

### 12. Add footer navigation to support page
**Fix:** Add links to Home and Privacy in `/sajda/support/index.html` footer
**Impact:** Better internal linking, helps crawlers discover pages

### 13. Expand support page content
**Fix:** Add more FAQ items covering common issues (troubleshooting, compatibility, etc.)
**Impact:** Reduces thin content risk, targets more long-tail keywords

### 14. Add responsive images
**Fix:** Use `srcset` with multiple resolutions for screenshot images
**Impact:** Faster loading on mobile devices

---

## 🟢 Low — Backlog

### 15. Optimize font loading
Reduce from 4 Google Font families or self-host for better performance.

### 16. Add aggregateRating to schema
When App Store reviews accumulate, add rating data to the SoftwareApplication schema.

### 17. Add OpenGraph tags to subpages
Add OG title, description, and image to privacy and support pages.

### 18. Content marketing opportunity
Consider adding a blog or articles section targeting keywords like "best Islamic apps for Apple TV", "how to listen to Quran at home", etc.
