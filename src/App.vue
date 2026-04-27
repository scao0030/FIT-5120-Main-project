<script setup>
import { computed, provide, ref } from 'vue'
import TopNav from './components/TopNav.vue'
import HomePage from './pages/HomePage.vue'
import GuidesPage from './pages/GuidesPage.vue'
import ServicesPage from './pages/ServicesPage.vue'
import HelpPage from './pages/HelpPage.vue'
import CheckerPage from './pages/CheckerPage.vue'
import { navItems } from './data/siteContent'
import { SUPPORTED_LANGUAGES, DEFAULT_LANG } from './i18n/index.js'

// ── Password gate ───────────────────────────────────────────────
const gateInput = ref('')
const gateError = ref('')
const showPassword = ref(false)
const expectedPassword = String(import.meta.env.VITE_ENTRY_PASSWORD || 'BrainAge').trim()
const authStorageKey = 'trusted_checker_auth_ok'
const isAuthed = ref(sessionStorage.getItem(authStorageKey) === '1')

function submitGate() {
  if (gateInput.value === expectedPassword) {
    gateError.value = ''
    isAuthed.value = true
    sessionStorage.setItem(authStorageKey, '1')
    return
  }
  gateError.value = 'Password is incorrect.'
}

// ── Language state ──────────────────────────────────────────────
const savedLang = localStorage.getItem('preferred-lang')
const lang = ref(
  SUPPORTED_LANGUAGES.find((l) => l.code === savedLang) ? savedLang : DEFAULT_LANG
)

function setLang(code) {
  lang.value = code
  localStorage.setItem('preferred-lang', code)
}

provide('lang', lang)
provide('setLang', setLang)

// ── Page routing ────────────────────────────────────────────────
const currentPage = ref('home')
const currentView = computed(
  () =>
    ({
      home: HomePage,
      guides: GuidesPage,
      services: ServicesPage,
      help: HelpPage,
      checker: CheckerPage,
    })[currentPage.value] || HomePage,
)
</script>

<template>
  <!-- Password gate -->
  <section v-if="!isAuthed" class="auth-gate-shell">
    <div class="card soft-card auth-gate-card">
      <div class="card-body p-4">
        <h1 class="h3 fw-bold mb-2">Access verification</h1>
        <p class="text-secondary mb-3">Enter the project password to continue.</p>
        <form @submit.prevent="submitGate">
          <input
            v-model="gateInput"
            :type="showPassword ? 'text' : 'password'"
            class="form-control form-control-lg mb-3"
            placeholder="Enter password"
            autocomplete="current-password"
          />
          <div class="form-check mb-3">
            <input id="show-password" v-model="showPassword" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="show-password">Show password</label>
          </div>
          <button type="submit" class="btn btn-primary btn-lg w-100">Enter</button>
        </form>
        <div v-if="gateError" class="alert alert-danger mt-3 mb-0">{{ gateError }}</div>
      </div>
    </div>
  </section>

  <!-- Main app -->
  <div v-else class="app-shell">
    <TopNav
      :nav-items="navItems"
      :current-page="currentPage"
      :supported-languages="SUPPORTED_LANGUAGES"
      @navigate="currentPage = $event"
    />
    <main class="page-shell">
      <component :is="currentView" @navigate="currentPage = $event" />
    </main>
  </div>
</template>