<script setup>
import IconGlyph from '../components/IconGlyph.vue'
import { checkerTips } from '../data/siteContent'
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section">
      <div class="text-center hero-copy-sm mx-auto mb-4">
        <div class="hero-icon mx-auto mb-3"><IconGlyph name="checkShield" /></div>
        <h1 class="display-6 fw-bold mb-3">Trusted Website Checker</h1>
        <p class="lead text-secondary mb-0">Not sure if a link is safe? Paste it here before you click. We will help you verify if the website is legitimate.</p>
      </div>

      <div class="card soft-card mx-auto checker-card mb-4">
        <div class="card-body p-4">
          <label class="form-label fw-semibold" for="checker-url">Paste the website address (URL) below:</label>
          <div class="input-group input-group-lg mb-3">
            <span class="input-group-text bg-white"><IconGlyph name="link" /></span>
            <input id="checker-url" type="text" class="form-control" placeholder="e.g. www.my.gov.au or https://suspicious-link.com" />
          </div>
          <button class="btn btn-primary btn-lg w-100" type="button"><IconGlyph name="checkShield" /> Check if this website is safe</button>
        </div>
      </div>

      <div class="card soft-card mx-auto checker-card">
        <div class="card-body p-4">
          <h2 class="h3 fw-bold mb-4 d-flex align-items-center gap-2"><IconGlyph name="warning" /> Tips for checking links yourself</h2>
          <div class="vstack gap-4">
            <article v-for="(tip, index) in checkerTips" :key="tip.title" class="d-flex gap-3 align-items-start">
              <span class="tip-number">{{ index + 1 }}</span>
              <div>
                <h3 class="h5 mb-2">{{ tip.title }}</h3>
                <p class="text-secondary mb-0">{{ tip.description }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
