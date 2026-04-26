<script setup>
import { computed, ref } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
import { checkerTips } from '../data/siteContent'

const urlInput = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const result = ref(null)
const detailsOpen = ref(false)

function buildApiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL
  if (!base) return path
  return String(base).replace(/\/+$/, '') + path
}

// ── Verdict colour config ────────────────────────────────────────────────────
const verdictConfig = computed(() => {
  const v = result.value?.verdict
  if (v === 'SAFE') return {
    word: 'SAFE', icon: '✔',
    bg: '#edfbf3', border: '#1db868', text: '#0a5c36',
    iconBg: '#1db868', chipBg: '#d4f7e7', chipText: '#0a5c36', chipBorder: '#1db868',
  }
  if (v === 'SUSPICIOUS') return {
    word: 'SUSPICIOUS', icon: '⚠',
    bg: '#fffbea', border: '#e6a817', text: '#6b4400',
    iconBg: '#e6a817', chipBg: '#fff4d4', chipText: '#6b4400', chipBorder: '#e6a817',
  }
  if (v === 'UNSAFE') return {
    word: 'DANGEROUS', icon: '✕',
    bg: '#fff5f5', border: '#e03535', text: '#6b0808',
    iconBg: '#e03535', chipBg: '#fde8e8', chipText: '#6b0808', chipBorder: '#e03535',
  }
  return null
})

// ── Per-source verdict chip styles ──────────────────────────────────────────
function chipStyle(verdict) {
  if (verdict === 'SAFE')       return { background: '#d4f7e7', color: '#0a5c36', border: '1px solid #1db868' }
  if (verdict === 'SUSPICIOUS') return { background: '#fff4d4', color: '#6b4400', border: '1px solid #e6a817' }
  if (verdict === 'UNSAFE')     return { background: '#fde8e8', color: '#6b0808', border: '1px solid #e03535' }
  return                               { background: '#f3f3f3', color: '#888',    border: '1px solid #ccc' }  // ERROR
}

function chipLabel(verdict) {
  if (verdict === 'SAFE')       return '✔  Safe'
  if (verdict === 'SUSPICIOUS') return '⚠  Suspicious'
  if (verdict === 'UNSAFE')     return '✕  Dangerous'
  return '?  Error'
}

// ── Heuristic severity colours ───────────────────────────────────────────────
function severityStyle(severity, triggered) {
  if (!triggered) return { background: '#f0f9f4', color: '#2a7a50', border: '1px solid #b6e8cf' }
  if (severity === 'CRITICAL') return { background: '#fde8e8', color: '#6b0808', border: '1px solid #e03535' }
  if (severity === 'HIGH')     return { background: '#fde8e8', color: '#6b0808', border: '1px solid #e8a0a0' }
  if (severity === 'MEDIUM')   return { background: '#fff4d4', color: '#6b4400', border: '1px solid #f0c060' }
  return                              { background: '#fff4d4', color: '#6b4400', border: '1px solid #f0c060' }
}
function severityLabel(severity, triggered) {
  if (!triggered) return '✔  Pass'
  if (severity === 'CRITICAL' || severity === 'HIGH') return '✕  Fail'
  return '⚠  Warning'
}

// ── Summary counts ────────────────────────────────────────────────────────────
const summary = computed(() => result.value?.summary || null)

// ── Enter key ────────────────────────────────────────────────────────────────
function handleKey(e) { if (e.key === 'Enter') onCheck() }

