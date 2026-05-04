<script setup>
import { inject } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
import { serviceCards } from '../data/siteContent'
import { t } from '../i18n/index.js'

const lang = inject('lang')

// serviceCards holds immutable metadata like URLs and phone numbers; text labels come from i18n.
const cardKeyMap = {
  'myGov': 'myGov',
  'Medicare Online': 'medicare',
  'Centrelink': 'centrelink',
  'My Aged Care': 'agedCare',
}
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section">
      <div class="hero-copy-sm mb-4">
        <h1 class="display-6 fw-bold mb-3">{{ t(lang, 'services.pageTitle') }}</h1>
        <p class="lead text-secondary mb-0">{{ t(lang, 'services.pageSubtitle') }}</p>
      </div>

      <div class="row g-4">
        <div v-for="service in serviceCards" :key="service.title" class="col-md-6">
          <article class="card soft-card h-100">
            <div class="card-body p-4 d-flex flex-column">
              <div class="d-flex gap-3 align-items-start mb-3">
                <div class="tile-icon tile-icon-sm" :class="`tone-${service.tone}`"><IconGlyph :name="service.icon" /></div>
                <div>
                  <h3 class="h3 mb-2">{{ t(lang, `serviceCards.${cardKeyMap[service.title]}.title`) }}</h3>
                  <p class="text-secondary mb-0">{{ t(lang, `serviceCards.${cardKeyMap[service.title]}.description`) }}</p>
                </div>
              </div>

              <h4 class="h6 fw-bold mt-2">{{ t(lang, 'services.whatCanYouDo') }}</h4>
              <ul class="text-secondary mb-4">
                <li
                  v-for="(bullet, i) in t(lang, `serviceCards.${cardKeyMap[service.title]}.bullets`)"
                  :key="i"
                  class="mb-2"
                >{{ bullet }}</li>
              </ul>

              <div class="mt-auto d-flex flex-column flex-sm-row gap-2">
                <a :href="service.url" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                  {{ t(lang, 'services.visitWebsite') }} <IconGlyph name="ext" />
                </a>
                <a :href="`tel:${service.phone}`" class="btn btn-outline-secondary">
                  <IconGlyph name="phone" /> {{ service.phone }}
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
