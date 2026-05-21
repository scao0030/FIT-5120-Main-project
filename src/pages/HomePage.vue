<script setup>
import { inject } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
import { featureCards } from '../data/siteContent'
import { t } from '../i18n/index.js'

const emit = defineEmits(['navigate'])
const lang = inject('lang')
</script>

<template>
  <!-- Home is a simple navigation hub: all CTA tiles emit page changes back to App.vue. -->
  <section class="app-page pb-5">
    <div class="container-xl py-5 text-center">
      <div class="mx-auto hero-copy">
        <h1 class="display-4 fw-bold mb-3">{{ t(lang, 'home.hero') }}</h1>
        <p class="lead text-secondary mb-0">{{ t(lang, 'home.heroSub') }}</p>
      </div>
    </div>

    <div class="container-xl pb-5">
      <div class="home-story-copy mx-auto">
        <section class="home-story-block">
          <div class="home-story-icon text-primary"><IconGlyph name="building" /></div>
          <h2 class="home-story-title fw-bold mb-3">{{ t(lang, 'home.aboutTitle') }}</h2>
          <p class="home-story-body mb-0">{{ t(lang, 'home.aboutBody') }}</p>
          <ul class="home-story-list mb-0">
            <li v-for="bullet in t(lang, 'home.aboutBullets')" :key="bullet">{{ bullet }}</li>
          </ul>
        </section>

        <section class="home-story-block">
          <div class="home-story-icon text-primary"><IconGlyph name="warning" /></div>
          <h2 class="home-story-title fw-bold mb-3">{{ t(lang, 'home.whyTitle') }}</h2>
          <p class="home-story-body mb-0">{{ t(lang, 'home.whyBody') }}</p>
          <ul class="home-story-list mb-0">
            <li v-for="bullet in t(lang, 'home.whyBullets')" :key="bullet">{{ bullet }}</li>
          </ul>
        </section>
      </div>
    </div>

    <div class="container-xl pb-5">
      <h2 class="home-feature-heading text-center fw-bold mb-4">{{ t(lang, 'home.startTitle') }}</h2>
      <div class="home-feature-grid">
        <div
          v-for="card in featureCards"
          :key="card.id"
          :class="{ 'home-feature-grid-wide': ['help', 'games'].includes(card.id) }"
        >
          <button type="button" class="card feature-tile h-100 text-start" :class="`tone-${card.tone}`" @click="emit('navigate', card.id)">
            <div class="card-body d-flex flex-column p-4">
              <div class="d-flex gap-3 align-items-start mb-3">
                <div class="tile-icon"><IconGlyph :name="card.icon" /></div>
                <h3 class="h2 fw-bold mb-0 home-feature-title">{{ t(lang, `featureCards.${card.id}.title`) }}</h3>
              </div>
              <p class="text-secondary mb-3 home-feature-description">{{ t(lang, `featureCards.${card.id}.description`) }}</p>
              <span class="fw-semibold text-primary d-inline-flex align-items-center gap-2 mt-auto home-feature-cta">
                  {{ t(lang, `featureCards.${card.id}.cta`) }}
                  <IconGlyph name="arrowRight" />
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
