<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import IconGlyph from '../components/IconGlyph.vue'
import { t } from '../i18n/index.js'

const lang = inject('lang')
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN

const searchInput = ref('')
const selectedState = ref('VIC')
const submittedQuery = ref('')
const submittedLabel = ref('')
const submittedState = ref('VIC')
const hasSearched = ref(false)
const errorMessage = ref('')
const isSearching = ref(false)
const activeVenue = ref('all')
const selectedPlaceId = ref(null)
const expandedPlaceId = ref(null)
const mapContainer = ref(null)
const isMapReady = ref(false)
const searchResults = ref([])
const queryCenter = ref(null)
const availableVenueTypes = ref([])

const markerThemes = ['theme-blue', 'theme-gold', 'theme-green', 'theme-coral']
const defaultCenter = [144.9631, -37.8136]

let map = null
let mapMarkers = []

const stateOptions = [
  { code: 'ACT', label: 'Australian Capital Territory (ACT)' },
  { code: 'NSW', label: 'New South Wales (NSW)' },
  { code: 'NT', label: 'Northern Territory (NT)' },
  { code: 'QLD', label: 'Queensland (QLD)' },
  { code: 'SA', label: 'South Australia (SA)' },
  { code: 'TAS', label: 'Tasmania (TAS)' },
  { code: 'VIC', label: 'Victoria (VIC)' },
  { code: 'WA', label: 'Western Australia (WA)' },
]

function buildApiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL
  if (!base) return path
  return String(base).replace(/\/+$/, '') + path
}

const venueFilters = computed(() => [
  { id: 'all', label: t(lang.value, 'help.filterAll') },
  ...availableVenueTypes.value.map((venueType) => ({ id: venueType, label: venueType })),
])

function normalizeQuery(value) {
  return String(value).trim()
}

function isValidSearchQuery(query) {
  return /^\d{4}$/.test(query)
}

function calculateDistanceKm(from, to) {
  const earthRadiusKm = 6371
  const dLat = ((to.lat - from.lat) * Math.PI) / 180
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(distanceKm) {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm)) return null
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`
}

async function geocodeQuery(rawQuery, stateCode) {
  if (!mapboxToken) return null

  const searchText = `${rawQuery}, ${stateCode}, Australia`
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json`)
  url.searchParams.set('access_token', mapboxToken)
  url.searchParams.set('country', 'au')
  url.searchParams.set('limit', '1')
  url.searchParams.set('types', 'postcode,place,locality,neighborhood,address')

  const response = await fetch(url)
  if (!response.ok) return null
  const data = await response.json()
  const feature = data?.features?.[0]
  if (!feature?.center || feature.center.length < 2) return null

  return {
    lng: Number(feature.center[0]),
    lat: Number(feature.center[1]),
  }
}

function normalisePlace(row) {
  return {
    id: row.id,
    name: row.name,
    venueType: row.venueType || '',
    address: row.address || '',
    suburb: row.suburb || '',
    state: row.state || '',
    postcode: row.postcode || '',
    phone: row.phone || '',
    website: row.website || '',
    hours: row.hours || '',
    source: row.source || '',
    lat: Number(row.lat),
    lng: Number(row.lng),
    distanceKm: null,
    distance: null,
  }
}

async function loadVenueTypes(stateCode) {
  try {
    const response = await fetch(buildApiUrl(`/api/help-venue-types?state=${encodeURIComponent(stateCode)}`))
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || t(lang.value, 'help.databaseLoadError'))
    }
    availableVenueTypes.value = payload.results || []
  } catch (err) {
    console.error('[HelpPage] Venue types failed:', err)
    availableVenueTypes.value = []
  }
}

