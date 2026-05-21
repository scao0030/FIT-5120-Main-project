<script setup>
import { inject, ref } from 'vue'
import IconGlyph from './IconGlyph.vue'
import { t } from '../i18n/index.js'

const brandLogo = '/assets/diginav-logo.jpg'

const props = defineProps({ navItems: Array, currentPage: String, supportedLanguages: Array })
const emit = defineEmits(['navigate'])

const lang = inject('lang')
const setLang = inject('setLang')

// These two only control the little popovers; the actual language value still lives in App.vue.
const langOpen = ref(false)
const supportOpen = ref(false)

function selectLang(code) {
  setLang(code)
  langOpen.value = false
}

function isItemActive(item) {
  if (props.currentPage === item.id) return true
  return Array.isArray(item.children) && item.children.some((child) => child.id === props.currentPage)
}

function isSubmenuOpen(item) {
  return Boolean(item.children?.length) && supportOpen.value
}

function onNavItemClick(item) {
  // The support item opens its submenu first instead of jumping straight away.
  if (item.children?.length) {
    supportOpen.value = !supportOpen.value
    langOpen.value = false
    return
  }
  emit('navigate', item.id)
  supportOpen.value = false
}

function onChildClick(childId) {
  emit('navigate', childId)
  supportOpen.value = false
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
          <div
            v-for="item in navItems"
            :key="item.id"
            class="position-relative nav-menu-group"
          >
            <button
              type="button"
              class="btn nav-btn"
              :class="isItemActive(item) ? 'nav-btn-active' : 'nav-btn-idle'"
              :aria-expanded="item.children?.length ? isSubmenuOpen(item) : undefined"
              @click="onNavItemClick(item)"
            >
              <IconGlyph :name="item.icon" />
              <span>{{ t(lang, `nav.${item.id}`) }}</span>
            </button>

            <div
              v-if="isSubmenuOpen(item)"
              class="nav-submenu"
            >
              <button
                v-for="child in item.children"
                :key="child.id"
                type="button"
                class="btn nav-btn nav-submenu-btn"
                :class="currentPage === child.id ? 'nav-btn-active' : 'nav-btn-idle'"
                @click="onChildClick(child.id)"
              >
                <IconGlyph :name="child.icon" />
                <span>{{ t(lang, `nav.${child.id}`) }}</span>
              </button>
            </div>
          </div>
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
}

.nav-submenu {
  position: absolute;
  top: calc(100% + 0.6rem);
  left: 0;
  display: grid;
  gap: 0.75rem;
  z-index: 9998;
  padding-top: 0.1rem;
  width: 100%;
}

.nav-submenu-btn {
  width: 100%;
  justify-content: flex-start;
  padding: 0.9rem 1.25rem;
  background: var(--brand-blue);
  border-color: rgba(255, 255, 255, 0.28);
  color: #fff;
}

.nav-submenu-btn:hover {
  background: var(--brand-blue-strong);
  border-color: rgba(255, 255, 255, 0.65);
  color: #fff;
}

@media (max-width: 991.98px) {
  .nav-menu-group {
    width: 100%;
  }

  .nav-submenu {
    position: static;
    margin-top: 0.6rem;
    width: 100%;
  }

  .nav-submenu-btn {
    width: 100%;
  }

  .brand-copy strong {
    white-space: normal;
  }
}
</style>
