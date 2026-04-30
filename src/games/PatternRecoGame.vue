<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import GameShell from './GameShell.vue'

const props = defineProps({ gameMeta: Object, savedScore: Object })
const emit  = defineEmits(['score-update'])
const shell = ref(null)

const CFG = [
  [4,20],[5,18],[5,16],
  [6,18],[6,16],[7,15],
  [7,16],[8,15],[8,14],
  [9,15],[9,14],[10,13],
  [10,14],[11,13],[12,12],
]
function getConfig(level, sub) {
  const [qs, time] = CFG[(level - 1) * 3 + (sub - 1)]
  return { qs, time }
}
function shuffle(a) { return [...a].sort(() => Math.random() - .5) }

function makeSequenceQ(diff) {
  const step  = Math.floor(Math.random() * (2 + diff)) + 1
  const start = Math.floor(Math.random() * 10) + 1
  const seq   = [start, start+step, start+step*2, start+step*3]
  const answer = start + step * 4
  const wrongs = [answer+1, answer-1, answer+step, answer-step+1].filter(x => x !== answer).slice(0,3)
  return { prompt: `What comes next? ${seq.join(', ')}, ?`, options: shuffle([answer, ...wrongs]), answer }
}

function makeOddQ() {
  const groups = [
    { items: ['Apple','Banana','Cherry','Mango'],   odd: 'Car'    },
    { items: ['Dog','Cat','Tiger','Lion'],           odd: 'Apple'  },
    { items: ['Red','Blue','Green','Yellow'],        odd: 'Seven'  },
    { items: ['Two','Four','Six','Eight'],           odd: 'Sunday' },
    { items: ['Circle','Square','Triangle','Oval'],  odd: 'Heavy'  },
  ]
  const g = groups[Math.floor(Math.random() * groups.length)]
  const members = shuffle(g.items).slice(0, 3)
  const opts = shuffle([...members, g.odd])
  return { prompt: 'Which one does NOT belong?', options: opts, answer: g.odd }
}

function makeShapeQ(diff) {
  const shapes = ['■','▲','●','◆','★','▼','○','□']
  const patLen = 2 + Math.min(diff, 2)
  const pat    = shapes.slice(0, patLen)
  const seq    = [...pat, ...pat, pat[0]]
  const answer = pat[1] || pat[0]
  const wrongs = shapes.filter(s => !pat.includes(s)).slice(0, 3)
  return { prompt: `What comes next? ${seq.join(' ')} ?`, options: shuffle([answer, ...wrongs]), answer }
}

function makeSeriesQ(diff) {
  const rules = [
    { seq: [2,4,6,8,10,12,14,16,18] },
    { seq: [1,2,4,8,16,32,64,128]   },
    { seq: [1,4,9,16,25,36,49,64]   },
    { seq: [3,6,9,12,15,18,21,24]   },
  ]
  const rule  = rules[Math.floor(Math.random() * Math.min(diff + 1, rules.length))]
  const start = Math.floor(Math.random() * 4)
  const slice = rule.seq.slice(start, start + 4)
  const next  = rule.seq[start + 4] || slice[slice.length - 1] + (slice[1] - slice[0])
  const diff2 = Math.max(1, slice[1] - slice[0])
  const wrongs = [next + diff2, next - diff2, next + 1].filter(x => x !== next).slice(0,3)
  return { prompt: `Complete: ${slice.join(' → ')} → ?`, options: shuffle([next, ...wrongs]), answer: next }
}

function generateQuestions(level, sub) {
  const { qs } = getConfig(level, sub)
  const diff   = level - 1
  const makers = [makeSequenceQ, makeOddQ, makeShapeQ, makeSeriesQ]
  return Array.from({ length: qs }, (_, i) => makers[i % makers.length](diff))
}

const questions = ref([])
const qIndex    = ref(0)
const correct   = ref(0)
const chosen    = ref(null)
const timeLeft  = ref(0)
const timer     = ref(null)
const current   = computed(() => questions.value[qIndex.value])

function startRound(level, sub) {
  questions.value = generateQuestions(level, sub)
  qIndex.value    = 0
  correct.value   = 0
  chosen.value    = null
  startQTimer(level, sub)
}

function startQTimer(level, sub) {
  const { time } = getConfig(level, sub)
  timeLeft.value  = time
  clearInterval(timer.value)
  timer.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) autoAdvance()
  }, 1000)
}

function pick(opt) {
  if (chosen.value !== null) return
  chosen.value = opt
  clearInterval(timer.value)
  if (opt === current.value.answer) correct.value++
  setTimeout(() => {
    if (qIndex.value < questions.value.length - 1) {
      qIndex.value++; chosen.value = null
      startQTimer(shell.value.level, shell.value.subLevel)
    } else endRound()
  }, 700)
}

function autoAdvance() {
  clearInterval(timer.value)
  chosen.value = '__timeout__'
  setTimeout(() => {
    if (qIndex.value < questions.value.length - 1) {
      qIndex.value++; chosen.value = null
      startQTimer(shell.value.level, shell.value.subLevel)
    } else endRound()
  }, 400)
}

function endRound() {
  clearInterval(timer.value)
  const total  = questions.value.length
  const earned = Math.round((correct.value / total) * 100 + correct.value * 15)
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
            <span class="small text-secondary">Question <strong>{{ qIndex + 1 }}</strong> / {{ questions.length }}</span>
            <span class="fw-bold" :style="timeLeft <= 5 ? 'color:#dc3545;' : 'color:var(--brand-blue-strong);'">⏱ {{ timeLeft }}s</span>
            <span class="small text-secondary">✅ {{ correct }} correct</span>
          </div>

          <div v-if="current">
            <p class="h6 fw-bold mb-4" style="font-size:1.05rem;line-height:1.6;">{{ current.prompt }}</p>
            <div class="d-grid gap-2" :style="`grid-template-columns:repeat(${current.options.length > 3 ? 2 : 1}, 1fr);`">
              <button
                v-for="opt in current.options" :key="opt"
                class="btn rounded-3 py-2 px-3 text-start fw-semibold"
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
                  transition:all .15s;
                `"
                @click="pick(opt)"
                :disabled="chosen !== null"
              >{{ opt }}</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </GameShell>
</template>
