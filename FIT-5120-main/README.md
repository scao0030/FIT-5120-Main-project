# FIT-5120-main

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Trusted Website Checker API (Local)

The checker calls a small local API server (to keep the Google Safe Browsing API key out of the frontend).

1. Create a `.env` file using `FIT-5120-main/.env.example` as a template.
2. Set `SAFE_BROWSING_API_KEY` to your Google Safe Browsing API key.
3. Run the API server in a second terminal:

```sh
npm run dev:server
```

The frontend will call `/api/check-url` and Vite will proxy it to `http://localhost:5174`.

### Compile and Minify for Production

```sh
npm run build
```