async function onSearch() {
  const raw = searchInput.value.trim()
  const normalized = normalizeQuery(raw)
  errorMessage.value = ''

  if (!normalized) {
    errorMessage.value = t(lang.value, 'help.emptySearchError')
    return
  }

  if (!isValidSearchQuery(normalized)) {
    errorMessage.value = t(lang.value, 'help.invalidSearchError')
    return
  }

  isSearching.value = true
  hasSearched.value = false
  submittedQuery.value = normalized
  submittedLabel.value = raw
  submittedState.value = selectedState.value
  activeVenue.value = 'all'

  try {
    const [geocodeResult, response] = await Promise.all([
      geocodeQuery(raw, selectedState.value).catch(() => null),
      fetch(buildApiUrl(`/api/help-locations?query=${encodeURIComponent(raw)}&state=${encodeURIComponent(selectedState.value)}`)),
    ])

    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || t(lang.value, 'help.databaseLoadError'))
    }

    queryCenter.value = geocodeResult

    const places = (payload.results || []).map(normalisePlace)
    if (geocodeResult) {
      places.forEach((place) => {
        if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return
        place.distanceKm = calculateDistanceKm(geocodeResult, { lat: place.lat, lng: place.lng })
        place.distance = formatDistance(place.distanceKm)
      })
      places.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return a.name.localeCompare(b.name)
        if (a.distanceKm == null) return 1
        if (b.distanceKm == null) return -1
        return a.distanceKm - b.distanceKm
      })
    }

    searchResults.value = places
    hasSearched.value = true
  } catch (err) {
    console.error('[HelpPage] Search failed:', err)
    searchResults.value = []
    queryCenter.value = null
    errorMessage.value = err.message || t(lang.value, 'help.databaseLoadError')
  } finally {
    isSearching.value = false
  }
}

function onSearchKeydown(event) {
  if (event.key === 'Enter') onSearch()
}

const nearbyPlaces = computed(() => searchResults.value)

const filteredPlaces = computed(() =>
  nearbyPlaces.value.filter((place) => activeVenue.value === 'all' || place.venueType === activeVenue.value),
)

watch(filteredPlaces, (places) => {
  if (!places.length) {
    selectedPlaceId.value = null
    expandedPlaceId.value = null
    return
  }

  const hasSelected = places.some((place) => place.id === selectedPlaceId.value)
  if (!hasSelected) {
    selectedPlaceId.value = places[0].id
  }

  if (expandedPlaceId.value && !places.some((place) => place.id === expandedPlaceId.value)) {
    expandedPlaceId.value = null
  }
}, { immediate: true })

const selectedPlace = computed(() =>
  filteredPlaces.value.find((place) => place.id === selectedPlaceId.value) || filteredPlaces.value[0] || null,
)

const mapPlaces = computed(() =>
  filteredPlaces.value
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
    .map((place, index) => ({
      ...place,
      markerLabel: String(index + 1),
      markerTheme: markerThemes[index % markerThemes.length],
    })),
)

function selectPlace(placeId) {
  selectedPlaceId.value = placeId
}

function toggleDetails(placeId) {
  selectedPlaceId.value = placeId
  expandedPlaceId.value = expandedPlaceId.value === placeId ? null : placeId
}

function venueLabel(venueType) {
  return venueType || t(lang.value, 'help.venueUnknown')
}

function formatPhone(phone) {
  return phone || t(lang.value, 'help.contactUnavailable')
}

function directionsUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.address, place.suburb, place.postcode].filter(Boolean).join(', '))}`
}

function websiteUrl(site) {
  if (!site) return null
  return site.startsWith('http') ? site : `https://${site}`
}

function resetSearch() {
  searchInput.value = ''
  selectedState.value = 'VIC'
  submittedQuery.value = ''
  submittedLabel.value = ''
  submittedState.value = 'VIC'
  hasSearched.value = false
  isSearching.value = false
  errorMessage.value = ''
  activeVenue.value = 'all'
  selectedPlaceId.value = null
  expandedPlaceId.value = null
  searchResults.value = []
  queryCenter.value = null
}

function clearMapMarkers() {
  mapMarkers.forEach((marker) => marker.remove())
  mapMarkers = []
}

