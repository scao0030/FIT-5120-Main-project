/**
 * apiSources.js – v3.1
 *
 * All checks are free and require no API keys.
 * IPQS and VirusTotal removed (both require API keys).
 *
 * Sources (10 total):
 *  1.  Quad9 DNS
 *  2.  Cloudflare DNS
 *  3.  URLhaus (abuse.ch)
 *  4.  ThreatFox (abuse.ch)
 *  5.  PhishTank
 *  6.  OpenPhish
 *  7.  Google Safe Browsing (Transparency Report — no key needed)
 *  8.  URLScan.io
 *  9.  Sucuri SiteCheck
 *  10. Abuse.ch SSL Blacklist
 */

const TIMEOUT_MS = 10_000

// ─── Whitelist ───────────────────────────────────────────────────────────────
const REPUTABLE_DOMAINS = [
  'google.com', 'google.com.au', 'youtube.com', 'microsoft.com',
  'apple.com', 'amazon.com', 'facebook.com', 'instagram.com',
  'linkedin.com', 'netflix.com', 'gov.au', 'edu.au',
  'outlook.com', 'gmail.com', 'icloud.com',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms),
    ),
  ])
}

async function safeFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* non-JSON body is fine */ }
  if (!res.ok) console.error(`[API Error] ${url} → ${res.status}`)
  return { ok: res.ok, status: res.status, json, text }
}

function getHostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url }
}

function errResult(id, name, message) {
  return { id, name, verdict: 'ERROR', detail: message, confidence: 'LOW', skipped: false }
}

// ─── 1. Quad9 DNS ────────────────────────────────────────────────────────────
export async function checkQuad9({ url }) {
  const id = 'quad9', name = 'Quad9 DNS'
  try {
    const hostname = getHostname(url)
    const { ok, json } = await withTimeout(
      safeFetch(
        `https://dns9.quad9.net/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
        { headers: { Accept: 'application/dns-json' } },
      ),
    )
    if (!ok) return errResult(id, name, 'Quad9 DNS check returned an error.')

    if (json?.Status === 5)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Actively blocked by Quad9 DNS threat protection.' }
    if (json?.Status === 3)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Domain does not exist in DNS (NXDOMAIN) — likely a fake or inactive site.' }
    if (json?.Status === 0 && Array.isArray(json?.Answer) && json.Answer.length > 0)
      return { id, name, verdict: 'SAFE', confidence: 'HIGH', skipped: false, detail: 'Domain resolves normally and is not blocked by Quad9.' }

    return { id, name, verdict: 'SUSPICIOUS', confidence: 'MEDIUM', skipped: false, detail: 'Quad9 DNS returned an ambiguous result for this domain.' }
  } catch (err) {
    return errResult(id, name, `Could not reach Quad9: ${err.message}`)
  }
}

// ─── 2. Cloudflare DNS ───────────────────────────────────────────────────────
export async function checkCloudflareDNS({ url }) {
  const id = 'cloudflare_dns', name = 'Cloudflare DNS'
  try {
    const hostname = getHostname(url)
    const { ok, json } = await withTimeout(
      safeFetch(
        `https://security.cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
        { headers: { Accept: 'application/dns-json' } },
      ),
    )
    if (!ok) return errResult(id, name, 'Cloudflare DNS check returned an error.')

    if (json?.Status === 5)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Blocked by Cloudflare security DNS.' }
    if (json?.Status === 3)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Domain does not exist in DNS (NXDOMAIN) — likely a fake or inactive site.' }
    if (json?.Status === 0 && Array.isArray(json?.Answer) && json.Answer.length > 0)
      return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', skipped: false, detail: 'Domain resolves normally through Cloudflare security DNS.' }

    return { id, name, verdict: 'SUSPICIOUS', confidence: 'MEDIUM', skipped: false, detail: 'Cloudflare DNS returned an ambiguous result for this domain.' }
  } catch (err) {
    return errResult(id, name, `Could not reach Cloudflare DNS: ${err.message}`)
  }
}

