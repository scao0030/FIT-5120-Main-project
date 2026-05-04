/**
 * apiSources.js – v3.2
 *
 * Most checks are free and require no API keys.
 * Google Safe Browsing uses SAFE_BROWSING_API_KEY if provided; otherwise it returns ERROR (not configured).
 * IPQS and VirusTotal removed (both require API keys).
 *
 * Sources (8 total):
 *  1.  Quad9 DNS
 *  2.  Cloudflare DNS
 *  3.  URLhaus (abuse.ch) [Auth-Key required]
 *  4.  ThreatFox (abuse.ch) [Auth-Key required]
 *  5.  PhishTank
 *  6.  OpenPhish
 *  7.  Google Safe Browsing (Official v4 API — key optional)
 *  8.  URLScan.io
 *  9.  Sucuri SiteCheck
 *  10. Abuse.ch SSL Blacklist
 */

import { safeBrowsingLookup } from './safeBrowsing.js'
import { Resolver } from 'node:dns/promises'

const TIMEOUT_MS = 10_000
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])
const CLOUDFLARE_DOH_ENDPOINTS = [
  'https://security.cloudflare-dns.com/dns-query',
  'https://cloudflare-dns.com/dns-query',
]
const URLHAUS_ENDPOINT = 'https://urlhaus-api.abuse.ch/v1/url/'
const THREATFOX_ENDPOINT = 'https://threatfox-api.abuse.ch/api/v1/'
const SSLBL_FEED_URL = 'https://sslbl.abuse.ch/blacklist/sslipblacklist.csv'
const SSLBL_CACHE_TTL_MS = 10 * 60 * 1000
const quad9Resolver = new Resolver()
quad9Resolver.setServers(['9.9.9.9', '149.112.112.112'])
const cloudflareResolver = new Resolver()
cloudflareResolver.setServers(['1.1.1.2', '1.0.0.2'])
const defaultResolver = new Resolver()
let sslblCache = { expiresAt: 0, ips: new Set() }

// Shared network helpers used by every threat-intel source adapter below.
function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms),
    ),
  ])
}

async function safeFetch(url, options = {}) {
  const attempts = Number.isFinite(options.attempts) ? Math.max(1, options.attempts) : 2
  const retryDelayMs = Number.isFinite(options.retryDelayMs) ? Math.max(0, options.retryDelayMs) : 250
  const { attempts: _attempts, retryDelayMs: _retryDelayMs, ...fetchOptions } = options

  let lastError = null
  for (let index = 0; index < attempts; index += 1) {
    try {
      // Many public feeds reject blank/default clients more aggressively than browser-like requests.
      const res = await fetch(url, {
        ...fetchOptions,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          ...(fetchOptions.headers || {}),
        },
      })
      const text = await res.text()
      let json = null
      // Some sources reply with plaintext feeds rather than JSON; callers can use whichever field fits.
      try { json = JSON.parse(text) } catch { /* non-JSON body is fine */ }

      // Retry transient gateway/rate-limit failures because several public feeds are flaky.
      if (!res.ok && RETRYABLE_STATUSES.has(res.status) && index + 1 < attempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (index + 1)))
        continue
      }

      if (!res.ok) console.error(`[API Error] ${url} → ${res.status}`)
      return { ok: res.ok, status: res.status, json, text }
    } catch (err) {
      lastError = err
      // Network failures get the same retry treatment as transient HTTP responses.
      if (index + 1 >= attempts) throw err
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (index + 1)))
    }
  }

  throw lastError || new Error('fetch failed')
}

function getHostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url }
}

function errResult(id, name, message) {
  return { id, name, verdict: 'ERROR', detail: message, confidence: 'LOW' }
}

function formatNetworkError(err) {
  if (!err) return 'unknown error'
  const code = err?.cause?.code || err?.code
  const name = err?.name && err.name !== 'Error' ? err.name : null
  const message = err?.message ? err.message : String(err)
  return [name, code, message].filter(Boolean).join(' ')
}

function getAbuseChAuthKey() {
  return String(process.env.ABUSECH_AUTH_KEY || '').trim()
}

function toPhishTankBool(value) {
  if (value === true || value === false) return value
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'y' || normalized === 'yes' || normalized === 'true' || normalized === '1'
}

