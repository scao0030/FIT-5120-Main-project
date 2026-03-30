<script setup>
import { computed, ref } from 'vue'
import TopNav from './components/TopNav.vue'
import HomePage from './pages/HomePage.vue'
import GuidesPage from './pages/GuidesPage.vue'
import ServicesPage from './pages/ServicesPage.vue'
import ScamsPage from './pages/ScamsPage.vue'
import HelpPage from './pages/HelpPage.vue'
import CheckerPage from './pages/CheckerPage.vue'
import { navItems } from './data/siteContent'

const currentPage = ref('home')

const currentView = computed(
  () =>
    ({
      home: HomePage,
      guides: GuidesPage,
      services: ServicesPage,
      scams: ScamsPage,
      help: HelpPage,
      checker: CheckerPage,
    })[currentPage.value] || HomePage,
)
</script>

<template>
  <div class="app-shell">
    <TopNav :nav-items="navItems" :current-page="currentPage" @navigate="currentPage = $event" />
    <main class="page-shell">
      <component :is="currentView" @navigate="currentPage = $event" />
    </main>
  </div>
</template>
