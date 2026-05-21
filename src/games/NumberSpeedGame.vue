<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import GameShell from './GameShell.vue'

const props = defineProps({ gameMeta: Object, savedScore: Object })
const emit  = defineEmits(['score-update'])
const shell = ref(null)

// [questionCount, secondsPerQuestion] for each stage.
const CFG = [
  [6,8],[7,7],[8,7],
  [8,7],[9,7],[10,6],
  [10,7],[11,6],[12,6],
  [12,6],[13,6],[14,5],
  [14,6],[15,5],[16,5],
]
function getConfig(level, sub) {
  const [qs, time] = CFG[(level - 1) * 3 + (sub - 1)]
  return { qs, time }
}
function shuffle(a) { return [...a].sort(() => Math.random() - .5) }

// Generate arithmetic that stays roughly aligned with the current difficulty band.
function genQuestion(level) {
  const ops = level <= 1 ? ['+','-'] : level <= 3 ? ['+','-','×'] : ['+','-','×','÷']
  const op  = ops[Math.floor(Math.random() * ops.length)]
  const max = 5 + level * 5
  let a, b, answer
  if (op === '+') { a = Math.floor(Math.random() * max) + 1; b = Math.floor(Math.random() * max) + 1; answer = a + b }
  else if (op === '-') { a = Math.floor(Math.random() * max) + Math.ceil(max/2) + 1; b = Math.floor(Math.random() * Math.floor(max/2)) + 1; answer = a - b }
  else if (op === '×') { a = Math.floor(Math.random() * (3 + level)) + 2; b = Math.floor(Math.random() * (3 + level)) + 2; answer = a * b }
  else { b = Math.floor(Math.random() * (3 + level)) + 2; answer = Math.floor(Math.random() * (3 + level)) + 2; a = b * answer }
  const diff   = Math.max(1, Math.floor(answer / 5))
  const wrongs = [answer + diff, answer - diff, answer + diff * 2].filter(x => x !== answer && x > 0)
  return { prompt: `${a} ${op} ${b} = ?`, answer, options: shuffle([answer, ...wrongs.slice(0,3)]) }
}

const questions = ref([])
const qIndex    = ref(0)
const correct   = ref(0)
const chosen    = ref(null)
const timeLeft  = ref(0)
const streak    = ref(0)
const maxStreak = ref(0)
const timer     = ref(null)
const current   = computed(() => questions.value[qIndex.value])

function startRound(level, sub) {
  const { qs } = getConfig(level, sub)
  questions.value = Array.from({ length: qs }, () => genQuestion(level))
  qIndex.value    = 0; correct.value = 0; chosen.value = null; streak.value = 0; maxStreak.value = 0
  startQTimer(level, sub)
}

function startQTimer(level, sub) {
  const { time } = getConfig(level, sub)
  timeLeft.value  = time
  clearInterval(timer.value)
  timer.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) pick(null)
  }, 1000)
}

function pick(opt) {
  if (chosen.value !== null) return
  chosen.value = opt ?? '__timeout__'
  clearInterval(timer.value)
  // Streaks reward consecutive correct answers and feed into the final score.
  if (opt === current.value?.answer) { correct.value++; streak.value++; maxStreak.value = Math.max(maxStreak.value, streak.value) }
  else streak.value = 0
  setTimeout(() => {
    if (qIndex.value < questions.value.length - 1) {
      qIndex.value++; chosen.value = null
      startQTimer(shell.value.level, shell.value.subLevel)
    } else endRound()
  }, 500)
}

function endRound() {
  clearInterval(timer.value)
  const total  = questions.value.length
  // Final points combine accuracy, speed-oriented correctness, and longest streak.
  const earned = Math.round((correct.value / total) * 100 + correct.value * 12 + maxStreak.value * 5)
  shell.value.submitResult(Math.max(0, earned), correct.value / total >= 0.6)
}

onUnmounted(() => clearInterval(timer.value))
watch(() => shell.value?.gameState, s => {
  if (s === 'playing') startRound(shell.value.level, shell.value.subLevel)
  if (s === 'idle')    clearInterval(timer.value)
})
</script>

<template>
  <GameShell ref="shell" :game-meta="gameMeta" :saved-score="savedScore" @score-update="emit('score-update', $event)">
    <template #default>
      <div class="soft-card mb-4">
        <div class="card-body p-3 p-md-4">
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <span class="small text-secondary">Q <strong>{{ qIndex + 1 }}</strong> / {{ questions.length }}</span>
            <span class="fw-bold fs-5" :style="timeLeft <= 3 ? 'color:#dc3545;' : 'color:var(--brand-blue-strong);'">⏱ {{ timeLeft }}s</span>
            <span class="small fw-semibold" style="color:#18884a;">🔥 Streak: {{ streak }}</span>
          </div>

          <div v-if="current">
            <div
              class="text-center rounded-3 mb-4 p-4"
              style="background:rgba(35,71,182,0.88);backdrop-filter:blur(8px);color:#fff;font-size:2rem;font-weight:700;letter-spacing:.05em;"
            >
              {{ current.prompt }}
            </div>
            <div class="d-grid gap-2" style="grid-template-columns:1fr 1fr;">
              <button
                v-for="opt in current.options" :key="opt"
                class="btn rounded-3 py-3 fw-bold fs-5"
                :style="`
                  background:${chosen !== null
                    ? opt === current.answer ? 'rgba(217,246,228,0.9)'
                      : opt === chosen ? 'rgba(255,226,226,0.9)'
                      : 'rgba(240,244,255,0.8)'
                    : 'rgba(240,244,255,0.8)'};
                  border:2px solid ${chosen !== null
                    ? opt === current.answer ? '#18884a'
                      : opt === chosen ? '#d61f1f'
                      : 'rgba(200,215,240,0.6)'
                    : 'rgba(200,215,240,0.6)'};
                  backdrop-filter:blur(4px);
                  color:var(--text-main);
                  transition:all .12s;
                `"
                @click="pick(opt)"
                :disabled="chosen !== null"
              >{{ opt }}</button>
            </div>
          </div>

          <div class="d-flex justify-content-between small text-secondary mt-3">
            <span>✅ {{ correct }} correct</span>
            <span>❌ {{ qIndex - correct }} missed</span>
          </div>
        </div>
      </div>
    </template>
  </GameShell>
</template>
