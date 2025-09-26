# Course Assignment Fall 2025 

A Vite + TypeScript client for a coursework assignment (Fall 2025).

## Features

- Client-side routing (`src/router/router.ts`)
- Authentication flow (login/register) storing tokens in `src/storage`
- REST-like API abstraction in `src/services` and `src/ApiClient`
- Offline-ready assets (service worker in `public/sw.js`)

## Tech Stack

- TypeScript
- Vite (dev/build tooling)
- Express 5

## Getting Started

### Prerequisites

- Node.js 18+ (recommend LTS) & npm

### Install

```
npm install
```

### Development

Run Vite dev server (serves frontend):

```
npm run dev

```
npm start
```
npm install --save-dev prettier

### Build

```
npm run build
```

Artifacts go to `dist/`.

### Preview Production Build

```
npm run preview
```


## Project Structure (partial)

```
public/        # static assets, manifest, service worker
src/
  pages/       # individual page modules
  services/    # API abstraction layers
  storage/     # token / key handling
  realtime/    # socket setup
  router/      # client-side routing
```

## Scripts (from package.json)

- `dev` – Vite dev server
- `build` – Type check then bundle
- `preview` – Preview built client
- `prettier` - Prettier
## Contributing
1. Fork & clone
2. Create a feature branch: `git checkout -b feat/something`
3. Commit using conventional style (e.g., `feat: add profile page`)
4. Open a PR
