import { heuristicCheck } from './heuristics.js'
import { safeBrowsingLookup, verdictFromMatches } from './safeBrowsing.js'

function normalizeInputUrl(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return { ok: false, error: 'Please paste a website address.' }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'Only http and https links are supported.' }
    }

    // Drop fragments to reduce noise.
    url.hash = ''

    return { ok: true, normalizedUrl: url.toString(), hostname: url.hostname }
  } catch {
    return { ok: false, error: 'That does not look like a valid website address.' }
  }
}

function uniqStrings(items) {
  const out = []
  const seen = new Set()
  for (const item of items || []) {
    const v = String(item || '').trim()
    if (!v) continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

export async function checkUrl({ rawUrl, safeBrowsingApiKey }) {
  const normalized = normalizeInputUrl(rawUrl)
  if (!normalized.ok) {
    return {
      ok: false,
      error: normalized.error,
    }
  }

  const { normalizedUrl, hostname } = normalized

  if (!safeBrowsingApiKey) {
    const fallback = heuristicCheck(normalizedUrl)
    return {
      ok: true,
      ...fallback,
      reasons: uniqStrings(['We could not verify this link against a security database.', ...fallback.reasons]),
      nextSteps: uniqStrings(fallback.nextSteps),
      source: 'HEURISTICS',
      confidence: 'LOW',
      normalizedUrl,
      hostname,
    }
  }

  const lookup = await safeBrowsingLookup({ apiKey: safeBrowsingApiKey, url: normalizedUrl })
  if (lookup.ok) {
    const unsafe = verdictFromMatches(lookup.matches)
    if (unsafe) {
      return {
        ok: true,
        ...unsafe,
        reasons: uniqStrings(unsafe.reasons),
        nextSteps: uniqStrings(unsafe.nextSteps),
        source: 'SAFE_BROWSING',
        normalizedUrl,
        hostname,
      }
    }

    const fallback = heuristicCheck(normalizedUrl)
    return {
      ok: true,
      ...fallback,
      reasons: uniqStrings(fallback.reasons),
      nextSteps: uniqStrings(fallback.nextSteps),
      source: 'MIXED',
      normalizedUrl,
      hostname,
    }
  }

  const fallback = heuristicCheck(normalizedUrl)
  return {
    ok: true,
    ...fallback,
    verdict: 'SUSPICIOUS',
    headline: "We couldn't fully verify this link. Be careful.",
    reasons: uniqStrings([lookup.error, ...fallback.reasons]),
    nextSteps: uniqStrings([
      ...fallback.nextSteps,
      'If you need this service, type the official website address into your browser.',
    ]),
    source: 'HEURISTICS',
    confidence: 'LOW',
    normalizedUrl,
    hostname,
  }
}
