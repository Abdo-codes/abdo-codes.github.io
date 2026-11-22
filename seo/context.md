# SEO Autopilot Context: yoloabdo.com

- **Site:** https://yoloabdo.com (GitHub Pages repo `Abdo-codes/abdo-codes.github.io`, default published branch `gh-pages`, custom domain via `CNAME`)
- **Product:** Personal portfolio + 11 indie Apple apps (iPhone, iPad, Mac, Apple TV) + 2 free interactive 3D browser projects (`Drive Town`, `How Surfing Works`) by Abdelrahman Eita.
- **Primary Conversion:** App Store installs (`apps.apple.com` clicks tracked by `/assets/track.js` and GA4 `G-MKWK9CX2JJ`), plus Pro/Lifetime IAP upgrades on Sajdah, Wi-Fi QR, Tateemi, and Angry Nona.
- **Ship Mode:** PR for review (never push directly without owner approval; keep `seo/` and `scripts/` excluded from live GitHub Pages via `_config.yml`).

## Repository Architecture
- Static hand-authored HTML/CSS/JS (no Next.js/Astro bundler). GitHub Pages runs Jekyll (no `.nojekyll`), so `_config.yml` excludes `seo/`, `scripts/`, and `.claude/` from the published site.
- Sitemap: `sitemap.xml` (89 URLs, includes `<xhtml:link>` hreflang sets).
- Robots: `robots.txt` (default-allow + explicit allow for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot).
- LLM context: `llms.txt` (concise structured catalog for all 11 apps + 2 browser projects) and `llms-full.txt` (extended copy).
- Feed: `blog/feed.xml` (Atom feed).
- Machine app catalog: `apps/catalog.json` (used for cross-app catalog metadata; verify iOS `SiblingApps` consumer compatibility before modifying schema/fields).

## Priority Commercial / High-Volume App Clusters & Competitors
1. **Sajdah (`/sajda/`)**: Apple TV Quran & Athan app. Competitors: Muslim Pro, Quran.com, Pillars, Athan Pro, Tarteel (tvOS / AirPlay / TV apps; see `/blog/quran-apps-apple-tv-compared/`).
2. **Wi-Fi QR (`/wifi-qr/`, `/wifi-qr/airbnb-wifi-sign/`)**: Guest Wi-Fi QR & printable Airbnb signs. Competitors: Canva WiFi templates, Etsy printable WiFi signs, QiFi, Visual Lead, QR Code Monkey, iOS Passwords app.
3. **SwingCoach (`/swingcoach/`)**: Hands-free iPhone camera kettlebell swing counter & form coach. Competitors: Strong, Hevy, Seconds Pro, manual interval timers, kettlebell rep counter apps.
4. **Tateemi (`/tateemi/`, `/tateemi/en/`)**: Arabic baby vaccination tracker with GCC/country schedules. Competitors: Sehhaty (Saudi official), paper vaccination cards, Baby Center / generic immunization logs.
5. **Nightcap Awake (`/nightcap-awake/`)**: Free open-source Mac menu-bar app that keeps Mac awake while chosen apps run. Competitors: Amphetamine, KeepingYouAwake, Lungo, `caffeinate` CLI.
6. **Tally (`/tally/`)**: Free iPhone score keeper + Apple TV scoreboard with iCloud sync & chess clock. Competitors: Scorekeeper XL, KeepScore, Game Score Counter, Apple TV scoreboard apps.
7. **Drive Town (`/drive-town/`, `/drive-town/guide/`)**: Free 3D Dutch CBR car theory exam practice in English. Competitors: TheorieExamen.nl, iTheorie, Theorie-leren.nl, CBR practice apps.

## Connected Data Sources & Gaps
- **Connected locally:** All 30 `Illyism/seo-skills` + `genppt` skill installed globally; 4 MCP servers (`aiseotracker`, `scribiz`, `awesome-tools`, `genppt`) configured across Claude Code, Codex, and Cursor; `ga4-sajda` MCP present in Claude Code.
- **Not yet connected (unlocks higher precision):**
  - Google Search Console export / API (needed for Page 2 -> Page 1 pushes and `/sajda/<locale>/` traffic pruning)
  - Ahrefs or DataForSEO credentials (needed for live SERP keyword volume, difficulty, and referring-domain gap analysis)
  - Browser OAuth completion for `aiseotracker` MCP (needed for live ChatGPT / Perplexity / Gemini / AI Overview citation scans)
