<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ gameMeta: Object, savedScore: Object })
const emit  = defineEmits(['score-update'])

const level        = ref(props.savedScore?.level    || 1)
const subLevel     = ref(props.savedScore?.subLevel || 1)
const sessionScore = ref(props.savedScore?.bestScore || 0)
const gameState    = ref('idle')   // idle | playing | result
const lastResult   = ref(null)

const levelLabel   = computed(() => `Level ${level.value} · Sub-level ${subLevel.value}`)
const isMaxLevel   = computed(() => level.value === 5 && subLevel.value === 3)
const progressPct  = computed(() => Math.round((((level.value - 1) * 3 + (subLevel.value - 1)) / 15) * 100))

function startGame() {
  gameState.value = 'playing'
  lastResult.value = null
}

function submitResult(earned, passed) {
  sessionScore.value = Math.max(sessionScore.value, earned)
  lastResult.value   = { passed, earned }
  gameState.value    = 'result'
  emit('score-update', { level: level.value, subLevel: subLevel.value, bestScore: sessionScore.value })
}

function advance() {
  if (isMaxLevel.value) return
  subLevel.value < 3 ? subLevel.value++ : (subLevel.value = 1, level.value++)
  gameState.value = 'idle'
}

function retry() { gameState.value = 'idle' }

defineExpose({ startGame, submitResult, gameState, level, subLevel, sessionScore })
</script>

<template>
  <div>
    <!-- ── Progress header ── -->
    <div class="soft-card mb-4">
      <div class="card-body p-3 p-md-4">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h2 class="h4 fw-bold mb-0">{{ gameMeta.emoji }} {{ gameMeta.title }}</h2>
            <div class="small text-secondary">{{ levelLabel }}</div>
          </div>
          <div class="text-end">
            <div class="small text-secondary">Session Best</div>
            <div class="fw-bold" style="color:var(--brand-blue-strong);font-size:1.25rem;">{{ sessionScore }} pts</div>
          </div>
        </div>

        <div class="mt-3">
          <div class="d-flex justify-content-between small text-secondary mb-1">
            <span>Progress</span><span>{{ progressPct }}% of 15 stages</span>
          </div>
          <div class="progress" style="height:8px;">
            <div class="progress-bar" :style="`width:${progressPct}%`" role="progressbar"></div>
          </div>
          <div class="d-flex gap-1 mt-2">
            <template v-for="l in 5" :key="l">
              <template v-for="s in 3" :key="s">
                <div
                  class="rounded-1"
                  style="height:6px;flex:1;transition:background .3s;"
                  :style="(l < level || (l === level && s < subLevel))
                    ? 'background:var(--brand-blue-strong);'
                    : (l === level && s === subLevel)
                      ? 'background:var(--brand-yellow);'
                      : 'background:rgba(200,215,240,0.7);'"
                ></div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Idle / ready screen ── -->
    <div v-if="gameState === 'idle'" class="soft-card mb-4">
      <div class="card-body p-4 text-center">
        <div class="mb-3" style="font-size:3rem;">{{ gameMeta.emoji }}</div>
        <h3 class="h5 fw-bold mb-2">Ready for {{ levelLabel }}?</h3>
        <p class="text-secondary small mb-4">{{ gameMeta.desc }}</p>
        <button class="btn btn-primary px-5 py-2 fw-bold" @click="startGame">Start</button>
      </div>
    </div>

    <!-- ── Playing ── -->
    <div v-if="gameState === 'playing'">
      <slot :level="level" :sub-level="subLevel" :submit="submitResult" />
    </div>

    <!-- ── Result ── -->
    <div v-if="gameState === 'result'" class="soft-card mb-4">
      <div class="card-body p-4 text-center">
        <div class="mb-2" style="font-size:2.5rem;">{{ lastResult.passed ? '🎉' : '💪' }}</div>
        <h3 class="h5 fw-bold mb-1">{{ lastResult.passed ? 'Well done!' : 'Keep going!' }}</h3>
        <p class="text-secondary small mb-1">You scored <strong>{{ lastResult.earned }} points</strong> this round.</p>
        <p class="small text-secondary mb-4">
          {{ lastResult.passed ? 'Sub-level complete! Advance when ready.' : 'Retry to improve your score (need 60%+).' }}
        </p>
        <div class="d-flex gap-2 justify-content-center flex-wrap">
          <button class="btn btn-outline-secondary" @click="retry">Retry</button>
          <button v-if="lastResult.passed && !isMaxLevel" class="btn btn-primary" @click="advance">Next Sub-level →</button>
        </div>
        <div v-if="isMaxLevel && lastResult.passed" class="mt-3 p-3 rounded-3 small fw-semibold" style="background:rgba(234,248,239,0.88);border-left:4px solid #18884a;color:#1b6c45;">
          🏆 You've completed all 15 stages! Incredible brain workout!
        </div>
      </div>
    </div>
  </div>
</template>