async function loadSslblIpSet() {
  if (Date.now() < sslblCache.expiresAt && sslblCache.ips.size > 0) return sslblCache.ips

  // SSLBL is a CSV feed, so cache the parsed IP set in memory to avoid refetching it for every request.
  const { ok, status, text } = await withTimeout(
    safeFetch(SSLBL_FEED_URL, { attempts: 2, retryDelayMs: 350 }),
    10_000,
  )
  if (!ok) throw new Error(`HTTP ${status}`)

  const ips = new Set()
  for (const line of String(text || '').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const first = trimmed.split(',')[0]?.trim()
    if (first) ips.add(first)
  }

  sslblCache = { expiresAt: Date.now() + SSLBL_CACHE_TTL_MS, ips }
  return ips
}

// Each check function returns a normalized { id, name, verdict, detail, confidence } shape.
export async function checkQuad9({ url }) {
  const id = 'quad9', name = 'Quad9 DNS'
  try {
    const hostname = getHostname(url)

    try {
      // A successful DNS answer from a security resolver is treated as a positive signal.
      const answers = await withTimeout(quad9Resolver.resolve4(hostname), 6000)
      if (Array.isArray(answers) && answers.length > 0) {
        return { id, name, verdict: 'SAFE', confidence: 'HIGH', detail: 'Domain resolves normally through Quad9 resolver and is not blocked.' }
      }
      return { id, name, verdict: 'SUSPICIOUS', confidence: 'LOW', detail: 'Quad9 resolver returned no A records.' }
    } catch (resolverErr) {
      if (resolverErr?.code === 'ENOTFOUND' || resolverErr?.code === 'ENODATA') {
        return { id, name, verdict: 'UNSAFE', confidence: 'MEDIUM', detail: 'Domain does not resolve in Quad9 resolver (NXDOMAIN/NOERROR-NODATA).' }
      }
      return errResult(id, name, `Could not reach Quad9 resolver: ${formatNetworkError(resolverErr)}`)
    }
  } catch (err) {
    return errResult(id, name, `Could not reach Quad9 resolver: ${formatNetworkError(err)}`)
  }
}

// ─── 2. Cloudflare DNS ───────────────────────────────────────────────────────
export async function checkCloudflareDNS({ url }) {
  const id = 'cloudflare_dns', name = 'Cloudflare DNS'
  try {
    const hostname = getHostname(url)
    let lastDoHError = null
    for (const endpoint of CLOUDFLARE_DOH_ENDPOINTS) {
      try {
        // Prefer DNS-over-HTTPS first because Cloudflare can expose richer block semantics there.
        const { ok, json, status } = await withTimeout(
          safeFetch(
            `${endpoint}?name=${encodeURIComponent(hostname)}&type=A`,
            { headers: { Accept: 'application/dns-json' } },
          ),
        )
        if (!ok) {
          lastDoHError = `HTTP ${status} from ${endpoint}`
          continue
        }

        if (json?.Status === 5) {
          return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', detail: 'Blocked by Cloudflare security DNS.' }
        }
        if (json?.Status === 3) {
          return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', detail: 'Domain does not resolve in Cloudflare DNS (NXDOMAIN).' }
        }
        if (json?.Status === 0 && Array.isArray(json?.Answer) && json.Answer.length > 0) {
          return { id, name, verdict: 'SAFE', confidence: 'HIGH', detail: 'Domain resolves normally through Cloudflare security DNS.' }
        }

        return { id, name, verdict: 'SUSPICIOUS', confidence: 'MEDIUM', detail: 'Cloudflare DNS returned an ambiguous result for this domain.' }
      } catch (err) {
        lastDoHError = formatNetworkError(err)
      }
    }

    try {
      // If DoH is unavailable, fall back to direct resolver queries instead of failing the whole source.
      const answers = await withTimeout(cloudflareResolver.resolve4(hostname), 6000)
      if (Array.isArray(answers) && answers.length > 0) {
        return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', detail: 'Domain resolves via Cloudflare resolver fallback and is not blocked.' }
      }
      return { id, name, verdict: 'SUSPICIOUS', confidence: 'LOW', detail: 'Cloudflare resolver returned no A records.' }
    } catch (resolverErr) {
      if (resolverErr?.code === 'ENOTFOUND' || resolverErr?.code === 'ENODATA') {
        return { id, name, verdict: 'UNSAFE', confidence: 'MEDIUM', detail: 'Domain does not resolve in Cloudflare resolver (NXDOMAIN/NOERROR-NODATA).' }
      }
      const reason = `DoH failed (${lastDoHError || 'unknown'}), resolver failed (${formatNetworkError(resolverErr)})`
      return errResult(id, name, `Could not reach Cloudflare DNS: ${reason}`)
    }
  } catch (err) {
    return errResult(id, name, `Could not reach Cloudflare DNS: ${formatNetworkError(err)}`)
  }
}

