<script setup>
import { computed, ref } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
import { checkerTips } from '../data/siteContent'

const urlInput = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const result = ref(null)

const verdictClass = computed(() => {
  const verdict = result.value?.verdict
  if (verdict === 'SAFE') return 'alert-success'
  if (verdict === 'SUSPICIOUS') return 'alert-warning'
  if (verdict === 'UNSAFE') return 'alert-danger'
  return 'alert-secondary'
})

async function onCheck() {
  errorMessage.value = ''
  result.value = null

  const url = urlInput.value.trim()
  if (!url) {
    errorMessage.value = 'Please paste a website address.'
    return
  }

  isLoading.value = true
  try {
    const response = await fetch('/api/check-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      errorMessage.value = data?.error || 'Something went wrong. Please try again.'
      return
    }

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
      <div class="text-center hero-copy-sm mx-auto mb-4">
        <div class="hero-icon mx-auto mb-3"><IconGlyph name="checkShield" /></div>
        <h1 class="display-6 fw-bold mb-3">Trusted Website Checker</h1>
        <p class="lead text-secondary mb-0">Not sure if a link is safe? Paste it here before you click. We will help you verify if the website is legitimate.</p>
      </div>

      <div class="card soft-card mx-auto checker-card mb-4">
        <div class="card-body p-4">
          <label class="form-label fw-semibold" for="checker-url">Paste the website address (URL) below:</label>
          <div class="input-group input-group-lg mb-3">
            <span class="input-group-text bg-white"><IconGlyph name="link" /></span>
            <input
              id="checker-url"
              v-model="urlInput"
              type="text"
              class="form-control"
              placeholder="e.g. www.my.gov.au or https://suspicious-link.com"
            />
          </div>
          <button class="btn btn-primary btn-lg w-100" type="button" :disabled="isLoading" @click="onCheck">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            <IconGlyph v-else name="checkShield" />
            <span class="ms-2">Check if this website is safe</span>
          </button>

          <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0" role="alert">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <div v-if="result" class="mx-auto checker-card mb-4">
        <div class="alert" :class="verdictClass" role="alert">
          <div class="d-flex align-items-start gap-2">
            <div class="fs-4">
              <IconGlyph v-if="result.verdict === 'SAFE'" name="checkShield" />
              <IconGlyph v-else-if="result.verdict === 'SUSPICIOUS'" name="warning" />
              <IconGlyph v-else name="shieldAlert" />
            </div>
            <div class="flex-grow-1">
              <div class="fw-bold mb-1">{{ result.headline }}</div>
              <div class="small">
                Website: <span class="fw-semibold">{{ result.hostname }}</span>
              </div>
              <div v-if="result.confidence" class="small">Confidence: {{ result.confidence }}</div>
            </div>
          </div>

          <hr />

          <div class="mb-3">
            <div class="fw-semibold mb-2">Why we think this:</div>
            <ul class="mb-0">
              <li v-for="reason in result.reasons" :key="reason">{{ reason }}</li>
            </ul>
          </div>

          <div>
            <div class="fw-semibold mb-2">What to do next:</div>
            <ul class="mb-0">
              <li v-for="step in result.nextSteps" :key="step">{{ step }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="card soft-card mx-auto checker-card">
        <div class="card-body p-4">
          <h2 class="h3 fw-bold mb-4 d-flex align-items-center gap-2"><IconGlyph name="warning" /> Tips for checking links yourself</h2>
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