function markerThemeClass(index) {
  return markerThemes[index % markerThemes.length]
}

function buildMarkerElement(place, index) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `mapbox-place-marker ${markerThemeClass(index)}${selectedPlaceId.value === place.id ? ' active' : ''}`
  button.setAttribute('aria-label', `${place.name}, ${place.distance}`)
  button.innerHTML = `<span>${index + 1}</span>`
  button.addEventListener('click', () => selectPlace(place.id))
  return button
}

function renderMapMarkers() {
  if (!map || !isMapReady.value) return

  clearMapMarkers()

  mapPlaces.value.forEach((place, index) => {
    const element = buildMarkerElement(place, index)
    const marker = new mapboxgl.Marker({ element, anchor: 'bottom' })
      .setLngLat([place.lng, place.lat])
      .addTo(map)
    mapMarkers.push(marker)
  })
}

function syncMarkerSelection() {
  mapMarkers.forEach((marker) => {
    const element = marker.getElement()
    const isActive = element.getAttribute('aria-label')?.startsWith(selectedPlace.value?.name || '')
    element.classList.toggle('active', Boolean(isActive))
  })
}

function updateMapViewport() {
  if (!map || !isMapReady.value) return

  if (!mapPlaces.value.length) {
    map.easeTo({ center: defaultCenter, zoom: 11, duration: 600 })
    return
  }

  if (mapPlaces.value.length === 1) {
    map.easeTo({
      center: [mapPlaces.value[0].lng, mapPlaces.value[0].lat],
      zoom: 13.5,
      duration: 700,
    })
    return
  }

  const bounds = new mapboxgl.LngLatBounds()
  mapPlaces.value.forEach((place) => bounds.extend([place.lng, place.lat]))
  map.fitBounds(bounds, { padding: 80, maxZoom: 13.5, duration: 700 })
}

async function refreshMap() {
  await nextTick()
  if (!map || !isMapReady.value) return
  renderMapMarkers()
  syncMarkerSelection()
  updateMapViewport()
}

onMounted(() => {
  loadVenueTypes(selectedState.value)

  if (!mapContainer.value || !mapboxToken) return

  mapboxgl.accessToken = mapboxToken
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: defaultCenter,
    zoom: 11,
  })

  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  map.on('load', () => {
    isMapReady.value = true
    refreshMap()
  })
})

onBeforeUnmount(() => {
  clearMapMarkers()
  map?.remove()
})

watch(filteredPlaces, () => {
  refreshMap()
})

watch(selectedState, async (stateCode) => {
  activeVenue.value = 'all'
  hasSearched.value = false
  searchResults.value = []
  queryCenter.value = null
  selectedPlaceId.value = null
  expandedPlaceId.value = null
  await loadVenueTypes(stateCode)
})

watch(selectedPlace, (place) => {
  if (!map || !isMapReady.value) return
  syncMarkerSelection()
  if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return

  map.flyTo({
    center: [place.lng, place.lat],
    zoom: Math.max(map.getZoom(), 12.5),
    essential: true,
    duration: 700,
  })
})
</script>

