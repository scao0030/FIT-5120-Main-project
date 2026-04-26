import 'dotenv/config'
import express from 'express'
import { checkUrl } from './checkUrl.js'

const app = express()
app.use(express.json({ limit: '32kb' }))

// Useful when running behind a reverse proxy / load balancer (common on AWS).
app.set('trust proxy', true)

const port = Number(process.env.PORT || 5174)
const host = process.env.HOST || '0.0.0.0'

// Optional CORS (only needed if your frontend and API are on different origins)
// Examples:
//   CORS_ORIGIN=http://localhost:5173
//   CORS_ORIGIN=https://your-frontend.example.com
//   CORS_ORIGIN=*
const corsOrigin = process.env.CORS_ORIGIN
if (corsOrigin) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (corsOrigin === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*')
    } else {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin)
      res.setHeader('Vary', 'Origin')
    }

    if (req.method === 'OPTIONS') return res.status(204).end()
    next()
  })
}

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

app.listen(port, host, () => {
  const displayHost = host === '0.0.0.0' ? 'localhost' : host
  console.log(`Trusted Checker API listening on http://${displayHost}:${port}`)
  console.log('  Active APIs: Quad9 DNS, Cloudflare DNS, URLhaus, ThreatFox, PhishTank, OpenPhish, Google Safe Browsing, URLScan.io, Sucuri, SSLBL')
  console.log('  Note: Google Safe Browsing uses SAFE_BROWSING_API_KEY if set; otherwise it returns ERROR (not configured).')
  console.log('  Note: URLhaus/ThreatFox use ABUSECH_AUTH_KEY if set; otherwise they return ERROR (not configured).')
})
