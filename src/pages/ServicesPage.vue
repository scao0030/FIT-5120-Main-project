<script setup>
// ============================================================
// ServicesPage.vue — Digital Services Directory (Epic 1)
// Responsibilities:
//   Displays four Australian government digital services:
//   myGov, Medicare Online, Centrelink, and My Aged Care.
//   Each card shows: icon, name, description, feature bullet
//   list, a Visit Website link, and a phone number.
//   All display text is resolved through i18n for multilingual
//   support across all four languages.
// ============================================================

import { inject } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
// serviceCards: static metadata that does NOT need translation —
// official URLs, phone numbers, icon names, and colour tones
import { serviceCards } from '../data/siteContent'
import { t } from '../i18n/index.js'

const lang = inject('lang')

// cardKeyMap: maps the English title in serviceCards to the
// short i18n key used for translated content lookups.
// Allows siteContent.js to use the full official service name
// while i18n uses concise, collision-free keys.
// e.g. 'Medicare Online' → 'medicare'
//      → t(lang, 'serviceCards.medicare.title / .description / .bullets')
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

      <!-- Page header -->
      <div class="hero-copy-sm mb-4">
        <h1 class="display-6 fw-bold mb-3">{{ t(lang, 'services.pageTitle') }}</h1>
        <p class="lead text-secondary mb-0">{{ t(lang, 'services.pageSubtitle') }}</p>
      </div>

      <!-- Two-column card grid -->
      <div class="row g-4">
        <div v-for="service in serviceCards" :key="service.title" class="col-md-6">
          <article class="card soft-card h-100">
            <div class="card-body p-4 d-flex flex-column">

              <!-- Card header: coloured icon + service name + short description -->
              <div class="d-flex gap-3 align-items-start mb-3">
                <!-- Icon colour determined by service.tone, matching homepage tiles -->
                <div class="tile-icon tile-icon-sm" :class="`tone-${service.tone}`"><IconGlyph :name="service.icon" /></div>
                <div>
                  <!-- cardKeyMap converts the raw title to the correct i18n key -->
                  <h3 class="h3 mb-2">{{ t(lang, `serviceCards.${cardKeyMap[service.title]}.title`) }}</h3>
                  <p class="text-secondary mb-0">{{ t(lang, `serviceCards.${cardKeyMap[service.title]}.description`) }}</p>
                </div>
              </div>

              <!-- "What can you do here?" feature bullet list -->
              <h4 class="h6 fw-bold mt-2">{{ t(lang, 'services.whatCanYouDo') }}</h4>
              <!-- bullets is a string array in i18n; v-for renders each as a list item -->
              <ul class="text-secondary mb-4">
                <li
                  v-for="(bullet, i) in t(lang, `serviceCards.${cardKeyMap[service.title]}.bullets`)"
                  :key="i"
                  class="mb-2"
                >{{ bullet }}</li>
              </ul>

              <!-- Action buttons pinned to card bottom with mt-auto for consistent alignment -->
              <div class="mt-auto d-flex flex-column flex-sm-row gap-2">
                <!-- External link: opens in new tab
                     rel="noopener noreferrer" prevents the new tab from accessing this window -->
                <a :href="service.url" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                  {{ t(lang, 'services.visitWebsite') }} <IconGlyph name="ext" />
                </a>
                <!-- tel: link allows mobile devices to dial directly -->
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