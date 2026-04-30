<script setup>
import { inject, ref } from 'vue'
import IconGlyph from './IconGlyph.vue'
import { t } from '../i18n/index.js'

const brandLogo = '/assets/diginav-logo.jpg'

defineProps({ navItems: Array, currentPage: String, supportedLanguages: Array })
const emit = defineEmits(['navigate'])

const lang = inject('lang')
const setLang = inject('setLang')

// ── Language dropdown ───────────────────────────────────────────
const langOpen = ref(false)

function selectLang(code) {
  setLang(code)
  langOpen.value = false
}

// ── Font size toggle (US 4.2) ───────────────────────────────────
const isLargeText = ref(sessionStorage.getItem('large-text') === '1')

if (isLargeText.value) {
  document.documentElement.classList.add('large-text')
}

function toggleFontSize() {
  isLargeText.value = !isLargeText.value
  if (isLargeText.value) {
    document.documentElement.classList.add('large-text')
    sessionStorage.setItem('large-text', '1')
  } else {
    document.documentElement.classList.remove('large-text')
    sessionStorage.setItem('large-text', '0')
  }
}
</script>

<template>
  <header class="site-header sticky-top">
    <div class="site-header-line"></div>
    <nav class="navbar navbar-expand-lg py-2">
      <div class="container-xl align-items-center gap-3">

        <!-- Brand -->
        <button
          class="navbar-brand d-flex align-items-center gap-2 text-white bg-transparent border-0 p-0"
          type="button"
          @click="emit('navigate', 'home')"
        >
          <img :src="brandLogo" alt="DigiNav logo" class="brand-logo" />
          <span class="d-flex flex-column align-items-start brand-copy">
            <strong>{{ t(lang, 'nav.brand') }}</strong>
            <small v-if="t(lang, 'nav.brandSub')">{{ t(lang, 'nav.brandSub') }}</small>
          </span>
        </button>

        <!-- Nav buttons -->
        <div class="d-flex flex-wrap justify-content-center gap-2 flex-grow-1">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="btn nav-btn"
            :class="currentPage === item.id ? 'nav-btn-active' : 'nav-btn-idle'"
            @click="emit('navigate', item.id)"
          >
            <IconGlyph :name="item.icon" />
            <span>{{ t(lang, `nav.${item.id}`) }}</span>
          </button>
        </div>

        <!-- Font size toggle: shows what will happen after click -->
        <button
          class="btn nav-btn nav-btn-idle"
          type="button"
          @click="toggleFontSize"
        >
          <IconGlyph name="fonts" />
          <span>{{ isLargeText ? t(lang, 'nav.normalText') : t(lang, 'nav.largeText') }}</span>
        </button>

        <!-- Language switcher -->
        <div class="position-relative">
          <button
            class="btn nav-btn nav-btn-idle language-btn"
            type="button"
            :aria-expanded="langOpen"
            @click="langOpen = !langOpen"
          >
            <IconGlyph name="globe" />
            <span>{{ supportedLanguages.find((l) => l.code === lang)?.label ?? 'English' }}</span>
          </button>

          <!-- Dropdown -->
          <ul v-if="langOpen" class="lang-dropdown list-unstyled m-0 p-0">
            <li v-for="l in supportedLanguages" :key="l.code">
              <button
                type="button"
                class="lang-option w-100 text-start"
                :class="{ active: lang === l.code }"
                @click="selectLang(l.code)"
              >
                {{ l.label }}
              </button>
            </li>
          </ul>
        </div>

      </div>
    </nav>
  </header>
</template>

<style scoped>
.lang-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  min-width: 130px;
  z-index: 9999;
  overflow: hidden;
}

.lang-option {
  display: block;
  padding: 10px 16px;
  font-size: 0.97rem;
  font-weight: 500;
  color: #333;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.12s;
}

.lang-option:hover {
  background: #f0f4ff;
  color: #1a56db;
}

.lang-option.active {
  background: #e8eeff;
  color: #1a56db;
  font-weight: 700;
}

@media (max-width: 991.98px) {
  .brand-copy strong {
    white-space: normal;
  }
}
</style>
