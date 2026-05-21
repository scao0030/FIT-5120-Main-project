# DigiNav

> DigiNav is a multilingual, trusted web platform that helps older Australians safely use essential digital services like Medicare and Centrelink, discover local community activities, and maintain cognitive health. It is designed for seniors aged 60–70, especially those from culturally and linguistically diverse backgrounds or living alone, who lack confidence navigating online services. DigiNav supports them to stay independent, avoid scams, and stay socially connected.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running in Development](#running-in-development)
  - [Building for Production](#building-for-production)
- [API Reference](#api-reference)
- [URL Check Engine](#url-check-engine)
  - [External Threat Sources](#external-threat-sources)
  - [Local Heuristics](#local-heuristics)
  - [Verdict Logic](#verdict-logic)
- [Database Setup](#database-setup)
- [Internationalisation (i18n)](#internationalisation-i18n)
- [Pages & Components](#pages--components)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Trusted Checker is a full-stack web application built to help everyday Australians — particularly seniors and those less familiar with online threats — stay safe on the internet. It provides:

- A **real-time URL safety checker** that queries 10 external threat-intelligence sources simultaneously.
- A **local help finder** that maps nearby support services (libraries, community centres, etc.) by postcode.
- **Scam recognition guides** covering phishing, smishing, fake government pages, and more.
- **Five cognitive mini-games** designed to help older users maintain digital alertness.
- Full **multi-language support** with a language selector persisted across sessions.

---

## Features

| Feature | Description |
|---|---|
| 🔗 **URL Checker** | Paste any link and get an instant SAFE / SUSPICIOUS / UNSAFE verdict backed by 10 threat databases |
| 🗺️ **Help Finder** | Search by Australian postcode and state to locate nearby support venues on an interactive Mapbox map with driving/walking directions |
| 📚 **Guides** | Step-by-step scam awareness guides covering phishing, fake sites, phone scams, and safe online habits |
| ⚠️ **Scam Alerts** | A curated list of currently active Australian scam campaigns with recognition tips and reporting links |
| 🎮 **Brain Games** | Five daily cognitive games (Memory Match, Word Recall, Pattern Recognition, Number Speed, Spatial Thinking) on a rotating weekday schedule |
| 🌐 **Multi-language** | Language preference saved to `localStorage` and applied across all pages |

---

## Tech Stack

### Frontend
- **[Vue 3](https://vuejs.org/)** (Composition API with `<script setup>`) — no Vue Router; page navigation is handled via a central `currentPage` ref in `App.vue`
- **[Bootstrap 5](https://getbootstrap.com/)** — utility classes and component primitives
- **[Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)** — interactive map and directions on the Help page
- **[Vite](https://vitejs.dev/)** — build tool and dev server

### Backend
- **[Node.js](https://nodejs.org/)** + **[Express](https://expressjs.com/)** — lightweight REST API server
- **[pg (node-postgres)](https://node-postgres.com/)** — PostgreSQL client for help-location queries
- **[dotenv](https://github.com/motdotla/dotenv)** — environment variable management

### External APIs (URL Checking)
- Quad9 DNS (`9.9.9.9`)
- Cloudflare DNS-over-HTTPS (`security.cloudflare-dns.com`)
- [URLhaus](https://urlhaus.abuse.ch/) (abuse.ch)
- [ThreatFox](https://threatfox.abuse.ch/) (abuse.ch)
- [PhishTank](https://www.phishtank.com/)
- [OpenPhish](https://openphish.com/)
- [Google Safe Browsing v4](https://developers.google.com/safe-browsing) *(API key required)*
- [URLScan.io](https://urlscan.io/)
- [Sucuri SiteCheck](https://sitecheck.sucuri.net/)
- [Abuse.ch SSL Blacklist (SSLBL)](https://sslbl.abuse.ch/)

---

## Project Structure

```
├── src/
│   ├── App.vue                  # Root component — routing, language state
│   ├── main.js                  # Vue app entry point
│   ├── styles.css               # Global styles
│   ├── pages/
│   │   ├── HomePage.vue         # Landing page with feature navigation tiles
│   │   ├── CheckerPage.vue      # URL safety checker UI
│   │   ├── HelpPage.vue         # Postcode-based help location finder + Mapbox map
│   │   ├── GuidesPage.vue       # Scam awareness guides
│   │   ├── ScamsPage.vue        # Active scam alerts
│   │   └── GamesPage.vue        # Game hub with weekday schedule
│   ├── games/
│   │   ├── MemoryMatchGame.vue  # Card memory match game
│   │   ├── WordRecallGame.vue   # Word recall game
│   │   ├── PatternRecoGame.vue  # Pattern recognition game
│   │   ├── NumberSpeedGame.vue  # Number speed game
│   │   └── SpatialThinkingGame.vue # Spatial thinking game
│   ├── components/
│   │   ├── TopNav.vue           # Navigation bar with language selector
│   │   ├── IconGlyph.vue        # SVG icon component
│   │   └── GameShell.vue        # Shared game wrapper (score, timer, instructions)
│   ├── data/
│   │   └── siteContent.js       # Static content: nav items, feature cards, scam cards
│   └── i18n/
│       └── index.js             # Translation helper and language definitions
│
├── server/
│   ├── index.js                 # Express server, API routes, in-memory cache
│   ├── checkUrl.js              # URL check orchestration and verdict aggregation
│   ├── apiSources.js            # Adapters for all 10 external threat sources
│   ├── heuristics.js            # Local pattern-based URL risk scoring
│   ├── safeBrowsing.js          # Google Safe Browsing v4 integration
│   └── db.js                    # PostgreSQL connection pool
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- *(Optional)* A PostgreSQL database for the Help location finder
- *(Optional)* API keys for Google Safe Browsing and abuse.ch

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/trusted-checker.git
cd trusted-checker

# Install all dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root. The app runs without any keys, but some features will be limited:

```env
# --- Server ---
PORT=5174                          # API server port (default: 5174)
HOST=0.0.0.0                       # Bind address
NODE_ENV=development               # Set to "production" to serve built frontend

# --- CORS (only needed if frontend and API are on different origins) ---
CORS_ORIGIN=http://localhost:5173  # Or "*" to allow all origins

# --- API Keys (optional but recommended) ---
SAFE_BROWSING_API_KEY=             # Google Safe Browsing v4 API key
ABUSECH_AUTH_KEY=                  # abuse.ch API key (URLhaus + ThreatFox)

# --- Database (required for Help location finder) ---
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trusted_checker
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false                       # Set to "true" for hosted databases

# Also accepts standard PG* env vars: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

# --- Frontend (Vite) ---
VITE_API_BASE_URL=http://localhost:5174   # Backend URL for the frontend to call
VITE_MAPBOX_TOKEN=                        # Mapbox public token (required for Help map)
```

> **Without `SAFE_BROWSING_API_KEY`:** Google Safe Browsing checks will return `ERROR` (not configured) and the verdict policy will treat this conservatively.  
> **Without `ABUSECH_AUTH_KEY`:** URLhaus and ThreatFox checks will similarly return `ERROR`.  
> **Without a database:** The `/api/help-locations` endpoint will return a 500 error; all other features work normally.  
> **Without `VITE_MAPBOX_TOKEN`:** The Help page map will not render.

### Running in Development

The frontend (Vite) and backend (Express) run as two separate processes:

```bash
# Terminal 1 — Start the API server
node server/index.js

# Terminal 2 — Start the Vite dev server
npm run dev
```

The frontend is available at `http://localhost:5173` and the API at `http://localhost:5174`.

### Building for Production

```bash
# Build the frontend into /dist
npm run build

# Serve the app (Express will also serve /dist in production mode)
NODE_ENV=production node server/index.js
```

In production mode, Express serves the built frontend from `/dist` for all non-API routes, so a single process handles everything.

---

## API Reference

All endpoints are served by the Express backend.

### `GET /api/health`

Returns `{ ok: true }`. Used for uptime/health checks.

---

### `POST /api/check-url`

Checks a URL against all configured threat sources and local heuristics.

**Request body:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{
  "ok": true,
  "verdict": "SAFE",               // "SAFE" | "SUSPICIOUS" | "UNSAFE"
  "headline": "All 8 security checks found no threats.",
  "hostname": "example.com",
  "normalizedUrl": "https://example.com/",
  "confidence": "HIGH",            // "HIGH" | "MEDIUM" | "LOW"
  "reasons": [],                   // Array of warning strings
  "nextSteps": ["Check the spelling..."],
  "sources": [ ... ],              // Per-source breakdown
  "heuristics": { ... },          // Heuristic flags and score
  "summary": {
    "totalSources": 10,
    "activeSources": 8,
    "flaggedCount": 0,
    "safeCount": 8,
    "errorSources": 2
  }
}
```

Results are cached in memory for **15 minutes** per normalised URL.

---

### `GET /api/help-locations?query=3000&state=VIC&venueType=Library`

Searches the database for help locations by postcode and state.

| Parameter | Required | Description |
|---|---|---|
| `query` | ✅ | 4-digit Australian postcode |
| `state` | ✅ | State code (`VIC`, `NSW`, `QLD`, etc.) |
| `venueType` | ❌ | Filter by venue type (e.g. `Library`) |

Returns up to 200 results ordered by suburb and name.

---

### `GET /api/help-venue-types?state=VIC`

Returns a list of all distinct venue types available in the database for a given state. Used to populate the filter dropdown on the Help page.

---

## URL Check Engine

### External Threat Sources

Each source is queried in parallel with a 10-second timeout and up to 2 retries on transient failures (408, 429, 5xx). The sources and their roles are:

| # | Source | Method | Key Required |
|---|---|---|---|
| 1 | **Quad9 DNS** | DNS resolution — blocked domains return `NXDOMAIN` | No |
| 2 | **Cloudflare DNS** | DNS-over-HTTPS security filtering | No |
| 3 | **URLhaus** | Malware URL feed lookup | Yes (`ABUSECH_AUTH_KEY`) |
| 4 | **ThreatFox** | IOC (Indicators of Compromise) lookup | Yes (`ABUSECH_AUTH_KEY`) |
| 5 | **PhishTank** | Community-verified phishing URL database | No |
| 6 | **OpenPhish** | Live phishing feed | No |
| 7 | **Google Safe Browsing** | Malware, social engineering, unwanted software | Yes (`SAFE_BROWSING_API_KEY`) |
| 8 | **URLScan.io** | URL scan history and threat tags | No |
| 9 | **Sucuri SiteCheck** | Website malware and blacklist check | No |
| 10 | **Abuse.ch SSLBL** | SSL certificate IP blacklist | No |

### Local Heuristics

Before contacting external services, the URL is scored locally against 9 structural risk signals:

| Check | Severity | Score |
|---|---|---|
| No HTTPS | HIGH | +40 |
| URL shortener detected | HIGH | +35 |
| Raw IP address used | CRITICAL | +50 |
| Internationalised (IDN) characters | HIGH | +35 |
| Excessive hyphens in domain (≥3) | MEDIUM | +15 |
| Excessive digits in domain (≥5) | MEDIUM | +15 |
| Unusually long domain (≥28 chars) | LOW | +10 |
| Suspicious keywords (login, verify, bank, mygov…) | HIGH | +12–25 |
| Impersonating Australian government (.gov.au) | CRITICAL | +30 |

A total heuristic score ≥ 60 raises a `SUSPICIOUS` local verdict.

### Verdict Logic

The final verdict is determined by `deriveOverallVerdict()` in `checkUrl.js` and follows a **fail-closed** (conservative) policy:

| Condition | Verdict |
|---|---|
| Any source returns `ERROR` | **UNSAFE** (strict error mode) |
| Any live source returns `UNSAFE` or `SUSPICIOUS` | **UNSAFE** |
| Fewer than 3 active sources respond | **SUSPICIOUS** |
| No active sources at all | **SUSPICIOUS** |
| ≥3 active sources all return `SAFE` | **SAFE** |

---

## Database Setup

The Help page requires a PostgreSQL table named `help_locations`:

```sql
CREATE TABLE help_locations (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  venue_type     TEXT,
  address        TEXT,
  suburb         TEXT,
  state          TEXT,
  postcode       TEXT,
  phone          TEXT,
  website        TEXT,
  opening_hours  TEXT,
  latitude       NUMERIC,
  longitude      NUMERIC,
  source         TEXT
);

-- Recommended index for postcode + state lookups
CREATE INDEX idx_help_locations_postcode_state
  ON help_locations (CAST(postcode AS TEXT), UPPER(state));
```

The connection supports both `DB_*` and `PG*` environment variable conventions and automatically enables SSL for non-localhost hosts.

---

## Internationalisation (i18n)

All user-facing strings are resolved through a lightweight translation helper (`src/i18n/index.js`). The active language is stored in `localStorage` under the key `preferred-lang` and provided app-wide via Vue's `provide/inject` API.

To add a new language, add its entries to the translation map in `src/i18n/index.js` and register it in the `SUPPORTED_LANGUAGES` array.

---

## Pages & Components

### Pages

| Page | Route key | Description |
|---|---|---|
| `HomePage` | `home` | Hero section and feature navigation tiles |
| `CheckerPage` | `checker` | URL input, check button, and result card with expandable details |
| `HelpPage` | `help` | Postcode search, Mapbox map, venue list, and turn-by-turn routing |
| `GuidesPage` | `guides` | Multi-section scam awareness guide |
| `ScamsPage` | `scams` | Active scam alerts with recognition tips |
| `GamesPage` | `games` | Game hub — one game per weekday (Mon–Fri), free choice on weekends |

### Games Schedule

| Day | Game |
|---|---|
| Monday | 🃏 Memory Match |
| Tuesday | 💬 Word Recall |
| Wednesday | 🔷 Pattern Recognition |
| Thursday | ⚡ Number Speed |
| Friday | 🧩 Spatial Thinking |
| Weekend | All games available |

### Key Components

- **`TopNav.vue`** — Responsive navigation bar with page links and language selector
- **`IconGlyph.vue`** — Inline SVG icon library component
- **`GameShell.vue`** — Shared wrapper for all games providing score tracking, timer, and instructions UI

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes and ensure the app runs correctly in development
3. Keep backend logic modular — new threat sources belong in `apiSources.js` following the existing adapter pattern
4. Submit a pull request with a clear description of what changed and why

---

## License

This project was developed as part of a university capstone project (FIT5120). Please check with the project owners before using or distributing this code.
