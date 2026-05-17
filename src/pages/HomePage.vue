<script setup>
// ============================================================
// HomePage.vue — Landing Page / Navigation Hub
// Responsibilities:
//   Renders the announcement bar, hero section, feature card
//   grid, and bottom CTA panel.
//   All feature card clicks emit 'navigate' to App.vue which
//   swaps the active page. This component has no local state —
//   it is entirely data-driven by siteContent.js + i18n.
// ============================================================

import { inject } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
// featureCards: static metadata for each navigation tile
// (id, icon, tone colour, large flag)
import { featureCards } from '../data/siteContent'
import { t } from '../i18n/index.js'

// emit 'navigate': fired when a feature tile is clicked
// App.vue listens for this event and updates currentPage
const emit = defineEmits(['navigate'])
// lang: current language ref injected from App.vue via provide/inject
const lang = inject('lang')
</script>

<template>
  <!-- Home is a simple navigation hub: all CTA tiles emit page changes back to App.vue. -->
  <section class="app-page pb-5">

    <!-- Announcement bar: short informational message, styled with yellow background -->
    <div class="announcement-bar text-center px-3 py-2">
      {{ t(lang, 'home.announcement') }}
    </div>

    <!-- Hero section: main headline + subtitle, centred -->
    <div class="container-xl py-5 text-center">
      <div class="mx-auto hero-copy">
        <h1 class="display-4 fw-bold mb-3">{{ t(lang, 'home.hero') }}</h1>
        <p class="lead text-secondary mb-0">{{ t(lang, 'home.heroSub') }}</p>
      </div>
    </div>

    <!-- Feature card grid -->
    <div class="container-xl pb-4">
      <h2 class="text-center fw-bold mb-4">{{ t(lang, 'home.sectionTitle') }}</h2>
      <div class="row g-4">
        <!-- Iterate featureCards to generate navigation tiles.
             card.large === true  → col-lg-7 (wide tile)
             card.large === false → col-lg-5 col-md-6 (standard tile)
             tone-{card.tone} applies a matching colour theme from styles.css -->
        <div v-for="card in featureCards" :key="card.id" :class="card.large ? 'col-lg-7' : 'col-lg-5 col-md-6'">
          <!-- Entire card is a <button> so it is keyboard-accessible -->
          <button type="button" class="card feature-tile h-100 text-start" :class="`tone-${card.tone}`" @click="emit('navigate', card.id)">
            <div class="card-body d-flex gap-3 align-items-start p-4">
              <div class="tile-icon"><IconGlyph :name="card.icon" /></div>
              <div>
                <!-- Title, description and CTA text resolved from i18n using card.id as key -->
                <h3 class="h2 fw-bold mb-3">{{ t(lang, `featureCards.${card.id}.title`) }}</h3>
                <p class="text-secondary mb-3">{{ t(lang, `featureCards.${card.id}.description`) }}</p>
                <span class="fw-semibold text-primary d-inline-flex align-items-center gap-2">
                  {{ t(lang, `featureCards.${card.id}.cta`) }}
                  <IconGlyph name="arrowRight" />
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom CTA panel: encourages users to seek help if needed -->
    <div class="container-xl pt-3">
      <section class="cta-panel text-center text-white p-4 p-md-5">
        <h2 class="fw-bold mb-3">{{ t(lang, 'home.ctaTitle') }}</h2>
        <p class="mb-0 mx-auto cta-copy">{{ t(lang, 'home.ctaBody') }}</p>
      </section>
    </div>
  </section>
</template>