// ─── 3. URLhaus (abuse.ch) ───────────────────────────────────────────────────
export async function checkURLhaus({ url }) {
  const id = 'urlhaus', name = 'URLhaus (abuse.ch)'
  try {
    const authKey = getAbuseChAuthKey()
    if (!authKey) {
      // Missing credentials are surfaced as ERROR so the caller can apply strict policy consistently.
      return errResult(id, name, 'ABUSECH_AUTH_KEY not set — URLhaus check cannot run.')
    }

    const body = new URLSearchParams({ url })
    const { ok, json, status } = await withTimeout(
      safeFetch(URLHAUS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Auth-Key': authKey,
        },
        body: body.toString(),
      }),
      10_000,
    )

    if (!ok) {
      if (status === 401 || status === 403) {
        return errResult(id, name, `URLhaus authentication failed (HTTP ${status}).`)
      }
      if (status === 404 || status === 410) {
        return errResult(id, name, `URLhaus endpoint unavailable (HTTP ${status}).`)
      }
      return errResult(id, name, `URLhaus returned an HTTP error (${status}).`)
    }

    if (json?.query_status === 'ok' || json?.query_status === 'is_listed' || json?.query_status === 'is_host') {
      if (json?.url_status === 'online') {
        return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', detail: 'Listed as actively malicious in URLhaus database.' }
      }
      return { id, name, verdict: 'SUSPICIOUS', confidence: 'MEDIUM', detail: 'Previously listed in URLhaus (currently offline/unknown).' }
    }
    if (json?.query_status === 'no_results') {
      return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', detail: 'Not found in the URLhaus database.' }
    }

    return errResult(id, name, `Unexpected URLhaus response: ${json?.query_status || 'unknown'}`)
  } catch (err) {
    return errResult(id, name, `Could not reach URLhaus: ${formatNetworkError(err)}`)
  }
}

// ─── 4. ThreatFox (abuse.ch) ─────────────────────────────────────────────────
export async function checkThreatFox({ url }) {
  const id = 'threatfox', name = 'ThreatFox (abuse.ch)'
  try {
    const authKey = getAbuseChAuthKey()
    if (!authKey) {
      return errResult(id, name, 'ABUSECH_AUTH_KEY not set — ThreatFox check cannot run.')
    }

    const hostname = getHostname(url)
    // ThreatFox is queried by hostname/IOC rather than full URL, so normalize accordingly.
    const { ok, json, status } = await withTimeout(
      safeFetch(THREATFOX_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Auth-Key': authKey,
        },
        body: JSON.stringify({ query: 'search_ioc', search_term: hostname, exact_match: true }),
      }),
      10_000,
    )

    if (!ok) {
      if (status === 401 || status === 403) {
        return errResult(id, name, `ThreatFox authentication failed (HTTP ${status}).`)
      }
      if (status === 404 || status === 410) {
        return errResult(id, name, `ThreatFox endpoint unavailable (HTTP ${status}).`)
      }
      return errResult(id, name, `ThreatFox returned an HTTP error (${status}).`)
    }

    if (json?.query_status === 'ok' && Array.isArray(json?.data) && json.data.length > 0) {
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', detail: `Domain associated with ${json.data[0].malware_printable || 'malware'} in ThreatFox.` }
    }
    if (json?.query_status === 'no_result') {
      return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', detail: 'Domain not found in ThreatFox.' }
    }

    return errResult(id, name, `Unexpected ThreatFox response: ${json?.query_status || 'unknown'}`)
  } catch (err) {
    return errResult(id, name, `Could not reach ThreatFox: ${formatNetworkError(err)}`)
  }
}

