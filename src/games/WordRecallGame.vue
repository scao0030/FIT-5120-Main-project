<script setup>
import { ref, watch, onUnmounted } from 'vue'
import GameShell from './GameShell.vue'

const props = defineProps({ gameMeta: Object, savedScore: Object })
const emit  = defineEmits(['score-update'])
const shell = ref(null)

const WORD_POOL = [
  'apple','river','candle','forest','music','pencil','window','garden','bridge','silver',
  'castle','tiger','rocket','butter','cloud','anchor','jewel','lantern','mirror','violin',
  'cactus','marble','compass','lemon','thunder','crystal','shadow','trumpet','honey','falcon',
  'glove','copper','feather','balloon','puzzle','harvest','pillow','engine','dagger','bottle',
  'torch','pebble','wagon','ribbon','volcano','statue','meadow','chimney','barrel','blanket',
]

// [wordCount, studySeconds, recallSeconds]
const CFG = [
  [4,20,60],[4,18,55],[5,16,50],
  [5,25,70],[6,22,65],[6,20,60],
  [7,30,80],[7,27,75],[8,25,70],
  [8,35,90],[9,30,85],[9,28,80],
  [10,40,100],[11,35,95],[12,30,90],
]
function getConfig(level, sub) {
  const [words, study, recall] = CFG[(level - 1) * 3 + (sub - 1)]
  return { words, study, recall }
}
function shuffle(a) { return [...a].sort(() => Math.random() - .5) }

const phase      = ref('study')   // study | recall | done
const wordList   = ref([])
const timeLeft   = ref(0)
const timer      = ref(null)
const input      = ref('')
const recalled   = ref([])
const submitted  = ref(false)

function startRound(level, sub) {
  const { words, study } = getConfig(level, sub)
  wordList.value = shuffle(WORD_POOL).slice(0, words)
  recalled.value = []
  input.value    = ''
  submitted.value = false
  phase.value    = 'study'
  timeLeft.value = study
  clearInterval(timer.value)
  timer.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) startRecall()
  }, 1000)
}

function startRecall() {
  clearInterval(timer.value)
  const { recall } = getConfig(shell.value.level, shell.value.subLevel)
  phase.value    = 'recall'
  timeLeft.value = recall
  timer.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) submitRecall()
  }, 1000)
}

function submitRecall() {
  clearInterval(timer.value)
  submitted.value = true
  phase.value     = 'done'
  const words = input.value.toLowerCase().split(/[\s,;]+/).map(w => w.trim()).filter(Boolean)
  const hit   = [...new Set(words.filter(w => wordList.value.includes(w)))]
  recalled.value  = hit
  const earned = Math.round(hit.length * 20 + timeLeft.value * 2)
  shell.value.submitResult(Math.max(0, earned), hit.length / wordList.value.length >= 0.6)
}

onUnmounted(() => clearInterval(timer.value))
watch(() => shell.value?.gameState, s => {
  if (s === 'playing') startRound(shell.value.level, shell.value.subLevel)
  if (s === 'idle')    { clearInterval(timer.value); phase.value = 'study' }
})
</script>

<template>
  <GameShell ref="shell" :game-meta="gameMeta" :saved-score="savedScore" @score-update="emit('score-update', $event)">
    <template #default>
      <div class="soft-card mb-4">
        <div class="card-body p-3 p-md-4">

          <!-- Phase badge + timer -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span
              class="badge rounded-pill px-3 py-2"
              :style="phase==='study'
                ? 'background:rgba(226,235,255,0.9);color:var(--brand-blue-strong);'
                : phase==='recall'
                  ? 'background:rgba(255,243,205,0.9);color:#856404;'
                  : 'background:rgba(217,246,228,0.9);color:#18884a;'"
            >
              {{ phase==='study' ? '📖 Study the words' : phase==='recall' ? '✍️ Type what you remember' : '✅ Done' }}
            </span>
            <span class="fw-bold" :style="timeLeft <= 10 ? 'color:#dc3545;' : 'color:var(--brand-blue-strong);'">⏱ {{ timeLeft }}s</span>
          </div>

          <!-- Study -->
          <div v-if="phase==='study'">
            <p class="text-secondary small mb-3">Memorise these words — they disappear when the timer ends!</p>
            <div class="d-flex flex-wrap gap-2">
              <span
                v-for="w in wordList" :key="w"
                class="badge rounded-pill fs-6 px-3 py-2"
                style="background:var(--brand-blue);color:#fff;"
              >{{ w }}</span>
            </div>
          </div>

          <!-- Recall -->
          <div v-if="phase==='recall'">
            <p class="text-secondary small mb-3">Type as many words as you remember, separated by spaces or commas.</p>
            <textarea
              v-model="input"
              class="form-control mb-3"
              rows="4"
              placeholder="apple, river, candle..."
              :disabled="submitted"
              style="background:rgba(255,255,255,0.9);backdrop-filter:blur(4px);"
            ></textarea>
            <button class="btn btn-primary" @click="submitRecall" :disabled="submitted">Submit Answers</button>
          </div>

          <!-- Done -->
          <div v-if="phase==='done'">
            <p class="small text-secondary mb-3">You recalled <strong>{{ recalled.length }}</strong> of <strong>{{ wordList.length }}</strong> words correctly.</p>
            <div class="d-flex flex-wrap gap-2">
              <span
                v-for="w in wordList" :key="w"
                class="badge rounded-pill px-3 py-2"
                :style="recalled.includes(w)
                  ? 'background:rgba(217,246,228,0.9);color:#18884a;'
                  : 'background:rgba(255,226,226,0.9);color:#d61f1f;'"
              >{{ w }}</span>
            </div>
          </div>

        </div>
      </div>
    </template>
  </GameShell>
</template>
