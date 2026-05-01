# Soumil's Tic-Tac-Toe (browser)

Local two-player tic-tac-toe in the browser with light motion effects and Web Audio sound effects. Core rules live in pure modules so the same logic can be reused on a server later.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build static files

```bash
npm run build
npm run preview
```

Output is in `dist/` — deploy to any static host (GitHub Pages, Netlify, etc.).

## Deploy (online-ready)

This game is a **static site** (Vite build output in `dist/`). Any static host works.

### Vercel

- Import the project in Vercel (or `vercel` CLI).
- **Build command**: `npm run build`
- **Output directory**: `dist`

### Netlify

- New site from Git (or drag-and-drop `dist/` after building).
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### GitHub Pages (project subpath)

GitHub Pages serves sites under a subpath like `https://<user>.github.io/<repo>/`, so you must build with a base path:

```bash
# replace <repo> with your repository name
BASE_PATH="/<repo>/" npm run build
```

Then deploy the `dist/` folder using your preferred method (GitHub Actions, `gh-pages`, etc.).

## Controls

- Click a cell to play; **Player 1** (X) goes first, then **Player 2** (O).
- **New game** or keyboard **R** restarts.

Sound unlocks after the first click (browser autoplay policy).

## Tests

```bash
npm test
```

Tests cover win lines, non-wins, full board, and draw detection in [`src/rules.ts`](src/rules.ts).

## Phase 2: online multiplayer

To add network play without rewriting the board rules:

1. **Extract or duplicate** [`src/rules.ts`](src/rules.ts) (and the same win checks from [`src/engine.ts`](src/engine.ts) flow) on a small **Node** server.
2. Use **WebSockets** (`ws` or Socket.io): clients send `{ type: "move", index }`; the server validates the move, updates authoritative state, and broadcasts the new snapshot.
3. Replace the direct `applyMove` call in [`src/main.ts`](src/main.ts) with a thin adapter: **local** calls `applyMove` immediately; **remote** sends the move and applies only the server-confirmed state (never trust the other client’s board).

Room codes and simple reconnection (same code rejoins a seat) are enough for friends; you do not need accounts for a first online version.

## Project layout

| File | Role |
|------|------|
| [`src/rules.ts`](src/rules.ts) | Pure win/draw detection (portable to server) |
| [`src/engine.ts`](src/engine.ts) | Game state and `applyMove` |
| [`src/ui.ts`](src/ui.ts) | Board DOM and HUD strings |
| [`src/effects.ts`](src/effects.ts) | CSS classes and short motion |
| [`src/audio.ts`](src/audio.ts) | Web Audio blips |
| [`src/main.ts`](src/main.ts) | Wires local play |
