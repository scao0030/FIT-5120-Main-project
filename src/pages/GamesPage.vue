<script setup>
import { ref, computed, inject } from 'vue'
import { t } from '../i18n/index.js'
import MemoryMatchGame from '../games/MemoryMatchGame.vue'
import WordRecallGame from '../games/WordRecallGame.vue'
import PatternRecoGame from '../games/PatternRecoGame.vue'
import NumberSpeedGame from '../games/NumberSpeedGame.vue'
import SpatialThinkingGame from '../games/SpatialThinkingGame.vue'

const lang = inject('lang')

// Day schedule: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
const SCHEDULE = { 1: 'memory', 2: 'word', 3: 'pattern', 4: 'number', 5: 'spatial' }

// Game metadata keys only — display strings come from i18n
const GAME_META = {
  memory:  { id: 'memory',  emoji: '🃏', tone: 'blue',   key: 'memory'  },
  word:    { id: 'word',    emoji: '💬', tone: 'green',  key: 'word'    },
  pattern: { id: 'pattern', emoji: '🔷', tone: 'purple', key: 'pattern' },
  number:  { id: 'number',  emoji: '⚡', tone: 'orange', key: 'number'  },
  spatial: { id: 'spatial', emoji: '🧩', tone: 'red',    key: 'spatial' },
}

const today      = new Date()
const todayDow   = today.getDay()
const isWeekend  = todayDow === 0 || todayDow === 6
const todayGameId = SCHEDULE[todayDow] || null

const activeGame = ref(null)
const scores     = ref({})

const todayGame = computed(() => todayGameId ? GAME_META[todayGameId] : null)
const availableGames = computed(() =>
  isWeekend ? Object.values(GAME_META) : todayGame.value ? [todayGame.value] : []
)

// i18n helpers
const gt = (path) => t(lang.value, `games.${path}`)
const gameT = (gameKey, field) => t(lang.value, `games.gameList.${gameKey}.${field}`)

function getDayLabel(dow) {
  if (dow === 0 || dow === 6) return null
  const gameKey = SCHEDULE[dow]
  return gameKey ? gameT(gameKey, 'dayLabel') : ''
}

