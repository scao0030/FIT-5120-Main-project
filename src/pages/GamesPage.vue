<script setup>
import { ref, computed } from 'vue'
import MemoryMatchGame from '../games/MemoryMatchGame.vue'
import WordRecallGame from '../games/WordRecallGame.vue'
import PatternRecoGame from '../games/PatternRecoGame.vue'
import NumberSpeedGame from '../games/NumberSpeedGame.vue'
import SpatialThinkingGame from '../games/SpatialThinkingGame.vue'

// Day schedule: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
const SCHEDULE = { 1: 'memory', 2: 'word', 3: 'pattern', 4: 'number', 5: 'spatial' }

const GAME_META = {
  memory:  { id: 'memory',  title: 'Memory Match',        emoji: '🃏', tone: 'blue',   duration: '~3 min', desc: 'Flip cards and find matching pairs. Tests short-term visual memory.',        dayLabel: 'Mon' },
  word:    { id: 'word',    title: 'Word Recall',          emoji: '💬', tone: 'green',  duration: '~2 min', desc: 'Read a word list, then recall as many as you can. Trains verbal memory.',    dayLabel: 'Tue' },
  pattern: { id: 'pattern', title: 'Pattern Recognition', emoji: '🔷', tone: 'purple', duration: '~3 min', desc: 'Spot the pattern and select the missing piece. Sharpens logical reasoning.', dayLabel: 'Wed' },
  number:  { id: 'number',  title: 'Number Speed',        emoji: '⚡', tone: 'orange', duration: '~2 min', desc: 'Quick arithmetic under time pressure. Boosts processing speed.',              dayLabel: 'Thu' },
  spatial: { id: 'spatial', title: 'Spatial Thinking',    emoji: '🧩', tone: 'red',    duration: '~3 min', desc: 'Rotate and match shapes mentally. Develops spatial reasoning skills.',        dayLabel: 'Fri' },
}

const DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const WEEK_DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const today      = new Date()
const todayDow   = today.getDay()
const isWeekend  = todayDow === 0 || todayDow === 6
const todayGameId = SCHEDULE[todayDow] || null

const activeGame = ref(null)
const scores     = ref({})

const todayGame = computed(() => todayGameId ? GAME_META[todayGameId] : null)
const availableGames = computed(() => isWeekend ? Object.values(GAME_META) : todayGame.value ? [todayGame.value] : [])

function getDayGame(dow) { return (dow === 0 || dow === 6) ? null : GAME_META[SCHEDULE[dow]] }

