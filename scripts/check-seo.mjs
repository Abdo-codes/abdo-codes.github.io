#!/usr/bin/env node
// Automated SEO gatekeeper for yoloabdo.com.
// Run before any push/PR: node scripts/check-seo.mjs
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SITE = 'https://yoloabdo.com'
const SKIP = new Set(['.git', '.claude', 'node_modules', 'seo', 'scripts', 'vendor', 'assets', 'images', 'media'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || SKIP.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

function routeOf(file) {
  const rel = relative(ROOT, file).split(sep).join('/')
  if (rel === 'index.html') return '/'
  if (rel === '404.html') return '/404.html'
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length)
  return '/' + rel
}

// 1. Parse sitemap.xml
const smXml = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8')
const sitemap = new Map()
for (const block of smXml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const locM = block[1].match(/<loc>([^<]+)<\/loc>/)
  if (!locM) continue
  const route = locM[1].trim().replace(SITE, '') || '/'
  const links = new Set()
  for (const lm of block[1].matchAll(/<xhtml:link[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g)) {
    links.add(`${lm[1]}|${lm[2]}`)
  }
  sitemap.set(route, links)
}

const files = walk(ROOT).sort()
const routes = new Set(files.map(routeOf))
const errors = []
const warnings = []

for (const file of files) {
  const route = routeOf(file)
  const raw = readFileSync(file, 'utf8')

  if (!/<\/head>/i.test(raw)) errors.push(`Missing </head>: ${route}`)
  if (!/<\/html>/i.test(raw)) errors.push(`Missing </html>: ${route}`)
  if (route === '/404.html') continue

  const isNoindex = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(raw)
  if (!isNoindex && !sitemap.has(route)) errors.push(`Indexable page missing from sitemap.xml: ${route}`)

  // Canonical
  const canM = raw.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
  if (!isNoindex && (!canM || canM[1] !== SITE + route)) {
    errors.push(`Canonical mismatch on ${route}: got ${canM ? canM[1] : 'NONE'}`)
  }

  // Single H1
  const h1Count = (raw.match(/<h1\b/gi) || []).length
  if (h1Count !== 1) errors.push(`Expected 1 <h1> on ${route}, found ${h1Count}`)

  // JSON-LD validity
  for (const m of raw.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(m[1])
    } catch (e) {
      errors.push(`Invalid JSON-LD on ${route}: ${e.message}`)
    }
  }

  // Hreflang HTML vs sitemap sync
  const htmlHl = new Set()
  for (const m of raw.matchAll(/<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["']/gi)) {
    htmlHl.add(`${m[1]}|${m[2]}`)
  }
  if (htmlHl.size > 0 && sitemap.has(route)) {
    const smHl = sitemap.get(route)
    if (htmlHl.size !== smHl.size || [...htmlHl].some((x) => !smHl.has(x))) {
      errors.push(`HTML vs sitemap.xml hreflang mismatch on ${route}`)
    }
  }

  // Broken root-relative internal links
  for (const m of raw.matchAll(/href=["'](\/[^"'#?\s]*)/gi)) {
    const href = m[1]
    if (href.startsWith('//')) continue
    const fsPath = join(ROOT, href.slice(1))
    if (!routes.has(href) && !routes.has(href + '/') && !existsSync(fsPath)) {
      errors.push(`Broken internal link on ${route} -> ${href}`)
    }
  }
}

for (const smRoute of sitemap.keys()) {
  if (!routes.has(smRoute)) errors.push(`Sitemap URL missing on disk: ${smRoute}`)
}

// 2. Run internal link graph checks
const graphOut = execFileSync(process.execPath, [join(ROOT, 'scripts/internal-link-graph.mjs')], {
  env: { ...process.env, SITE },
  encoding: 'utf8',
})
const graph = JSON.parse(graphOut)
if (graph.lateOrMissingBlogLinksCount > 0) {
  errors.push(`${graph.lateOrMissingBlogLinksCount} blog posts fail upper-40% money-link rule`)
}
if (graph.orphanMoneyPages.length > 0) {
  warnings.push(`Remaining orphan money pages (<3 contextual body links): ${graph.orphanMoneyPages.join(', ')}`)
}

console.log(`Checked ${files.length} HTML pages, ${sitemap.size} sitemap URLs, ${graph.moneyPagesCount} money pages.`)
if (warnings.length) {
  console.log('Warnings:')
  for (const w of warnings) console.log('  -', w)
}
if (errors.length) {
  console.error('SEO CHECK FAILED:')
  for (const e of errors) console.error('  -', e)
  process.exit(1)
}
console.log('SEO CHECK PASSED (0 errors).')