// ─── 5. PhishTank ────────────────────────────────────────────────────────────
export async function checkPhishTank({ url }) {
  const id = 'phishtank', name = 'PhishTank'
  try {
    const body = new URLSearchParams({ url, format: 'json' })
    const appKey = String(process.env.PHISHTANK_APP_KEY || '').trim()
    if (appKey) body.set('app_key', appKey)

    const { ok, json } = await withTimeout(
      safeFetch('http://checkurl.phishtank.com/checkurl/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': process.env.PHISHTANK_USER_AGENT || 'phishtank/fit5120-trusted-checker',
        },
        body: body.toString(),
      }),
    )
    if (!ok) return errResult(id, name, 'PhishTank returned an HTTP error.')

    const r = json?.results
    // PhishTank mixes booleans and string flags in its response; normalize before branching.
    const inDatabase = toPhishTankBool(r?.in_database)
    const verified = toPhishTankBool(r?.verified)
    const valid = toPhishTankBool(r?.valid)

    if (!inDatabase) {
      return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', detail: 'Not found in PhishTank.' }
    }

    if (verified && valid) {
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', detail: 'Verified phishing site in the PhishTank database.' }
    }

    if (verified && !valid) {
      return {
        id,
        name,
        verdict: 'SAFE',
        confidence: 'HIGH',
        detail: 'Verified by PhishTank as not a phishing site.',
      }
    }

    return {
      id,
      name,
      verdict: 'SUSPICIOUS',
      confidence: 'LOW',
      detail: 'Listed in PhishTank but not yet verified by the community.',
    }
  } catch (err) {
    return errResult(id, name, `Could not reach PhishTank: ${formatNetworkError(err)}`)
  }
}

// ─── 6. OpenPhish ────────────────────────────────────────────────────────────
export async function checkOpenPhish({ url }) {
  const id = 'openphish', name = 'OpenPhish'
  try {
    const { ok, text } = await withTimeout(safeFetch('https://openphish.com/feed.txt'))
    if (!ok) return errResult(id, name, 'Could not fetch OpenPhish feed.')

    // The feed is line-oriented plaintext, so exact normalized URL matching is enough here.
    const normalised = url.toLowerCase().replace(/\/$/, '')
    const match = (text || '').split('\n').some(
      (line) => line.trim().toLowerCase().replace(/\/$/, '') === normalised,
    )
    return {
      id, name,
      verdict: match ? 'UNSAFE' : 'SAFE',
      confidence: match ? 'HIGH' : 'MEDIUM',
      detail: match ? 'Appears in the OpenPhish active phishing feed.' : 'Not found in OpenPhish feed.',
    }
  } catch (err) {
    return errResult(id, name, `Could not reach OpenPhish: ${formatNetworkError(err)}`)
  }
}

// ─── 7. Google Safe Browsing (Official v4 API — key optional) ────────────────
export async function checkGoogleSafeBrowsing({ url }) {
  const id = 'google_safe_browsing', name = 'Google Safe Browsing'
  try {
    const apiKey = process.env.SAFE_BROWSING_API_KEY
    if (!apiKey) {
      return errResult(id, name, 'SAFE_BROWSING_API_KEY not set — Safe Browsing check cannot run.')
    }

    const lookup = await withTimeout(
      safeBrowsingLookup({ apiKey, url, timeoutMs: 6_000 }),
      7_000,
    )

    if (!lookup?.ok) return errResult(id, name, lookup?.error || 'Safe Browsing lookup failed.')

    const matches = Array.isArray(lookup.matches) ? lookup.matches : []
    if (matches.length > 0) {
      // Multiple match rows may map to the same user-facing warning, so collapse threat types.
      const threatTypes = Array.from(new Set(matches.map((m) => m?.threatType).filter(Boolean)))
      const extra = threatTypes.length ? ` Threat types: ${threatTypes.join(', ')}.` : ''
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', detail: `Flagged as dangerous by Google Safe Browsing.${extra}` }
    }

    return { id, name, verdict: 'SAFE', confidence: 'HIGH', detail: "No threats found in Google's Safe Browsing database." }
  } catch (err) {
    return errResult(id, name, `Could not reach Google Safe Browsing: ${formatNetworkError(err)}`)
  }
}