// ─── 3. URLhaus (abuse.ch) ───────────────────────────────────────────────────
export async function checkURLhaus({ url }) {
  const id = 'urlhaus', name = 'URLhaus (abuse.ch)'
  try {
    const body = new URLSearchParams({ url })
    const { ok, json } = await withTimeout(
      safeFetch('https://urlhaus-api.abuse.ch/v1/url/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      }),
    )
    if (!ok) return errResult(id, name, 'URLhaus returned an HTTP error.')

    if (json?.query_status === 'is_host') {
      if (json?.url_status === 'online')
        return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Listed as actively malicious in URLhaus database.' }
      return { id, name, verdict: 'SUSPICIOUS', confidence: 'MEDIUM', skipped: false, detail: 'Previously reported as malicious in URLhaus.' }
    }
    if (json?.query_status === 'no_results')
      return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', skipped: false, detail: 'Not found in the URLhaus database.' }

    return errResult(id, name, `Unexpected URLhaus response: ${json?.query_status}`)
  } catch (err) {
    return errResult(id, name, `Could not reach URLhaus: ${err.message}`)
  }
}

// ─── 4. ThreatFox (abuse.ch) ─────────────────────────────────────────────────
export async function checkThreatFox({ url }) {
  const id = 'threatfox', name = 'ThreatFox (abuse.ch)'
  try {
    const hostname = getHostname(url)
    const { ok, json } = await withTimeout(
      safeFetch('https://threatfox-api.abuse.ch/api/v1/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'search_ioc', search_term: hostname }),
      }),
    )
    if (!ok) return errResult(id, name, 'ThreatFox returned an HTTP error.')

    if (json?.query_status === 'ok' && Array.isArray(json?.data) && json.data.length > 0)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: `Domain associated with ${json.data[0].malware_printable || 'malware'} in ThreatFox.` }
    if (json?.query_status === 'no_result')
      return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', skipped: false, detail: 'Domain not found in ThreatFox.' }

    return errResult(id, name, `Unexpected ThreatFox response: ${json?.query_status}`)
  } catch (err) {
    return errResult(id, name, `Could not reach ThreatFox: ${err.message}`)
  }
}

// ─── 5. PhishTank ────────────────────────────────────────────────────────────
export async function checkPhishTank({ url }) {
  const id = 'phishtank', name = 'PhishTank'
  try {
    const body = new URLSearchParams({ url, format: 'json' })
    const { ok, json } = await withTimeout(
      safeFetch('https://checkurl.phishtank.com/checkurl/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'phishtank/checkurl',
        },
        body: body.toString(),
      }),
    )
    if (!ok) return errResult(id, name, 'PhishTank returned an HTTP error.')

    const r = json?.results
    if (r?.in_database && r?.valid)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Verified phishing site in the PhishTank database.' }
    if (r?.in_database && !r?.valid)
      return { id, name, verdict: 'SUSPICIOUS', confidence: 'MEDIUM', skipped: false, detail: 'Reported as phishing but not yet verified.' }

    return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', skipped: false, detail: 'Not found in PhishTank.' }
  } catch (err) {
    return errResult(id, name, `Could not reach PhishTank: ${err.message}`)
  }
}

// ─── 6. OpenPhish ────────────────────────────────────────────────────────────
export async function checkOpenPhish({ url }) {
  const id = 'openphish', name = 'OpenPhish'
  try {
    const { ok, text } = await withTimeout(safeFetch('https://openphish.com/feed.txt'))
    if (!ok) return errResult(id, name, 'Could not fetch OpenPhish feed.')

    const normalised = url.toLowerCase().replace(/\/$/, '')
    const match = (text || '').split('\n').some(
      (line) => line.trim().toLowerCase().replace(/\/$/, '') === normalised,
    )
    return {
      id, name,
      verdict: match ? 'UNSAFE' : 'SAFE',
      confidence: match ? 'HIGH' : 'MEDIUM',
      skipped: false,
      detail: match ? 'Appears in the OpenPhish active phishing feed.' : 'Not found in OpenPhish feed.',
    }
  } catch (err) {
    return errResult(id, name, `Could not reach OpenPhish: ${err.message}`)
  }
}

