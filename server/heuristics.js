const SHORTENER_HOSTS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd',
  'ow.ly', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorturl.at',
])

const SUSPICIOUS_WORDS = [
  'login', 'verify', 'update', 'secure', 'account', 'password',
  'bank', 'refund', 'invoice', 'support', 'helpdesk',
  'mygov', 'ato', 'centrelink', 'medicare',
]

// Fast local checks for risky URL patterns before network lookups complete.
function isIpHost(hostname) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
}

function countMatches(text, items) {
  const lower = text.toLowerCase()
  return items.filter((w) => lower.includes(w))
}

/**
 * Returns a detailed breakdown of every heuristic flag checked,
 * whether it passed or failed, and the score contribution.
 */
function scoreUrlFeatures(url) {
  const flags = []   // { label, detail, severity, triggered }
  let score = 0

  const hostname = url.hostname.toLowerCase()
  // Query strings often contain scam bait like "verify" or "login", so inspect them too.
  const pathAndQuery = `${url.pathname}${url.search}`.toLowerCase()

  // 1. HTTPS
  const noHttps = url.protocol !== 'https:'
  if (noHttps) score += 40
  flags.push({
    label: 'Secure connection (HTTPS)',
    detail: noHttps
      ? 'This link does NOT use HTTPS. Your information could be exposed.'
      : 'This link uses a secure HTTPS connection.',
    severity: 'HIGH',
    triggered: noHttps,
  })

  // 2. URL shortener
  const isShortener = SHORTENER_HOSTS.has(hostname)
  if (isShortener) score += 35
  flags.push({
    label: 'URL shortener detected',
    detail: isShortener
      ? `This is a shortened link (${hostname}), which can hide the real destination.`
      : 'This is not a known URL shortening service.',
    severity: 'HIGH',
    triggered: isShortener,
  })

  // 3. Raw IP address
  const isIp = isIpHost(hostname)
  if (isIp) score += 50
  flags.push({
    label: 'Raw IP address used',
    detail: isIp
      ? `This link uses a raw IP address (${hostname}) instead of a website name. This is unusual and often dangerous.`
      : 'The link uses a normal domain name, not a raw IP address.',
    severity: 'CRITICAL',
    triggered: isIp,
  })

  // 4. Internationalised / look-alike characters
  const hasIDN = hostname.includes('xn--')
  if (hasIDN) score += 35
  flags.push({
    label: 'Look-alike characters (IDN)',
    detail: hasIDN
      ? 'This domain uses internationalised characters that can look identical to real letters (e.g. "а" instead of "a") to trick you.'
      : 'No look-alike / internationalised characters detected.',
    severity: 'HIGH',
    triggered: hasIDN,
  })

  // 5. Excessive hyphens
  const hyphenCount = (hostname.match(/-/g) || []).length
  const manyHyphens = hyphenCount >= 3
  if (manyHyphens) score += 15
  flags.push({
    label: 'Excessive hyphens in domain',
    detail: manyHyphens
      ? `The domain contains ${hyphenCount} hyphens, which is unusual and a common sign of a fake site.`
      : `The domain contains ${hyphenCount} hyphen(s) — within normal range.`,
    severity: 'MEDIUM',
    triggered: manyHyphens,
  })

  // 6. Excessive digits
  const digitCount = (hostname.match(/\d/g) || []).length
  const manyDigits = digitCount >= 5
  if (manyDigits) score += 15
  flags.push({
    label: 'Excessive numbers in domain',
    detail: manyDigits
      ? `The domain contains ${digitCount} digits, which can be a sign of a randomly generated fake site.`
      : `The domain contains ${digitCount} digit(s) — within normal range.`,
    severity: 'MEDIUM',
    triggered: manyDigits,
  })

  // 7. Long domain name
  const longDomain = hostname.length >= 28
  if (longDomain) score += 10
  flags.push({
    label: 'Unusually long domain name',
    detail: longDomain
      ? `The domain is ${hostname.length} characters long. Very long domain names are sometimes used to confuse users.`
      : `The domain is ${hostname.length} characters — a normal length.`,
    severity: 'LOW',
    triggered: longDomain,
  })

  // 8. Suspicious keywords
  const hitWords = countMatches(hostname + pathAndQuery, SUSPICIOUS_WORDS)
  const wordHits = hitWords.length
  if (wordHits >= 2) score += 25
  else if (wordHits === 1) score += 12
  const triggeredWords = wordHits > 0
  flags.push({
    label: 'Suspicious keywords in URL',
    detail: triggeredWords
      ? `Found ${wordHits} suspicious keyword(s) often used in scam links: "${hitWords.join('", "')}".`
      : 'No suspicious keywords (like "login", "verify", "password") found in the URL.',
    severity: wordHits >= 2 ? 'HIGH' : 'MEDIUM',
    triggered: triggeredWords,
  })

  // 9. Fake government service
  const looksLikeGov =
    hostname.includes('mygov') || hostname.includes('ato') ||
    hostname.includes('centrelink') || hostname.includes('medicare')
  // Legitimate Australian government services should resolve under .gov.au.
  const fakeGov = looksLikeGov && !hostname.endsWith('.gov.au')
  if (fakeGov) score += 30
  flags.push({
    label: 'Impersonating Australian government',
    detail: fakeGov
      ? 'This link uses the name of an Australian government service but is NOT a .gov.au website. This is a strong sign of a scam.'
      : looksLikeGov
        ? 'This link references a government service and correctly uses a .gov.au domain.'
        : 'No Australian government service impersonation detected.',
    severity: 'CRITICAL',
    triggered: fakeGov,
  })

  // Build legacy reasons / nextSteps arrays for backward compat
  const reasons = flags.filter(f => f.triggered).map(f => f.detail)
  const nextSteps = []
  if (noHttps) nextSteps.push('Do not enter passwords or bank details on this site.')
  if (isShortener) nextSteps.push('Ask the sender for the full website address if possible.')
  if (isIp) nextSteps.push('Avoid opening it unless you fully trust the sender.')
  if (hasIDN) nextSteps.push('Check the spelling of the website name very carefully.')
  if (manyHyphens || manyDigits || longDomain) nextSteps.push('Type the official website address yourself instead of clicking this link.')
  if (triggeredWords) nextSteps.push('Do not log in from this link. Go to the official site by typing it yourself.')
  if (fakeGov) nextSteps.push('Do not use this link. Type the official .gov.au address into your browser directly.')
  if (nextSteps.length === 0) {
    nextSteps.push('Check the spelling of the website name before you continue.')
    nextSteps.push('Do not enter personal information unless you are sure it is the correct site.')
  }

  return { score, flags, reasons, nextSteps }
}

export function heuristicCheck(normalizedUrl) {
  const url = new URL(normalizedUrl)
  const { score, flags, reasons, nextSteps } = scoreUrlFeatures(url)

  const triggeredCount = flags.filter(f => f.triggered).length
  const totalChecks = flags.length

  // Heuristics alone only escalate to SUSPICIOUS; the backend reserves UNSAFE for stronger evidence.
  if (score >= 60) {
    // This threshold is intentionally coarse: several medium signals together should surface caution.
    return {
      verdict: 'SUSPICIOUS',
      headline: 'This link looks suspicious. Be careful before opening it.',
      reasons,
      nextSteps,
      confidence: 'MEDIUM',
      heuristics: { score, flags, triggeredCount, totalChecks },
    }
  }

  return {
    verdict: 'SAFE',
    // "SAFE" here only means the URL structure itself looks ordinary.
    // It does not overrule live source warnings from the backend aggregator.
    headline: 'No known warnings were found, but always double-check the website name.',
    reasons: reasons.length ? reasons : ['No major risk signals were found in the link itself.'],
    nextSteps,
    confidence: 'MEDIUM',
    heuristics: { score, flags, triggeredCount, totalChecks },
  }
}
