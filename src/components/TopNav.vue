<script setup>
import IconGlyph from './IconGlyph.vue'

defineProps({ navItems: Array, currentPage: String })
const emit = defineEmits(['navigate'])
</script>

<template>
  <header class="site-header sticky-top">
    <div class="site-header-line"></div>
    <nav class="navbar navbar-expand-lg py-2">
      <div class="container-xl align-items-center gap-3">
        <button class="navbar-brand d-flex align-items-center gap-2 text-white bg-transparent border-0 p-0" type="button" @click="emit('navigate', 'home')">
          <span class="brand-icon"><IconGlyph name="book" /></span>
          <span class="d-flex flex-column align-items-start lh-1">
            <strong>Be Connected</strong>
            <small>Digital Skills for Seniors</small>
          </span>
        </button>

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
            <span>{{ item.label }}</span>
          </button>
        </div>

        <button class="btn nav-btn nav-btn-idle language-btn" type="button">
          <IconGlyph name="globe" />
          <span>English</span>
        </button>
      </div>
    </nav>
  </header>
</template>
