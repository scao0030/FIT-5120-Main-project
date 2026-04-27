<script setup>
import { computed, ref } from 'vue'
import TopNav from './components/TopNav.vue'
import HomePage from './pages/HomePage.vue'
import GuidesPage from './pages/GuidesPage.vue'
import ServicesPage from './pages/ServicesPage.vue'
import HelpPage from './pages/HelpPage.vue'
import CheckerPage from './pages/CheckerPage.vue'
import { navItems } from './data/siteContent'

const currentPage = ref('home')
const gateInput = ref('')
const gateError = ref('')
const showPassword = ref(false)
const expectedPassword = String(import.meta.env.VITE_ENTRY_PASSWORD || 'fit5120').trim()
const authStorageKey = 'trusted_checker_auth_ok'
const isAuthed = ref(sessionStorage.getItem(authStorageKey) === '1')

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

function submitGate() {
  if (gateInput.value === expectedPassword) {
    gateError.value = ''
    isAuthed.value = true
    sessionStorage.setItem(authStorageKey, '1')
    return
  }
  gateError.value = 'Password is incorrect.'
}
</script>

<template>
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

  <div v-else class="app-shell">
    <TopNav :nav-items="navItems" :current-page="currentPage" @navigate="currentPage = $event" />
    <main class="page-shell">
      <component :is="currentView" @navigate="currentPage = $event" />
    </main>
  </div>
</template>
