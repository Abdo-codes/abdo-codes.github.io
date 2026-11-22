#!/usr/bin/env node
// Adapted from Illyism/seo-skills (internal-linking) for static HTML sites.
// Usage: SITE=https://yoloabdo.com node scripts/internal-link-graph.mjs > seo/internal-link-graph.json
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SITE = (process.env.SITE ?? 'https://yoloabdo.com').replace(/\/+$/, '')
const SKIP_DIRS = new Set(['.git', '.claude', 'node_modules', 'seo', 'scripts', 'vendor', 'assets', 'images', 'media'])

const MONEY_ROUTES = new Set([
  '/apps/',
  '/sajda/',
  '/tally/',
  '/capybara-rush/',
  '/wifi-qr/',
  '/wifi-qr/generator/',
  '/wifi-qr/airbnb-wifi-sign/',
  '/wifi-qr/vs-canva-etsy/',
  '/tateemi/',
  '/tateemi/en/',
  '/baba-abdo/',
  '/baba-abdo/en/',
  '/hona-elqahra/',
  '/hona-elqahra/ar/',
  '/angry-nona/',
  '/angry-nona/ar/',
  '/colortalk/',
  '/swingcoach/',
  '/nightcap-awake/',
  '/nightcap-awake/vs-amphetamine/',
  '/surfing/',
  '/drive-town/',
  '/drive-town/guide/',
])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

function routeOf(file) {
  const rel = relative(ROOT, file).split(sep).join('/')
  if (rel === 'index.html') return '/'
  if (rel === '404.html') return null
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length)
  return '/' + rel
}

function normalizeHref(href, currentRoute) {
  let clean = href.trim()
  if (!clean || clean.startsWith('#') || clean.startsWith('mailto:') || clean.startsWith('tel:') || clean.startsWith('javascript:')) return null
  if (clean.startsWith(SITE)) clean = clean.slice(SITE.length) || '/'
  if (/^https?:\/\//i.test(clean) || clean.startsWith('//')) return null
  clean = clean.split('#')[0].split('?')[0]
  if (!clean) return null
  if (!clean.startsWith('/')) {
    const baseDir = currentRoute.endsWith('/') ? currentRoute : currentRoute.replace(/[^/]+$/, '')
    const parts = (baseDir + clean).split('/')
    const stack = []
    for (const p of parts) {
      if (!p || p === '.') continue
      if (p === '..') stack.pop()
      else stack.push(p)
    }
    clean = '/' + stack.join('/')
    if (href.split('#')[0].split('?')[0].endsWith('/') && !clean.endsWith('/')) clean += '/'
  }
  return clean
}

function stripChrome(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '')
}

function extractLinks(html, currentRoute) {
  const links = []
  const re = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const target = normalizeHref(m[1], currentRoute)
    if (!target) continue
    const anchor = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    links.push({ target, anchor, offset: m.index })
  }
  return links
}

const files = walk(ROOT).sort()
const routeToFile = new Map()
for (const file of files) {
  const route = routeOf(file)
  if (route) routeToFile.set(route, relative(ROOT, file).split(sep).join('/'))
}

const inbound = new Map()
const anchorsByTarget = new Map()
const blogUpper40 = []

for (const file of files) {
  const route = routeOf(file)
  if (!route) continue
  const raw = readFileSync(file, 'utf8')
  const bodyOnly = stripChrome(raw)
  const links = extractLinks(bodyOnly, route)

  for (const { target, anchor } of links) {
    let resolved = target
    if (!routeToFile.has(resolved) && routeToFile.has(resolved + '/')) resolved += '/'
    if (resolved === route || !routeToFile.has(resolved)) continue
    if (!inbound.has(resolved)) inbound.set(resolved, new Set())
    inbound.get(resolved).add(route)
    if (!anchorsByTarget.has(resolved)) anchorsByTarget.set(resolved, [])
    anchorsByTarget.get(resolved).push({ from: route, anchor })
  }

  if (route.startsWith('/blog/') && route !== '/blog/') {
    const artMatch = raw.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
    const artBody = stripChrome(artMatch ? artMatch[1] : raw)
    const artLinks = extractLinks(artBody, route)
    let firstMoney = null
    for (const l of artLinks) {
      let resolved = l.target
      if (!routeToFile.has(resolved) && routeToFile.has(resolved + '/')) resolved += '/'
      if (MONEY_ROUTES.has(resolved)) {
        firstMoney = { target: resolved, pct: Math.round((l.offset / Math.max(1, artBody.length)) * 100) }
        break
      }
    }
    blogUpper40.push({
      route,
      firstMoneyTarget: firstMoney?.target ?? null,
      firstMoneyPct: firstMoney?.pct ?? null,
      passUpper40: firstMoney !== null && firstMoney.pct <= 40,
    })
  }
}

const rows = [...routeToFile.entries()].map(([route, file]) => {
  const from = [...(inbound.get(route) ?? [])].sort()
  const blogFrom = from.filter((r) => r.startsWith('/blog/') && r !== '/blog/')
  const distinctAnchors = new Set((anchorsByTarget.get(route) ?? []).map((x) => x.anchor.toLowerCase()).filter(Boolean))
  return {
    route,
    file,
    money: MONEY_ROUTES.has(route),
    contextualInbound: from.length,
    blogInbound: blogFrom.length,
    distinctAnchors: distinctAnchors.size,
    linkedFrom: from,
  }
}).sort((a, b) => a.contextualInbound - b.contextualInbound || a.route.localeCompare(b.route))

const orphanMoneyPages = rows.filter((r) => r.money && r.contextualInbound < 3).map((r) => r.route)
const lateOrMissingBlogLinks = blogUpper40.filter((b) => !b.passUpper40)

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalPages: rows.length,
  moneyPagesCount: MONEY_ROUTES.size,
  orphanMoneyPages,
  lateOrMissingBlogLinksCount: lateOrMissingBlogLinks.length,
  lateOrMissingBlogLinks,
  moneyPages: rows.filter((r) => r.money),
  pages: rows,
}, null, 2))