<template>
  <section class="app-page pb-5">
    <div class="container page-section">
      <div class="text-center hero-copy-sm mx-auto mb-4">
        <h1 class="display-6 fw-bold mb-3">{{ t(lang, 'help.pageTitle') }}</h1>
        <p class="lead text-secondary mb-0">{{ t(lang, 'help.pageSubtitle') }}</p>
      </div>

      <div class="card soft-card mb-4 mx-auto search-card">
        <div class="card-body p-4 p-md-5">
          <label class="form-label fw-semibold fs-5 mb-2" for="search-place">{{ t(lang, 'help.searchLabel') }}</label>
          <p class="text-secondary mb-3">{{ t(lang, 'help.searchHint') }}</p>
          <div class="row g-2 align-items-stretch">
            <div class="col-lg-3">
              <label class="visually-hidden" for="search-state">{{ t(lang, 'help.stateLabel') }}</label>
              <select id="search-state" v-model="selectedState" class="form-select form-select-lg search-state-select">
                <option v-for="state in stateOptions" :key="state.code" :value="state.code">
                  {{ state.label }}
                </option>
              </select>
            </div>
            <div class="col-lg-6">
              <div class="input-group input-group-lg search-input-wrap" :class="{ 'is-invalid': !!errorMessage }">
                <span class="input-group-text bg-white search-icon"><IconGlyph name="search" /></span>
                <input
                  id="search-place"
                  v-model="searchInput"
                  type="text"
                  class="form-control"
                  :placeholder="t(lang, 'help.searchPlaceholder')"
                  @keydown="onSearchKeydown"
                />
              </div>
            </div>
            <div class="col-lg-3 d-grid">
              <button class="btn btn-primary btn-lg search-btn" type="button" @click="onSearch">
                {{ isSearching ? t(lang, 'help.searchingBtn') : t(lang, 'help.searchBtn') }}
              </button>
            </div>
          </div>
          <p v-if="errorMessage" class="search-feedback error mt-3 mb-0" role="alert">
            <IconGlyph name="warning" /> {{ errorMessage }}
          </p>
          <p v-else class="search-feedback mt-3 mb-0">
            {{ t(lang, 'help.searchExamples') }}
          </p>
        </div>
      </div>

      <section class="map-preview-section mb-4">
        <div class="map-preview-shell">
          <div class="map-preview-copy">
            <span class="map-preview-kicker">{{ t(lang, 'help.mapKicker') }}</span>
            <div class="map-preview-heading-row">
              <div>
                <h2 class="map-preview-title mb-2">{{ t(lang, 'help.mapTitle') }}</h2>
                <p class="map-preview-text mb-0">{{ t(lang, 'help.mapBody') }}</p>
              </div>
              <div v-if="hasSearched && nearbyPlaces.length" class="map-preview-meta">
                <span class="map-preview-meta-pill">{{ filteredPlaces.length }} {{ t(lang, 'help.resultsFound') }}</span>
                <span class="map-preview-meta-pill">{{ t(lang, 'help.sortedClosest') }}</span>
              </div>
            </div>
          </div>

          <div class="map-canvas-frame">
            <div class="map-canvas">
              <div ref="mapContainer" class="real-map"></div>

              <template v-if="hasSearched && filteredPlaces.length">
                <div class="map-panel">
                  <div class="map-panel-label">{{ t(lang, 'help.mapPanelLabel') }}</div>
                  <div v-if="selectedPlace" class="map-panel-card">
                    <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <h3 class="h5 mb-1">{{ selectedPlace.name }}</h3>
                        <p class="text-secondary small mb-0">{{ [selectedPlace.address, selectedPlace.suburb, selectedPlace.postcode].filter(Boolean).join(', ') }}</p>
                      </div>
                      <span v-if="selectedPlace.distance" class="badge rounded-pill text-bg-primary">{{ selectedPlace.distance }}</span>
                    </div>
                    <div class="map-panel-info">
                      <span v-if="selectedPlace.venueType"><IconGlyph name="building" /> {{ venueLabel(selectedPlace.venueType) }}</span>
                      <span><IconGlyph name="clock" /> {{ selectedPlace.hours || t(lang, 'help.hoursUnavailable') }}</span>
                      <span><IconGlyph name="phone" /> {{ formatPhone(selectedPlace.phone) }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <div v-else-if="hasSearched && !nearbyPlaces.length" class="map-empty-card">
                <h3 class="h5 mb-2">{{ t(lang, 'help.noNearbyTitle') }}</h3>
                <p class="mb-0">{{ t(lang, 'help.noNearbyBody') }}</p>
              </div>

              <div v-else-if="hasSearched && nearbyPlaces.length && !filteredPlaces.length" class="map-empty-card">
                <h3 class="h5 mb-2">{{ t(lang, 'help.noFilterResultsTitle') }}</h3>
                <p class="mb-0">{{ t(lang, 'help.noFilterResultsBody') }}</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section v-if="hasSearched" class="results-shell">
        <div class="results-topbar mb-3">
          <div>
            <h2 class="h2 fw-bold mb-2 d-flex align-items-center gap-2">
              <IconGlyph name="pin" /> {{ t(lang, 'help.nearbyTitle') }}
            </h2>
            <p v-if="nearbyPlaces.length" class="results-summary mb-0">
              {{ filteredPlaces.length }} {{ t(lang, 'help.resultsFoundNear') }}
              <strong>{{ submittedLabel }}</strong>, {{ submittedState }}.
              {{ t(lang, 'help.sortedClosest') }}
            </p>
          </div>
          <div v-if="nearbyPlaces.length" class="sort-pill">
            {{ t(lang, 'help.sortedByLabel') }}
          </div>
        </div>

        <div v-if="nearbyPlaces.length" class="card soft-card filter-panel mb-4">
          <div class="card-body p-4">
            <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              <div>
                <h3 class="h5 fw-bold mb-1">{{ t(lang, 'help.filterTitle') }}</h3>
                <p class="text-secondary mb-0">{{ t(lang, 'help.filterBody') }}</p>
              </div>
              <button
                v-if="activeVenue !== 'all'"
                type="button"
                class="btn btn-link text-decoration-none filter-clear-btn"
                @click="activeVenue = 'all'"
              >
                {{ t(lang, 'help.clearFilter') }}
              </button>
            </div>
            <div class="filter-pill-row mt-3">
              <button
                v-for="filter in venueFilters"
                :key="filter.id"
                type="button"
                class="filter-pill"
                :class="{ active: activeVenue === filter.id }"
                @click="activeVenue = filter.id"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="nearbyPlaces.length && !filteredPlaces.length" class="card soft-card empty-state-card mb-4">
          <div class="card-body p-4 p-md-5 text-center">
            <h3 class="h4 fw-bold mb-2">{{ t(lang, 'help.noFilterResultsTitle') }}</h3>
            <p class="text-secondary mb-3">{{ t(lang, 'help.noFilterResultsBody') }}</p>
            <button type="button" class="btn btn-outline-primary btn-lg" @click="activeVenue = 'all'">
              {{ t(lang, 'help.showAllLocations') }}
            </button>
          </div>
        </div>

        <div v-else-if="!nearbyPlaces.length" class="card soft-card empty-state-card mb-4">
          <div class="card-body p-4 p-md-5 text-center">
            <h3 class="h4 fw-bold mb-2">{{ t(lang, 'help.noNearbyTitle') }}</h3>
            <p class="text-secondary mb-3">{{ t(lang, 'help.noNearbyBody') }}</p>
            <button type="button" class="btn btn-outline-primary btn-lg" @click="resetSearch">
              {{ t(lang, 'help.tryAnotherSearch') }}
            </button>
          </div>
        </div>

        <div v-else class="row g-4">
          <div v-for="place in filteredPlaces" :key="place.id" class="col-xl-6">
            <article class="card soft-card place-card h-100" :class="{ selected: selectedPlaceId === place.id }">
              <div class="card-header place-card-header p-4">
                <div class="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <span class="list-marker">{{ filteredPlaces.findIndex((item) => item.id === place.id) + 1 }}</span>
                      <span class="venue-type-badge">{{ venueLabel(place.venueType) }}</span>
                    </div>
                    <h3 class="h4 mb-2">{{ place.name }}</h3>
                    <p class="text-secondary mb-0 d-flex gap-2"><IconGlyph name="pin" /> {{ [place.address, place.suburb, place.postcode].filter(Boolean).join(', ') }}</p>
                  </div>
                  <span v-if="place.distance" class="distance-badge">{{ place.distance }}</span>
                </div>
              </div>

              <div class="card-body p-4 d-flex flex-column">
                <div class="detail-list">
                  <p class="text-secondary d-flex gap-2 mb-2"><IconGlyph name="clock" /> {{ place.hours || t(lang, 'help.hoursUnavailable') }}</p>
                  <p class="text-secondary d-flex gap-2 mb-2"><IconGlyph name="phone" /> {{ formatPhone(place.phone) }}</p>
                  <a v-if="place.website" class="text-primary d-flex gap-2 mb-3 place-link" :href="websiteUrl(place.website)" target="_blank" rel="noreferrer">
                    <IconGlyph name="globe" /> {{ place.website }}
                  </a>
                </div>

                <div v-if="expandedPlaceId === place.id" class="expanded-details">
                  <div class="expanded-grid">
                    <div>
                      <span class="expanded-label">{{ t(lang, 'help.detailAddress') }}</span>
                      <p class="mb-0">{{ [place.address, place.suburb, place.state, place.postcode].filter(Boolean).join(', ') }}</p>
                    </div>
                    <div>
                      <span class="expanded-label">{{ t(lang, 'help.detailHours') }}</span>
                      <p class="mb-0">{{ place.hours || t(lang, 'help.hoursUnavailable') }}</p>
                    </div>
                    <div>
                      <span class="expanded-label">{{ t(lang, 'help.detailPhone') }}</span>
                      <p class="mb-0">{{ formatPhone(place.phone) }}</p>
                    </div>
                    <div>
                      <span class="expanded-label">{{ t(lang, 'help.detailState') }}</span>
                      <p class="mb-0">{{ place.state || t(lang, 'help.detailUnavailable') }}</p>
                    </div>
                    <div>
                      <span class="expanded-label">{{ t(lang, 'help.detailSource') }}</span>
                      <p class="mb-0">{{ place.source || t(lang, 'help.detailUnavailable') }}</p>
                    </div>
                    <div v-if="place.website">
                      <span class="expanded-label">{{ t(lang, 'help.detailWebsite') }}</span>
                      <p class="mb-0">{{ place.website }}</p>
                    </div>
                  </div>
                </div>

                <div class="card-actions mt-auto">
                  <button type="button" class="btn btn-outline-primary btn-lg" @click="toggleDetails(place.id)">
                    {{ expandedPlaceId === place.id ? t(lang, 'help.hideDetails') : t(lang, 'help.viewDetails') }}
                  </button>
                  <a
                    class="btn btn-primary btn-lg"
                    :href="directionsUrl(place)"
                    target="_blank"
                    rel="noreferrer"
                    @click="selectPlace(place.id)"
                  >
                    {{ t(lang, 'help.getDirections') }}
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

    </div>
  </section>
</template>

<style scoped>
.search-card,
.results-shell {
  max-width: 72rem;
  margin-inline: auto;
}

.search-input-wrap {
  border: 2px solid rgba(92, 120, 193, 0.14);
  border-radius: 20px;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input-wrap:focus-within {
  border-color: rgba(52, 101, 239, 0.45);
  box-shadow: 0 0 0 6px rgba(52, 101, 239, 0.09);
}

.search-input-wrap.is-invalid {
  border-color: rgba(212, 61, 61, 0.72);
  box-shadow: 0 0 0 4px rgba(212, 61, 61, 0.1);
}

.search-icon {
  border: 0;
  padding-inline: 1.2rem 0.8rem;
  font-size: 1.2rem;
}

.search-input-wrap .form-control {
  border: 0;
  min-height: 4rem;
  font-size: 1.15rem;
  padding-inline: 0.4rem 1rem;
}

.search-input-wrap .form-control:focus {
  box-shadow: none;
}

.search-state-select {
  min-height: 4rem;
  border: 2px solid rgba(92, 120, 193, 0.14);
  border-radius: 20px;
  font-size: 1.02rem;
  font-weight: 600;
  color: #31456f;
}

.search-state-select:focus {
  border-color: rgba(52, 101, 239, 0.45);
  box-shadow: 0 0 0 6px rgba(52, 101, 239, 0.09);
}

.search-btn {
  min-height: 4rem;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: 700;
}

.search-feedback {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: #657699;
  font-size: 0.98rem;
}

.search-feedback.error {
  color: #b3261e;
  font-weight: 600;
}

.map-preview-section {
  max-width: 72rem;
  margin-inline: auto;
}

.map-preview-shell {
  background:
    radial-gradient(circle at top left, rgba(137, 184, 255, 0.18), transparent 32%),
    radial-gradient(circle at bottom right, rgba(107, 181, 152, 0.16), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(244, 248, 255, 0.96));
  border: 1px solid rgba(108, 143, 255, 0.2);
  border-radius: 32px;
  box-shadow: 0 24px 60px rgba(78, 102, 151, 0.12);
  overflow: hidden;
}

.map-preview-copy {
  padding: 2rem 2rem 1.2rem;
}

.map-preview-kicker {
  display: inline-flex;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(49, 101, 241, 0.08);
  color: #3156b6;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.map-preview-heading-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.25rem;
  margin-top: 1rem;
}

.map-preview-title {
  font-size: clamp(1.6rem, 2vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #1d2b4f;
}

.map-preview-text {
  max-width: 44rem;
  color: #5f6f94;
  font-size: 1.02rem;
}

.map-preview-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.7rem;
}

.map-preview-meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 2.2rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(101, 124, 188, 0.16);
  background: rgba(255, 255, 255, 0.82);
  color: #40537f;
  font-weight: 600;
}

.map-canvas-frame {
  padding: 0 1.2rem 1.2rem;
}

.map-canvas {
  position: relative;
  min-height: 30rem;
  border-radius: 28px;
  border: 1px solid rgba(117, 142, 204, 0.18);
  overflow: hidden;
}

.real-map {
  position: absolute;
  inset: 0;
}

:deep(.mapboxgl-map) {
  width: 100%;
  height: 100%;
}

:deep(.mapboxgl-canvas) {
  outline: none;
}

:deep(.mapboxgl-ctrl-top-right) {
  top: 1rem;
  right: 1rem;
}

.map-panel {
  position: absolute;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 3;
  width: min(100%, 23rem);
}

.map-panel-label {
  display: inline-flex;
  margin-bottom: 0.6rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(28, 42, 76, 0.82);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.map-panel-card,
.map-empty-card {
  padding: 1.1rem;
  border: 1px solid rgba(103, 128, 194, 0.18);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 34px rgba(62, 87, 143, 0.16);
}

.map-panel-info {
  display: grid;
  gap: 0.55rem;
  color: #546685;
  font-size: 0.94rem;
}

.map-panel-info span {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.map-empty-card {
  position: absolute;
  left: 50%;
  top: 50%;
  max-width: 26rem;
  transform: translate(-50%, -50%);
  text-align: center;
}

.results-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
}

.results-summary {
  color: #586987;
  font-size: 1rem;
}

.sort-pill {
  display: inline-flex;
  align-items: center;
  min-height: 2.8rem;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  background: rgba(46, 86, 199, 0.08);
  color: #2e56c7;
  font-weight: 700;
}

.filter-panel {
  border-radius: 28px;
}

.filter-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
}

.filter-pill {
  min-height: 3rem;
  padding: 0.65rem 1.1rem;
  border: 1px solid rgba(94, 119, 185, 0.18);
  border-radius: 999px;
  background: #fff;
  color: #31456f;
  font-size: 1rem;
  font-weight: 700;
}

.filter-pill.active {
  border-color: #2e56c7;
  background: #2e56c7;
  color: #fff;
  box-shadow: 0 10px 22px rgba(46, 86, 199, 0.18);
}

.filter-clear-btn {
  font-weight: 700;
}

.empty-state-card {
  border-radius: 28px;
}

.place-card {
  border: 1px solid rgba(108, 143, 255, 0.14);
  border-radius: 28px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.place-card.selected {
  border-color: rgba(46, 86, 199, 0.32);
  box-shadow: 0 18px 38px rgba(46, 86, 199, 0.12);
}

.place-card-header {
  background: linear-gradient(180deg, rgba(216, 231, 255, 0.85), rgba(229, 239, 255, 0.72));
  border-bottom: 1px solid rgba(103, 128, 194, 0.12);
}

.distance-badge,
.venue-type-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-weight: 700;
}

.distance-badge {
  background: #2e56c7;
  color: #fff;
}

.venue-type-badge {
  background: rgba(46, 86, 199, 0.08);
  color: #2e56c7;
}

.list-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: #1f3f95;
  color: #fff;
  font-weight: 800;
}

