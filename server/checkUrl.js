import { heuristicCheck } from './heuristics.js'
import { runAllSources } from './apiSources.js'

function normalizeInputUrl(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return { ok: false, error: 'Please paste a website address.' }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'Only http and https links are supported.' }
    }
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
    if (!v || seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

function deriveOverallVerdict(sourceResults) {
  const errorCount = sourceResults.filter((s) => s.verdict === 'ERROR').length
  if (errorCount > 0) {
    return {
      verdict: 'UNSAFE',
      confidence: 'LOW',
      flaggedCount: errorCount,
      safeCount: sourceResults.filter((s) => s.verdict === 'SAFE').length,
      totalActive: sourceResults.filter((s) => s.verdict !== 'ERROR').length,
      reasonCode: 'strict_error_mode',
    }
  }

  const active = sourceResults.filter(s => s.verdict !== 'ERROR')
  const unsafe     = active.filter(s => s.verdict === 'UNSAFE')
  const suspicious = active.filter(s => s.verdict === 'SUSPICIOUS')
  const safe       = active.filter(s => s.verdict === 'SAFE')

  const totalActive = active.length
  const flaggedCount = unsafe.length + suspicious.length
  const safeCount = safe.length

  // API-only strict rule: any negative source means UNSAFE.
  if (unsafe.length > 0 || suspicious.length > 0) {
    return {
      verdict: 'UNSAFE',
      confidence: 'MEDIUM',
      flaggedCount,
      safeCount,
      totalActive,
      reasonCode: 'api_negative_signal',
    }
  }

  if (totalActive === 0) {
    return {
      verdict: 'SUSPICIOUS',
      confidence: 'LOW',
      flaggedCount: 0,
      safeCount: 0,
      totalActive: 0,
      reasonCode: 'no_live_sources',
    }
  }

  if (totalActive < 3) {
    return {
      verdict: 'SUSPICIOUS',
      confidence: 'LOW',
      flaggedCount,
      safeCount,
      totalActive,
      reasonCode: 'insufficient_sources',
    }
  }

  return {
    verdict: 'SAFE',
    confidence: totalActive >= 6 ? 'HIGH' : 'MEDIUM',
    flaggedCount,
    safeCount,
    totalActive,
    reasonCode: 'clean_evidence',
  }
}

function buildHeadline(verdict, flaggedCount, totalActive, reasonCode) {
  if (verdict === 'UNSAFE') {
    if (reasonCode === 'strict_error_mode') {
      return 'Security checks failed, so this link is treated as unsafe by strict policy.'
    }
    if (reasonCode === 'api_negative_signal') {
      return 'At least one security source flagged this link, so it is treated as unsafe.'
    }
    return 'This link is dangerous. Do not open it.'
  }
  if (verdict === 'SUSPICIOUS') {
    if (reasonCode === 'no_live_sources') return 'We could not verify this link with live threat sources.'
    if (reasonCode === 'insufficient_sources') return 'Not enough independent sources responded to verify this link safely.'
    if (flaggedCount > 0) return `This link looks suspicious — ${flaggedCount} security ${flaggedCount === 1 ? 'check' : 'checks'} raised a warning.`
    return 'This link looks suspicious based on its structure. Be careful.'
  }
  if (totalActive >= 3) return `All ${totalActive} security checks found no threats.`
  if (totalActive > 0) return 'No threats found, but always double-check the website name.'
  return 'No known warnings found, but we could not fully verify this link.'
}

function buildNextSteps(verdict, heuristicResult) {
  if (verdict === 'UNSAFE') {
    return [
      'Do not open this link.',
      'Do not enter passwords, bank details, or personal information.',
      'If you received it by message or email, delete it and block the sender.',
      'You can report scams to Scamwatch at scamwatch.gov.au.',
    ]
  }
  if (verdict === 'SUSPICIOUS') {
    return uniqStrings([
      'Be very careful before opening this link.',
      'If you did not expect this link, do not open it.',
      ...heuristicResult.nextSteps,
      'When in doubt, type the official website address into your browser yourself.',
    ])
  }
  return uniqStrings([
    'Check the spelling of the website name before you continue.',
    'Do not enter personal information unless you are sure it is the correct site.',
    ...heuristicResult.nextSteps,
  ])
}

export async function checkUrl({ rawUrl }) {
  const normalized = normalizeInputUrl(rawUrl)
  if (!normalized.ok) return { ok: false, error: normalized.error }

  const { normalizedUrl, hostname } = normalized

  // Run heuristics and all API sources in parallel.
  // runAllSources returns { results } — destructure accordingly.
  const [heuristicResult, { results: sourceResults }] = await Promise.all([
    Promise.resolve(heuristicCheck(normalizedUrl)),
    runAllSources({ url: normalizedUrl }),
  ])

  const { verdict, confidence, flaggedCount, safeCount, totalActive, reasonCode } =
    deriveOverallVerdict(sourceResults)

  const headline  = buildHeadline(verdict, flaggedCount, totalActive, reasonCode)
  const nextSteps = buildNextSteps(verdict, heuristicResult)

  const apiReasons = sourceResults
    .filter(s => s.verdict === 'UNSAFE' || s.verdict === 'SUSPICIOUS' || s.verdict === 'ERROR')
    .map(s => `${s.name}: ${s.detail}`)

  const heuristicReasons = heuristicResult.heuristics?.flags
    ?.filter(f => f.triggered)
    ?.map(f => f.detail) || heuristicResult.reasons

  const reasons = uniqStrings([...apiReasons, ...heuristicReasons])

  const errorSources      = sourceResults.filter(s => s.verdict === 'ERROR').length
  const respondedSources  = sourceResults.filter(s => s.verdict !== 'ERROR').length
  const activeSources     = respondedSources + errorSources
  const unsafeCount     = sourceResults.filter(s => s.verdict === 'UNSAFE').length
  const suspiciousCount = sourceResults.filter(s => s.verdict === 'SUSPICIOUS').length

  return {
    ok: true,
    verdict,
    headline,
    hostname,
    normalizedUrl,
    confidence,
    reasons,
    nextSteps,
    sources:    sourceResults,
    heuristics: heuristicResult.heuristics,
    summary: {
      totalSources: sourceResults.length,
      activeSources,
      respondedSources,
      errorSources,
      unsafeCount,
      suspiciousCount,
      safeCount,
      flaggedCount,
    },
  }
}
