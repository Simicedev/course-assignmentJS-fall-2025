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

## Project Management

### Kanban Board
We use GitHub Projects to track our work. The board is organized into columns:
- **Backlog** – Unprioritized ideas/tasks
- **Ready** – Groomed & sized, ready to start  
- **In Progress** – Active development
- **Review** – PR open / needs review
- **Done** – Merged & deployed

See [TASKS.md](./TASKS.md) for current project tasks and priorities.

### Issue Templates
Use our issue templates when creating new issues:
- **Bug Report** – For reporting defects
- **Feature Request** – For suggesting new features
- **Task** – For general work items

## Contributing

1. Pick or create an issue using the templates
2. Move issue to "In Progress" on the Project board
3. Fork & clone
4. Create a feature branch: `git checkout -b feat/something`
5. Commit using conventional style (e.g., `feat: add profile page`)
6. Open a PR referencing the issue (e.g., `Closes #12`)
7. Request review and move issue to "Review"

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed workflow guidelines.
