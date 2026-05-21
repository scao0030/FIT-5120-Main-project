// Google Safe Browsing uses a specific request schema; isolate it here to keep apiSources clean.
function buildRequestBody(url) {
  return {
    client: {
      clientId: 'fit5120-trusted-checker',
      clientVersion: '1.0.0',
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION',
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  }
}

export async function safeBrowsingLookup({ apiKey, url, timeoutMs = 6000 }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(
      apiKey,
    )}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(url)),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const message = text ? `Safe Browsing error: ${response.status} ${text}` : `Safe Browsing error: ${response.status}`
      return { ok: false, error: message }
    }

    const data = await response.json()
    const matches = Array.isArray(data?.matches) ? data.matches : []
    return { ok: true, matches }
  } catch (err) {
    const message = err?.name === 'AbortError' ? 'Safe Browsing request timed out.' : 'Safe Browsing request failed.'
    return { ok: false, error: message }
  } finally {
    clearTimeout(timer)
  }
}

// Convert a raw Safe Browsing match list into the same verdict shape used elsewhere.
export function verdictFromMatches(matches) {
  if (!matches || matches.length === 0) return null

  const threatTypes = Array.from(new Set(matches.map((m) => m?.threatType).filter(Boolean)))

  const reasons = [
    'This link is listed as dangerous by a trusted security database.',
    threatTypes.length ? `Warning type: ${threatTypes.join(', ').toLowerCase().replaceAll('_', ' ')}.` : null,
    'It may try to steal personal information or install harmful software.',
  ].filter(Boolean)

  const nextSteps = [
    'Do not open this link.',
    'Do not enter passwords or bank details.',
    'If you received it by message or email, delete it and block the sender.',
  ]

  return {
    verdict: 'UNSAFE',
    headline: 'This link is unsafe. Do not open it.',
    reasons,
    nextSteps,
    confidence: 'HIGH',
  }
}