function launchGame(id) { activeGame.value = id; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function closeGame()    { activeGame.value = null; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function onScore(gameId, score) { scores.value[gameId] = score }

const GAME_COMPONENTS = { memory: MemoryMatchGame, word: WordRecallGame, pattern: PatternRecoGame, number: NumberSpeedGame, spatial: SpatialThinkingGame }
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section d-flex flex-column align-items-center">

      <!-- ── Active game ── -->
      <div v-if="activeGame" class="w-100">
        <button class="btn btn-outline-secondary mb-4" @click="closeGame">← Back to Brain Games</button>
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
              <h1 class="display-6 fw-bold mb-0" style="font-size:2rem;">Brain Age Reverse</h1>
              <p class="text-secondary mb-0" style="font-size:1.1rem;">Short daily cognitive exercises — no login, no data stored, entirely in-browser</p>
            </div>
          </div>
        </div>

        <!-- Science bar -->
        <div class="soft-card d-flex align-items-center gap-3 p-3 mb-4 mx-auto" style="max-width:52rem;background:rgba(35,71,182,0.88);backdrop-filter:blur(8px);color:#fff;">
          <span style="font-size:1.5rem;flex-shrink:0;">🧬</span>
          <span style="font-size:1rem;">Regular cognitive exercise is linked to reduced dementia risk. <strong>(Lancet, 2020)</strong> — just minutes a day makes a difference.</span>
        </div>

        <!-- Weekly schedule -->
        <div class="soft-card mb-4 p-3 p-md-4 mx-auto" style="max-width:52rem;">
          <h2 class="fw-bold mb-3" style="font-size:1.3rem;">This Week's Schedule</h2>
          <div class="d-flex gap-2 flex-wrap">
            <div
              v-for="(day, i) in WEEK_DAYS" :key="day"
              class="text-center rounded-3 p-2 flex-fill"
              style="min-width:68px;transition:all .15s;"
              :style="i === todayDow
                ? 'background:var(--brand-blue);color:#fff;box-shadow:0 4px 12px rgba(35,71,182,.3);'
                : (i===0||i===6 ? 'background:rgba(255,255,255,0.5);border:1px dashed #c0cfe8;' : 'background:rgba(255,255,255,0.6);border:1px solid #e0e8f8;')"
            >
              <div class="fw-bold mb-1" style="font-size:0.95rem;">{{ day }}</div>
              <div style="font-size:0.8rem;" :style="i===todayDow?'color:#ffffffcc':''">
                <template v-if="i===0||i===6">🎉 Free</template>
                <template v-else>{{ getDayGame(i)?.title.split(' ').slice(-1)[0] }}</template>
              </div>
            </div>
          </div>
        </div>

        <!-- Today banner (weekday) -->
        <div v-if="!isWeekend && todayGame" class="soft-card mb-4 p-4 mx-auto" style="max-width:52rem;border-left:4px solid var(--brand-blue-strong);">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div class="fw-semibold text-secondary text-uppercase mb-1" style="letter-spacing:.06em;font-size:0.95rem;">Today's Exercise — {{ DAY_NAMES[todayDow] }}</div>
              <h2 class="fw-bold mb-1" style="font-size:1.5rem;">{{ todayGame.emoji }} {{ todayGame.title }}</h2>
              <div class="text-secondary" style="font-size:1rem;">{{ todayGame.duration }} &bull; {{ todayGame.desc }}</div>
            </div>
            <button class="btn btn-primary px-4 py-2 fw-bold" style="min-width:100px;font-size:1.1rem;" @click="launchGame(todayGame.id)">START</button>
          </div>
        </div>

        <!-- Weekend banner -->
        <div v-if="isWeekend" class="soft-card mb-4 p-3 mx-auto" style="max-width:52rem;background:rgba(234,248,239,0.88);border-left:4px solid #18884a;color:#1b6c45;">
          <div class="fw-bold mb-1" style="font-size:1.1rem;">🎉 Weekend — All Games Available!</div>
          <div style="font-size:1rem;">Choose any game below to play at your own pace today.</div>
        </div>

        <!-- Game tiles -->
        <h2 class="fw-bold mb-3 mx-auto" style="max-width:52rem;font-size:1.3rem;">{{ isWeekend ? 'Choose a Game' : 'Available Today' }}</h2>
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
                    <div class="fw-bold" style="font-size:1.1rem;">{{ game.title }}</div>
                    <div class="text-secondary" style="font-size:0.95rem;">{{ game.duration }}</div>
                  </div>
                </div>
                <div class="text-secondary" style="font-size:1rem;">{{ game.desc }}</div>
                <div v-if="scores[game.id]" class="mt-1 fw-semibold" style="color:var(--brand-blue-strong);font-size:0.95rem;">
                  Best: Level {{ scores[game.id].level }}-{{ scores[game.id].subLevel }} &bull; {{ scores[game.id].bestScore }} pts
                </div>
                <div class="mt-auto pt-2">
                  <span class="btn btn-primary btn-sm" style="font-size:1rem;">Play →</span>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- How levels work -->
        <div class="soft-card mt-4 p-3 p-md-4 mx-auto" style="max-width:52rem;background:rgba(240,245,255,0.88);">
          <div class="fw-bold mb-1" style="font-size:1.1rem;">📊 How Levels Work</div>
          <div class="text-secondary" style="font-size:1rem;">Each game has <strong>5 levels</strong> with <strong>3 sub-levels</strong> each — 15 stages in total. Complete all 3 sub-levels to unlock the next level. Score at least 60% to pass. Your best scores are saved for this session.</div>
        </div>

      </div>
    </div>
  </section>
</template>
