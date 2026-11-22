# Internal Links Report: yoloabdo.com

Run: 2026-11-22 | Sources edited: 12 (10 blog posts + `/` + `/apps/`) | Upper-40% blog failures: 9 -> 0 | Orphan money pages (`<3` contextual body links): 5 -> 3

Snapshots:
- Before: `seo/internal-link-graph.before.json`
- After: `seo/internal-link-graph.json`
- Script: `SITE=https://yoloabdo.com node scripts/internal-link-graph.mjs`

## Money Pages (Before vs After Contextual Body Links, Nav/Footer Excluded)

| Target | Before (body) | After (body) | Before (blog) | After (blog) | Distinct anchors | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `/nightcap-awake/` | 2 | 4 | 0 | 2 | 4 | Rescued from orphan via `git-worktree-remove-keep-branch` and `xcode-deriveddata-safe-to-delete` |
| `/drive-town/guide/` | 2 | 3 | 0 | 0 | 3 | Rescued from orphan via homepage Drive Town card |
| `/tateemi/en/` | 0 | 2 | 0 | 1 | 2 | Linked from `/apps/` Tateemi card and `saudi-vaccination-schedule-2026` |
| `/angry-nona/ar/` | 0 | 2 | 0 | 1 | 2 | Linked from `/apps/` Angry Nona card and `angry-nona-1-6-release-notes` |
| `/baba-abdo/` | 4 | 5 | 3 | 3 | 4 | Linked from `/apps/` Baba Abdo card |
| `/swingcoach/` | 7 | 7 | 5 | 5 | 7 | First link moved from 98%-99% into top 12% on 3 SwingCoach posts |
| `/wifi-qr/` | 11 | 11 | 5 | 5 | 11 | First link moved from 54%-63% into top 12%-25% on 2 Wi-Fi QR posts |
| `/wifi-qr/airbnb-wifi-sign/` | 6 | 6 | 5 | 5 | 6 | Added upper-body contextual links in `share-wifi-password-iphone-to-android` and `wifi-qr-story` |
| `/tateemi/` | 17 | 17 | 1 | 1 | 17 | First link moved from 66% into top 15% of `saudi-vaccination-schedule-2026` |
| `/apps/` | 19 | 19 | 4 | 4 | 19 | First link moved from 100% into top 8% of `swiftui-open-app-store-page` |
| `/wifi-qr/generator/` | new | 4 | new | 1 | 4 | New free browser tool; Day-1 links from `/wifi-qr/`, `/wifi-qr/airbnb-wifi-sign/`, `/wifi-qr/vs-canva-etsy/`, `/blog/share-wifi-password-iphone-to-android/` |
| `/wifi-qr/vs-canva-etsy/` | new | 3 | new | 0 | 3 | New BOFU comparison; Day-1 links from `/wifi-qr/`, `/wifi-qr/airbnb-wifi-sign/`, `/wifi-qr/generator/` |
| `/nightcap-awake/vs-amphetamine/` | new | 3 | new | 2 | 3 | New BOFU comparison; Day-1 links from `/nightcap-awake/`, `/blog/git-worktree-remove-keep-branch/`, `/blog/xcode-deriveddata-safe-to-delete/` |

## Upper-40% Blog Money-Link Verification

Every blog post on the site now passes the upper-40% placement rule (`lateOrMissingBlogLinksCount: 0`):
- `/blog/git-worktree-remove-keep-branch/`: NONE -> `/nightcap-awake/` (upper 15%)
- `/blog/xcode-deriveddata-safe-to-delete/`: NONE -> `/nightcap-awake/` (upper 10%)
- `/blog/swiftui-open-app-store-page/`: 100% -> `/apps/` (upper 10%)
- `/blog/saudi-vaccination-schedule-2026/`: 66% -> `/tateemi/` + `/tateemi/en/` (upper 15%)
- `/blog/share-wifi-password-iphone-to-android/`: 54% -> `/wifi-qr/` + `/wifi-qr/airbnb-wifi-sign/` (upper 15%)
- `/blog/kettlebell-workout-app-hands-free/`: 99% -> `/swingcoach/` (upper 12%)
- `/blog/swingcoach-1-1-release-notes/`: 98% -> `/swingcoach/` (upper 12%)
- `/blog/swingcoach-1-2-1-release-notes/`: 99% -> `/swingcoach/` (upper 12%)
- `/blog/wifi-qr-story/`: 63% -> `/wifi-qr/airbnb-wifi-sign/` + `/wifi-qr/` (upper 25%)

## Remaining Orphans (`<3` contextual body links)

1. `/surfing/` (1 contextual link, from `/`): no matching blog post exists yet. Next step: publish a short making-of / Three.js ocean shader guide linking to `/surfing/` and add `/surfing/` to `/apps/` interactive projects.
2. `/tateemi/en/` (2 contextual links): needs 1 English parenting/vaccination guide (e.g. English companion to `saudi-vaccination-schedule-2026` or GCC baby vaccine schedule in English).
3. `/angry-nona/ar/` (2 contextual links): needs 1 Arabic blog post (e.g. Arabic version of the Angry Nona launch or 1.6 release notes).
