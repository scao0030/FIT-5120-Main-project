<script setup>
import { inject, ref } from 'vue'
import IconGlyph from './IconGlyph.vue'
import { t } from '../i18n/index.js'

const brandLogo = '/assets/diginav-logo.jpg'

const props = defineProps({ navItems: Array, currentPage: String, supportedLanguages: Array })
const emit = defineEmits(['navigate'])

const lang = inject('lang')
const setLang = inject('setLang')

// The language picker popover is local UI state; the actual language value still lives in App.vue.
const langOpen = ref(false)

function selectLang(code) {
  setLang(code)
  langOpen.value = false
}

function isItemActive(item) {
  return props.currentPage === item.id
}

function onNavItemClick(item) {
  emit('navigate', item.id)
  langOpen.value = false
}

// Large-text mode only needs to live for this tab, so sessionStorage is enough.
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
      <div class="container-xl align-items-center gap-3 nav-shell">

        <!-- Brand -->
        <button
          class="navbar-brand d-flex flex-column align-items-center text-white bg-transparent border-0 p-0 brand-block"
          type="button"
          @click="emit('navigate', 'home')"
        >
          <img :src="brandLogo" alt="DigiNav logo" class="brand-logo" />
          <span class="d-flex flex-column align-items-center brand-copy">
            <strong>{{ t(lang, 'nav.brand') }}</strong>
            <small v-if="t(lang, 'nav.brandSub')">{{ t(lang, 'nav.brandSub') }}</small>
          </span>
        </button>

        <!-- All controls stay in one static group -->
        <div class="d-flex justify-content-center align-items-center gap-2 flex-grow-1 nav-links">
          <div class="d-flex align-items-center gap-2 nav-primary-group">
            <div
              v-for="item in navItems"
              :key="item.id"
              class="nav-menu-group"
            >
              <button
                type="button"
                class="btn nav-btn"
                :class="isItemActive(item) ? 'nav-btn-active' : 'nav-btn-idle'"
                @click="onNavItemClick(item)"
              >
                <IconGlyph :name="item.icon" />
                <span>{{ t(lang, `nav.${item.id}`) }}</span>
              </button>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2 nav-utility-group">
            <button
              class="btn nav-btn nav-btn-idle nav-utility-btn"
              type="button"
              @click="toggleFontSize"
            >
              <IconGlyph name="fonts" />
              <span>{{ isLargeText ? t(lang, 'nav.normalText') : t(lang, 'nav.largeText') }}</span>
            </button>

            <div class="position-relative nav-menu-group">
              <button
                class="btn nav-btn nav-btn-idle language-btn nav-utility-btn"
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
        </div>

      </div>
    </nav>
  </header>
</template>

<style scoped>
/* Dropdown is intentionally absolute-positioned so it works inside the sticky header. */
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

.nav-menu-group {
  display: inline-flex;
  flex: 0 0 auto;
}

.nav-shell {
  min-height: 5.25rem;
  flex-wrap: nowrap;
}

.nav-links {
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  overflow: visible;
}

.nav-primary-group {
  flex: 1 1 auto;
  justify-content: center;
  min-width: 0;
}

.nav-utility-group {
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: 1rem;
}

.nav-utility-btn {
  flex: 0 0 auto;
  min-width: 8.6rem;
  min-height: 2.7rem;
  padding: 0.58rem 0.9rem;
  font-size: 0.86rem;
  border-radius: 0.92rem;
}

.language-btn {
  justify-content: center;
}

.brand-block {
  flex: 0 0 auto;
  min-width: 9rem;
}

@media (max-width: 1199.98px) {
  .nav-shell {
    gap: 1rem !important;
  }

  .nav-utility-group {
    padding-left: 0.7rem;
  }
}

@media (max-width: 767.98px) {
  .brand-copy strong {
    white-space: nowrap;
  }
}
</style>
