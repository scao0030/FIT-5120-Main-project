<script setup>
import { computed, provide, ref } from 'vue'
import TopNav from './components/TopNav.vue'
import HomePage from './pages/HomePage.vue'
import GuidesPage from './pages/GuidesPage.vue'
import ServicesPage from './pages/ServicesPage.vue'
import HelpPage from './pages/HelpPage.vue'
import CheckerPage from './pages/CheckerPage.vue'
import GamesPage from './pages/GamesPage.vue'
import { navItems } from './data/siteContent'
import { SUPPORTED_LANGUAGES, DEFAULT_LANG } from './i18n/index.js'

// Keep language preference across refreshes and expose it to the whole app via provide/inject.
const savedLang = localStorage.getItem('preferred-lang')
const lang = ref(
  SUPPORTED_LANGUAGES.find((l) => l.code === savedLang) ? savedLang : DEFAULT_LANG
)
function setLang(code) { lang.value = code; localStorage.setItem('preferred-lang', code) }
provide('lang', lang)
provide('setLang', setLang)

// This project uses a lightweight view switcher instead of vue-router.
const currentPage = ref('home')
const currentView = computed(() =>
  ({ home: HomePage, guides: GuidesPage, services: ServicesPage, help: HelpPage, checker: CheckerPage, games: GamesPage })[currentPage.value] || HomePage
)
</script>

