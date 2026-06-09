---
name: WebGL in Replit headless
description: Three.js WebGLRenderer throws a hard runtime error in Replit's headless screenshot env (no GPU). Pattern for graceful fallback.
---

## Rule
Always wrap `new THREE.WebGLRenderer(...)` in try/catch AND check `renderer.getContext()` afterward. If either fails, set a `_failed` / state flag and bail early. Never let a WebGL init error propagate up — it crashes the entire React app.

## Pattern (class-based scene)
```typescript
private _failed = false;
constructor(canvas) {
  try {
    this.renderer = new THREE.WebGLRenderer({ canvas });
  } catch { this._failed = true; return; }
  if (!this.renderer.getContext()) { this._failed = true; return; }
  // … normal init …
}
private _loop = () => {
  if (this._failed) return;
  // … render …
};
dispose() {
  if (!this._failed) this.renderer?.dispose();
}
```

## Pattern (React component)
```tsx
const [webGLFailed, setWebGLFailed] = useState(false);
useEffect(() => {
  try {
    renderer = new THREE.WebGLRenderer({ canvas });
    if (!renderer.getContext()) throw new Error();
  } catch { setWebGLFailed(true); return; }
  // … setup …
}, []);
if (webGLFailed) return <CssFallback />;
return <canvas ref={canvasRef} />;
```

## CSS fallback strategy
- **MainMenu**: keep `.corridor-bg` CSS div always present; canvas sits on top and covers it when WebGL works.
- **SkinViewer3D**: render a colored gradient div + skin name text when WebGL unavailable.

**Why:** Replit's screenshot/preview environment has no GPU. Three.js emits `console.error` AND throws, which triggers Vite's runtime-error overlay and completely blocks the UI. The CSS fallback looks good enough and real users always have WebGL.

**How to apply:** Any new Three.js component or scene class. Apply immediately at construction/init time, not lazily.
