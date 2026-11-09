# Arrow Portrait

A mobile-first spatial puzzle that turns a portrait into 146 luminous arrow paths. Remove each path in the direction of its arrow without colliding with the paths around it.

## Features

- On-device portrait processing—photos are never uploaded
- Adjustable portrait crop and automatic color sampling
- Deterministic, validated 146-piece puzzles
- Undo, hints, restart, pause, sound, and haptics
- Offline-capable progressive web app

## Development

```bash
npm install
npm run dev
```

Run verification with:

```bash
npm test
npm run build
```

## Privacy

The original portrait remains in browser memory. Only the generated puzzle specification and a small processed preview are stored locally in IndexedDB.

