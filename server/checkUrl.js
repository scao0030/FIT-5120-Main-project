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

/**
 * Derive the final verdict from all API source results + heuristics.
 *
 * Priority: UNSAFE > SUSPICIOUS > SAFE
 * ERROR results are excluded from verdict logic but counted in the summary.
 *
 * Key rule: a single HIGH-confidence UNSAFE from any source = overall UNSAFE.
 * This means one Google Safe Browsing hit correctly overrides 5 SAFE results.
 */
function deriveOverallVerdict(sourceResults, heuristicResult) {
  // Exclude ERROR and SKIPPED from the verdict calculation
  const active = sourceResults.filter(s => s.verdict !== 'SKIPPED' && s.verdict !== 'ERROR')
  const unsafe     = active.filter(s => s.verdict === 'UNSAFE')
  const suspicious = active.filter(s => s.verdict === 'SUSPICIOUS')
  const safe       = active.filter(s => s.verdict === 'SAFE')

  const totalActive  = active.length
  const flaggedCount = unsafe.length + suspicious.length

  // Any HIGH-confidence UNSAFE source = UNSAFE overall, regardless of safe count
  if (unsafe.some(s => s.confidence === 'HIGH')) {
    return { verdict: 'UNSAFE', confidence: 'HIGH', flaggedCount, safeCount: safe.length, totalActive }
  }
  // Any UNSAFE (medium) or multiple SUSPICIOUS = UNSAFE overall
  if (unsafe.length >= 1 || suspicious.length >= 2) {
    return { verdict: 'UNSAFE', confidence: 'MEDIUM', flaggedCount, safeCount: safe.length, totalActive }
  }
  if (suspicious.length === 1) {
    return { verdict: 'SUSPICIOUS', confidence: 'MEDIUM', flaggedCount, safeCount: safe.length, totalActive }
  }
  // No active sources at all — fall back to heuristics only
  if (totalActive === 0) {
    return { verdict: heuristicResult.verdict, confidence: 'LOW', flaggedCount: 0, safeCount: 0, totalActive: 0 }
  }
  // Heuristics flagged it even though APIs were clean — show caution
  if (heuristicResult.verdict === 'SUSPICIOUS' && safe.length > 0) {
    return { verdict: 'SUSPICIOUS', confidence: 'LOW', flaggedCount, safeCount: safe.length, totalActive }
  }
  return { verdict: 'SAFE', confidence: totalActive >= 3 ? 'HIGH' : 'MEDIUM', flaggedCount, safeCount: safe.length, totalActive }
}

function buildHeadline(verdict, flaggedCount, totalActive) {
  if (verdict === 'UNSAFE') return 'This link is dangerous. Do not open it.'
  if (verdict === 'SUSPICIOUS') {
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

  const { verdict, confidence, flaggedCount, safeCount, totalActive } =
    deriveOverallVerdict(sourceResults, heuristicResult)

  const headline  = buildHeadline(verdict, flaggedCount, totalActive)
  const nextSteps = buildNextSteps(verdict, heuristicResult)

  const apiReasons = sourceResults
    .filter(s => s.verdict === 'UNSAFE' || s.verdict === 'SUSPICIOUS')
    .map(s => `${s.name}: ${s.detail}`)

  const heuristicReasons = heuristicResult.heuristics?.flags
    ?.filter(f => f.triggered)
    ?.map(f => f.detail) || heuristicResult.reasons

  const reasons = uniqStrings([...apiReasons, ...heuristicReasons])

  const skippedSources  = sourceResults.filter(s => s.skipped).length
  const errorSources    = sourceResults.filter(s => s.verdict === 'ERROR' && !s.skipped).length
  const activeSources   = sourceResults.length - skippedSources
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
      skippedSources,
      errorSources,
      unsafeCount,
      suspiciousCount,
      safeCount,
      flaggedCount,
    },
  }
}
