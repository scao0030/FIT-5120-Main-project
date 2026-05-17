<script setup>
// ============================================================
// GamesPage.vue — Brain Age Reverse: Daily Cognitive Game Hub (Epic 6)
// Responsibilities:
//   Delivers five short cognitive training games to help older
//   Australians maintain mental sharpness.
//
// Rotation logic:
//   - Weekdays (Mon–Fri): one featured game per day based on
//     the current day of the week (SCHEDULE map)
//   - Weekends (Sat–Sun): all five games are available to play freely
//
// Privacy:
//   - No user data is collected or stored on a server
//   - Best scores live in component memory only and reset on page reload
//
// Game list:
//   Memory Match     — Monday    (visual working memory)
//   Word Recall      — Tuesday   (verbal memory)
//   Pattern Reco     — Wednesday (logical pattern recognition)
//   Number Speed     — Thursday  (processing speed)
//   Spatial Thinking — Friday    (spatial reasoning)
// ============================================================

import { ref, computed, inject } from 'vue'
import { t } from '../i18n/index.js'
// Each game is a self-contained Vue component with its own logic, state, and scoring
import MemoryMatchGame from '../games/MemoryMatchGame.vue'
import WordRecallGame from '../games/WordRecallGame.vue'
import PatternRecoGame from '../games/PatternRecoGame.vue'
import NumberSpeedGame from '../games/NumberSpeedGame.vue'
import SpatialThinkingGame from '../games/SpatialThinkingGame.vue'

const lang = inject('lang')

// SCHEDULE: maps JavaScript day-of-week numbers to game ids
// getDay() returns: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
// Weekends (0 and 6) are intentionally absent — handled separately
const SCHEDULE = { 1: 'memory', 2: 'word', 3: 'pattern', 4: 'number', 5: 'spatial' }

// GAME_META: static metadata for each game
//   id    — unique identifier used for routing and score tracking
//   emoji — visual icon displayed on game cards and in the hub
//   tone  — colour theme class (maps to CSS variables in styles.css)
//   key   — i18n key segment used for: games.gameList.{key}.title / description / etc.
const GAME_META = {
  memory:  { id: 'memory',  emoji: '🃏', tone: 'blue',   key: 'memory'  },
  word:    { id: 'word',    emoji: '💬', tone: 'green',  key: 'word'    },
  pattern: { id: 'pattern', emoji: '🔷', tone: 'purple', key: 'pattern' },
  number:  { id: 'number',  emoji: '⚡', tone: 'orange', key: 'number'  },
  spatial: { id: 'spatial', emoji: '🧩', tone: 'red',    key: 'spatial' },
}

// Determine today's schedule
const today      = new Date()
const todayDow   = today.getDay()                    // 0–6
const isWeekend  = todayDow === 0 || todayDow === 6  // Saturday or Sunday
const todayGameId = SCHEDULE[todayDow] || null       // null on weekends

// activeGame: id of the game currently being played; null = user is on the hub screen
const activeGame = ref(null)
// scores: session-only best scores, keyed by game id e.g. { memory: 85, word: 72 }
// Scores are never sent to a server and reset when the page is refreshed
const scores     = ref({})

// todayGame: resolved game metadata for today's featured game (null on weekends)
const todayGame = computed(() => todayGameId ? GAME_META[todayGameId] : null)

// availableGames: the list of games shown in the hub
//   Weekends → all five games (free choice)
//   Weekdays → single array containing only today's game
const availableGames = computed(() =>
  isWeekend ? Object.values(GAME_META) : todayGame.value ? [todayGame.value] : []
)

// i18n shorthand helpers to keep template expressions concise
// gt(path)            → t(lang, 'games.{path}')
// gameT(key, field)   → t(lang, 'games.gameList.{key}.{field}')
const gt = (path) => t(lang.value, `games.${path}`)
const gameT = (gameKey, field) => t(lang.value, `games.gameList.${gameKey}.${field}`)

// getDayLabel: returns the translated game label for a given weekday
// Used to populate the weekly schedule strip below the hub hero
// Returns null for Saturday and Sunday (they show a special "free choice" label instead)
function getDayLabel(dow) {
  if (dow === 0 || dow === 6) return null
  const gameKey = SCHEDULE[dow]
  return gameKey ? gameT(gameKey, 'dayLabel') : ''
}

// launchGame: enters a specific game and scrolls to the top so the game is fully visible
function launchGame(id) { activeGame.value = id; window.scrollTo({ top: 0, behavior: 'smooth' }) }
// closeGame: returns to the hub from an active game
function closeGame()    { activeGame.value = null; window.scrollTo({ top: 0, behavior: 'smooth' }) }

// onScore: receives a score-update event from a game component
// Stores the score in the session-only scores object
// The game component is responsible for determining when a score should be reported
function onScore(gameId, score) { scores.value[gameId] = score }