<template>
  <!-- Global background illustration -->
  <div class="bg-scene" aria-hidden="true">
    <svg width="100%" height="100%" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1400" height="900" fill="#eef4ff"/>
      <circle cx="1300" cy="100" r="72" fill="#fff7cc" opacity="0.75"/>
      <circle cx="1300" cy="100" r="52" fill="#ffe566" opacity="0.45"/>
      <g stroke="#ffe566" stroke-width="3" opacity="0.35" stroke-linecap="round">
        <line x1="1300" y1="14" x2="1300" y2="2"/><line x1="1300" y1="198" x2="1300" y2="210"/>
        <line x1="1214" y1="100" x2="1202" y2="100"/><line x1="1386" y1="100" x2="1398" y2="100"/>
        <line x1="1239" y1="39" x2="1231" y2="31"/><line x1="1361" y1="161" x2="1369" y2="169"/>
        <line x1="1361" y1="39" x2="1369" y2="31"/><line x1="1239" y1="161" x2="1231" y2="169"/>
      </g>
      <g opacity="0.55"><ellipse cx="200" cy="155" rx="80" ry="32" fill="#fff"/><ellipse cx="158" cy="160" rx="50" ry="28" fill="#fff"/><ellipse cx="248" cy="158" rx="46" ry="26" fill="#fff"/></g>
      <g opacity="0.48"><ellipse cx="860" cy="130" rx="90" ry="34" fill="#fff"/><ellipse cx="818" cy="135" rx="55" ry="28" fill="#fff"/><ellipse cx="916" cy="133" rx="50" ry="26" fill="#fff"/></g>
      <g opacity="0.40"><ellipse cx="560" cy="80" rx="60" ry="22" fill="#fff"/><ellipse cx="528" cy="84" rx="38" ry="20" fill="#fff"/><ellipse cx="594" cy="83" rx="34" ry="19" fill="#fff"/></g>
      <g stroke="#2347b6" stroke-width="2" fill="none" opacity="0.22" stroke-linecap="round">
        <path d="M340 118 Q348 110 356 118"/><path d="M364 106 Q372 98 380 106"/>
        <path d="M390 122 Q398 114 406 122"/><path d="M420 100 Q428 92 436 100"/>
      </g>
      <ellipse cx="700" cy="930" rx="1000" ry="220" fill="#c8deff" opacity="0.45"/>
      <ellipse cx="100" cy="920" rx="550" ry="180" fill="#b8d4ff" opacity="0.38"/>
      <ellipse cx="1320" cy="910" rx="450" ry="160" fill="#c0daff" opacity="0.40"/>
      <rect x="0" y="820" width="1400" height="80" fill="#d4e8ff" opacity="0.35"/>
      <rect x="72" y="500" width="18" height="220" rx="9" fill="#8ab4d8" opacity="0.55"/>
      <ellipse cx="81" cy="488" rx="58" ry="70" fill="#a8ccee" opacity="0.45"/>
      <ellipse cx="81" cy="445" rx="44" ry="55" fill="#b8d8f4" opacity="0.40"/>
      <ellipse cx="81" cy="408" rx="30" ry="38" fill="#c8e4f8" opacity="0.35"/>
      <rect x="148" y="580" width="12" height="140" rx="6" fill="#8ab4d8" opacity="0.50"/>
      <ellipse cx="154" cy="566" rx="38" ry="48" fill="#a8ccee" opacity="0.40"/>
      <ellipse cx="154" cy="530" rx="26" ry="34" fill="#b8d8f4" opacity="0.35"/>
      <rect x="1300" y="510" width="18" height="210" rx="9" fill="#8ab4d8" opacity="0.52"/>
      <ellipse cx="1309" cy="498" rx="56" ry="66" fill="#a8ccee" opacity="0.42"/>
      <ellipse cx="1309" cy="456" rx="40" ry="52" fill="#b8d8f4" opacity="0.38"/>
      <ellipse cx="1309" cy="418" rx="28" ry="36" fill="#c8e4f8" opacity="0.32"/>
      <rect x="1238" y="590" width="12" height="130" rx="6" fill="#8ab4d8" opacity="0.45"/>
      <ellipse cx="1244" cy="576" rx="36" ry="44" fill="#a8ccee" opacity="0.38"/>
      <rect x="590" y="698" width="188" height="10" rx="5" fill="#90b8e0" opacity="0.60"/>
      <rect x="590" y="712" width="188" height="10" rx="5" fill="#90b8e0" opacity="0.55"/>
      <rect x="580" y="730" width="200" height="14" rx="7" fill="#a0c8f0" opacity="0.65"/>
      <rect x="598" y="744" width="12" height="46" rx="5" fill="#90b8e0" opacity="0.55"/>
      <rect x="752" y="744" width="12" height="46" rx="5" fill="#90b8e0" opacity="0.55"/>
      <rect x="590" y="782" width="185" height="8" rx="4" fill="#90b8e0" opacity="0.45"/>
      <ellipse cx="648" cy="706" rx="26" ry="32" fill="#3a7bd5" opacity="0.32"/>
      <path d="M634 736 Q630 760 626 780" stroke="#3a7bd5" stroke-width="11" fill="none" opacity="0.28" stroke-linecap="round"/>
      <path d="M662 736 Q665 760 668 780" stroke="#3a7bd5" stroke-width="11" fill="none" opacity="0.28" stroke-linecap="round"/>
      <ellipse cx="624" cy="782" rx="10" ry="5" fill="#2347b6" opacity="0.30"/>
      <ellipse cx="670" cy="782" rx="10" ry="5" fill="#2347b6" opacity="0.30"/>
      <rect x="643" y="668" width="10" height="14" rx="5" fill="#f0d8c0" opacity="0.55"/>
      <circle cx="648" cy="652" r="24" fill="#f0d8c0" opacity="0.60"/>
      <ellipse cx="648" cy="634" rx="22" ry="11" fill="#e8ecf8" opacity="0.70"/>
      <ellipse cx="636" cy="638" rx="10" ry="8" fill="#e8ecf8" opacity="0.65"/>
      <ellipse cx="660" cy="638" rx="10" ry="8" fill="#e8ecf8" opacity="0.65"/>
      <circle cx="641" cy="652" r="2.5" fill="#4a3020" opacity="0.55"/>
      <circle cx="655" cy="652" r="2.5" fill="#4a3020" opacity="0.55"/>
      <path d="M641 660 Q648 667 655 660" stroke="#8a5030" stroke-width="2" fill="none" opacity="0.50" stroke-linecap="round"/>
      <rect x="635" y="648" width="10" height="8" rx="4" fill="none" stroke="#6080c0" stroke-width="1.5" opacity="0.45"/>
      <rect x="648" y="648" width="10" height="8" rx="4" fill="none" stroke="#6080c0" stroke-width="1.5" opacity="0.45"/>
      <line x1="645" y1="652" x2="648" y2="652" stroke="#6080c0" stroke-width="1.5" opacity="0.45"/>
      <path d="M632 690 Q618 698 610 700" stroke="#f0d8c0" stroke-width="9" fill="none" opacity="0.50" stroke-linecap="round"/>
      <path d="M664 690 Q674 698 678 706" stroke="#f0d8c0" stroke-width="9" fill="none" opacity="0.45" stroke-linecap="round"/>
      <rect x="590" y="678" width="36" height="28" rx="4" fill="#2347b6" opacity="0.35"/>
      <rect x="593" y="681" width="30" height="22" rx="3" fill="#e8f2ff" opacity="0.70"/>
      <rect x="595" y="683" width="26" height="3" rx="1" fill="#2347b6" opacity="0.30"/>
      <rect x="595" y="688" width="20" height="2" rx="1" fill="#90b8e0" opacity="0.40"/>
      <rect x="595" y="692" width="24" height="2" rx="1" fill="#90b8e0" opacity="0.35"/>
      <rect x="595" y="696" width="16" height="2" rx="1" fill="#90b8e0" opacity="0.30"/>
      <ellipse cx="718" cy="698" rx="22" ry="34" fill="#2963f1" opacity="0.25"/>
      <path d="M706 730 Q702 758 698 782" stroke="#2963f1" stroke-width="11" fill="none" opacity="0.22" stroke-linecap="round"/>
      <path d="M730 730 Q733 758 736 782" stroke="#2963f1" stroke-width="11" fill="none" opacity="0.22" stroke-linecap="round"/>
      <ellipse cx="696" cy="784" rx="10" ry="5" fill="#2347b6" opacity="0.25"/>
      <ellipse cx="738" cy="784" rx="10" ry="5" fill="#2347b6" opacity="0.25"/>
      <rect x="713" y="658" width="10" height="14" rx="5" fill="#e8c8a8" opacity="0.55"/>
      <circle cx="718" cy="642" r="22" fill="#e8c8a8" opacity="0.58"/>
      <ellipse cx="718" cy="626" rx="20" ry="9" fill="#3a2818" opacity="0.40"/>
      <circle cx="711" cy="642" r="2.5" fill="#2a1808" opacity="0.50"/>
      <circle cx="725" cy="642" r="2.5" fill="#2a1808" opacity="0.50"/>
      <path d="M711 650 Q718 656 725 650" stroke="#7a4020" stroke-width="2" fill="none" opacity="0.45" stroke-linecap="round"/>
      <path d="M700 680 Q660 688 620 696" stroke="#e8c8a8" stroke-width="8" fill="none" opacity="0.42" stroke-linecap="round"/>
      <circle cx="614" cy="697" r="4" fill="#e8c8a8" opacity="0.50"/>
      <g class="particles">
        <circle cx="300" cy="400" r="4" fill="#2963f1" opacity="0.15"><animate attributeName="cy" values="400;200;400" dur="8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.15;0.25;0.15" dur="8s" repeatCount="indefinite"/></circle>
        <circle cx="500" cy="600" r="3" fill="#fff" opacity="0.20"><animate attributeName="cy" values="600;350;600" dur="10s" repeatCount="indefinite"/></circle>
        <circle cx="900" cy="500" r="5" fill="#fff" opacity="0.12"><animate attributeName="cy" values="500;280;500" dur="12s" repeatCount="indefinite"/></circle>
        <circle cx="700" cy="750" r="4" fill="#ffe566" opacity="0.18"><animate attributeName="cy" values="750;500;750" dur="11s" repeatCount="indefinite"/></circle>
        <circle cx="1200" cy="700" r="3" fill="#ffe566" opacity="0.16"><animate attributeName="cy" values="700;450;700" dur="10.5s" repeatCount="indefinite"/></circle>
      </g>
    </svg>
  </div>

  <!-- Main app -->
  <div class="app-shell">
    <TopNav
      :nav-items="navItems"
      :current-page="currentPage"
      :supported-languages="SUPPORTED_LANGUAGES"
      @navigate="currentPage = $event"
    />
    <main class="page-shell">
      <component :is="currentView" @navigate="currentPage = $event" />
    </main>
  </div>
</template>

<style scoped>
/* Full-screen decorative background shared by every page. */
.bg-scene {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: #eef4ff;
}
.bg-scene svg {
  width: 100%;
  height: 100%;
}
</style>
