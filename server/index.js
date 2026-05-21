import 'dotenv/config'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkUrl } from './checkUrl.js'
import { hasDatabaseConfig, queryDb } from './db.js'

const app = express()
// Keep this file fairly thin; the heavier logic lives in the dedicated modules.
app.use(express.json({ limit: '32kb' }))
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// This helps when the app sits behind a proxy, which is pretty common once it is deployed.
app.set('trust proxy', true)

const port = Number(process.env.PORT || 5174)
const host = process.env.HOST || '0.0.0.0'

// When frontend and API are on different origins, this little CORS block stops the browser from getting in the way.
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

// The same link gets checked a lot, so a short in-memory cache saves hammering external services.
const cache = new Map()
const CACHE_TTL = 15 * 60 * 1000

// Try to collapse equivalent URLs down to one cache key so repeats actually hit the cache.
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

app.get('/api/help-locations', async (req, res) => {
  // Right now this endpoint only supports 4-digit postcodes, which keeps the SQL path nice and simple.
  const rawQuery = String(req.query?.query || '').trim()
  const venueType = String(req.query?.venueType || '').trim()
  const state = String(req.query?.state || '').trim().toUpperCase()

  if (!rawQuery) {
    return res.status(400).json({ ok: false, error: 'Please provide a 4-digit postcode.' })
  }

  if (!state) {
    return res.status(400).json({ ok: false, error: 'Please provide a state code.' })
  }

  if (!/^\d{4}$/.test(rawQuery)) {
    return res.status(400).json({ ok: false, error: 'Please provide a valid 4-digit postcode.' })
  }

  if (!hasDatabaseConfig) {
    return res.status(500).json({ ok: false, error: 'Database connection is not configured on the server.' })
  }

  const params = [rawQuery, state]
  // Do the obvious filtering in SQL first so the frontend does not have to trim a huge payload later.
  let sql = `
    SELECT
      id,
      name,
      venue_type,
      address,
      suburb,
      state,
      postcode,
      phone,
      website,
      opening_hours,
      latitude,
      longitude,
      source
    FROM help_locations
    WHERE UPPER(state) = $2
      AND CAST(postcode AS TEXT) = $1
  `

  if (venueType) {
    params.push(venueType)
    sql += ` AND venue_type = $${params.length}`
  }

  sql += `
    ORDER BY suburb, name
    LIMIT 200
  `

  try {
    const { rows } = await queryDb(sql, params)
    // Tidy the field names a bit before sending them back so the page code can stay cleaner.
    res.json({
      ok: true,
      results: rows.map((row) => ({
        id: row.id,
        name: row.name,
        venueType: row.venue_type,
        address: row.address,
        suburb: row.suburb,
        state: row.state,
        postcode: row.postcode == null ? null : String(row.postcode),
        phone: row.phone,
        website: row.website,
        hours: row.opening_hours,
        lat: row.latitude == null ? null : Number(row.latitude),
        lng: row.longitude == null ? null : Number(row.longitude),
        source: row.source,
      })),
    })
  } catch (err) {
    console.error('[/api/help-locations] Query failed:', err)
    res.status(500).json({ ok: false, error: 'Could not load help locations from the database.' })
  }
})

app.get('/api/help-venue-types', async (req, res) => {
  const state = String(req.query?.state || '').trim().toUpperCase()

  if (!state) {
    return res.status(400).json({ ok: false, error: 'Please provide a state code.' })
  }

  if (!hasDatabaseConfig) {
    return res.status(500).json({ ok: false, error: 'Database connection is not configured on the server.' })
  }

  try {
    // This endpoint really only does one job: list the venue types seen in that state for the filter UI.
    const { rows } = await queryDb(
      `
        SELECT DISTINCT venue_type
        FROM help_locations
        WHERE UPPER(state) = $1
          AND venue_type IS NOT NULL
          AND TRIM(venue_type) <> ''
        ORDER BY venue_type ASC
      `,
      [state],
    )

    res.json({
      ok: true,
      results: rows.map((row) => row.venue_type),
    })
  } catch (err) {
    console.error('[/api/help-venue-types] Query failed:', err)
    res.status(500).json({ ok: false, error: 'Could not load venue types from the database.' })
  }
})

app.post('/api/check-url', async (req, res) => {
  const rawUrl = req.body?.url
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ ok: false, error: 'Please paste a website address.' })
  }

  const cacheKey = normalizeCacheKey(rawUrl)
  if (cacheKey) {
    // If we just checked this link, hand back the cached result and skip the wait.
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)
  }

  try {
    // This route mostly handles request plumbing and caching; the real decision-making sits in checkUrl.
    const result = await checkUrl({ rawUrl })
    if (!result.ok) return res.status(400).json(result)
    setCached(result.normalizedUrl || cacheKey || rawUrl, result)
    res.json(result)
  } catch (err) {
    console.error('[/api/check-url] Unhandled error:', err)
    res.status(500).json({ ok: false, error: 'An unexpected error occurred. Please try again.' })
  }
})

const distDir = path.resolve(__dirname, '../dist')
const hasProdFrontend = fs.existsSync(path.join(distDir, 'index.html'))

if (process.env.NODE_ENV === 'production' && hasProdFrontend) {
  // In production we can serve the built frontend here too, but local dev is easier when they stay separate.
  app.use(express.static(distDir))
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(port, host, () => {
  const displayHost = host === '0.0.0.0' ? 'localhost' : host
  console.log(`Trusted Checker API listening on http://${displayHost}:${port}`)
  console.log('  Active APIs: Quad9 DNS, Cloudflare DNS, URLhaus, ThreatFox, PhishTank, OpenPhish, Google Safe Browsing, URLScan.io, Sucuri, SSLBL')
  console.log('  Note: Google Safe Browsing uses SAFE_BROWSING_API_KEY if set; otherwise it returns ERROR (not configured).')
  console.log('  Note: URLhaus/ThreatFox use ABUSECH_AUTH_KEY if set; otherwise they return ERROR (not configured).')
  if (process.env.NODE_ENV === 'production') {
    console.log(hasProdFrontend
      ? '  Frontend: serving built files from /dist'
      : '  Frontend: /dist not found (run npm run build to serve UI in production).')
  }
})