// ─── 7. Google Safe Browsing (Transparency Report — no API key needed) ───────
export async function checkGoogleSafeBrowsing({ url }) {
  const id = 'google_safe_browsing', name = 'Google Safe Browsing'
  try {
    const encoded = encodeURIComponent(url)
    const { ok, text } = await withTimeout(
      safeFetch(
        `https://transparencyreport.google.com/transparencyreport/api/v3/safebrowsing/status?site=${encoded}`,
        { headers: { Accept: 'application/json' } },
      ),
    )
    if (!ok) return errResult(id, name, 'Google Safe Browsing check failed.')

    const cleaned = (text || '').replace(/^\)\]\}'\n/, '').trim()
    let parsed = null
    try { parsed = JSON.parse(cleaned) } catch {
      return errResult(id, name, 'Could not parse Google Safe Browsing response.')
    }

    let threatStatus = 0
    if (Array.isArray(parsed)) {
      const level1 = parsed[0]
      if (Array.isArray(level1)) {
        if (typeof level1[1] === 'number') threatStatus = level1[1]
        else if (Array.isArray(level1[0]) && typeof level1[0][1] === 'number') threatStatus = level1[0][1]
      }
    }

    if (typeof threatStatus === 'number' && threatStatus > 0)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Flagged as dangerous by Google Safe Browsing.' }

    return { id, name, verdict: 'SAFE', confidence: 'HIGH', skipped: false, detail: "No threats found in Google's Safe Browsing database." }
  } catch (err) {
    return errResult(id, name, `Could not reach Google Safe Browsing: ${err.message}`)
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
    if (verdict?.malicious)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Detected as malicious in a prior URLScan.' }

    if (!json?.results?.length)
      return { id, name, verdict: 'SAFE', confidence: 'LOW', skipped: false, detail: 'No prior scans found in URLScan.io — cannot confirm history.' }

    return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', skipped: false, detail: 'No malicious verdicts found in URLScan.io.' }
  } catch (err) {
    return errResult(id, name, `Could not reach URLScan.io: ${err.message}`)
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

    const blacklisted = Object.values(json?.blacklists || {}).some((v) => v?.listed)
    if (blacklisted || (Array.isArray(json?.malware) && json.malware.length > 0))
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Sucuri detected malware or blacklisting.' }

    return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', skipped: false, detail: 'No malware found by Sucuri.' }
  } catch (err) {
    return errResult(id, name, `Could not reach Sucuri: ${err.message}`)
  }
}

// ─── 10. Abuse.ch SSL Blacklist ───────────────────────────────────────────────
export async function checkSSLBL({ url }) {
  const id = 'sslbl', name = 'Abuse.ch SSL Blacklist'
  try {
    const hostname = getHostname(url)
    const { ok, json } = await withTimeout(
      safeFetch('https://sslbl.abuse.ch/api/v1/query/domainname/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ domainname: hostname }).toString(),
      }),
    )
    if (!ok) return errResult(id, name, 'SSLBL returned an error.')

    if (json?.query_status === 'ok' && json?.results?.length > 0)
      return { id, name, verdict: 'UNSAFE', confidence: 'HIGH', skipped: false, detail: 'Listed in SSL Blacklist (Botnet C2).' }
    if (json?.query_status === 'no_results')
      return { id, name, verdict: 'SAFE', confidence: 'MEDIUM', skipped: false, detail: 'Not found in SSL Blacklist.' }

    return errResult(id, name, `Unexpected SSLBL response: ${json?.query_status}`)
  } catch (err) {
    return errResult(id, name, `Could not reach SSLBL: ${err.message}`)
  }
}

// ─── Run all sources ──────────────────────────────────────────────────────────
export async function runAllSources({ url }) {
  const hostname = getHostname(url)
  const isWhitelisted = REPUTABLE_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith(`.${d}`),
  )

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
    checks.map(({ fn, id, name }) => {
      if (isWhitelisted) {
        return Promise.resolve({
          id, name, verdict: 'SAFE', confidence: 'HIGH', skipped: false,
          detail: 'Recognised as a highly reputable official domain.',
        })
      }
      return fn({ url })
    }),
  )

  const results = settled.map((r, i) => {
    if (r.status === 'fulfilled') return { ...r.value, id: checks[i].id, name: checks[i].name }
    return {
      id: checks[i].id, name: checks[i].name,
      verdict: 'ERROR',
      detail: `Unexpected error: ${r.reason?.message || 'unknown'}`,
      confidence: 'LOW', skipped: false,
    }
  })

  return { results }
}
