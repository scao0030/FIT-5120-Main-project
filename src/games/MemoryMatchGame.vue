<script setup>
import { ref, watch, onUnmounted } from 'vue'
import GameShell from './GameShell.vue'

const props = defineProps({ gameMeta: Object, savedScore: Object })
const emit  = defineEmits(['score-update'])
const shell = ref(null)

// [pairCount, secondsAvailable] for each stage.
const CFG = [
  [3,60],[4,55],[4,50],
  [5,60],[5,55],[6,50],
  [6,70],[7,65],[7,60],
  [8,80],[8,75],[9,70],
  [9,90],[10,85],[10,80],
]
function getConfig(level, sub) {
  const [pairs, time] = CFG[(level - 1) * 3 + (sub - 1)]
  return { pairs, time }
}

const EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🦁','🐯','🦄','🦋','🌺','🎸','🎯','🍕','🚀','⭐','🎈','🌈']
const cards   = ref([])
const flipped = ref([])
const matched = ref([])
const moves   = ref(0)
const timeLeft = ref(60)
const timer   = ref(null)

function shuffle(arr) { return [...arr].sort(() => Math.random() - .5) }

// Build a duplicated emoji set, then reshuffle so every round has a fresh board.
function buildDeck(pairs) {
  const pool = shuffle(EMOJIS).slice(0, pairs)
  return shuffle([...pool, ...pool].map((e, i) => ({ id: i, emoji: e })))
}

function startRound(level, sub) {
  const { pairs, time } = getConfig(level, sub)
  cards.value   = buildDeck(pairs)
  flipped.value = []
  matched.value = []
  moves.value   = 0
  timeLeft.value = time
  clearInterval(timer.value)
  timer.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) endGame(false)
  }, 1000)
}

function flipCard(idx) {
  if (matched.value.includes(idx) || flipped.value.includes(idx) || flipped.value.length === 2) return
  flipped.value = [...flipped.value, idx]
  if (flipped.value.length === 2) {
    moves.value++
    const [a, b] = flipped.value
    // Lock in matches immediately; mismatches briefly stay visible for memorisation.
    if (cards.value[a].emoji === cards.value[b].emoji) {
      matched.value = [...matched.value, a, b]
      flipped.value = []
      if (matched.value.length === cards.value.length) endGame(true)
    } else {
      setTimeout(() => { flipped.value = [] }, 900)
    }
  }
}

function isFaceUp(idx) { return flipped.value.includes(idx) || matched.value.includes(idx) }

function endGame(won) {
  clearInterval(timer.value)
  const pairs  = cards.value.length / 2
  // A win rewards remaining time and efficiency; a loss still awards partial progress.
  const earned = won
    ? Math.max(0, Math.round(timeLeft.value * 10 + pairs * 20 - moves.value * 2))
    : Math.round((matched.value.length / 2) * 10)
  shell.value.submitResult(earned, won)
}

onUnmounted(() => clearInterval(timer.value))
watch(() => shell.value?.gameState, s => {
  if (s === 'playing') startRound(shell.value.level, shell.value.subLevel)
  if (s === 'idle')    clearInterval(timer.value)
})
</script>

<template>
  <GameShell ref="shell" :game-meta="gameMeta" :saved-score="savedScore" @score-update="emit('score-update', $event)">
    <template #default="{ level, subLevel }">
      <div class="soft-card mb-4">
        <div class="card-body p-3 p-md-4">
          <!-- Stats bar -->
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span style="font-size:1.1rem;">⏱</span>
              <span class="fw-bold" :style="timeLeft <= 10 ? 'color:#dc3545;' : 'color:var(--brand-blue-strong);'">{{ timeLeft }}s</span>
            </div>
            <div class="small text-secondary">Moves: <strong>{{ moves }}</strong></div>
            <div class="small text-secondary">Matched: <strong>{{ matched.length / 2 }}</strong> / <strong>{{ cards.length / 2 }}</strong></div>
          </div>

          <!-- Card grid -->
          <div
            class="d-grid gap-2"
            :style="`grid-template-columns:repeat(${Math.ceil(Math.sqrt(cards.length))}, 1fr);`"
          >
            <button
              v-for="(card, i) in cards"
              :key="card.id"
              class="rounded-3 border-0 fw-bold"
              :style="`
                aspect-ratio:1;
                font-size:clamp(1rem,3vw,1.8rem);
                background:${matched.includes(i) ? 'rgba(217,246,228,0.9)' : isFaceUp(i) ? 'rgba(255,255,255,0.95)' : 'var(--brand-blue)'};
                color:${isFaceUp(i) ? 'var(--text-main)' : 'transparent'};
                cursor:${matched.includes(i) ? 'default' : 'pointer'};
                box-shadow:0 2px 8px rgba(23,41,94,.12);
                transition:all .2s;
                transform:${isFaceUp(i) ? 'scale(1.05)' : 'scale(1)'};
              `"
              :disabled="matched.includes(i)"
              @click="flipCard(i)"
            >
              {{ isFaceUp(i) ? card.emoji : '?' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </GameShell>
</template>
