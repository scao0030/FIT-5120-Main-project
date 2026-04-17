import 'dotenv/config'
import express from 'express'
import { checkUrl } from './checkUrl.js'

const app = express()
app.use(express.json({ limit: '32kb' }))

const port = Number(process.env.PORT || 5174)

// In-memory cache (15 min TTL)
const cache = new Map()
const CACHE_TTL = 15 * 60 * 1000

function normalizeCacheKey(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null }
  return entry.payload
}

function setCached(key, payload) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL, payload })
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/check-url', async (req, res) => {
  const rawUrl = req.body?.url
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ ok: false, error: 'Please paste a website address.' })
  }

  const cacheKey = normalizeCacheKey(rawUrl)
  if (cacheKey) {
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)
  }

  try {
    const result = await checkUrl({ rawUrl })
    if (!result.ok) return res.status(400).json(result)
    setCached(result.normalizedUrl || cacheKey || rawUrl, result)
    res.json(result)
  } catch (err) {
    console.error('[/api/check-url] Unhandled error:', err)
    res.status(500).json({ ok: false, error: 'An unexpected error occurred. Please try again.' })
  }
})

app.listen(port, '127.0.0.1', () => {
  console.log(`Trusted Checker API listening on http://127.0.0.1:${port}`)
  console.log('  Active APIs: Quad9 DNS, Cloudflare DNS, URLhaus, ThreatFox, PhishTank, OpenPhish, Google Safe Browsing, URLScan.io, Sucuri, SSLBL')
  console.log('  No API keys required.')
})