// ─── 8. URLScan.io ───────────────────────────────────────────────────────────
export async function checkURLScan({ url }) {
  const id = 'urlscan', name = 'URLScan.io'
  try {
    const q = encodeURIComponent(`page.url:"${url}"`)
    const { ok, json } = await withTimeout(
      safeFetch(`https://urlscan.io/api/v1/search/?q=${q}&size=1`),
    )
    if (!ok) return errResult(id, name, 'URLScan.io returned an error.')

    const verdict = json?.results?.[0]?.verdicts?.overall
    // URLScan is historical rather than authoritative: no result means "no history", not guaranteed safety.
    if (verdict?.malicious)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', detail: 'Detected as malicious in a prior URLScan.' }

    if (!json?.results?.length)
      return { id, name, verdict: 'SAFE', confidence: 'LOW', detail: 'No prior scans found in URLScan.io — cannot confirm history.' }

    return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', detail: 'No malicious verdicts found in URLScan.io.' }
  } catch (err) {
    return errResult(id, name, `Could not reach URLScan.io: ${formatNetworkError(err)}`)
  }
}

// ─── 9. Sucuri SiteCheck ─────────────────────────────────────────────────────
export async function checkSucuri({ url }) {
  const id = 'sucuri', name = 'Sucuri SiteCheck'
  try {
    const { ok, json } = await withTimeout(
      safeFetch(`https://sitecheck.sucuri.net/api/v3/?scan=${encodeURIComponent(url)}`),
    )
    if (!ok) return errResult(id, name, 'Sucuri returned an error.')

    // Either blacklisting or malware indicators are enough for a hard negative result.
    const blacklisted = Object.values(json?.blacklists || {}).some((v) => v?.listed)
    if (blacklisted || (Array.isArray(json?.malware) && json.malware.length > 0))
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', detail: 'Sucuri detected malware or blacklisting.' }

    return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', detail: 'No malware found by Sucuri.' }
  } catch (err) {
    return errResult(id, name, `Could not reach Sucuri: ${formatNetworkError(err)}`)
  }
}

// ─── 10. Abuse.ch SSL Blacklist ───────────────────────────────────────────────
export async function checkSSLBL({ url }) {
  const id = 'sslbl', name = 'Abuse.ch SSL Blacklist'
  try {
    const hostname = getHostname(url)
    // This source works at the IP layer: resolve the host first, then compare against the cached blacklist.
    const [ips, listedIps] = await Promise.all([
      withTimeout(defaultResolver.resolve4(hostname), 6000),
      loadSslblIpSet(),
    ])
    const matches = ips.filter((ip) => listedIps.has(ip))
    if (matches.length > 0) {
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', detail: `Resolved IP appears in SSLBL feed: ${matches.join(', ')}` }
    }
    return { id, name, verdict: 'SAFE', confidence: 'LOW', detail: 'No matching resolved IPs were found in SSLBL feed.' }
  } catch (err) {
    return errResult(id, name, `Could not evaluate SSLBL feed: ${formatNetworkError(err)}`)
  }
}

// ─── Run all sources ──────────────────────────────────────────────────────────
export async function runAllSources({ url }) {
  // Run independent sources in parallel so the user waits for the slowest single feed, not the sum.
  const checks = [
    { fn: checkQuad9,              id: 'quad9',               name: 'Quad9 DNS' },
    { fn: checkCloudflareDNS,      id: 'cloudflare_dns',      name: 'Cloudflare DNS' },
    { fn: checkURLhaus,            id: 'urlhaus',             name: 'URLhaus (abuse.ch)' },
    { fn: checkThreatFox,          id: 'threatfox',           name: 'ThreatFox (abuse.ch)' },
    { fn: checkPhishTank,          id: 'phishtank',           name: 'PhishTank' },
    { fn: checkOpenPhish,          id: 'openphish',           name: 'OpenPhish' },
    { fn: checkGoogleSafeBrowsing, id: 'google_safe_browsing',name: 'Google Safe Browsing' },
    { fn: checkURLScan,            id: 'urlscan',             name: 'URLScan.io' },
    { fn: checkSucuri,             id: 'sucuri',              name: 'Sucuri SiteCheck' },
    { fn: checkSSLBL,              id: 'sslbl',               name: 'Abuse.ch SSL Blacklist' },
  ]

  const settled = await Promise.allSettled(
    checks.map(({ fn }) => fn({ url })),
  )

  const results = settled.map((r, i) => {
    // Promise.allSettled preserves one failed source without discarding all the successful ones.
    if (r.status === 'fulfilled') return { ...r.value, id: checks[i].id, name: checks[i].name }
    return {
      id: checks[i].id, name: checks[i].name,
      verdict: 'ERROR',
      detail: `Unexpected error: ${r.reason?.message || 'unknown'}`,
      confidence: 'LOW',
    }
  })

  return { results }
}
