<script setup>
import IconGlyph from '../components/IconGlyph.vue'
import { scamCards } from '../data/siteContent'
</script>

<template>
  <!-- Static alert-style page for scam examples and reporting guidance. -->
  <section class="app-page pb-5">
    <div class="container page-section">
      <section class="alert-panel p-4 p-md-5 mb-4">
        <div class="d-flex gap-3 align-items-start">
          <div class="alert-panel-icon"><IconGlyph name="shieldAlert" /></div>
          <div>
            <h1 class="display-6 fw-bold mb-3">Scam Recognition &amp; Reporting</h1>
            <p class="lead mb-0">Real, current scam alerts to help you identify fake websites, emails, and suspicious phone calls. Protect your personal information.</p>
          </div>
        </div>
      </section>

      <h2 class="h2 fw-bold mb-4 d-flex align-items-center gap-2"><IconGlyph name="warning" /> Current Active Scams</h2>
      <div class="row g-4">
        <div v-for="scam in scamCards" :key="scam.title" class="col-md-6">
          <article class="card soft-card h-100">
            <div class="card-body p-4">
              <div class="d-flex gap-3 align-items-start mb-3">
                <div class="alert-panel-icon alert-panel-icon-sm"><IconGlyph :name="scam.icon" /></div>
                <div>
                  <div class="text-danger small fw-bold mb-1">{{ scam.type }}</div>
                  <h3 class="h4 mb-0">{{ scam.title }}</h3>
                </div>
              </div>
              <p class="text-secondary">{{ scam.description }}</p>
              <div class="advice-panel mt-3">
                <strong>What to do:</strong>
                <p class="mb-0 mt-2">{{ scam.advice }}</p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <section class="cta-panel text-center text-white p-4 p-md-5 mt-4">
        <h2 class="fw-bold mb-3">Have you been scammed or spotted a scam?</h2>
        <p class="mb-4 mx-auto cta-copy">Report it to Scamwatch immediately. Reporting helps warn others and can sometimes stop the scammers.</p>
        <button class="btn btn-light btn-lg text-primary fw-semibold" type="button">Report to Scamwatch</button>
      </section>
    </div>
  </section>
</template>
