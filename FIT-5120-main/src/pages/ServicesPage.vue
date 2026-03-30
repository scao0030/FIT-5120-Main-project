<script setup>
import IconGlyph from '../components/IconGlyph.vue'
import { serviceCards } from '../data/siteContent'
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section">
      <div class="hero-copy-sm mb-4">
        <h1 class="display-6 fw-bold mb-3">Australian Digital Services Directory</h1>
        <p class="lead text-secondary mb-0">A plain-language guide to common government websites. Learn what they are for and access them safely.</p>
      </div>

      <div class="row g-4">
        <div v-for="service in serviceCards" :key="service.title" class="col-md-6">
          <article class="card soft-card h-100">
            <div class="card-body p-4 d-flex flex-column">
              <div class="d-flex gap-3 align-items-start mb-3">
                <div class="tile-icon tile-icon-sm" :class="`tone-${service.tone}`"><IconGlyph :name="service.icon" /></div>
                <div>
                  <h3 class="h3 mb-2">{{ service.title }}</h3>
                  <p class="text-secondary mb-0">{{ service.description }}</p>
                </div>
              </div>

              <h4 class="h6 fw-bold mt-2">What can you do here?</h4>
              <ul class="text-secondary mb-4">
                <li v-for="bullet in service.bullets" :key="bullet" class="mb-2">{{ bullet }}</li>
              </ul>

              <div class="mt-auto d-flex flex-column flex-sm-row gap-2">
                <button class="btn btn-primary" type="button">Visit Website <IconGlyph name="ext" /></button>
                <button class="btn btn-outline-secondary" type="button"><IconGlyph name="phone" /> Get Help</button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