.place-link {
  width: fit-content;
  text-decoration: none;
}

.place-link:hover {
  text-decoration: underline;
}

.service-tag {
  padding: 0.55rem 0.85rem;
  border: 1px solid rgba(104, 126, 175, 0.18);
  border-radius: 999px;
  background: #fff;
  color: #394b74;
  font-size: 0.95rem;
  font-weight: 600;
}

.expanded-details {
  margin-bottom: 1.25rem;
  padding: 1rem 1.1rem;
  border-radius: 20px;
  background: rgba(241, 246, 255, 0.88);
}

.expanded-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}

.expanded-label {
  display: block;
  margin-bottom: 0.25rem;
  color: #5b6e9e;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.card-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.card-actions .btn {
  min-height: 3.3rem;
  border-radius: 18px;
  font-weight: 700;
}

.theme-blue .map-marker-dot {
  background: linear-gradient(135deg, #4587ff, #2b56de);
}

.theme-gold .map-marker-dot {
  background: linear-gradient(135deg, #ffb84d, #e28220);
}

.theme-green .map-marker-dot {
  background: linear-gradient(135deg, #45b983, #1d8f63);
}

.theme-coral .map-marker-dot {
  background: linear-gradient(135deg, #ff7b72, #da4b43);
}

:deep(.mapbox-place-marker) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.9rem;
  height: 2.9rem;
  padding: 0;
  border: 2px solid #fff;
  border-radius: 999px;
  color: #fff;
  font-weight: 800;
  box-shadow: 0 12px 30px rgba(42, 62, 108, 0.24);
  cursor: pointer;
}

:deep(.mapbox-place-marker span) {
  line-height: 1;
}

:deep(.mapbox-place-marker.active) {
  transform: scale(1.08);
  box-shadow: 0 18px 34px rgba(27, 47, 92, 0.34);
}

:deep(.mapbox-place-marker.theme-blue) {
  background: linear-gradient(135deg, #4587ff, #2b56de);
}

:deep(.mapbox-place-marker.theme-gold) {
  background: linear-gradient(135deg, #ffb84d, #e28220);
}

:deep(.mapbox-place-marker.theme-green) {
  background: linear-gradient(135deg, #45b983, #1d8f63);
}

:deep(.mapbox-place-marker.theme-coral) {
  background: linear-gradient(135deg, #ff7b72, #da4b43);
}

@media (max-width: 991.98px) {
  .map-preview-heading-row,
  .results-topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .map-preview-meta {
    justify-content: flex-start;
  }

  .map-canvas {
    min-height: 36rem;
  }

  .map-panel {
    left: 1rem;
    right: 1rem;
    width: auto;
  }
}

@media (max-width: 767.98px) {
  .map-preview-copy {
    padding: 1.4rem 1.1rem 1rem;
  }

  .map-canvas-frame {
    padding: 0 0.8rem 0.8rem;
  }

  .map-canvas {
    min-height: 37rem;
    border-radius: 24px;
  }

  .expanded-grid,
  .card-actions {
    grid-template-columns: 1fr;
  }

  .search-card .card-body {
    padding: 1.2rem !important;
  }

  .search-state-select,
  .search-input-wrap .form-control,
  .search-btn {
    min-height: 3.6rem;
    font-size: 1rem;
  }
}
</style>
