import 'dotenv/config'
import express from 'express'
import { checkUrl } from './checkUrl.js'

const app = express()
app.use(express.json({ limit: '32kb' }))

const port = Number(process.env.PORT || 5174)
const apiKey = process.env.SAFE_BROWSING_API_KEY || ''

// In-memory cache to reduce API usage (URL -> { expiresAt, payload })
const cache = new Map()
const cacheTtlMs = 15 * 60 * 1000

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

function getCached(url) {
  const entry = cache.get(url)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(url)
    return null
  }
  return entry.payload
}

function setCached(url, payload) {
  cache.set(url, { expiresAt: Date.now() + cacheTtlMs, payload })
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/api/check-url', async (req, res) => {
  const rawUrl = req.body?.url
  if (!rawUrl || typeof rawUrl !== 'string') {
    res.status(400).json({ ok: false, error: 'Please paste a website address.' })
    return
  }

  const cacheKey = normalizeCacheKey(rawUrl)
  if (cacheKey) {
    const cached = getCached(cacheKey)
    if (cached) {
      res.json(cached)
      return
    }
  }

  const result = await checkUrl({ rawUrl, safeBrowsingApiKey: apiKey })
  if (!result.ok) {
    res.status(400).json(result)
    return
  }

  // Cache only successful checks; keep it short-lived.
  setCached(result.normalizedUrl || cacheKey || rawUrl, result)
  res.json(result)
})

app.listen(port, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`Trusted Checker API listening on http://127.0.0.1:${port}`)
})
