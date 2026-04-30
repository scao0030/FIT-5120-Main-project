<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import GameShell from './GameShell.vue'

const props = defineProps({ gameMeta: Object, savedScore: Object })
const emit  = defineEmits(['score-update'])
const shell = ref(null)

const CFG = [
  [5,20],[6,18],[6,16],
  [7,18],[7,16],[8,15],
  [8,16],[9,15],[9,14],
  [10,15],[10,14],[11,13],
  [11,14],[12,13],[12,12],
]
function getConfig(level, sub) {
  const [qs, time] = CFG[(level - 1) * 3 + (sub - 1)]
  return { qs, time }
}
function shuffle(a) { return [...a].sort(() => Math.random() - .5) }

const SHAPES = [
  { cells: [[0,0],[0,1],[0,2],[1,2]] },
  { cells: [[0,0],[1,0],[2,0],[1,1]] },
  { cells: [[1,0],[2,0],[0,1],[1,1]] },
  { cells: [[0,0],[1,0],[1,1],[2,1]] },
  { cells: [[0,0],[0,1],[0,2],[0,3]] },
  { cells: [[0,0],[1,0],[0,1],[1,1]] },
  { cells: [[1,0],[1,1],[1,2],[0,2]] },
  { cells: [[1,0],[0,1],[1,1],[2,1],[1,2]] },
  { cells: [[0,0],[1,0],[2,0],[2,1],[2,2]] },
]

function rotateCells(cells, times) {
  let c = cells
  for (let t = 0; t < times; t++) {
    c = c.map(([x, y]) => [y, -x])
    const minX = Math.min(...c.map(([x]) => x))
    const minY = Math.min(...c.map(([, y]) => y))
    c = c.map(([x, y]) => [x - minX, y - minY])
  }
  return c
}

function cellsKey(c) { return c.map(p => p.join(',')).sort().join('|') }
function cellsEqual(a, b) { return cellsKey(a) === cellsKey(b) }

function renderCells(cells, size = 14, color = '#2347b6') {
  const maxX = Math.max(...cells.map(([x]) => x))
  const maxY = Math.max(...cells.map(([, y]) => y))
  const w = (maxX + 1) * size + 2
  const h = (maxY + 1) * size + 2
  const rects = cells.map(([x, y]) =>
    `<rect x="${x*size+1}" y="${y*size+1}" width="${size-1}" height="${size-1}" rx="2" fill="${color}"/>`
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${rects}</svg>`
}

function genQuestion() {
  const shape  = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  const baseR  = Math.floor(Math.random() * 4)
  const base   = rotateCells(shape.cells, baseR)
  const ansR   = (baseR + 1 + Math.floor(Math.random() * 2)) % 4
  const answer = rotateCells(shape.cells, ansR)

  const wrongs = []
  for (let r = 0; r < 4; r++) {
    const rc = rotateCells(shape.cells, r)
    if (!cellsEqual(rc, answer)) wrongs.push(rc)
  }
  const other = SHAPES[(SHAPES.indexOf(shape) + 1 + Math.floor(Math.random() * 3)) % SHAPES.length]
  wrongs.push(rotateCells(other.cells, 0))

  const options = shuffle([
    { key: 'correct', cells: answer },
    ...shuffle(wrongs).slice(0, 3).map((c, i) => ({ key: `w${i}`, cells: c })),
  ])
  return { base, answerKey: 'correct', options }
}

const questions = ref([])
const qIndex    = ref(0)
const correct   = ref(0)
const chosen    = ref(null)
const timeLeft  = ref(0)
const timer     = ref(null)
const current   = computed(() => questions.value[qIndex.value])

function startRound(level, sub) {
  const { qs } = getConfig(level, sub)
  questions.value = Array.from({ length: qs }, genQuestion)
  qIndex.value    = 0; correct.value = 0; chosen.value = null
  startQTimer(level, sub)
}

function startQTimer(level, sub) {
  const { time } = getConfig(level, sub)
  timeLeft.value  = time
  clearInterval(timer.value)
  timer.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) autoNext()
  }, 1000)
}

function pick(key) {
  if (chosen.value) return
  chosen.value = key
  clearInterval(timer.value)
  if (key === current.value.answerKey) correct.value++
  setTimeout(advance, 700)
}

function autoNext() { clearInterval(timer.value); chosen.value = '__timeout__'; setTimeout(advance, 400) }

function advance() {
  if (qIndex.value < questions.value.length - 1) {
    qIndex.value++; chosen.value = null
    startQTimer(shell.value.level, shell.value.subLevel)
  } else endRound()
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
            <span class="small text-secondary">Q <strong>{{ qIndex + 1 }}</strong> / {{ questions.length }}</span>
            <span class="fw-bold" :style="timeLeft <= 5 ? 'color:#dc3545;' : 'color:var(--brand-blue-strong);'">⏱ {{ timeLeft }}s</span>
            <span class="small text-secondary">✅ {{ correct }} correct</span>
          </div>

          <div v-if="current">
            <p class="small text-secondary mb-3">Which option is a rotation of the original shape?</p>
            <div class="d-flex align-items-center gap-3 mb-4 flex-wrap">
              <!-- Original -->
              <div class="text-center">
                <div class="small text-secondary mb-1 fw-semibold">Original</div>
                <div
                  class="rounded-2 d-inline-flex align-items-center justify-content-center p-2"
                  style="background:rgba(226,235,255,0.9);backdrop-filter:blur(4px);min-width:80px;min-height:80px;"
                  v-html="renderCells(current.base, 16, '#2347b6')"
                ></div>
              </div>

              <span style="font-size:1.5rem;color:var(--brand-blue-strong);">→</span>

              <!-- Options -->
              <div class="d-flex gap-2 flex-wrap">
                <button
                  v-for="(opt, i) in current.options" :key="opt.key"
                  class="rounded-3 p-2 d-flex flex-column align-items-center border-0"
                  :style="`
                    background:${chosen
                      ? opt.key === current.answerKey ? 'rgba(217,246,228,0.9)'
                        : opt.key === chosen ? 'rgba(255,226,226,0.9)'
                        : 'rgba(240,244,255,0.8)'
                      : 'rgba(240,244,255,0.8)'};
                    outline:2px solid ${chosen
                      ? opt.key === current.answerKey ? '#18884a'
                        : opt.key === chosen ? '#d61f1f'
                        : 'rgba(200,215,240,0.5)'
                      : 'rgba(200,215,240,0.5)'};
                    backdrop-filter:blur(4px);
                    cursor:pointer;
                    transition:all .15s;
                    min-width:70px;min-height:70px;
                  `"
                  @click="pick(opt.key)"
                  :disabled="!!chosen"
                >
                  <span class="small text-secondary mb-1">{{ String.fromCharCode(65 + i) }}</span>
                  <div v-html="renderCells(opt.cells, 14, chosen && opt.key === current.answerKey ? '#18884a' : '#2347b6')"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </GameShell>
</template>
