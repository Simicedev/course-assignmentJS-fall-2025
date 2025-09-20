# Testing DOM Behaviour

A Vite + TypeScript client with an Express + Socket.IO server for a coursework assignment (Fall 2025).

## Features
- Client-side routing (`src/router/router.ts`)
- Authentication flow (login/register) storing tokens in `src/storage`
- Realtime updates via Socket.IO (`src/realtime/socket.ts`)
- REST-like API abstraction in `src/services` and `src/ApiClient`
- Offline-ready assets (service worker in `public/sw.js`)

## Tech Stack
- TypeScript
- Vite (dev/build tooling)
- Express 5
- Socket.IO (server & client)

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
Run the API / websocket server (default port from `server.ts`, override with `PORT`):
```
npm start
```
Example with custom port:
```
npm run start:3001
```

### Build
```
npm run build
```
Artifacts go to `dist/`.

### Preview Production Build
```
npm run preview
```

## Environment Variables
Create a `.env` file (not committed) for overrides.
Example:
```
PORT=3000
ORIGIN=http://localhost:5173
```
Adjust server code to consume additional vars as needed.

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
- `start` – Runs `server.ts` via tsx
- `start:3000`, `start:3001` – Convenience with PORT presets
- `build` – Type check then bundle
- `preview` – Preview built client

## Contributing
1. Fork & clone
2. Create a feature branch: `git checkout -b feat/something`
3. Commit using conventional style (e.g., `feat: add profile page`)
4. Open a PR

## License
Specify a license (e.g., MIT). If you want, ask to generate a LICENSE file.

## Deployment Tips
- Serve `dist/` with a static host (Netlify, Vercel, etc.)
- Run the Node server separately (can be on Render/Fly/Heroku). Ensure CORS + Socket.IO origin configured.

---
Generated scaffold README. Customize sections (assignment instructions, architecture decisions) as needed.
