<script setup>
import IconGlyph from '../components/IconGlyph.vue'
import { helpPlaces } from '../data/siteContent'
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section">
      <div class="text-center hero-copy-sm mx-auto mb-4">
        <h1 class="display-6 fw-bold mb-3">Find Local Digital Help</h1>
        <p class="lead text-secondary mb-0">Get free, in-person assistance with your devices at libraries, community centres, and Be Connected network hubs near you.</p>
      </div>

      <div class="card soft-card mb-4 mx-auto search-card">
        <div class="card-body p-4">
          <label class="form-label fw-semibold" for="search-place">Enter your postcode or suburb</label>
          <div class="row g-2">
            <div class="col-md-9">
              <div class="input-group input-group-lg">
                <span class="input-group-text bg-white"><IconGlyph name="search" /></span>
                <input id="search-place" type="text" class="form-control" placeholder="e.g. 3000 or Melbourne" />
              </div>
            </div>
            <div class="col-md-3 d-grid">
              <button class="btn btn-primary btn-lg" type="button">Search</button>
            </div>
          </div>
        </div>
      </div>

      <h2 class="h2 fw-bold mb-4 d-flex align-items-center gap-2"><IconGlyph name="pin" /> Places offering free help near you</h2>
      <div class="row g-4">
        <div v-for="place in helpPlaces" :key="place.name" class="col-lg-4 col-md-6">
          <article class="card soft-card h-100 overflow-hidden">
            <div class="card-header bg-primary-subtle d-flex justify-content-between align-items-start gap-3 p-4">
              <div>
                <h3 class="h4 mb-2">{{ place.name }}</h3>
                <p class="text-secondary mb-0 d-flex gap-2"><IconGlyph name="pin" /> {{ place.address }}</p>
              </div>
              <span class="badge rounded-pill text-bg-primary">{{ place.distance }}</span>
            </div>
            <div class="card-body p-4 d-flex flex-column">
              <p class="text-secondary d-flex gap-2 mb-2"><IconGlyph name="clock" /> {{ place.hours }}</p>
              <p class="text-secondary d-flex gap-2 mb-2"><IconGlyph name="phone" /> {{ place.phone }}</p>
              <p class="text-primary d-flex gap-2 mb-3"><IconGlyph name="globe" /> {{ place.site }}</p>
              <div class="mb-4">
                <strong class="d-block mb-2">Services offered:</strong>
                <div class="d-flex flex-wrap gap-2">
                  <span v-for="tag in place.tags" :key="tag" class="badge text-bg-light border text-secondary-emphasis">{{ tag }}</span>
                </div>
              </div>
              <button class="btn btn-outline-primary mt-auto" type="button"><IconGlyph name="arrowRight" /> Get Directions</button>
            </div>
          </article>
        </div>
      </div>

      <section class="cta-panel text-center text-white p-4 p-md-5 mt-4">
        <h2 class="fw-bold mb-3">Need help finding a location?</h2>
        <p class="mb-4 mx-auto cta-copy">You can call the free Be Connected helpline. They can find a local centre for you and answer basic questions.</p>
        <button class="btn btn-light btn-lg text-primary fw-semibold" type="button"><IconGlyph name="phone" /> 1300 795 897</button>
      </section>
    </div>
  </section>
</template>
