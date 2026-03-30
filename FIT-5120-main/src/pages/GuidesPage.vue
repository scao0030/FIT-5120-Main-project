<script setup>
import { computed, ref } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
import { filters, lessons } from '../data/siteContent'

const lessonFilter = ref('internet')
const visibleLessons = computed(() =>
  lessonFilter.value === 'all' ? lessons : lessons.filter((lesson) => lesson.filter === lessonFilter.value),
)
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section">
      <div class="text-center hero-copy-sm mx-auto mb-4">
        <h1 class="display-6 fw-bold mb-3">Digital Skills Lessons</h1>
        <p class="lead text-secondary mb-0">Choose a lesson to begin learning. Start with beginner lessons and work your way up.</p>
      </div>

      <div class="card soft-card mb-4">
        <div class="card-body p-4">
          <div class="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
            <h3 class="h4 mb-0">Your Progress</h3>
            <span class="text-secondary">0 of 10 lessons completed</span>
          </div>
          <div class="progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar w-0"></div>
          </div>
        </div>
      </div>

      <h2 class="h3 fw-bold mb-3">Filter by Category</h2>
      <div class="d-flex flex-wrap gap-2 mb-4">
        <button
          v-for="filter in filters"
          :key="filter.id"
          type="button"
          class="btn"
          :class="lessonFilter === filter.id ? 'btn-primary' : 'btn-outline-secondary'"
          @click="lessonFilter = filter.id"
        >
          {{ filter.label }}
        </button>
      </div>

      <div class="row g-4">
        <div v-for="lesson in visibleLessons" :key="lesson.title" class="col-md-6 col-lg-4">
          <article class="card soft-card h-100">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="tile-icon tile-icon-sm bg-primary-subtle text-primary"><IconGlyph :name="lesson.icon" /></div>
                <span class="rounded-circle border lesson-dot"></span>
              </div>
              <h3 class="h4 mb-2">{{ lesson.title }}</h3>
              <p class="text-secondary mb-3">{{ lesson.description }}</p>
              <span class="badge rounded-pill" :class="lesson.tone === 'green' ? 'text-bg-success-subtle text-success-emphasis' : 'text-bg-warning-subtle text-warning-emphasis'">{{ lesson.level }}</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
