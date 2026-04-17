<script setup>
import IconGlyph from '../components/IconGlyph.vue'
import { featureCards } from '../data/siteContent'
const emit = defineEmits(['navigate'])
</script>

<template>
  <section class="app-page pb-5">
    <div class="announcement-bar text-center px-3 py-2">
      Welcome to your secure place for learning digital skills. All text is large and easy to read.
    </div>

    <div class="container-xl py-5 text-center">
      <div class="mx-auto hero-copy">
        <h1 class="display-4 fw-bold mb-3">Learn Digital Skills Safely and Easily</h1>
        <p class="lead text-secondary mb-0">
          Gain the confidence to use your smartphone, tablet, or computer. We help you stay connected,
          safe, and independent.
        </p>
      </div>
    </div>

    <div class="container-xl pb-4">
      <h2 class="text-center fw-bold mb-4">What would you like to do today?</h2>
      <div class="row g-4">
        <div v-for="card in featureCards" :key="card.id" :class="card.large ? 'col-lg-7' : 'col-lg-5 col-md-6'">
          <button type="button" class="card feature-tile h-100 text-start" :class="`tone-${card.tone}`" @click="emit('navigate', card.id)">
            <div class="card-body d-flex gap-3 align-items-start p-4">
              <div class="tile-icon"><IconGlyph :name="card.icon" /></div>
              <div>
                <h3 class="h2 fw-bold mb-3">{{ card.title }}</h3>
                <p class="text-secondary mb-3">{{ card.description }}</p>
                <span class="fw-semibold text-primary d-inline-flex align-items-center gap-2">
                  {{ card.cta }}
                  <IconGlyph name="arrowRight" />
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div class="container-xl pt-3">
      <section class="cta-panel text-center text-white p-4 p-md-5">
        <h2 class="fw-bold mb-3">Not sure where to start?</h2>
        <p class="mb-0 mx-auto cta-copy">
          If you feel overwhelmed, that's okay. You can find a local centre where a friendly person can help you
          face-to-face, for free.
        </p>
      </section>
    </div>
  </section>
</template>