// ── Main check function ──────────────────────────────────────────────────────
async function onCheck() {
  errorMessage.value = ''
  result.value = null
  detailsOpen.value = false

  const url = urlInput.value.trim()
  if (!url) { errorMessage.value = 'Please paste a website address first.'; return }

  isLoading.value = true
  try {
    const response = await fetch(buildApiUrl('/api/check-url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) { errorMessage.value = data?.error || 'Something went wrong. Please try again.'; return }
    result.value = data
  } catch {
    errorMessage.value = 'Could not connect to the checker service. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section">

      <!-- ── Hero ── -->
      <div class="text-center hero-copy-sm mx-auto mb-4">
        <div class="hero-icon mx-auto mb-3"><IconGlyph name="checkShield" /></div>
        <h1 class="display-6 fw-bold mb-3">Trusted Website Checker</h1>
        <p class="lead text-secondary mb-0">
          Not sure if a link is safe? Paste it below and we will check it against multiple security databases.
        </p>
      </div>

      <!-- ── Input card ── -->
      <div class="card soft-card mx-auto checker-card mb-4">
        <div class="card-body p-4">
          <label class="form-label fw-semibold fs-5 mb-3 d-block" for="checker-url">
            Paste the website address (link) below:
          </label>
          <div class="input-group input-group-lg mb-3">
            <span class="input-group-text bg-white"><IconGlyph name="link" /></span>
            <input
              id="checker-url"
              v-model="urlInput"
              type="text"
              class="form-control"
              style="font-size:1.1rem;"
              placeholder="e.g. www.my.gov.au or https://suspicious-link.com"
              @keydown="handleKey"
            />
          </div>
          <button
            class="btn btn-primary btn-lg w-100"
            type="button"
            :disabled="isLoading"
            style="font-size:1.15rem;padding:14px;"
            @click="onCheck"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            <IconGlyph v-else name="checkShield" />
            <span class="ms-2">{{ isLoading ? 'Checking… this may take a few seconds' : 'Check if this website is safe' }}</span>
          </button>
          <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0 fs-5" role="alert">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- ── Result card ── -->
      <div v-if="result && verdictConfig" class="mx-auto checker-card mb-4">
        <div
          class="result-outer"
          :style="{
            background: verdictConfig.bg,
            border: `2.5px solid ${verdictConfig.border}`,
            borderRadius: '16px',
            overflow: 'hidden',
          }"
        >

          <!-- Big verdict banner -->
          <div class="verdict-banner d-flex align-items-center gap-3 px-4 py-4"
            :style="{ borderBottom: `2px solid ${verdictConfig.border}` }">
            <div class="verdict-icon-circle flex-shrink-0"
              :style="{
                background: verdictConfig.iconBg,
                width: '68px', height: '68px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', color: '#fff', fontWeight: '800', flexShrink: 0,
              }">
              {{ verdictConfig.icon }}
            </div>
            <div>
              <div :style="{ fontSize: '2.6rem', fontWeight: '800', color: verdictConfig.text, lineHeight: 1.05, letterSpacing: '-0.5px' }">
                {{ verdictConfig.word }}
              </div>
              <div :style="{ color: verdictConfig.text, fontSize: '1.1rem', marginTop: '5px', opacity: 0.85 }">
                {{ result.headline }}
              </div>
            </div>
          </div>

          <!-- Quick summary strip -->
          <div v-if="summary"
            class="summary-strip px-4 py-3 d-flex flex-wrap align-items-center gap-3"
            :style="{ background: 'rgba(255,255,255,0.55)', borderBottom: `1.5px solid ${verdictConfig.border}` }">

            <!-- Flagged count pill -->
            <div class="summary-pill"
              :style="{
                background: summary.flaggedCount > 0 ? '#fde8e8' : '#d4f7e7',
                border: `1.5px solid ${summary.flaggedCount > 0 ? '#e03535' : '#1db868'}`,
                color: summary.flaggedCount > 0 ? '#6b0808' : '#0a5c36',
              }">
              <span class="summary-pill-num">{{ summary.flaggedCount }}</span>
              <span class="summary-pill-label">{{ summary.flaggedCount === 1 ? 'source flagged it' : 'sources flagged it' }}</span>
            </div>

            <!-- Safe count pill -->
            <div class="summary-pill"
              :style="{ background: '#d4f7e7', border: '1.5px solid #1db868', color: '#0a5c36' }">
              <span class="summary-pill-num">{{ summary.safeCount }}</span>
              <span class="summary-pill-label">{{ summary.safeCount === 1 ? 'source said safe' : 'sources said safe' }}</span>
            </div>

            <!-- Total databases attempted pill -->
            <div class="summary-pill"
              :style="{ background: '#f0f0f0', border: '1.5px solid #ccc', color: '#444' }">
              <span class="summary-pill-num">{{ summary.activeSources }}</span>
              <span class="summary-pill-label">{{ summary.activeSources === 1 ? 'database checked' : 'databases checked' }}</span>
            </div>

            <!-- Unavailable (error) pill — only shown when some sources failed -->
            <div v-if="summary.errorSources > 0" class="summary-pill"
              :style="{ background: '#fff8e1', border: '1.5px solid #f0c060', color: '#6b4400' }">
              <span class="summary-pill-num">{{ summary.errorSources }}</span>
              <span class="summary-pill-label">{{ summary.errorSources === 1 ? 'source unavailable' : 'sources unavailable' }}</span>
            </div>

            <!-- URL badge -->
            <div class="ms-auto">
              <span class="badge rounded-pill px-3 py-2"
                style="background:#f5f5f5;color:#444;border:1px solid #ddd;font-size:0.9rem;"
                :title="result.normalizedUrl">
                🌐 {{ result.hostname }}
              </span>
            </div>
          </div>

          <!-- Expand / collapse button -->
          <div class="px-4 pt-3 pb-3">
            <button
              class="w-100 expand-btn"
              :style="{
                background: 'rgba(255,255,255,0.65)',
                border: `1.5px solid ${verdictConfig.border}`,
                borderRadius: '10px',
                padding: '16px 20px',
                cursor: 'pointer',
                fontSize: '1.05rem',
                fontWeight: '700',
                color: verdictConfig.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }"
              @click="detailsOpen = !detailsOpen"
              :aria-expanded="detailsOpen"
            >
              <span style="font-size:1.1rem;">
                {{ detailsOpen ? '▲  Hide full details' : '▼  See full details — why did we give this result?' }}
              </span>
              <span
                :style="{
                  background: verdictConfig.iconBg,
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '5px 16px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  marginLeft: '12px',
                  flexShrink: 0,
                }"
              >
                {{ detailsOpen ? 'Close ▲' : 'Tap to open ▼' }}
              </span>
            </button>
          </div>

          <!-- ── Expanded details panel ── -->
          <div v-if="detailsOpen" class="details-panel px-4 pb-4" style="animation: fadeSlideIn 0.25s ease;">

            <!-- ══ Section 1: Per-API source results ══ -->
            <div class="detail-section mb-4">
              <div class="detail-section-heading">
                🔍 Security database results
                <span class="detail-section-sub">How each database rated this link</span>
              </div>

              <div class="source-grid">
                <div
                  v-for="src in result.sources"
                  :key="src.id"
                  class="source-row"
                >
                  <div class="source-name">{{ src.name }}</div>
                  <div class="source-chip-wrap">
                    <span class="source-chip" :style="chipStyle(src.verdict)">
                      {{ chipLabel(src.verdict) }}
                    </span>
                  </div>
                  <div class="source-detail">{{ src.detail }}</div>
                  <!-- VirusTotal engine sub-stats -->
                  <div v-if="src.engineStats" class="engine-stats-row">
                    <span v-if="src.engineStats.malicious"  class="engine-stat-chip danger">{{ src.engineStats.malicious }} malicious</span>
                    <span v-if="src.engineStats.suspicious" class="engine-stat-chip warning">{{ src.engineStats.suspicious }} suspicious</span>
                    <span v-if="src.engineStats.harmless"   class="engine-stat-chip safe">{{ src.engineStats.harmless }} safe</span>
                    <span v-if="src.engineStats.undetected" class="engine-stat-chip muted">{{ src.engineStats.undetected }} undetected</span>
                  </div>
                </div>
              </div>

              <!-- Note shown when some sources failed -->
              <div v-if="summary && summary.errorSources > 0"
                class="mt-3 px-3 py-2"
                style="background:#fff8e1;border:1px solid #f0c060;border-radius:8px;font-size:0.9rem;color:#6b4400;">
                ⚠ {{ summary.errorSources }} {{ summary.errorSources === 1 ? 'database was' : 'databases were' }} temporarily unavailable. Results are still based on the {{ summary.respondedSources ?? (summary.activeSources - summary.errorSources) }} {{ (summary.respondedSources ?? (summary.activeSources - summary.errorSources)) === 1 ? 'database' : 'databases' }} that responded.
              </div>
            </div>

            <!-- ══ Section 2: Heuristics breakdown ══ -->
            <div v-if="result.heuristics" class="detail-section mb-4">
              <div class="detail-section-heading">
                🧪 Link structure analysis (heuristics)
                <span class="detail-section-sub">
                  {{ result.heuristics.triggeredCount }} out of {{ result.heuristics.totalChecks }} checks raised a warning
                  &nbsp;·&nbsp; Risk score: {{ result.heuristics.score }}
                </span>
              </div>

              <div class="heuristics-grid">
                <div
                  v-for="flag in result.heuristics.flags"
                  :key="flag.label"
                  class="heuristic-row"
                  :style="{
                    background: flag.triggered ? (flag.severity === 'CRITICAL' || flag.severity === 'HIGH' ? '#fff5f5' : '#fffbea') : '#f4fcf7',
                    borderLeft: `4px solid ${flag.triggered ? (flag.severity === 'CRITICAL' || flag.severity === 'HIGH' ? '#e03535' : '#e6a817') : '#1db868'}`,
                  }"
                >
                  <div class="heuristic-label-row">
                    <span class="heuristic-name">{{ flag.label }}</span>
                    <span class="heuristic-chip" :style="severityStyle(flag.severity, flag.triggered)">
                      {{ severityLabel(flag.severity, flag.triggered) }}
                    </span>
                  </div>
                  <div class="heuristic-detail">{{ flag.detail }}</div>
                  <div v-if="flag.triggered && flag.severity !== 'LOW'" class="heuristic-severity-tag"
                    :style="{ color: flag.severity === 'CRITICAL' ? '#e03535' : flag.severity === 'HIGH' ? '#c53030' : '#b07d00' }">
                    Severity: {{ flag.severity }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ══ Section 3: What we found (reasons) ══ -->
            <div v-if="result.reasons && result.reasons.length" class="detail-section mb-4">
              <div class="detail-section-heading">
                📋 What we found
                <span class="detail-section-sub">Summary of all warnings</span>
              </div>
              <ul class="reasons-list">
                <li v-for="reason in result.reasons" :key="reason">
                  {{ reason }}
                </li>
              </ul>
            </div>

            <!-- ══ Section 4: What to do ══ -->
            <div class="detail-section">
              <div class="detail-section-heading">
                💡 What should I do?
                <span class="detail-section-sub">Recommended steps for you</span>
              </div>
              <ol class="steps-list">
                <li v-for="step in result.nextSteps" :key="step">
                  {{ step }}
                </li>
              </ol>
            </div>

          </div><!-- /details-panel -->
        </div><!-- /result-outer -->
      </div><!-- /result card -->

      <!-- ── Tips card ── -->
      <div class="card soft-card mx-auto checker-card">
        <div class="card-body p-4">
          <h2 class="h3 fw-bold mb-4 d-flex align-items-center gap-2">
            <IconGlyph name="warning" /> Tips for checking links yourself
          </h2>
          <div class="vstack gap-4">
            <article v-for="(tip, index) in checkerTips" :key="tip.title" class="d-flex gap-3 align-items-start">
              <span class="tip-number">{{ index + 1 }}</span>
              <div>
                <h3 class="h5 mb-2">{{ tip.title }}</h3>
                <p class="text-secondary mb-0">{{ tip.description }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Summary strip pills ── */
.summary-pill {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 600;
}
.summary-pill-num   { font-size: 1.4rem; font-weight: 800; line-height: 1; }
.summary-pill-label { font-size: 0.9rem; }

/* ── Expand button ── */
.expand-btn {
  transition: filter 0.15s, box-shadow 0.15s;
}
.expand-btn:hover      { filter: brightness(0.97); box-shadow: 0 3px 12px rgba(0,0,0,0.1); }
.expand-btn:focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }

/* ── Detail section headers ── */
.detail-section-heading {
  font-size: 1.1rem;
  font-weight: 700;
  color: #222;
  border-bottom: 1.5px solid rgba(0,0,0,0.1);
  padding-bottom: 8px;
  margin-bottom: 14px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.detail-section-sub {
  font-size: 0.9rem;
  font-weight: 400;
  color: #666;
}

/* ── Source rows ── */
.source-grid { display: flex; flex-direction: column; gap: 10px; }
.source-row {
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  padding: 14px 16px;
}
.source-name {
  font-size: 1rem;
  font-weight: 700;
  color: #222;
  margin-bottom: 6px;
}
.source-chip-wrap { margin-bottom: 6px; }
.source-chip {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 700;
}
.source-detail {
  font-size: 0.97rem;
  color: #444;
  line-height: 1.5;
}

/* VirusTotal engine sub-stats */
.engine-stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.engine-stat-chip {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}
.engine-stat-chip.danger  { background: #fde8e8; color: #6b0808; border: 1px solid #e8a0a0; }
.engine-stat-chip.warning { background: #fff4d4; color: #6b4400; border: 1px solid #f0c060; }
.engine-stat-chip.safe    { background: #d4f7e7; color: '#0a5c36'; border: 1px solid #8de0b8; }
.engine-stat-chip.muted   { background: #f3f3f3; color: #666;     border: 1px solid #ddd; }

/* ── Heuristics grid ── */
.heuristics-grid { display: flex; flex-direction: column; gap: 8px; }
.heuristic-row {
  border-radius: 8px;
  padding: 12px 14px;
}
.heuristic-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}
.heuristic-name {
  font-size: 0.97rem;
  font-weight: 700;
  color: #222;
}
.heuristic-chip {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}
.heuristic-detail {
  font-size: 0.93rem;
  color: #444;
  line-height: 1.5;
}
.heuristic-severity-tag {
  font-size: 0.8rem;
  font-weight: 700;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* ── Reasons & steps lists ── */
.reasons-list, .steps-list {
  padding-left: 1.5rem;
  margin: 0;
}
.reasons-list li, .steps-list li {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 8px;
  color: #333;
}
.steps-list li {
  font-weight: 500;
}
</style>
