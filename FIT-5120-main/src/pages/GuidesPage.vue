<script setup>
import { computed, ref } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
import { filters, lessons } from '../data/siteContent'

const lessonFilter = ref('all')
const selectedLesson = ref(null)
const completedIds = ref([])

const visibleLessons = computed(() =>
  lessonFilter.value === 'all'
    ? lessons
    : lessons.filter((l) => l.filter === lessonFilter.value),
)

const completedCount = computed(() => completedIds.value.length)
const progressPercent = computed(() => Math.round((completedCount.value / lessons.length) * 100))

function openLesson(lesson) {
  selectedLesson.value = lesson
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeLesson() {
  selectedLesson.value = null
}

function markComplete(lessonId) {
  if (!completedIds.value.includes(lessonId)) {
    completedIds.value.push(lessonId)
  }
  selectedLesson.value = null
}

function isCompleted(lessonId) {
  return completedIds.value.includes(lessonId)
}
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section">

      <!-- Lesson detail view -->
      <div v-if="selectedLesson">
        <button class="btn btn-outline-secondary mb-4" type="button" @click="closeLesson">
          ← Back to all lessons
        </button>

        <div class="card soft-card mb-4">
          <div class="card-body p-4 p-md-5">
            <div class="d-flex align-items-center gap-3 mb-2">
              <div class="tile-icon tile-icon-sm bg-primary-subtle text-primary">
                <IconGlyph :name="selectedLesson.icon" />
              </div>
              <span class="badge rounded-pill" :class="selectedLesson.tone === 'green' ? 'text-bg-success-subtle text-success-emphasis' : 'text-bg-warning-subtle text-warning-emphasis'">
                {{ selectedLesson.level }}
              </span>
            </div>
            <h1 class="display-6 fw-bold mb-2">{{ selectedLesson.title }}</h1>
            <p class="lead text-secondary mb-0">{{ selectedLesson.description }}</p>
          </div>
        </div>

        <h2 class="h4 fw-bold mb-3">Follow these steps:</h2>
        <div class="vstack gap-3 mb-4">
          <div
            v-for="(step, index) in selectedLesson.steps"
            :key="index"
            class="card soft-card"
          >
            <div class="card-body p-4 d-flex gap-3 align-items-start">
              <span class="tip-number flex-shrink-0">{{ index + 1 }}</span>
              <div>
                <h3 class="h5 fw-bold mb-1">{{ step.title }}</h3>
                <p class="text-secondary mb-0">{{ step.detail }}</p>
                <div v-if="step.tip" class="alert alert-warning mt-3 mb-0 py-2 px-3 small">
                  💡 <strong>Tip:</strong> {{ step.tip }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex gap-3 flex-wrap">
          <button
            v-if="!isCompleted(selectedLesson.id)"
            class="btn btn-primary btn-lg"
            type="button"
            @click="markComplete(selectedLesson.id)"
          >
            ✓ Mark as complete
          </button>
          <div v-else class="alert alert-success mb-0 py-2 px-4">
            ✓ You've completed this lesson!
          </div>
          <button class="btn btn-outline-secondary btn-lg" type="button" @click="closeLesson">
            Back to lessons
          </button>
        </div>
      </div>

      <!-- Lesson list view -->
      <div v-else>
        <div class="text-center hero-copy-sm mx-auto mb-4">
          <h1 class="display-6 fw-bold mb-3">Digital Skills Lessons</h1>
          <p class="lead text-secondary mb-0">
            Choose a lesson to begin learning. Start with beginner lessons and work your way up.
          </p>
        </div>

        <!-- Progress bar -->
        <div class="card soft-card mb-4">
          <div class="card-body p-4">
            <div class="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
              <h3 class="h4 mb-0">Your Progress</h3>
              <span class="text-secondary">{{ completedCount }} of {{ lessons.length }} lessons completed</span>
            </div>
            <div class="progress" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Filter buttons -->
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

        <!-- Lesson cards -->
        <div class="row g-4">
          <div v-for="lesson in visibleLessons" :key="lesson.id" class="col-md-6 col-lg-4">
            <article
              class="card soft-card h-100 lesson-card"
              role="button"
              tabindex="0"
              @click="openLesson(lesson)"
              @keyup.enter="openLesson(lesson)"
            >
              <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div class="tile-icon tile-icon-sm bg-primary-subtle text-primary">
                    <IconGlyph :name="lesson.icon" />
                  </div>
                  <span v-if="isCompleted(lesson.id)" class="badge text-bg-success">✓ Done</span>
                  <span v-else class="rounded-circle border lesson-dot"></span>
                </div>
                <h3 class="h4 mb-2">{{ lesson.title }}</h3>
                <p class="text-secondary mb-3">{{ lesson.description }}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="badge rounded-pill" :class="lesson.tone === 'green' ? 'text-bg-success-subtle text-success-emphasis' : 'text-bg-warning-subtle text-warning-emphasis'">
                    {{ lesson.level }}
                  </span>
                  <span class="text-primary small fw-semibold">Start lesson →</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
.lesson-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.lesson-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}
</style>