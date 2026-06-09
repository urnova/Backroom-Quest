---
name: The Liminal game stack
description: Tech stack, ports, and key file locations for The Liminal horror game.
---

# The Liminal — Game Stack

- **Frontend**: `artifacts/backrooms-game` — React + Vite + Three.js, port 5000, BASE_PATH=/
- **Backend**: `artifacts/api-server` — Express + Socket.io, port 8080, path /api
- **Artifact IDs**: `artifacts/backrooms-game` (frontend), `3B4_FFSkEVBkAeYMFRJ2e` (API)
- **Workflows**: "Backrooms Game" (webview, port 5000), "API Server" (console, port 8080)
- **Lib packages**: `lib/api-client-react`, `lib/api-zod`, `lib/db` — must run `pnpm run typecheck:libs` to compile before TS checks pass.
- **Game name**: "THE LIMINAL" (originally "THE BACKROOMS" — renamed for originality)
- **Language**: French UI throughout

**Why:** Backrooms was imported from GitHub; ports and names were changed during setup.
**How to apply:** When restarting services, use `PORT=5000 BASE_PATH=/ ...` for frontend and `PORT=8080 ...` for API.