function launchGame(id) { activeGame.value = id; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function closeGame()    { activeGame.value = null; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function onScore(gameId, score) { scores.value[gameId] = score }

const GAME_COMPONENTS = {
  memory: MemoryMatchGame,
  word: WordRecallGame,
  pattern: PatternRecoGame,
  number: NumberSpeedGame,
  spatial: SpatialThinkingGame,
}
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section d-flex flex-column align-items-center">

      <!-- ── Active game ── -->
      <div v-if="activeGame" class="w-100">
        <button class="btn btn-outline-secondary mb-4" @click="closeGame">{{ gt('backToGames') }}</button>
        <component
          :is="GAME_COMPONENTS[activeGame]"
          :game-meta="GAME_META[activeGame]"
          :saved-score="scores[activeGame]"
          @score-update="onScore(activeGame, $event)"
        />
      </div>

      <!-- ── Hub ── -->
      <div v-else class="w-100">

        <!-- Hero -->
        <div class="hero-copy-sm mb-4">
          <div class="d-flex align-items-center gap-3 mb-2">
            <div class="hero-icon" style="background:rgba(226,235,255,0.85);color:var(--brand-blue-strong);">🧠</div>
            <div>
              <h1 class="display-6 fw-bold mb-0" style="font-size:2rem;">{{ gt('heroTitle') }}</h1>
              <p class="text-secondary mb-0" style="font-size:1.1rem;">{{ gt('heroSub') }}</p>
            </div>
          </div>
        </div>

        <!-- Science bar -->
        <div class="soft-card d-flex align-items-center gap-3 p-3 mb-4 mx-auto" style="max-width:52rem;background:rgba(35,71,182,0.88);backdrop-filter:blur(8px);color:#fff;">
          <span style="font-size:1.5rem;flex-shrink:0;">🧬</span>
          <span style="font-size:1rem;" v-html="gt('scienceBar')"></span>
        </div>

        <!-- Weekly schedule -->
        <div class="soft-card mb-4 p-3 p-md-4 mx-auto" style="max-width:52rem;">
          <h2 class="fw-bold mb-3" style="font-size:1.3rem;">{{ gt('weeklySchedule') }}</h2>
          <div class="d-flex gap-2 flex-wrap">
            <div
              v-for="(dayKey, i) in ['sun','mon','tue','wed','thu','fri','sat']" :key="dayKey"
              class="text-center rounded-3 p-2 flex-fill"
              style="min-width:68px;transition:all .15s;"
              :style="i === todayDow
                ? 'background:var(--brand-blue);color:#fff;box-shadow:0 4px 12px rgba(35,71,182,.3);'
                : (i===0||i===6 ? 'background:rgba(255,255,255,0.5);border:1px dashed #c0cfe8;' : 'background:rgba(255,255,255,0.6);border:1px solid #e0e8f8;')"
            >
              <div class="fw-bold mb-1" style="font-size:0.95rem;">{{ gt(`days.${dayKey}`) }}</div>
              <div style="font-size:0.8rem;" :style="i===todayDow?'color:#ffffffcc':''">
                <template v-if="i===0||i===6">🎉 {{ gt('freeDay') }}</template>
                <template v-else>{{ getDayLabel(i) }}</template>
              </div>
            </div>
          </div>
        </div>

        <!-- Today banner (weekday) -->
        <div v-if="!isWeekend && todayGame" class="soft-card mb-4 p-4 mx-auto" style="max-width:52rem;border-left:4px solid var(--brand-blue-strong);">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div class="fw-semibold text-secondary text-uppercase mb-1" style="letter-spacing:.06em;font-size:0.95rem;">
                {{ gt('todayExercise') }}
              </div>
              <h2 class="fw-bold mb-1" style="font-size:1.5rem;">{{ todayGame.emoji }} {{ gameT(todayGame.key, 'title') }}</h2>
              <div class="text-secondary" style="font-size:1rem;">
                {{ gameT(todayGame.key, 'duration') }} &bull; {{ gameT(todayGame.key, 'desc') }}
              </div>
            </div>
            <button class="btn btn-primary px-4 py-2 fw-bold" style="min-width:100px;font-size:1.1rem;" @click="launchGame(todayGame.id)">
              {{ gt('startBtn') }}
            </button>
          </div>
        </div>

        <!-- Weekend banner -->
        <div v-if="isWeekend" class="soft-card mb-4 p-3 mx-auto" style="max-width:52rem;background:rgba(234,248,239,0.88);border-left:4px solid #18884a;color:#1b6c45;">
          <div class="fw-bold mb-1" style="font-size:1.1rem;">🎉 {{ gt('weekendTitle') }}</div>
          <div style="font-size:1rem;">{{ gt('weekendSub') }}</div>
        </div>

        <!-- Game tiles -->
        <h2 class="fw-bold mb-3 mx-auto" style="max-width:52rem;font-size:1.3rem;">
          {{ isWeekend ? gt('chooseGame') : gt('availableToday') }}
        </h2>
        <div class="row g-3 mx-auto" style="max-width:52rem;">
          <div v-for="game in availableGames" :key="game.id" class="col-md-6">
            <article
              class="card feature-tile h-100"
              :class="`tone-${game.tone}`"
              style="cursor:pointer;transition:transform .18s,box-shadow .18s;"
              @click="launchGame(game.id)"
              @mouseenter="e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 36px rgba(23,41,94,.15)' }"
              @mouseleave="e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }"
            >
              <div class="card-body p-4 d-flex flex-column gap-2">
                <div class="d-flex align-items-center gap-3 mb-1">
                  <div class="tile-icon tile-icon-sm" :class="`tone-${game.tone}`" style="font-size:1.5rem;">{{ game.emoji }}</div>
                  <div>
                    <div class="fw-bold" style="font-size:1.1rem;">{{ gameT(game.key, 'title') }}</div>
                    <div class="text-secondary" style="font-size:0.95rem;">{{ gameT(game.key, 'duration') }}</div>
                  </div>
                </div>
                <div class="text-secondary" style="font-size:1rem;">{{ gameT(game.key, 'desc') }}</div>
                <div v-if="scores[game.id]" class="mt-1 fw-semibold" style="color:var(--brand-blue-strong);font-size:0.95rem;">
                  {{ gt('bestScore') }}: Level {{ scores[game.id].level }}-{{ scores[game.id].subLevel }} &bull; {{ scores[game.id].bestScore }} pts
                </div>
                <div class="mt-auto pt-2">
                  <span class="btn btn-primary btn-sm" style="font-size:1rem;">{{ gt('playBtn') }}</span>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- How levels work -->
        <div class="soft-card mt-4 p-3 p-md-4 mx-auto" style="max-width:52rem;background:rgba(240,245,255,0.88);">
          <div class="fw-bold mb-1" style="font-size:1.1rem;">📊 {{ gt('howLevelsTitle') }}</div>
          <div class="text-secondary" style="font-size:1rem;" v-html="gt('howLevelsBody')"></div>
        </div>

      </div>
    </div>
  </section>
</template>