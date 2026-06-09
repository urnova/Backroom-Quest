---
name: Workflow ports
description: Replit workflows only support specific ports; which ports this project uses.
---

# Workflow Ports

Replit's `configureWorkflow` only supports these `waitForPort` values:
3000, 3001, 3002, 3003, 4200, 5000, 5173, 6000, 6800, 8000, 8008, 8080, 8099, 9000

This project originally had frontend on port 19682 (not supported). Changed to 5000.

- Frontend: PORT=5000, workflow "Backrooms Game", waitForPort: 5000, outputType: "webview"
- API: PORT=8080, workflow "API Server", waitForPort: 8080, outputType: "console"

**Why:** Port 19682 was in the artifact.toml but is not in Replit's supported workflow port list.
**How to apply:** Always use a port from the supported list when configuring workflows.