// GAME_COMPONENTS: maps game ids to their Vue component objects
// Used by <component :is="GAME_COMPONENTS[activeGame]"> to dynamically render the correct game
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

      <!-- ── Active Game View ── -->
      <!-- Shown when the user has launched a game (activeGame is not null) -->
      <div v-if="activeGame" class="w-100">
        <!-- Back to hub button -->
        <button class="btn btn-outline-secondary mb-4" @click="closeGame">{{ gt('backToGames') }}</button>

        <!-- Dynamically renders the correct game component based on activeGame
             game-meta  — passes id, emoji, and tone to the game component
             saved-score — passes the current session best so the game can display it
             @score-update — receives new scores from the game and stores them in memory -->
        <component
          :is="GAME_COMPONENTS[activeGame]"
          :game-meta="GAME_META[activeGame]"
          :saved-score="scores[activeGame]"
          @score-update="onScore(activeGame, $event)"
        />
      </div>

      <!-- ── Game Hub View ── -->
      <!-- Shown when no game is active (activeGame is null) -->
      <div v-else class="w-100">

        <!-- Hero section: brain icon + title + subtitle -->
        <div class="hero-copy-sm mb-4">
          <div class="d-flex align-items-center gap-3 mb-2">
            <div class="hero-icon" style="background:rgba(226,235,255,0.85);color:var(--brand-blue-strong);">🧠</div>
            <div>
              <h1 class="display-6 fw-bold mb-0" style="font-size:2rem;">{{ gt('heroTitle') }}</h1>
              <p class="text-secondary mb-0" style="font-size:1.1rem;">{{ gt('heroSub') }}</p>
            </div>
          </div>
        </div>

        <!-- Science credibility bar: references cognitive science research
             v-html is used here because the i18n string may contain <strong> tags -->
        <div class="soft-card d-flex align-items-center gap-3 p-3 mb-4 mx-auto" style="max-width:52rem;background:rgba(35,71,182,0.88);backdrop-filter:blur(8px);color:#fff;">
          <span style="font-size:1.5rem;flex-shrink:0;">🧬</span>
          <span style="font-size:1rem;" v-html="gt('scienceBar')"></span>
        </div>

        <!-- Weekly schedule strip: shows which game is assigned to each day
             Days are iterated Mon–Fri–Sat–Sun (1–5–6–0 maps to JS getDay() values)
             Today's day is highlighted with 'schedule-day-today' class -->
        <div class="soft-card mb-4 p-3 p-md-4 mx-auto" style="max-width:52rem;">
          <h2 class="fw-bold mb-3" style="font-size:1.3rem;">{{ gt('weeklySchedule') }}</h2>
          <div class="d-flex gap-2 flex-wrap">
            <div
              v-for="dow in [1,2,3,4,5,6,0]"
              :key="dow"
              class="schedule-day"
              :class="{
                'schedule-day-today': dow === todayDow,
                'schedule-day-weekend': dow === 0 || dow === 6
              }"
            >
              <!-- Abbreviated weekday name (Mon / Tue / ...) from i18n -->
              <div class="schedule-day-label">{{ gt(`days.${dow}`) }}</div>
              <!-- Game label for weekdays; "Free Choice" label for weekends -->
              <div class="schedule-game-label">
                {{ (dow === 0 || dow === 6) ? gt('weekend') : getDayLabel(dow) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Game card list: one card on weekdays, all five on weekends -->
        <div class="w-100 mx-auto" style="max-width:52rem;">
          <h2 class="fw-bold mb-3" style="font-size:1.3rem;">
            {{ isWeekend ? gt('allGames') : gt('todayGame') }}
          </h2>

          <!-- Grid: single column on weekdays, responsive multi-column on weekends -->
          <div class="row g-3">
            <div
              v-for="game in availableGames"
              :key="game.id"
              :class="isWeekend ? 'col-sm-6 col-lg-4' : 'col-12'"
            >
              <!-- Game card: clicking calls launchGame() to enter the selected game
                   Hover effect is applied via inline JS listeners to avoid extra CSS classes -->
              <div
                class="card game-card h-100"
                :class="`tone-${game.tone}`"
                @click="launchGame(game.id)"
                @mouseenter="e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.13)' }"
                @mouseleave="e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }"
              >
                <div class="card-body p-4 d-flex flex-column gap-2">

                  <!-- Card header row: icon, translated game title, and "Today" badge -->
                  <div class="d-flex align-items-center gap-3 mb-1">
                    <div class="tile-icon tile-icon-sm" :class="`tone-${game.tone}`" style="font-size:1.4rem;display:flex;align-items:center;justify-content:center;">
                      <div>{{ game.emoji }}</div>
                    </div>
                    <div>
                      <div class="fw-bold" style="font-size:1.15rem;">{{ gameT(game.key, 'title') }}</div>
                      <!-- "Today's Game" badge: only shown on weekdays -->
                      <div v-if="!isWeekend" class="badge text-bg-primary mt-1" style="font-size:0.8rem;">{{ gt('todayBadge') }}</div>
                    </div>
                  </div>

                  <!-- Brief game description -->
                  <p class="text-secondary mb-1" style="font-size:0.97rem;">{{ gameT(game.key, 'description') }}</p>

                  <!-- Duration and difficulty badges -->
                  <div class="d-flex gap-2 flex-wrap">
                    <span class="badge rounded-pill text-bg-light border" style="font-size:0.82rem;">⏱ {{ gameT(game.key, 'duration') }}</span>
                    <span class="badge rounded-pill text-bg-light border" style="font-size:0.82rem;">{{ gameT(game.key, 'difficulty') }}</span>
                  </div>

                  <!-- Session best score: only displayed if the user has played this game -->
                  <div v-if="scores[game.id] !== undefined" class="mt-1" style="font-size:0.92rem;font-weight:600;color:#2347b6;">
                    {{ gt('bestScore') }}: {{ scores[game.id] }}
                  </div>

                  <!-- Play button: mt-auto pins it to the card bottom for consistent alignment -->
                  <button class="btn btn-primary mt-auto" style="font-size:1rem;" type="button">
                    {{ gt('playNow') }} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>