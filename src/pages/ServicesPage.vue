<script setup>
import { inject } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
import { serviceCards } from '../data/siteContent'
import { t } from '../i18n/index.js'

const emit = defineEmits(['navigate'])
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
      <div class="hero-copy-sm text-center mx-auto mb-4">
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

      <section class="service-journey mt-5">
        <div class="service-journey-card">
          <div class="service-journey-copy">
            <span class="service-journey-kicker">{{ t(lang, 'journey.services.kicker') }}</span>
            <h2 class="service-journey-title mt-3 mb-2">{{ t(lang, 'journey.services.title') }}</h2>
            <p class="service-journey-body mb-0">{{ t(lang, 'journey.services.body') }}</p>
          </div>

          <button type="button" class="btn btn-primary btn-lg service-journey-btn" @click="emit('navigate', 'help')">
            <IconGlyph name="pin" /> {{ t(lang, 'journey.services.cta') }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.service-journey-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.75rem 1.9rem;
  border: 1px solid rgba(103, 128, 194, 0.16);
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(255, 204, 126, 0.2), transparent 30%),
    radial-gradient(circle at bottom right, rgba(65, 147, 116, 0.16), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 251, 255, 0.98));
  box-shadow: 0 22px 46px rgba(69, 91, 142, 0.12);
}

.service-journey-copy {
  max-width: 40rem;
}

.service-journey-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: rgba(34, 98, 81, 0.1);
  color: #226251;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.service-journey-title {
  font-size: clamp(1.6rem, 2vw, 2.15rem);
  font-weight: 800;
  color: #1f2f54;
}

.service-journey-body {
  color: #5f6f94;
  font-size: 1rem;
}

.service-journey-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 3.4rem;
  padding-inline: 1.4rem;
  border-radius: 18px;
  font-weight: 800;
  flex-shrink: 0;
}

@media (max-width: 767.98px) {
  .service-journey-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.35rem;
  }

  .service-journey-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
