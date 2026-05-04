<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
})

// Central icon registry so pages only reference semantic names, not Bootstrap classes directly.
const iconMap = {
  home: 'bi-house-door',
  book: 'bi-book',
  columns: 'bi-layout-three-columns',
  shield: 'bi-shield',
  shieldAlert: 'bi-shield-exclamation',
  pin: 'bi-geo-alt',
  checkShield: 'bi-shield-check',
  globe: 'bi-globe2',
  cart: 'bi-cart3',
  search: 'bi-search',
  building: 'bi-building',
  phone: 'bi-telephone',
  mail: 'bi-envelope',
  link: 'bi-link-45deg',
  arrowRight: 'bi-arrow-right',
  warning: 'bi-exclamation-triangle',
  clock: 'bi-clock',
  ext: 'bi-box-arrow-up-right',
  fonts: 'bi-fonts',
}

const iconClass = computed(() => iconMap[props.name] || 'bi-square')
</script>

<template>
  <i class="bi" :class="iconClass" aria-hidden="true"></i>
</template>
