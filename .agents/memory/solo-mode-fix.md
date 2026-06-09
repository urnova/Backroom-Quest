---
name: Solo mode fix
description: How solo game start is implemented to avoid blank page on navigation.
---

# Solo Mode Fix

## The Problem
SoloSetup was navigating to /game/:code before the server had emitted `game:started`. The game page would render with no gameState → blank page.

## The Fix
`GameContext.joinAndStartSolo(code, playerId)` uses socket ack chain:
1. `socket.emit("room:join", { code, playerId }, ack => { ... })` — waits for server to confirm join
2. On ack ok → `socket.emit("game:start", { code, playerId })` — starts game
3. Server emits `game:started` → GameContext sets `gameState`
4. SoloSetup watches `gameState && roomCode` via useEffect → navigates to /game/:code

**Why:** Socket events are async. Navigation before `game:started` causes Game.tsx to render with null gameState, showing a blank page or loading forever.
**How to apply:** Any flow that auto-starts a game must use the ack chain, not fire-and-forget.
