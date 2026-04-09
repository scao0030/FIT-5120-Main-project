const SHORTENER_HOSTS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'is.gd',
  'ow.ly',
  'buff.ly',
  'rebrand.ly',
  'cutt.ly',
  'shorturl.at',
])

const SUSPICIOUS_WORDS = [
  'login',
  'verify',
  'update',
  'secure',
  'account',
  'password',
  'bank',
  'refund',
  'invoice',
  'support',
  'helpdesk',
  'mygov',
  'ato',
  'centrelink',
  'medicare',
]

function isIpHost(hostname) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
}

function countMatches(text, items) {
  const lower = text.toLowerCase()
  return items.filter((w) => lower.includes(w)).length
}

function scoreUrlFeatures(url) {
  const reasons = []
  const nextSteps = []
  let score = 0

  const hostname = url.hostname.toLowerCase()
  const pathAndQuery = `${url.pathname}${url.search}`.toLowerCase()

  if (url.protocol !== 'https:') {
    score += 40
    reasons.push('This link does not use a secure connection (HTTPS).')
    nextSteps.push('Do not enter passwords or bank details on this site.')
  }

  if (SHORTENER_HOSTS.has(hostname)) {
    score += 35
    reasons.push('This is a shortened link, which can hide the real website.')
    nextSteps.push('If possible, ask the sender for the full website address.')
  }

  if (isIpHost(hostname)) {
    score += 50
    reasons.push('This link uses a raw IP address instead of a normal website name.')
    nextSteps.push('Avoid opening it unless you trust the sender and know what it is.')
  }

  if (hostname.includes('xn--')) {
    score += 35
    reasons.push('This website name may be using look-alike characters.')
    nextSteps.push('Check the spelling carefully before you continue.')
  }

  const hyphenCount = (hostname.match(/-/g) || []).length
  if (hyphenCount >= 3) {
    score += 15
    reasons.push('This website name has many dashes, which can be a sign of a fake site.')
    nextSteps.push('Type the official website address yourself instead of clicking.')
  }

  const digitCount = (hostname.match(/\d/g) || []).length
  if (digitCount >= 5) {
    score += 15
    reasons.push('This website name has many numbers, which can be a sign of a fake site.')
    nextSteps.push('Search for the official website and open it from trusted results.')
  }

  if (hostname.length >= 28) {
    score += 10
    reasons.push('This website name is unusually long.')
    nextSteps.push('Double-check that it matches the official site.')
  }

  const wordHits = countMatches(hostname, SUSPICIOUS_WORDS) + countMatches(pathAndQuery, SUSPICIOUS_WORDS)
  if (wordHits >= 2) {
    score += 25
    reasons.push('This link contains words often used in scam links (like "login" or "verify").')
    nextSteps.push('Do not log in from this link. Go to the official site by typing it yourself.')
  } else if (wordHits === 1) {
    score += 12
    reasons.push('This link contains a word that scammers often use.')
    nextSteps.push('Take a moment to check the website name carefully.')
  }

  // Strong rule: if it looks like an AU government service but isn't a .gov.au domain, be extra cautious.
  const looksLikeGovService =
    hostname.includes('mygov') || hostname.includes('ato') || hostname.includes('centrelink') || hostname.includes('medicare')
  if (looksLikeGovService && !hostname.endsWith('.gov.au')) {
    score += 30
    reasons.push('This link looks like it is pretending to be a government service, but it is not a .gov.au website.')
    nextSteps.push('Do not use this link. Type the official .gov.au address into your browser.')
  }

  return { score, reasons, nextSteps }
}

export function heuristicCheck(normalizedUrl) {
  const url = new URL(normalizedUrl)
  const { score, reasons, nextSteps } = scoreUrlFeatures(url)

  if (score >= 60) {
    return {
      verdict: 'SUSPICIOUS',
      headline: 'This link looks suspicious. Be careful before opening it.',
      reasons,
      nextSteps,
      confidence: 'MEDIUM',
    }
  }

  return {
    verdict: 'SAFE',
    headline: 'No known warnings were found, but always double-check the website name.',
    reasons: reasons.length ? reasons : ['No major risk signals were found in the link itself.'],
    nextSteps: [
      'Check the spelling of the website name before you continue.',
      'Do not enter personal information unless you are sure it is the correct site.',
    ],
    confidence: 'MEDIUM',
  }
}
