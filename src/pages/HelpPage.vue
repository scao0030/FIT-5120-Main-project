<script setup>
// ============================================================
// HelpPage.vue — Find Local Digital Help (Epic 3)
// Responsibilities:
//   Helps older Australians locate nearby venues that offer
//   free in-person digital assistance — public libraries,
//   community centres, and Be Connected hubs.
//
// Implementation notes:
//   - The search input is currently presentational (no live
//     filtering logic). Active search is planned for a future
//     iteration.
//   - helpPlaces in siteContent.js contains placeholder data.
//     Replace with real AIHW / library open data before launch.
// ============================================================

import { inject } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
// helpPlaces: array of location objects
// (name, address, hours, phone, site, tags, distance)
import { helpPlaces } from '../data/siteContent'
import { t } from '../i18n/index.js'

const lang = inject('lang')
</script>

<template>
  <!-- Search UI is currently presentational; cards come from the local placeholder dataset. -->
  <section class="app-page pb-5">
    <div class="container page-section">

      <!-- Page header -->
      <div class="text-center hero-copy-sm mx-auto mb-4">
        <h1 class="display-6 fw-bold mb-3">{{ t(lang, 'help.pageTitle') }}</h1>
        <p class="lead text-secondary mb-0">{{ t(lang, 'help.pageSubtitle') }}</p>
      </div>

      <!-- Search card: suburb / postcode input
           The search button does not yet trigger filtering — reserved for a future iteration -->
      <div class="card soft-card mb-4 mx-auto search-card">
        <div class="card-body p-4">
          <label class="form-label fw-semibold" for="search-place">{{ t(lang, 'help.searchLabel') }}</label>
          <div class="row g-2">
            <div class="col-md-9">
              <div class="input-group input-group-lg">
                <span class="input-group-text bg-white"><IconGlyph name="search" /></span>
                <input id="search-place" type="text" class="form-control" :placeholder="t(lang, 'help.searchPlaceholder')" />
              </div>
            </div>
            <div class="col-md-3 d-grid">
              <button class="btn btn-primary btn-lg" type="button">{{ t(lang, 'help.searchBtn') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Nearby locations heading -->
      <h2 class="h2 fw-bold mb-4 d-flex align-items-center gap-2">
        <IconGlyph name="pin" /> {{ t(lang, 'help.nearbyTitle') }}
      </h2>

      <!-- Location card grid: 3 cols on large screens, 2 on medium -->
      <div class="row g-4">
        <div v-for="place in helpPlaces" :key="place.name" class="col-lg-4 col-md-6">
          <article class="card soft-card h-100 overflow-hidden">

            <!-- Card header: venue name, address, and distance badge -->
            <div class="card-header bg-primary-subtle d-flex justify-content-between align-items-start gap-3 p-4">
              <div>
                <h3 class="h4 mb-2">{{ place.name }}</h3>
                <p class="text-secondary mb-0 d-flex gap-2"><IconGlyph name="pin" /> {{ place.address }}</p>
              </div>
              <!-- Distance badge e.g. "1.2 km away" -->
              <span class="badge rounded-pill text-bg-primary">{{ place.distance }}</span>
            </div>

            <!-- Card body: hours, phone, website, service tags, directions button -->
            <div class="card-body p-4 d-flex flex-column">
              <p class="text-secondary d-flex gap-2 mb-2"><IconGlyph name="clock" /> {{ place.hours }}</p>
              <p class="text-secondary d-flex gap-2 mb-2"><IconGlyph name="phone" /> {{ place.phone }}</p>
              <p class="text-primary d-flex gap-2 mb-3"><IconGlyph name="globe" /> {{ place.site }}</p>

              <!-- Service tags: e.g. "Free Wi-Fi", "Walk-in welcome" -->
              <div class="mb-4">
                <strong class="d-block mb-2">{{ t(lang, 'help.servicesOffered') }}</strong>
                <div class="d-flex flex-wrap gap-2">
                  <span v-for="tag in place.tags" :key="tag" class="badge text-bg-light border text-secondary-emphasis">{{ tag }}</span>
                </div>
              </div>

              <!-- Get Directions button: mt-auto pins it to the card bottom -->
              <button class="btn btn-outline-primary mt-auto" type="button">
                <IconGlyph name="arrowRight" /> {{ t(lang, 'help.getDirections') }}
              </button>
            </div>
          </article>
        </div>
      </div>

      <!-- CTA panel: Be Connected helpline (1300 795 897) -->
      <section class="cta-panel text-center text-white p-4 p-md-5 mt-4">
        <h2 class="fw-bold mb-3">{{ t(lang, 'help.ctaTitle') }}</h2>
        <p class="mb-4 mx-auto cta-copy">{{ t(lang, 'help.ctaBody') }}</p>
        <button class="btn btn-light btn-lg text-primary fw-semibold" type="button">
          <IconGlyph name="phone" /> 1300 795 897
        </button>
      </section>
    </div>
  </section>
</template>