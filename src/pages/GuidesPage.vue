<script setup>
import { computed, inject, ref } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
import { filters, lessons } from '../data/siteContent'
import { t } from '../i18n/index.js'

// GuidesPage is the most data-heavy screen: it combines lesson metadata,
// translated copy, per-step progress, and inline SVG teaching visuals.
const lang = inject('lang')
const lessonFilter = ref('all')
const selectedLesson = ref(null)
const currentStep = ref(0)
const completedIds = ref([])

// The list view and lesson detail view share one component; this filter drives the list side only.
const visibleLessons = computed(() =>
  lessonFilter.value === 'all' ? lessons : lessons.filter((l) => l.filter === lessonFilter.value),
)
// Progress is session-only and based on completed lesson IDs, not per-step persistence.
const completedCount = computed(() => completedIds.value.length)
const progressPercent = computed(() => Math.round((completedCount.value / lessons.length) * 100))
const totalSteps = computed(() => selectedLesson.value?.steps?.length || 0)
const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)
const isFirstStep = computed(() => currentStep.value === 0)

// Translation helpers keep the template readable when drilling into nested lesson content.
function lessonT(lessonId, path) { return t(lang.value, `lessons.${lessonId}.${path}`) }
function stepT(lessonId, stepIdx, field) {
  const steps = t(lang.value, `lessons.${lessonId}.steps`)
  if (Array.isArray(steps) && steps[stepIdx]) return steps[stepIdx][field]
  return ''
}
// Lesson navigation is fully local state; there is no persisted progress yet.
function openLesson(lesson) { selectedLesson.value = lesson; currentStep.value = 0; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function closeLesson() { selectedLesson.value = null; currentStep.value = 0 }
// Step navigation recenters the viewport so large SVG teaching aids stay visible on mobile.
function nextStep() { if (!isLastStep.value) currentStep.value++; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function prevStep() { if (!isFirstStep.value) currentStep.value--; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function markComplete(lessonId) { if (!completedIds.value.includes(lessonId)) completedIds.value.push(lessonId); selectedLesson.value = null; currentStep.value = 0 }
function isCompleted(lessonId) { return completedIds.value.includes(lessonId) }

// Build the compact SVG step tracker shown above each lesson step.
function flowDiagram(steps, currentIdx) {
  const total = steps.length
  // Fit every step into a fixed-width SVG row by shrinking boxes and recalculating the gap.
  const boxW = Math.min(86, Math.floor((640 - (total - 1) * 10) / total))
  const gap = Math.floor((640 - total * boxW) / (total - 1))
  const startX = 20
  const y = 22, h = 38
  let rects = '', texts = '', lines = ''
  steps.forEach((label, i) => {
    const x = startX + i * (boxW + gap)
    // Past/current/future steps get different fill and label treatment for quick scanning.
    const active = i === currentIdx, done = i < currentIdx
    const fill = active ? '#2347b6' : done ? '#e8f0fe' : '#f5f7fb'
    const stroke = (active || done) ? '#2347b6' : '#d0d5e0'
    const sw = active ? 2 : done ? 1.5 : 1
    const tf = active ? '#fff' : done ? '#2347b6' : '#999'
    rects += `<rect x="${x}" y="${y}" width="${boxW}" height="${h}" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
    if (done) {
      texts += `<text x="${x+boxW/2}" y="${y+12}" text-anchor="middle" font-size="10" fill="#2347b6" font-family="sans-serif">✓</text>`
      texts += `<text x="${x+boxW/2}" y="${y+28}" text-anchor="middle" font-size="10" fill="${tf}" font-family="sans-serif">${label}</text>`
    } else {
      texts += `<text x="${x+boxW/2}" y="${y+h/2}" text-anchor="middle" dominant-baseline="central" font-size="10" fill="${tf}" font-family="sans-serif" font-weight="${active?'bold':'normal'}">${label}</text>`
    }
    if (i < total - 1) {
      const lx1 = x + boxW, lx2 = x + boxW + gap, ly = y + h / 2
      lines += `<line x1="${lx1}" y1="${ly}" x2="${lx2}" y2="${ly}" stroke="#c0c8d8" stroke-width="1.2" marker-end="url(#flarr)"/>`
    }
  })
  return `<svg width="100%" viewBox="0 0 680 80" role="img"><title>Flow step ${currentIdx+1}</title>
    <defs><marker id="flarr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M2 2L8 5L2 8" fill="none" stroke="#c0c8d8" stroke-width="1.5"/></marker></defs>
    ${lines}${rects}${texts}
    <text x="340" y="72" text-anchor="middle" font-size="11" fill="#888" font-family="sans-serif">Step ${currentIdx+1} of ${total}: ${steps[currentIdx]}</text>
  </svg>`
}

// Below are prebuilt instructional SVGs keyed by lesson and step order.
// They are kept inline so each lesson remains self-contained and portable.
// 1. myGov Login
const mygovVisuals = [
  // Step 0: Open browser - 4 browser icons
  `<svg width="100%" viewBox="0 0 680 170" role="img"><title>Open your web browser</title>
    <g transform="translate(70,20)">
      <circle cx="50" cy="55" r="48" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
      <circle cx="50" cy="55" r="34" fill="#4285F4"/>
      <path d="M50 21 A34 34 0 0 1 79.4 55 L50 55Z" fill="#EA4335"/>
      <path d="M79.4 55 A34 34 0 0 1 35.3 84.4 L50 55Z" fill="#FBBC05"/>
      <path d="M35.3 84.4 A34 34 0 0 1 20.6 55 L50 55Z" fill="#34A853"/>
      <path d="M20.6 55 A34 34 0 0 1 50 21 L50 55Z" fill="#4285F4"/>
      <circle cx="50" cy="55" r="16" fill="#fff"/>
      <circle cx="50" cy="55" r="12" fill="#4285F4"/>
      <text x="50" y="125" text-anchor="middle" font-size="14" fill="#444" font-family="sans-serif" font-weight="500">Chrome</text>
    </g>
    <g transform="translate(215,20)">
      <circle cx="50" cy="55" r="48" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
      <ellipse cx="50" cy="57" rx="30" ry="28" fill="#0078D4"/>
      <ellipse cx="50" cy="63" rx="30" ry="21" fill="#50A8DC"/>
      <ellipse cx="53" cy="68" rx="24" ry="13" fill="#fff" opacity="0.9"/>
      <text x="50" y="125" text-anchor="middle" font-size="14" fill="#444" font-family="sans-serif" font-weight="500">Edge</text>
    </g>
    <g transform="translate(360,20)">
      <circle cx="50" cy="55" r="48" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
      <circle cx="50" cy="55" r="36" fill="#e8f4fd"/>
      <circle cx="50" cy="55" r="32" fill="none" stroke="#0070C9" stroke-width="2"/>
      <line x1="50" y1="23" x2="50" y2="30" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="50" y1="80" x2="50" y2="87" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="18" y1="55" x2="25" y2="55" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="75" y1="55" x2="82" y2="55" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="50,35 54,51 50,47 46,51" fill="#E8392A"/>
      <polygon points="50,75 46,59 50,63 54,59" fill="#5A5A5A"/>
      <text x="50" y="125" text-anchor="middle" font-size="14" fill="#444" font-family="sans-serif" font-weight="500">Safari</text>
    </g>
    <g transform="translate(505,20)">
      <circle cx="50" cy="55" r="48" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
      <circle cx="50" cy="55" r="32" fill="#0060DF"/>
      <circle cx="50" cy="55" r="32" fill="#00B3F4" opacity="0.45"/>
      <ellipse cx="50" cy="62" rx="20" ry="18" fill="#FF7139"/>
      <ellipse cx="50" cy="67" rx="12" ry="10" fill="#FFCD02"/>
      <text x="50" y="125" text-anchor="middle" font-size="14" fill="#444" font-family="sans-serif" font-weight="500">Firefox</text>
    </g>
    <text x="340" y="158" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">Choose any of these browsers — find the icon on your desktop or home screen</text>
  </svg>`,

  // Step 1: Address bar
  `<svg width="100%" viewBox="0 0 680 160" role="img"><title>Type my.gov.au in the address bar</title>
    <rect x="30" y="20" width="620" height="110" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="30" y="20" width="620" height="42" rx="12" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="30" y="44" width="620" height="18" fill="#f5f5f5"/>
    <circle cx="70" cy="41" r="7" fill="none" stroke="#bbb" stroke-width="1.5"/>
    <line x1="75" y1="46" x2="80" y2="51" stroke="#bbb" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="92" y="28" width="490" height="26" rx="13" fill="#fff" stroke="#2963f1" stroke-width="2"/>
    <text x="112" y="46" font-size="14" fill="#222" font-family="monospace" font-weight="600">my.gov.au</text>
    <rect x="556" y="32" width="22" height="18" rx="4" fill="#2963f1"/>
    <text x="567" y="45" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif">→</text>
    <rect x="92" y="74" width="490" height="30" rx="6" fill="#fff8e6" stroke="#f0d080" stroke-width="1"/>
    <circle cx="108" cy="89" r="8" fill="#00AAD2"/>
    <text x="108" y="93" text-anchor="middle" font-size="9" fill="#fff" font-family="sans-serif">▶▶</text>
    <text x="124" y="94" font-size="13" fill="#555" font-family="sans-serif">myGov Home | myGov — my.gov.au</text>
    <text x="340" y="148" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">Type my.gov.au in the address bar at the top and press Enter</text>
  </svg>`,

  // Step 2: Click Sign In
  `<svg width="100%" viewBox="0 0 680 180" role="img"><title>Click Sign in</title>
    <rect x="30" y="20" width="620" height="140" rx="12" fill="#00AAD2"/>
    <rect x="30" y="20" width="620" height="48" rx="12" fill="#009BBF"/>
    <rect x="30" y="50" width="620" height="18" fill="#009BBF"/>
    <text x="120" y="50" font-size="20" fill="#fff" font-family="sans-serif" font-weight="bold">▶▶ myGov</text>
    <text x="340" y="110" text-anchor="middle" font-size="18" fill="#fff" font-family="sans-serif" font-weight="bold">We're here to help</text>
    <text x="340" y="135" text-anchor="middle" font-size="13" fill="rgba(255,255,255,0.85)" font-family="sans-serif">Access government services from one place.</text>
    <rect x="490" y="27" width="120" height="36" rx="6" fill="#1a1a1a"/>
    <text x="550" y="50" text-anchor="middle" font-size="15" fill="#fff" font-family="sans-serif" font-weight="bold">Sign in →</text>
    <defs><marker id="ya" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#FFD700" stroke-width="2"/></marker></defs>
    <path d="M430 105 C440 80 480 70 488 56" stroke="#FFD700" stroke-width="2.5" stroke-dasharray="5,3" fill="none" marker-end="url(#ya)"/>
    <rect x="330" y="112" width="170" height="32" rx="8" fill="#FFD700"/>
    <text x="415" y="133" text-anchor="middle" font-size="13" fill="#333" font-family="sans-serif" font-weight="bold">👆 Click Sign in here</text>
  </svg>`,

  // Step 3: Username + password form
  `<svg width="100%" viewBox="0 0 680 210" role="img"><title>Enter username and password</title>
    <rect x="100" y="10" width="480" height="195" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <text x="340" y="42" text-anchor="middle" font-size="16" fill="#222" font-family="sans-serif" font-weight="bold">Use your myGov username and password</text>
    <text x="125" y="68" font-size="13" fill="#444" font-family="sans-serif">Username or email</text>
    <rect x="120" y="76" width="440" height="34" rx="6" fill="#fff" stroke="#2963f1" stroke-width="2"/>
    <text x="135" y="98" font-size="13" fill="#aaa" font-family="sans-serif">e.g. yourname@email.com</text>
    <text x="125" y="130" font-size="13" fill="#444" font-family="sans-serif">Password</text>
    <rect x="120" y="138" width="440" height="34" rx="6" fill="#fff" stroke="#ccc" stroke-width="1.5"/>
    <text x="135" y="160" font-size="13" fill="#aaa" font-family="sans-serif">••••••••••</text>
    <text x="530" y="160" font-size="13" fill="#2963f1" font-family="sans-serif">Show</text>
    <rect x="120" y="184" width="440" height="14" rx="4" fill="#fff"/>
    <text x="340" y="195" text-anchor="middle" font-size="12" fill="#2963f1" font-family="sans-serif">Sign in</text>
    <rect x="120" y="178" width="440" height="26" rx="6" fill="#00AAD2"/>
    <text x="340" y="196" text-anchor="middle" font-size="14" fill="#fff" font-family="sans-serif" font-weight="bold">Sign in</text>
  </svg>`,

  // Step 4: SMS code
  `<svg width="100%" viewBox="0 0 680 190" role="img"><title>Enter the 6-digit security code</title>
    <rect x="150" y="15" width="380" height="165" rx="14" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="150" y="15" width="380" height="42" rx="14" fill="#f5f5f5"/>
    <rect x="150" y="38" width="380" height="19" fill="#f5f5f5"/>
    <circle cx="340" cy="36" r="10" fill="#00AAD2"/>
    <text x="340" y="40" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif">✓</text>
    <text x="340" y="78" text-anchor="middle" font-size="14" fill="#222" font-family="sans-serif" font-weight="bold">Enter your security code</text>
    <text x="340" y="98" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">We sent a 6-digit code to your mobile</text>
    <rect x="168" y="112" width="40" height="42" rx="6" fill="#fff" stroke="#2963f1" stroke-width="2"/>
    <rect x="216" y="112" width="40" height="42" rx="6" fill="#fff" stroke="#ddd" stroke-width="1.5"/>
    <rect x="264" y="112" width="40" height="42" rx="6" fill="#fff" stroke="#ddd" stroke-width="1.5"/>
    <rect x="312" y="112" width="40" height="42" rx="6" fill="#fff" stroke="#ddd" stroke-width="1.5"/>
    <rect x="360" y="112" width="40" height="42" rx="6" fill="#fff" stroke="#ddd" stroke-width="1.5"/>
    <rect x="408" y="112" width="40" height="42" rx="6" fill="#fff" stroke="#ddd" stroke-width="1.5"/>
    <text x="188" y="140" text-anchor="middle" font-size="22" fill="#222" font-family="monospace" font-weight="bold">5</text>
    <text x="340" y="174" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Check your phone's SMS messages for the code</text>
  </svg>`,

  // Step 5: Dashboard
  `<svg width="100%" viewBox="0 0 680 185" role="img"><title>myGov dashboard</title>
    <rect x="30" y="10" width="620" height="165" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="30" y="10" width="620" height="42" rx="12" fill="#00AAD2"/>
    <rect x="30" y="36" width="620" height="16" fill="#00AAD2"/>
    <text x="110" y="37" font-size="17" fill="#fff" font-family="sans-serif" font-weight="bold">▶▶ myGov</text>
    <text x="340" y="76" text-anchor="middle" font-size="14" fill="#333" font-family="sans-serif" font-weight="bold">Your linked services</text>
    <rect x="50" y="88" width="170" height="68" rx="8" fill="#f0f8ff" stroke="#b0d4f0" stroke-width="1"/>
    <text x="135" y="116" text-anchor="middle" font-size="14" fill="#0060DF" font-family="sans-serif" font-weight="bold">Medicare</text>
    <text x="135" y="136" text-anchor="middle" font-size="11" fill="#888" font-family="sans-serif">Health &amp; benefits</text>
    <rect x="255" y="88" width="170" height="68" rx="8" fill="#f0f8ff" stroke="#b0d4f0" stroke-width="1"/>
    <text x="340" y="116" text-anchor="middle" font-size="14" fill="#0060DF" font-family="sans-serif" font-weight="bold">Centrelink</text>
    <text x="340" y="136" text-anchor="middle" font-size="11" fill="#888" font-family="sans-serif">Payments</text>
    <rect x="460" y="88" width="170" height="68" rx="8" fill="#f0f8ff" stroke="#b0d4f0" stroke-width="1"/>
    <text x="545" y="116" text-anchor="middle" font-size="14" fill="#0060DF" font-family="sans-serif" font-weight="bold">ATO</text>
    <text x="545" y="136" text-anchor="middle" font-size="11" fill="#888" font-family="sans-serif">Tax &amp; super</text>
    <text x="340" y="172" text-anchor="middle" font-size="13" fill="#27a060" font-family="sans-serif" font-weight="500">✓ You are logged in — click any service to open it</text>
  </svg>`,
]

// 2. Medicare Claim
const medicareVisuals = [
  // Step 0: Log in to myGov first
  `<svg width="100%" viewBox="0 0 680 160" role="img"><title>Log in to myGov first</title>
    <rect x="30" y="15" width="620" height="120" rx="12" fill="#00AAD2"/>
    <rect x="30" y="15" width="620" height="44" rx="12" fill="#009BBF"/>
    <rect x="30" y="42" width="620" height="17" fill="#009BBF"/>
    <text x="120" y="44" font-size="19" fill="#fff" font-family="sans-serif" font-weight="bold">▶▶ myGov</text>
    <rect x="490" y="22" width="118" height="32" rx="6" fill="#1a1a1a"/>
    <text x="549" y="43" text-anchor="middle" font-size="14" fill="#fff" font-family="sans-serif" font-weight="bold">Sign in →</text>
    <text x="340" y="100" text-anchor="middle" font-size="15" fill="#fff" font-family="sans-serif" font-weight="bold">Step 1: Log in to myGov first</text>
    <text x="340" y="122" text-anchor="middle" font-size="13" fill="rgba(255,255,255,0.85)" font-family="sans-serif">Then click Medicare on your myGov home page</text>
    <text x="340" y="150" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">Go to my.gov.au → Sign in → click Medicare</text>
  </svg>`,

  // Step 1: Medicare Online menu
  `<svg width="100%" viewBox="0 0 680 180" role="img"><title>Go to Make a claim in Medicare</title>
    <rect x="30" y="10" width="620" height="160" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="30" y="10" width="620" height="48" rx="12" fill="#00AAD2"/>
    <rect x="30" y="40" width="620" height="18" fill="#00AAD2"/>
    <text x="80" y="40" font-size="17" fill="#fff" font-family="sans-serif" font-weight="bold">▶▶  Medicare Online</text>
    <rect x="50" y="76" width="180" height="36" rx="8" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
    <text x="140" y="99" text-anchor="middle" font-size="13" fill="#555" font-family="sans-serif">View history</text>
    <rect x="250" y="76" width="180" height="36" rx="8" fill="#2963f1"/>
    <text x="340" y="99" text-anchor="middle" font-size="13" fill="#fff" font-family="sans-serif" font-weight="bold">Make a claim ✓</text>
    <rect x="450" y="76" width="180" height="36" rx="8" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
    <text x="540" y="99" text-anchor="middle" font-size="13" fill="#555" font-family="sans-serif">Update details</text>
    <defs><marker id="ma" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#FFD700" stroke-width="2"/></marker></defs>
    <path d="M340 148 L340 116" stroke="#FFD700" stroke-width="2.5" stroke-dasharray="4,3" fill="none" marker-end="url(#ma)"/>
    <rect x="260" y="148" width="160" height="28" rx="7" fill="#FFD700"/>
    <text x="340" y="167" text-anchor="middle" font-size="13" fill="#333" font-family="sans-serif" font-weight="bold">👆 Click here</text>
  </svg>`,

  // Step 2: Receipt details form
  `<svg width="100%" viewBox="0 0 680 200" role="img"><title>Enter receipt details</title>
    <rect x="80" y="10" width="520" height="185" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <text x="340" y="40" text-anchor="middle" font-size="15" fill="#222" font-family="sans-serif" font-weight="bold">Enter details from your receipt</text>
    <text x="105" y="68" font-size="12" fill="#555" font-family="sans-serif">Date of service</text>
    <rect x="100" y="75" width="200" height="30" rx="6" fill="#fff" stroke="#2963f1" stroke-width="1.5"/>
    <text x="115" y="95" font-size="12" fill="#aaa" font-family="sans-serif">e.g. 28/04/2026</text>
    <text x="315" y="68" font-size="12" fill="#555" font-family="sans-serif">Amount paid ($)</text>
    <rect x="310" y="75" width="180" height="30" rx="6" fill="#fff" stroke="#ccc" stroke-width="1.5"/>
    <text x="325" y="95" font-size="12" fill="#aaa" font-family="sans-serif">e.g. 85.00</text>
    <text x="105" y="128" font-size="12" fill="#555" font-family="sans-serif">Item number (on receipt)</text>
    <rect x="100" y="135" width="500" height="30" rx="6" fill="#fff" stroke="#ccc" stroke-width="1.5"/>
    <text x="115" y="155" font-size="12" fill="#aaa" font-family="sans-serif">e.g. 23</text>
    <rect x="80" y="20" width="80" height="100" rx="6" fill="none" stroke="#f0d080" stroke-width="1.5" stroke-dasharray="4,2"/>
    <text x="50" y="45" font-size="10" fill="#888" font-family="sans-serif" transform="rotate(-30,50,45)">Receipt</text>
    <text x="340" y="190" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Have your doctor's receipt ready before you start</text>
  </svg>`,

  // Step 3: Bank details
  `<svg width="100%" viewBox="0 0 680 175" role="img"><title>Check your bank details</title>
    <rect x="80" y="10" width="520" height="155" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <text x="340" y="40" text-anchor="middle" font-size="15" fill="#222" font-family="sans-serif" font-weight="bold">Your bank account for refund</text>
    <rect x="100" y="55" width="480" height="70" rx="8" fill="#f0f8ff" stroke="#b0d4f0" stroke-width="1"/>
    <text x="120" y="78" font-size="13" fill="#444" font-family="sans-serif">Account name:</text>
    <text x="300" y="78" font-size="13" fill="#222" font-family="sans-serif" font-weight="500">Margaret Smith</text>
    <text x="120" y="100" font-size="13" fill="#444" font-family="sans-serif">BSB:</text>
    <text x="300" y="100" font-size="13" fill="#222" font-family="sans-serif" font-weight="500">062-000</text>
    <text x="120" y="122" font-size="13" fill="#444" font-family="sans-serif">Account number:</text>
    <text x="300" y="122" font-size="13" fill="#222" font-family="sans-serif" font-weight="500">••••• 4821</text>
    <text x="340" y="155" text-anchor="middle" font-size="12" fill="#e05000" font-family="sans-serif">⚠ Check these details are correct before continuing</text>
  </svg>`,

  // Step 4: Submit claim
  `<svg width="100%" viewBox="0 0 680 160" role="img"><title>Submit your claim</title>
    <rect x="80" y="10" width="520" height="140" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <text x="340" y="42" text-anchor="middle" font-size="15" fill="#222" font-family="sans-serif" font-weight="bold">Review and submit</text>
    <rect x="100" y="55" width="480" height="48" rx="8" fill="#f8f8f8" stroke="#eee" stroke-width="1"/>
    <text x="120" y="74" font-size="12" fill="#666" font-family="sans-serif">Date: 28/04/2026   Amount: $85.00   Item: 23</text>
    <text x="120" y="92" font-size="12" fill="#666" font-family="sans-serif">Refund to: •••• 4821</text>
    <rect x="200" y="115" width="280" height="32" rx="8" fill="#2963f1"/>
    <text x="340" y="136" text-anchor="middle" font-size="14" fill="#fff" font-family="sans-serif" font-weight="bold">Submit claim →</text>
  </svg>`,

  // Step 5: Confirmation
  `<svg width="100%" viewBox="0 0 680 160" role="img"><title>Claim submitted confirmation</title>
    <rect x="80" y="10" width="520" height="140" rx="12" fill="#edfbf3" stroke="#1db868" stroke-width="1.5"/>
    <circle cx="340" cy="55" r="28" fill="#1db868"/>
    <text x="340" y="63" text-anchor="middle" font-size="26" fill="#fff" font-family="sans-serif">✓</text>
    <text x="340" y="100" text-anchor="middle" font-size="16" fill="#0a5c36" font-family="sans-serif" font-weight="bold">Claim submitted!</text>
    <text x="340" y="122" text-anchor="middle" font-size="13" fill="#0a5c36" font-family="sans-serif">Confirmation number: MED-2026-48291</text>
    <text x="340" y="142" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Refund usually arrives in 2–3 business days</text>
  </svg>`,
]

// 3. Internet Browsing (Safe)
const browsingVisuals = [
  // Step 0: Browser window
  `<svg width="100%" viewBox="0 0 680 160" role="img"><title>Web browser window</title>
    <rect x="30" y="10" width="620" height="140" rx="10" fill="#fff" stroke="#ddd" stroke-width="1"/>
    <rect x="30" y="10" width="620" height="40" rx="10" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
    <rect x="30" y="34" width="620" height="16" fill="#f5f5f5"/>
    <circle cx="58" cy="30" r="7" fill="#FF5F56"/>
    <circle cx="78" cy="30" r="7" fill="#FFBD2E"/>
    <circle cx="98" cy="30" r="7" fill="#27C93F"/>
    <rect x="120" y="21" width="400" height="18" rx="9" fill="#fff" stroke="#ddd" stroke-width="1"/>
    <text x="140" y="34" font-size="12" fill="#aaa" font-family="sans-serif">Search or type a website address...</text>
    <text x="340" y="90" text-anchor="middle" font-size="20" fill="#00AAD2" font-family="sans-serif" font-weight="bold">▶▶ myGov</text>
    <text x="340" y="115" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">ABC News • Google • YouTube</text>
    <text x="340" y="142" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">This is the browser — Chrome, Safari, Edge or Firefox</text>
  </svg>`,

  // Step 1: Address bar with URL
  `<svg width="100%" viewBox="0 0 680 130" role="img"><title>Type a website address</title>
    <rect x="30" y="20" width="620" height="90" rx="10" fill="#fff" stroke="#ddd" stroke-width="1"/>
    <rect x="30" y="20" width="620" height="38" rx="10" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
    <rect x="30" y="42" width="620" height="16" fill="#f5f5f5"/>
    <text x="56" y="43" font-size="18" fill="#888" font-family="sans-serif">←  →  ↻</text>
    <rect x="112" y="24" width="460" height="22" rx="11" fill="#fff" stroke="#2963f1" stroke-width="2"/>
    <text x="130" y="39" font-size="13" fill="#333" font-family="monospace" font-weight="600">abc.net.au</text>
    <rect x="30" y="58" width="620" height="50" rx="0" fill="#fff"/>
    <text x="80" y="90" font-size="14" fill="#1a1a1a" font-family="sans-serif" font-weight="bold">ABC News — Latest Australian news, breaking stories</text>
    <text x="80" y="108" font-size="12" fill="#888" font-family="sans-serif">abc.net.au/news</text>
    <text x="340" y="122" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Click the address bar at the top, type the address, press Enter</text>
  </svg>`,

  // Step 2: Padlock symbol
  `<svg width="100%" viewBox="0 0 680 140" role="img"><title>Check the padlock symbol</title>
    <rect x="30" y="15" width="620" height="40" rx="10" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
    <rect x="42" y="23" width="500" height="24" rx="12" fill="#fff" stroke="#27C93F" stroke-width="2"/>
    <text x="60" y="39" font-size="15" fill="#27C93F" font-family="sans-serif">🔒</text>
    <text x="82" y="39" font-size="13" fill="#333" font-family="monospace" font-weight="600">my.gov.au</text>
    <rect x="30" y="72" width="620" height="60" rx="10" fill="#edfbf3" stroke="#1db868" stroke-width="1.5"/>
    <text x="65" y="100" font-size="22" fill="#1db868" font-family="sans-serif">✓</text>
    <text x="95" y="96" font-size="14" fill="#0a5c36" font-family="sans-serif" font-weight="bold">Padlock shown — this site is safe to use</text>
    <text x="95" y="116" font-size="12" fill="#0a5c36" font-family="sans-serif">The padlock means your connection is encrypted and secure</text>
    <text x="340" y="138" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Always check for the padlock before entering personal details</text>
  </svg>`,

  // Step 3: Search engine
  `<svg width="100%" viewBox="0 0 680 155" role="img"><title>Use a search engine</title>
    <rect x="80" y="10" width="520" height="135" rx="10" fill="#fff" stroke="#ddd" stroke-width="1"/>
    <text x="340" y="42" text-anchor="middle" font-size="26" fill="#4285F4" font-family="sans-serif" font-weight="bold">G<tspan fill="#EA4335">o</tspan><tspan fill="#FBBC05">o</tspan><tspan fill="#4285F4">g</tspan><tspan fill="#34A853">l</tspan><tspan fill="#EA4335">e</tspan></text>
    <rect x="120" y="55" width="440" height="34" rx="17" fill="#fff" stroke="#ddd" stroke-width="1.5"/>
    <text x="148" y="77" font-size="14" fill="#333" font-family="sans-serif">Medicare phone number Australia</text>
    <text x="537" y="77" font-size="18" fill="#4285F4" font-family="sans-serif">🔍</text>
    <rect x="120" y="100" width="440" height="36" rx="6" fill="#f8f8f8" stroke="#eee" stroke-width="1"/>
    <text x="140" y="116" font-size="13" fill="#1a0dab" font-family="sans-serif">Contact us — Medicare — Services Australia</text>
    <text x="140" y="131" font-size="11" fill="#888" font-family="sans-serif">servicesaustralia.gov.au › medicare › contact-us</text>
  </svg>`,

  // Step 4: Close tabs
  `<svg width="100%" viewBox="0 0 680 130" role="img"><title>Close tabs you are not using</title>
    <rect x="30" y="10" width="620" height="110" rx="10" fill="#fff" stroke="#ddd" stroke-width="1"/>
    <rect x="30" y="10" width="620" height="38" rx="10" fill="#f5f5f5"/>
    <rect x="30" y="32" width="620" height="16" fill="#f5f5f5"/>
    <rect x="40" y="14" width="140" height="26" rx="6" fill="#fff" stroke="#ddd" stroke-width="1"/>
    <text x="90" y="31" text-anchor="middle" font-size="11" fill="#333" font-family="sans-serif">myGov</text>
    <text x="165" y="31" font-size="14" fill="#aaa" font-family="sans-serif">✕</text>
    <rect x="185" y="14" width="140" height="26" rx="6" fill="#e8e8e8" stroke="#ddd" stroke-width="1"/>
    <text x="240" y="31" text-anchor="middle" font-size="11" fill="#888" font-family="sans-serif">ABC News</text>
    <text x="308" y="29" font-size="16" fill="#ff5555" font-family="sans-serif" font-weight="bold">✕</text>
    <rect x="330" y="14" width="140" height="26" rx="6" fill="#e8e8e8" stroke="#ddd" stroke-width="1"/>
    <text x="390" y="31" text-anchor="middle" font-size="11" fill="#888" font-family="sans-serif">Google</text>
    <text x="453" y="29" font-size="16" fill="#ff5555" font-family="sans-serif" font-weight="bold">✕</text>
    <text x="340" y="85" text-anchor="middle" font-size="14" fill="#444" font-family="sans-serif">Click the <tspan font-weight="bold" fill="#ff5555">✕</tspan> on a tab to close it when you are done</text>
    <text x="340" y="110" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Keeping fewer tabs open helps your device run faster</text>
  </svg>`,
]

// 4. Online Banking
const bankingVisuals = [
  // Step 0: Find bank website
  `<svg width="100%" viewBox="0 0 680 170" role="img"><title>Find your bank's website</title>
    <rect x="30" y="10" width="620" height="150" rx="12" fill="#fff" stroke="#eee" stroke-width="1"/>
    <rect x="30" y="10" width="620" height="42" rx="12" fill="#f5f5f5" stroke="#eee" stroke-width="1"/>
    <rect x="30" y="35" width="620" height="17" fill="#f5f5f5"/>
    <rect x="90" y="18" width="430" height="22" rx="11" fill="#fff" stroke="#2963f1" stroke-width="2"/>
    <text x="108" y="33" font-size="13" fill="#333" font-family="monospace">commbank.com.au</text>
    <rect x="50" y="62" width="580" height="88" rx="8" fill="#fff" stroke="#f0c000" stroke-width="2"/>
    <rect x="50" y="62" width="580" height="42" rx="8" fill="#f5f5f5" stroke="#eee" stroke-width="1"/>
    <rect x="50" y="86" width="580" height="18" fill="#f5f5f5"/>
    <text x="80" y="88" font-size="14" fill="#333" font-family="sans-serif" font-weight="bold">CommBank</text>
    <rect x="520" y="68" width="100" height="30" rx="6" fill="#f5c000"/>
    <text x="570" y="88" text-anchor="middle" font-size="13" fill="#333" font-family="sans-serif" font-weight="bold">🔒 Log on</text>
    <text x="80" y="125" font-size="12" fill="#888" font-family="sans-serif">Business  |  Institutional  |  CommBank Yello</text>
    <text x="340" y="162" text-anchor="middle" font-size="12" fill="#e05000" font-family="sans-serif">⚠ Always type the address yourself — never click email links</text>
  </svg>`,

  // Step 1: Click log in
  `<svg width="100%" viewBox="0 0 680 140" role="img"><title>Click Log in or Sign in</title>
    <rect x="30" y="10" width="620" height="120" rx="12" fill="#f5f5f5" stroke="#eee" stroke-width="1"/>
    <text x="80" y="50" font-size="16" fill="#333" font-family="sans-serif">Business</text>
    <text x="200" y="50" font-size="16" fill="#333" font-family="sans-serif">Personal</text>
    <text x="340" y="50" font-size="16" fill="#333" font-family="sans-serif">CommBank Yello</text>
    <rect x="480" y="28" width="140" height="38" rx="8" fill="#f5c000"/>
    <text x="550" y="52" text-anchor="middle" font-size="15" fill="#222" font-family="sans-serif" font-weight="bold">🔒 Log on</text>
    <defs><marker id="ba" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#e05000" stroke-width="2"/></marker></defs>
    <path d="M400 100 L490 56" stroke="#e05000" stroke-width="2.5" stroke-dasharray="5,3" fill="none" marker-end="url(#ba)"/>
    <rect x="260" y="98" width="200" height="30" rx="7" fill="#e05000"/>
    <text x="360" y="118" text-anchor="middle" font-size="13" fill="#fff" font-family="sans-serif" font-weight="bold">👆 Click Log on</text>
  </svg>`,

  // Step 2: Enter customer number
  `<svg width="100%" viewBox="0 0 680 185" role="img"><title>Enter customer number and password</title>
    <rect x="100" y="10" width="480" height="170" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <text x="340" y="40" text-anchor="middle" font-size="15" fill="#222" font-family="sans-serif" font-weight="bold">Log on to NetBank</text>
    <text x="125" y="68" font-size="13" fill="#444" font-family="sans-serif">Client number</text>
    <rect x="120" y="76" width="440" height="32" rx="6" fill="#fff" stroke="#2963f1" stroke-width="2"/>
    <text x="135" y="97" font-size="13" fill="#aaa" font-family="sans-serif">Your number is on the front of your card</text>
    <text x="125" y="128" font-size="13" fill="#444" font-family="sans-serif">Password</text>
    <rect x="120" y="136" width="440" height="32" rx="6" fill="#fff" stroke="#ccc" stroke-width="1.5"/>
    <text x="135" y="157" font-size="13" fill="#aaa" font-family="sans-serif">••••••••</text>
    <rect x="200" y="154" width="280" height="20" rx="4" fill="#fff"/>
    <rect x="200" y="150" width="280" height="28" rx="8" fill="#f5c000"/>
    <text x="340" y="169" text-anchor="middle" font-size="13" fill="#222" font-family="sans-serif" font-weight="bold">Log on</text>
  </svg>`,

  // Step 3: Security check
  `<svg width="100%" viewBox="0 0 680 160" role="img"><title>Complete the security check</title>
    <rect x="100" y="10" width="480" height="140" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <text x="340" y="42" text-anchor="middle" font-size="15" fill="#222" font-family="sans-serif" font-weight="bold">Security verification</text>
    <text x="340" y="68" text-anchor="middle" font-size="13" fill="#666" font-family="sans-serif">We sent a code to your mobile ending in ••••23</text>
    <rect x="200" y="80" width="280" height="36" rx="8" fill="#fff" stroke="#2963f1" stroke-width="2"/>
    <text x="340" y="103" text-anchor="middle" font-size="14" fill="#aaa" font-family="sans-serif">Enter 6-digit code</text>
    <rect x="200" y="126" width="280" height="16" rx="4" fill="#fff"/>
    <rect x="200" y="122" width="280" height="24" rx="6" fill="#f5c000"/>
    <text x="340" y="139" text-anchor="middle" font-size="13" fill="#222" font-family="sans-serif" font-weight="bold">Verify</text>
  </svg>`,

  // Step 4: View balance
  `<svg width="100%" viewBox="0 0 680 170" role="img"><title>View your balance and transactions</title>
    <rect x="30" y="10" width="620" height="150" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="30" y="10" width="620" height="44" rx="12" fill="#f5f5f5" stroke="#eee" stroke-width="1"/>
    <rect x="30" y="38" width="620" height="16" fill="#f5f5f5"/>
    <text x="80" y="36" font-size="16" fill="#333" font-family="sans-serif" font-weight="bold">My accounts</text>
    <rect x="50" y="64" width="580" height="44" rx="8" fill="#fff8e0" stroke="#f0d060" stroke-width="1"/>
    <text x="80" y="82" font-size="13" fill="#444" font-family="sans-serif">Everyday account</text>
    <text x="555" y="82" text-anchor="end" font-size="16" fill="#222" font-family="sans-serif" font-weight="bold">$2,481.50</text>
    <text x="80" y="100" font-size="11" fill="#888" font-family="sans-serif">BSB 062-000 · Acct ••••4821</text>
    <rect x="50" y="118" width="580" height="32" rx="6" fill="#f5f5f5" stroke="#eee" stroke-width="1"/>
    <text x="80" y="138" font-size="12" fill="#666" font-family="sans-serif">28 Apr — Woolworths</text>
    <text x="555" y="138" text-anchor="end" font-size="12" fill="#c03000" font-family="sans-serif">−$45.20</text>
    <text x="340" y="162" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Click your account name to see your balance and recent transactions</text>
  </svg>`,

  // Step 5: Log out
  `<svg width="100%" viewBox="0 0 680 150" role="img"><title>Log out when finished</title>
    <rect x="30" y="10" width="620" height="130" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="30" y="10" width="620" height="42" rx="12" fill="#f5f5f5" stroke="#eee" stroke-width="1"/>
    <rect x="30" y="36" width="620" height="16" fill="#f5f5f5"/>
    <text x="80" y="35" font-size="16" fill="#333" font-family="sans-serif" font-weight="bold">CommBank</text>
    <rect x="500" y="16" width="120" height="26" rx="6" fill="#fff" stroke="#cc0000" stroke-width="2"/>
    <text x="560" y="34" text-anchor="middle" font-size="13" fill="#cc0000" font-family="sans-serif" font-weight="bold">Log out →</text>
    <defs><marker id="lo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#cc0000" stroke-width="2"/></marker></defs>
    <path d="M400 100 L498 36" stroke="#cc0000" stroke-width="2" stroke-dasharray="4,3" fill="none" marker-end="url(#lo)"/>
    <text x="340" y="98" text-anchor="middle" font-size="14" fill="#444" font-family="sans-serif">Always click <tspan font-weight="bold" fill="#cc0000">Log out</tspan> when you are finished</text>
    <text x="340" y="122" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Do not just close the browser tab — always log out properly</text>
  </svg>`,
]

// 5. Spot a Scam Text
const scamVisuals = [
  // Step 0: Read carefully - fake SMS
  `<svg width="100%" viewBox="0 0 680 200" role="img"><title>Scam text message example</title>
    <rect x="150" y="10" width="380" height="180" rx="18" fill="#1a1a2e" stroke="#333" stroke-width="2"/>
    <rect x="150" y="10" width="380" height="44" rx="18" fill="#2a2a40"/>
    <rect x="150" y="38" width="380" height="16" fill="#2a2a40"/>
    <text x="340" y="36" text-anchor="middle" font-size="13" fill="#ccc" font-family="sans-serif">Messages</text>
    <text x="340" y="75" text-anchor="middle" font-size="12" fill="#aaa" font-family="sans-serif">myGov</text>
    <rect x="170" y="85" width="330" height="80" rx="12" fill="#ff4444" opacity="0.15" stroke="#ff4444" stroke-width="1.5"/>
    <text x="185" y="106" font-size="12" fill="#ffcccc" font-family="sans-serif" font-weight="bold">⚠ URGENT: myGov account</text>
    <text x="185" y="124" font-size="12" fill="#ffcccc" font-family="sans-serif">suspended. Verify now or</text>
    <text x="185" y="142" font-size="12" fill="#ffcccc" font-family="sans-serif">lose access: bit.ly/mg0v-fix</text>
    <text x="185" y="160" font-size="10" fill="#ff8888" font-family="sans-serif">10:42 AM</text>
    <text x="340" y="192" text-anchor="middle" font-size="12" fill="#e05000" font-family="sans-serif">⚠ This is a SCAM — do not click any links</text>
  </svg>`,

  // Step 1: Spelling mistakes
  `<svg width="100%" viewBox="0 0 680 180" role="img"><title>Look for spelling mistakes in scam messages</title>
    <rect x="60" y="10" width="560" height="160" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <text x="340" y="40" text-anchor="middle" font-size="14" fill="#222" font-family="sans-serif" font-weight="bold">Spot the differences</text>
    <rect x="80" y="52" width="240" height="90" rx="8" fill="#edfbf3" stroke="#1db868" stroke-width="1.5"/>
    <text x="200" y="74" text-anchor="middle" font-size="12" fill="#0a5c36" font-family="sans-serif" font-weight="bold">✓ Real myGov message</text>
    <text x="200" y="96" text-anchor="middle" font-size="12" fill="#0a5c36" font-family="sans-serif">Sender: myGov</text>
    <text x="200" y="114" text-anchor="middle" font-size="12" fill="#0a5c36" font-family="sans-serif">Link: my.gov.au</text>
    <text x="200" y="132" text-anchor="middle" font-size="12" fill="#0a5c36" font-family="sans-serif">Tone: calm, clear</text>
    <rect x="360" y="52" width="240" height="90" rx="8" fill="#fff3f3" stroke="#e03535" stroke-width="1.5"/>
    <text x="480" y="74" text-anchor="middle" font-size="12" fill="#6b0808" font-family="sans-serif" font-weight="bold">✕ Scam message</text>
    <text x="480" y="96" text-anchor="middle" font-size="12" fill="#6b0808" font-family="sans-serif">Sender: unknown number</text>
    <text x="480" y="114" text-anchor="middle" font-size="12" fill="#6b0808" font-family="sans-serif">Link: myg0v-update.net</text>
    <text x="480" y="132" text-anchor="middle" font-size="12" fill="#6b0808" font-family="sans-serif">Tone: URGENT! Act NOW!</text>
    <text x="340" y="170" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Scammers use panic and urgency — real organisations never do this</text>
  </svg>`,

  // Step 2: Do not click links
  `<svg width="100%" viewBox="0 0 680 160" role="img"><title>Do not click links in suspicious texts</title>
    <rect x="60" y="10" width="560" height="140" rx="12" fill="#fff3f3" stroke="#e03535" stroke-width="2"/>
    <text x="340" y="46" text-anchor="middle" font-size="30" fill="#e03535" font-family="sans-serif">🚫</text>
    <text x="340" y="80" text-anchor="middle" font-size="16" fill="#6b0808" font-family="sans-serif" font-weight="bold">Never click links in unexpected texts</text>
    <rect x="140" y="92" width="400" height="28" rx="8" fill="#fde8e8" stroke="#e03535" stroke-width="1"/>
    <text x="340" y="110" text-anchor="middle" font-size="13" fill="#6b0808" font-family="monospace">bit.ly/mg0v-fix  ← DO NOT CLICK</text>
    <text x="340" y="142" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Real government sites never send account links by SMS</text>
  </svg>`,

  // Step 3: Check independently
  `<svg width="100%" viewBox="0 0 680 155" role="img"><title>Check independently</title>
    <rect x="60" y="10" width="560" height="135" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <text x="340" y="42" text-anchor="middle" font-size="14" fill="#222" font-family="sans-serif" font-weight="bold">If unsure — check independently</text>
    <rect x="80" y="55" width="520" height="36" rx="8" fill="#e8f0fe" stroke="#2963f1" stroke-width="1.5"/>
    <text x="108" y="72" font-size="14" fill="#2963f1" font-family="monospace" font-weight="600">my.gov.au</text>
    <text x="108" y="86" font-size="11" fill="#2963f1" font-family="sans-serif">Type the official address yourself in a new browser tab</text>
    <text x="340" y="112" text-anchor="middle" font-size="22" fill="#888" font-family="sans-serif">OR</text>
    <rect x="80" y="115" width="520" height="26" rx="8" fill="#edfbf3" stroke="#1db868" stroke-width="1.5"/>
    <text x="340" y="133" text-anchor="middle" font-size="13" fill="#0a5c36" font-family="sans-serif">📞 Call the official number — 132 307 (myGov)</text>
  </svg>`,

  // Step 4: Report the scam
  `<svg width="100%" viewBox="0 0 680 155" role="img"><title>Report the scam</title>
    <rect x="60" y="10" width="560" height="135" rx="12" fill="#fff" stroke="#e0e0e0" stroke-width="1"/>
    <text x="340" y="42" text-anchor="middle" font-size="14" fill="#222" font-family="sans-serif" font-weight="bold">Report the scam to protect others</text>
    <rect x="80" y="55" width="520" height="70" rx="8" fill="#e8f0fe" stroke="#2963f1" stroke-width="1.5"/>
    <text x="340" y="82" text-anchor="middle" font-size="14" fill="#2963f1" font-family="sans-serif" font-weight="bold">acma.gov.au/report-a-scam</text>
    <text x="340" y="104" text-anchor="middle" font-size="12" fill="#444" font-family="sans-serif">Australian Communications and Media Authority</text>
    <text x="340" y="118" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">Free, easy, and helps protect other Australians</text>
    <text x="340" y="145" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">You can also forward scam texts to 0429 999 888 (Spam SMS line)</text>
  </svg>`,
]

// 6. Smartphone Basics
const smartphoneVisuals = [
  // Step 0: Power button
  `<svg width="100%" viewBox="0 0 680 200" role="img"><title>Turn phone on and off</title>
    <rect x="240" y="10" width="200" height="170" rx="22" fill="#2a2a2a" stroke="#444" stroke-width="2"/>
    <rect x="248" y="18" width="184" height="154" rx="16" fill="#1a1a1a"/>
    <rect x="248" y="18" width="184" height="154" rx="16" fill="#111"/>
    <text x="340" y="105" text-anchor="middle" font-size="28" fill="#fff" font-family="sans-serif">📱</text>
    <rect x="440" y="70" width="8" height="40" rx="4" fill="#555" stroke="#666" stroke-width="1"/>
    <rect x="442" y="72" width="4" height="36" rx="2" fill="#777"/>
    <defs><marker id="pba" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#FFD700" stroke-width="2"/></marker></defs>
    <path d="M510 90 L452 90" stroke="#FFD700" stroke-width="2" stroke-dasharray="4,3" fill="none" marker-end="url(#pba)"/>
    <rect x="514" y="76" width="130" height="28" rx="6" fill="#FFD700"/>
    <text x="579" y="95" text-anchor="middle" font-size="13" fill="#333" font-family="sans-serif" font-weight="bold">Power button</text>
    <text x="340" y="192" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">Press and hold the side button for 2–3 seconds</text>
  </svg>`,

  // Step 1: Make a call
  `<svg width="100%" viewBox="0 0 680 200" role="img"><title>Make a phone call</title>
    <rect x="220" y="10" width="240" height="180" rx="22" fill="#2a2a2a" stroke="#444" stroke-width="2"/>
    <rect x="228" y="18" width="224" height="164" rx="16" fill="#111"/>
    <text x="340" y="55" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">10:42</text>
    <text x="340" y="85" text-anchor="middle" font-size="26" fill="#fff" font-family="monospace">0412 345 678</text>
    <circle cx="340" cy="148" r="28" fill="#27C93F"/>
    <text x="340" y="156" text-anchor="middle" font-size="24" fill="#fff" font-family="sans-serif">📞</text>
    <text x="340" y="192" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">Tap the green phone icon — type the number — tap call</text>
  </svg>`,

  // Step 2: Send text message
  `<svg width="100%" viewBox="0 0 680 200" role="img"><title>Send a text message</title>
    <rect x="200" y="10" width="280" height="180" rx="22" fill="#2a2a2a" stroke="#444" stroke-width="2"/>
    <rect x="208" y="18" width="264" height="164" rx="16" fill="#111"/>
    <rect x="218" y="28" width="244" height="24" rx="6" fill="#222"/>
    <text x="270" y="44" font-size="13" fill="#fff" font-family="sans-serif">To: Mum</text>
    <rect x="220" y="60" width="160" height="36" rx="10" fill="#2963f1"/>
    <text x="300" y="82" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif">Hello! How are you?</text>
    <rect x="220" y="150" width="220" height="22" rx="11" fill="#222"/>
    <text x="260" y="165" font-size="12" fill="#666" font-family="sans-serif">Type a message...</text>
    <circle cx="420" cy="161" r="11" fill="#2963f1"/>
    <text x="420" y="166" text-anchor="middle" font-size="14" fill="#fff" font-family="sans-serif">↑</text>
    <text x="340" y="196" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">Tap Messages → new message → type → send</text>
  </svg>`,

  // Step 3: Font size settings
  `<svg width="100%" viewBox="0 0 680 190" role="img"><title>Adjust text size in settings</title>
    <rect x="200" y="10" width="280" height="170" rx="22" fill="#2a2a2a" stroke="#444" stroke-width="2"/>
    <rect x="208" y="18" width="264" height="154" rx="16" fill="#111"/>
    <rect x="208" y="18" width="264" height="36" rx="16" fill="#1a1a1a"/>
    <rect x="208" y="36" width="264" height="18" fill="#1a1a1a"/>
    <text x="340" y="40" text-anchor="middle" font-size="13" fill="#fff" font-family="sans-serif" font-weight="bold">Display &amp; Text Size</text>
    <text x="225" y="78" font-size="12" fill="#aaa" font-family="sans-serif">Text size</text>
    <rect x="220" y="90" width="240" height="6" rx="3" fill="#444"/>
    <circle cx="380" cy="93" r="10" fill="#2963f1"/>
    <text x="215" y="90" font-size="11" fill="#888" font-family="sans-serif">A</text>
    <text x="455" y="92" font-size="17" fill="#fff" font-family="sans-serif" font-weight="bold">A</text>
    <text x="225" y="125" font-size="14" fill="#fff" font-family="sans-serif">This is how text looks now</text>
    <text x="340" y="186" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">Settings → Display → Text Size → drag slider right</text>
  </svg>`,

  // Step 4: WiFi settings
  `<svg width="100%" viewBox="0 0 680 195" role="img"><title>Connect to WiFi</title>
    <rect x="200" y="10" width="280" height="175" rx="22" fill="#2a2a2a" stroke="#444" stroke-width="2"/>
    <rect x="208" y="18" width="264" height="159" rx="16" fill="#111"/>
    <rect x="208" y="18" width="264" height="36" rx="16" fill="#1a1a1a"/>
    <rect x="208" y="36" width="264" height="18" fill="#1a1a1a"/>
    <text x="340" y="40" text-anchor="middle" font-size="13" fill="#fff" font-family="sans-serif" font-weight="bold">Wi-Fi</text>
    <rect x="220" y="62" width="240" height="30" rx="8" fill="#1e1e1e"/>
    <text x="235" y="80" font-size="13" fill="#fff" font-family="sans-serif">Wi-Fi</text>
    <rect x="415" y="67" width="36" height="20" rx="10" fill="#27C93F"/>
    <circle cx="442" cy="77" r="8" fill="#fff"/>
    <rect x="220" y="100" width="240" height="30" rx="8" fill="#2963f1" opacity="0.3" stroke="#2963f1" stroke-width="1.5"/>
    <text x="235" y="118" font-size="13" fill="#fff" font-family="sans-serif" font-weight="bold">✓ MyHomeWiFi</text>
    <text x="235" y="148" font-size="12" fill="#aaa" font-family="sans-serif">Neighbour_WiFi</text>
    <text x="235" y="168" font-size="12" fill="#aaa" font-family="sans-serif">CafeNetwork</text>
    <text x="340" y="191" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">Settings → Wi-Fi → tap your home network name</text>
  </svg>`,

  // Step 5: Charging
  `<svg width="100%" viewBox="0 0 680 195" role="img"><title>Charge your phone</title>
    <rect x="230" y="10" width="220" height="165" rx="22" fill="#2a2a2a" stroke="#444" stroke-width="2"/>
    <rect x="238" y="18" width="204" height="149" rx="16" fill="#111"/>
    <text x="340" y="90" text-anchor="middle" font-size="40" fill="#FFD700" font-family="sans-serif">⚡</text>
    <text x="340" y="130" text-anchor="middle" font-size="14" fill="#aaa" font-family="sans-serif">Charging…  68%</text>
    <rect x="320" y="175" width="40" height="16" rx="4" fill="#555"/>
    <rect x="326" y="191" width="28" height="8" rx="2" fill="#777"/>
    <rect x="326" y="191" width="28" height="80" rx="2" fill="#666"/>
    <defs><marker id="ca" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#888" stroke-width="2"/></marker></defs>
    <text x="340" y="185" text-anchor="middle" font-size="13" fill="#888" font-family="sans-serif">Plug the cable into the bottom of your phone</text>
  </svg>`,
]

// ─── Map lesson id to visuals and flow steps ─────────────────────────────────
const lessonVisualMap = {
  'mygov-login': {
    visuals: mygovVisuals,
    flowSteps: ['Open browser', 'Go to my.gov.au', 'Click Sign in', 'Enter details', 'Enter code', 'Logged in ✓'],
  },
  'medicare-claim': {
    visuals: medicareVisuals,
    flowSteps: ['Log in myGov', 'Make a claim', 'Enter receipt', 'Check bank', 'Submit', 'Done ✓'],
  },
  'internet-browsing': {
    visuals: browsingVisuals,
    flowSteps: ['Open browser', 'Type address', 'Check padlock', 'Use search', 'Close tabs'],
  },
  'online-banking': {
    visuals: bankingVisuals,
    flowSteps: ['Find website', 'Click Log in', 'Enter number', 'Security check', 'View balance', 'Log out ✓'],
  },
  'spot-scam-texts': {
    visuals: scamVisuals,
    flowSteps: ['Read carefully', 'Check spelling', 'No links!', 'Check yourself', 'Report it'],
  },
  'smartphone-basics': {
    visuals: smartphoneVisuals,
    flowSteps: ['Power on/off', 'Make a call', 'Send text', 'Text size', 'Connect Wi-Fi', 'Charging'],
  },
}

function getCurrentVisual(lessonId, stepIdx) {
  const map = lessonVisualMap[lessonId]
  if (!map) return null
  return map.visuals[stepIdx] || null
}

function getCurrentFlow(lessonId, stepIdx) {
  const map = lessonVisualMap[lessonId]
  if (!map) return null
  return flowDiagram(map.flowSteps, stepIdx)
}
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section">

      <!-- Lesson detail view -->
      <div v-if="selectedLesson">
        <button class="btn btn-outline-secondary mb-4" type="button" @click="closeLesson">
          {{ t(lang, 'guides.backToLessons') }}
        </button>

        <!-- Lesson header -->
        <div class="card soft-card mb-4">
          <div class="card-body p-4 p-md-5">
            <div class="d-flex align-items-center gap-3 mb-2">
              <div class="tile-icon tile-icon-sm bg-primary-subtle text-primary">
                <IconGlyph :name="selectedLesson.icon" />
              </div>
              <span class="badge rounded-pill" :class="selectedLesson.tone === 'green' ? 'text-bg-success-subtle text-success-emphasis' : 'text-bg-warning-subtle text-warning-emphasis'">
                {{ lessonT(selectedLesson.id, 'level') }}
              </span>
            </div>
            <h1 class="display-6 fw-bold mb-2">{{ lessonT(selectedLesson.id, 'title') }}</h1>
            <p class="lead text-secondary mb-0">{{ lessonT(selectedLesson.id, 'description') }}</p>
          </div>
        </div>

        <!-- Step indicator -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h4 fw-bold mb-0">{{ t(lang, 'guides.stepOf')(currentStep + 1, totalSteps) }}</h2>
          <span class="text-secondary small">{{ t(lang, 'guides.percentComplete')(Math.round(((currentStep + 1) / totalSteps) * 100)) }}</span>
        </div>

        <!-- Step progress bar -->
        <div class="progress mb-4" role="progressbar">
          <div class="progress-bar" :style="{ width: ((currentStep + 1) / totalSteps * 100) + '%' }"></div>
        </div>

        <!-- Current step card -->
        <div class="card soft-card mb-4">
          <div class="card-body p-4 d-flex gap-3 align-items-start">
            <span class="tip-number flex-shrink-0">{{ currentStep + 1 }}</span>
            <div class="w-100">
              <h3 class="h5 fw-bold mb-1">{{ stepT(selectedLesson.id, currentStep, 'title') }}</h3>
              <p class="text-secondary mb-0">{{ stepT(selectedLesson.id, currentStep, 'detail') }}</p>
              <div v-if="stepT(selectedLesson.id, currentStep, 'tip')" class="alert alert-warning mt-3 mb-0 py-2 px-3 small">
                💡 <strong>{{ t(lang, 'guides.tip') }}:</strong> {{ stepT(selectedLesson.id, currentStep, 'tip') }}
              </div>

              <!-- Step illustration -->
              <div
                v-if="getCurrentVisual(selectedLesson.id, currentStep)"
                class="mt-4 step-visual-wrap"
                v-html="getCurrentVisual(selectedLesson.id, currentStep)"
              ></div>

              <!-- Flow diagram -->
              <div
                v-if="getCurrentFlow(selectedLesson.id, currentStep)"
                class="mt-3 flow-diagram-wrap"
                v-html="getCurrentFlow(selectedLesson.id, currentStep)"
              ></div>
            </div>
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="d-flex justify-content-between align-items-center gap-3">
          <button class="btn btn-outline-secondary btn-lg" type="button" :disabled="isFirstStep" @click="prevStep">
            {{ t(lang, 'guides.back') }}
          </button>
          <button v-if="!isLastStep" class="btn btn-primary btn-lg" type="button" @click="nextStep">
            {{ t(lang, 'guides.next') }}
          </button>
          <button v-else-if="!isCompleted(selectedLesson.id)" class="btn btn-success btn-lg" type="button" @click="markComplete(selectedLesson.id)">
            {{ t(lang, 'guides.markComplete') }}
          </button>
          <div v-else class="alert alert-success mb-0 py-2 px-4">
            {{ t(lang, 'guides.lessonDone') }}
          </div>
        </div>
      </div>

      <!-- Lesson list view -->
      <div v-else>
        <div class="text-center hero-copy-sm mx-auto mb-4">
          <h1 class="display-6 fw-bold mb-3">{{ t(lang, 'guides.pageTitle') }}</h1>
          <p class="lead text-secondary mb-0">{{ t(lang, 'guides.pageSubtitle') }}</p>
        </div>

        <!-- Progress bar -->
        <div class="card soft-card mb-4">
          <div class="card-body p-4">
            <div class="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
              <h3 class="h4 mb-0">{{ t(lang, 'guides.yourProgress') }}</h3>
              <span class="text-secondary">{{ t(lang, 'guides.progressLabel')(completedCount, lessons.length) }}</span>
            </div>
            <div class="progress" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Filter buttons -->
        <h2 class="h3 fw-bold mb-3">{{ t(lang, 'guides.filterTitle') }}</h2>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <button
            v-for="filter in filters"
            :key="filter.id"
            type="button"
            class="btn"
            :class="lessonFilter === filter.id ? 'btn-primary' : 'btn-outline-secondary'"
            @click="lessonFilter = filter.id"
          >
            {{ t(lang, `guides.filters.${filter.id}`) }}
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
                  <span v-if="isCompleted(lesson.id)" class="badge text-bg-success">{{ t(lang, 'guides.done') }}</span>
                  <span v-else class="rounded-circle border lesson-dot"></span>
                </div>
                <h3 class="h4 mb-2">{{ lessonT(lesson.id, 'title') }}</h3>
                <p class="text-secondary mb-3">{{ lessonT(lesson.id, 'description') }}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="badge rounded-pill" :class="lesson.tone === 'green' ? 'text-bg-success-subtle text-success-emphasis' : 'text-bg-warning-subtle text-warning-emphasis'">
                    {{ lessonT(lesson.id, 'level') }}
                  </span>
                  <span class="text-primary small fw-semibold">{{ t(lang, 'guides.startLesson') }}</span>
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
.step-visual-wrap {
  background: #f8faff;
  border-radius: 12px;
  padding: 16px 12px;
  border: 1px solid #e4eaf8;
  margin-top: 1rem;
}
.flow-diagram-wrap {
  background: #f8faff;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid #e4eaf8;
}
</style>
