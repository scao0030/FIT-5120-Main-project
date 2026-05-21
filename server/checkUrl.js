import { heuristicCheck } from './heuristics.js'
import { runAllSources } from './apiSources.js'

// Normalize the user input once so every later check is working off the same URL.
function normalizeInputUrl(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return { ok: false, error: 'Please paste a website address.' }
  // People often paste a bare domain, so add https here and save the later parsers some grief.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'Only http and https links are supported.' }
    }
    // The hash part does not matter for reputation checks, and stripping it helps caching stay consistent.
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
    // A few different checks can end up saying the same thing, so de-dupe it before the UI gets noisy.
    if (!v || seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

// The final policy is intentionally conservative: if a live source warns, or even fails, we do not call it safe.
function deriveOverallVerdict(sourceResults) {
  const errorCount = sourceResults.filter((s) => s.verdict === 'ERROR').length
  if (errorCount > 0) {
    // This is fail-closed on purpose: if a source we wanted is down, we would rather lean strict than optimistic.
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

  // Any negative signal from a live reputation source is enough to tip this into unsafe.
  if (unsafe.length > 0 || suspicious.length > 0) {
    // Local heuristics are more of a "this looks odd" hint; a live source warning counts as stronger evidence.
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
    // Distinguish "we saw nothing bad" from "we were unable to verify anything at all".
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
    // A tiny sample of responders is not enough for a confident clean verdict.
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
  // Headline text is intentionally plain-language because it is shown directly to end users.
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

// Action advice depends on the final verdict but can incorporate heuristic-specific guidance.
function buildNextSteps(verdict, heuristicResult) {
  if (verdict === 'UNSAFE') {
    // Unsafe guidance is fixed and conservative regardless of which specific source raised the flag.
    return [
      'Do not open this link.',
      'Do not enter passwords, bank details, or personal information.',
      'If you received it by message or email, delete it and block the sender.',
      'You can report scams to Scamwatch at scamwatch.gov.au.',
    ]
  }
  if (verdict === 'SUSPICIOUS') {
    // Suspicious results merge generic caution with concrete structural warnings from heuristics.
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

  // Local heuristics are basically instant, remote sources are the slow bit, so run them together and save time.
  const [heuristicResult, { results: sourceResults }] = await Promise.all([
    Promise.resolve(heuristicCheck(normalizedUrl)),
    runAllSources({ url: normalizedUrl }),
  ])

  const { verdict, confidence, flaggedCount, safeCount, totalActive, reasonCode } =
    deriveOverallVerdict(sourceResults)

  const headline  = buildHeadline(verdict, flaggedCount, totalActive, reasonCode)
  const nextSteps = buildNextSteps(verdict, heuristicResult)

  // The frontend wants both rich drill-down data and short summary reasons, so keep both forms around.
  const apiReasons = sourceResults
    .filter(s => s.verdict === 'UNSAFE' || s.verdict === 'SUSPICIOUS' || s.verdict === 'ERROR')
    .map(s => `${s.name}: ${s.detail}`)

  const heuristicReasons = heuristicResult.heuristics?.flags
    ?.filter(f => f.triggered)
    ?.map(f => f.detail) || heuristicResult.reasons

  // `sources` and `heuristics` feed the expanded panels, while `reasons` powers the short summary block.
  const reasons = uniqStrings([...apiReasons, ...heuristicReasons])

  const errorSources      = sourceResults.filter(s => s.verdict === 'ERROR').length
  const respondedSources  = sourceResults.filter(s => s.verdict !== 'ERROR').length
  // "Active" here means every configured source that produced either a signal or an error state.
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
