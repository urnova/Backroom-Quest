---
name: Babylon.js v9 engine quirks
description: Key API differences in Babylon.js v9 and the loadLevel cleanup pattern used in BabylonEngine.ts
---

## Vignette / ImageProcessing
In Babylon.js v9, `DefaultRenderingPipeline` does NOT expose `vignetteEnabled`, `vignetteWeight`, etc. directly.
Use `this._scene.imageProcessingConfiguration` instead:
```ts
const ipc = this._scene.imageProcessingConfiguration;
ipc.isEnabled = true;
ipc.vignetteEnabled = true;
ipc.vignetteWeight = 2.8;
ipc.contrast = 1.18;
ipc.exposure = 0.92;
```

## loadLevel cleanup pattern
`registerBeforeRender` callbacks (lights, portal rotation, item bobbing) accumulate across level loads.
**Fix:** Store all level-scoped observers in `_levelObservers: Observer<Scene>[]`.
Use `scene.onBeforeRenderObservable.add(...)` and push the returned observer.
In `loadLevel`: remove all observers, dispose all meshes, dispose all lights except `_flashlight`, then rebuild.
Do NOT call `_setupPostFX()` again in `loadLevel` — the pipeline is shared across levels.

## TS definite assignment
Private fields initialized via setup methods (not in constructor body directly) need `!` assertion:
```ts
private _camera!: UniversalCamera;
private _flashlight!: SpotLight;
```

**Why:** `_setupCamera()` is called from the constructor, so the field IS set before use, but TypeScript's strictPropertyInitialization can't follow through method calls.
