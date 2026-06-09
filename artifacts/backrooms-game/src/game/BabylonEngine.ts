import {
  Engine,
  Scene,
  UniversalCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  PointLight,
  SpotLight,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  Mesh,
  DefaultRenderingPipeline,
  GlowLayer,
  Observer,
} from "@babylonjs/core";
import { generateMap } from "./MapGenerator";
import { BabylonCharacterRenderer } from "./BabylonCharacterRenderer";
import { LevelConfig, GameState, Mob } from "../types/game";

export interface WorldItem { id: string; type: string; x: number; y: number; }

const WALL_H    = 2.6;
const EYE_H     = 1.55;
const WALK_SPD  = 3.2;
const SPRINT_SPD = 5.8;
const BOB_AMP   = 0.035;
const BOB_FREQ  = 9;

export class BabylonEngine {
  private _engine!: Engine;
  private _scene!: Scene;
  private _camera!: UniversalCamera;
  private _flashlight!: SpotLight;
  private _canvas!: HTMLCanvasElement;
  private _chars!: BabylonCharacterRenderer;

  // Player
  private _px = 5;
  private _py = 5;
  private _yaw = 0;
  private _pitch = 0;
  private _bobTime = 0;

  // Input
  private _keys: Record<string, boolean> = {};
  private _locked = false;

  // Map
  private _map: number[][] = [];
  private _exitX = -1;
  private _exitY = -1;

  // Items (tracked for near-item detection)
  private _liveItems: Array<{ id: string; type: string; x: number; z: number; mesh: Mesh; label: string }> = [];

  // Level-scoped before-render observers (cleared on level load)
  private _levelObservers: Observer<Scene>[] = [];

  // Effects
  private _flashOn = true;
  private _speedActive = false;
  private _speedTimer = 0;
  private _damageTimer = 0;
  private _tickTimer = 0;
  private _origClearColor!: Color4;

  // Callbacks
  public onAttack?: () => void;
  public onFlashlight?: () => void;
  public onEmoteDown?: () => void;
  public onEmoteUp?: () => void;
  public onEscape?: () => void;
  public onItemPickup?: (item: WorldItem) => void;
  public onNearItem?: (label: string | null) => void;
  public onTick?: (state: { x: number; y: number; angle: number }) => void;

  get isFlashlightOn() { return this._flashOn; }
  get isPointerLocked() { return this._locked; }

  constructor(canvas: HTMLCanvasElement, levelConfig: LevelConfig, seed: string, _quality: string) {
    this._canvas = canvas;

    this._engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });

    this._scene = new Scene(this._engine);
    this._scene.clearColor = new Color4(0.04, 0.03, 0.02, 1);
    this._origClearColor = this._scene.clearColor.clone();

    this._setupCamera();
    this._setupInput();
    this._buildLevel(levelConfig, seed);
    this._setupPostFX();

    this._chars = new BabylonCharacterRenderer(this._scene);

    this._engine.runRenderLoop(() => this._tick());
    window.addEventListener("resize", this._onResize);
  }

  private _onResize = () => this._engine.resize();

  // ─── Camera ─────────────────────────────────────────────────────────────────

  private _setupCamera() {
    this._camera = new UniversalCamera("fpc", new Vector3(5, EYE_H, 5), this._scene);
    this._camera.minZ = 0.05;
    this._camera.maxZ = 55;
    this._camera.fov = 1.2;
    this._camera.inputs.clear();

    this._flashlight = new SpotLight(
      "fl",
      Vector3.Zero(),
      new Vector3(0, 0, 1),
      Math.PI / 5.5,
      16,
      this._scene,
    );
    this._flashlight.diffuse  = new Color3(1, 0.97, 0.84);
    this._flashlight.intensity = 2.8;
    this._flashlight.range     = 24;
    this._flashlight.parent    = this._camera;
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  private _ptrChange = () => {
    this._locked = document.pointerLockElement === this._canvas;
  };

  private _mouseMove = (e: MouseEvent) => {
    if (!this._locked) return;
    this._yaw   -= e.movementX * 0.0018;
    this._pitch  = Math.max(-1.1, Math.min(1.1, this._pitch + e.movementY * 0.0018));
  };

  private _keydown = (e: KeyboardEvent) => {
    this._keys[e.code] = true;
    if (e.code === "KeyF") { this._toggleFL(); this.onFlashlight?.(); }
    if (e.code === "Escape" && this._locked) { document.exitPointerLock(); this.onEscape?.(); }
    if ((e.code === "KeyT" || e.code === "KeyE") && this._locked) {
      document.exitPointerLock();
      this.onEmoteDown?.();
    }
  };

  private _keyup = (e: KeyboardEvent) => {
    this._keys[e.code] = false;
    if (e.code === "KeyT" || e.code === "KeyE") this.onEmoteUp?.();
  };

  private _mousedown = (e: MouseEvent) => {
    if (e.button === 0 && this._locked) this.onAttack?.();
  };

  private _setupInput() {
    this._canvas.addEventListener("click", () => {
      if (!this._locked) this._canvas.requestPointerLock();
    });
    document.addEventListener("pointerlockchange", this._ptrChange);
    document.addEventListener("mousemove",         this._mouseMove);
    document.addEventListener("keydown",           this._keydown);
    document.addEventListener("keyup",             this._keyup);
    this._canvas.addEventListener("mousedown",     this._mousedown);
  }

  // ─── Game Loop ───────────────────────────────────────────────────────────────

  private _tick() {
    const dt = Math.min(this._engine.getDeltaTime() / 1000, 0.05);

    this._updateMovement(dt);

    if (this._speedActive) {
      this._speedTimer -= dt;
      if (this._speedTimer <= 0) this._speedActive = false;
    }

    if (this._damageTimer > 0) {
      this._damageTimer -= dt;
      if (this._damageTimer <= 0) {
        this._scene.clearColor = this._origClearColor.clone();
      }
    }

    this._chars.update(dt);

    // Check item proximity
    let nearLabel: string | null = null;
    for (const item of this._liveItems) {
      const dx = this._px - item.x;
      const dz = this._py - item.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 0.6) {
        item.mesh.setEnabled(false);
        this._liveItems = this._liveItems.filter(i => i.id !== item.id);
        this.onItemPickup?.({ id: item.id, type: item.type, x: item.x, y: item.z });
        this.onNearItem?.(null);
        break;
      } else if (d2 < 3) {
        nearLabel = item.label;
      }
    }
    this.onNearItem?.(nearLabel);

    // Server tick (every 50 ms)
    this._tickTimer += dt;
    if (this._tickTimer >= 0.05) {
      this._tickTimer = 0;
      this.onTick?.({ x: this._px, y: this._py, angle: this._yaw });
    }

    this._scene.render();
  }

  private _updateMovement(dt: number) {
    if (!this._locked) return;

    const spd = (this._keys["ShiftLeft"] || this._keys["ShiftRight"] || this._speedActive)
      ? SPRINT_SPD : WALK_SPD;

    // Angle convention: angle 0 = looking in +X direction (same as BackroomsEngine)
    // _yaw decreases when turning right (mouse left = positive movementX = yaw decreases)
    const cos = Math.cos(this._yaw);
    const sin = Math.sin(this._yaw);
    const fwdX = cos,  fwdZ = sin;
    const rtX  = sin,  rtZ  = -cos;

    let nx = this._px;
    let nz = this._py;
    let moving = false;

    if (this._keys["KeyZ"] || this._keys["KeyW"] || this._keys["ArrowUp"])    { nx += fwdX * spd * dt; nz += fwdZ * spd * dt; moving = true; }
    if (this._keys["KeyS"] || this._keys["ArrowDown"])                         { nx -= fwdX * spd * dt; nz -= fwdZ * spd * dt; moving = true; }
    if (this._keys["KeyD"] || this._keys["ArrowRight"])                        { nx += rtX  * spd * dt; nz += rtZ  * spd * dt; moving = true; }
    if (this._keys["KeyQ"] || this._keys["KeyA"] || this._keys["ArrowLeft"])   { nx -= rtX  * spd * dt; nz -= rtZ  * spd * dt; moving = true; }

    if (this._walkable(nx, this._py)) this._px = nx;
    if (this._walkable(this._px, nz)) this._py = nz;

    if (moving) this._bobTime += dt * BOB_FREQ;
    const bob = moving ? Math.sin(this._bobTime) * BOB_AMP : 0;

    this._camera.position.set(this._px, EYE_H + bob, this._py);

    // Camera rotation: map yaw to Three.js-compatible convention
    // camera.rotation.y = -yaw + PI/2 gives: yaw=0 → looking in +X
    this._camera.rotation.x = this._pitch;
    this._camera.rotation.y = -this._yaw + Math.PI / 2;
    this._camera.rotation.z = 0;
  }

  private _walkable(x: number, z: number): boolean {
    const m = 0.32;
    for (const [dx, dz] of [[-m,-m],[-m,m],[m,-m],[m,m]] as [number,number][]) {
      const gx = Math.floor(x + dx);
      const gz = Math.floor(z + dz);
      if (gz < 0 || gz >= this._map.length || gx < 0 || gx >= (this._map[0]?.length ?? 0)) return false;
      if (this._map[gz]?.[gx] === 1) return false;
    }
    return true;
  }

  // ─── Level ───────────────────────────────────────────────────────────────────

  private _buildLevel(cfg: LevelConfig, seed: string) {
    const map = generateMap(seed, cfg.width, cfg.height);
    this._map   = map;
    this._exitX = -1;
    this._exitY = -1;

    // Find exit
    for (let row = 0; row < map.length; row++)
      for (let col = 0; col < map[row].length; col++)
        if (map[row][col] === 2) { this._exitX = col + 0.5; this._exitY = row + 0.5; }

    // Find spawn (nearest open cell to centre)
    const cx = Math.floor(map[0].length / 2);
    const cy = Math.floor(map.length / 2);
    outer: for (let r = 0; r < 20; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (map[cy + dy]?.[cx + dx] === 0) {
            this._px = cx + dx + 0.5;
            this._py = cy + dy + 0.5;
            this._camera.position.set(this._px, EYE_H, this._py);
            break outer;
          }
        }
      }
    }

    this._buildGeometry(cfg, map);
  }

  private _buildGeometry(cfg: LevelConfig, map: number[][]) {
    const theme  = cfg.theme   || "backrooms";
    const rows   = map.length;
    const cols   = map[0].length;

    // --- Materials ---
    const wallMat  = this._wallMat(cfg.wallColor  || "#d4a017", theme);
    const floorMat = this._floorMat(cfg.floorColor || "#c8b06e", theme);

    const ceilMat = new StandardMaterial("cm", this._scene);
    ceilMat.diffuseColor  = Color3.FromHexString(cfg.ceilColor || "#e8e0c0");
    ceilMat.specularColor = Color3.Black();

    const lightPanelMat = new StandardMaterial("lpm", this._scene);
    lightPanelMat.emissiveColor = new Color3(1, 0.97, 0.85);
    lightPanelMat.disableLighting = true;

    // --- Walls (instanced) ---
    const wallTpl = MeshBuilder.CreateBox("wt", { width: 1, height: WALL_H, depth: 1 }, this._scene);
    wallTpl.material   = wallMat;
    wallTpl.isPickable = false;
    wallTpl.setEnabled(false);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (map[row][col] !== 1) continue;
        const inst = wallTpl.createInstance(`w${row}_${col}`);
        inst.position.set(col + 0.5, WALL_H / 2, row + 0.5);
        inst.isPickable = false;
      }
    }

    // --- Floor ---
    const floor = MeshBuilder.CreateGround("floor", { width: cols, height: rows }, this._scene);
    floor.position.set(cols / 2, 0, rows / 2);
    floor.material   = floorMat;
    floor.isPickable = false;

    // --- Ceiling ---
    const ceil = MeshBuilder.CreateGround("ceil", { width: cols, height: rows }, this._scene);
    ceil.position.set(cols / 2, WALL_H, rows / 2);
    ceil.rotation.x  = Math.PI;
    ceil.material    = ceilMat;
    ceil.isPickable  = false;

    // --- Fluorescent light panels + point lights ---
    const lightTpl = MeshBuilder.CreateBox("lt", { width: 0.55, height: 0.03, depth: 1.6 }, this._scene);
    lightTpl.material   = lightPanelMat;
    lightTpl.setEnabled(false);

    const pls: PointLight[] = [];
    for (let row = 4; row < rows - 4; row += 6) {
      for (let col = 4; col < cols - 4; col += 6) {
        if (map[row]?.[col] !== 0) continue;
        const inst = lightTpl.createInstance(`lp${row}_${col}`);
        inst.position.set(col + 0.5, WALL_H - 0.02, row + 0.5);
        inst.isPickable = false;

        if (pls.length < 20) {
          const pl = new PointLight(`pl${pls.length}`, new Vector3(col + 0.5, WALL_H - 0.25, row + 0.5), this._scene);
          pl.diffuse    = new Color3(1, 0.95, 0.78);
          pl.intensity  = 0.6;
          pl.range      = 9;
          const base = 0.55 + Math.random() * 0.12;
          const fl   = 0.035 + Math.random() * 0.035;
          const freq = 0.7 + Math.random() * 0.5;
          const off  = Math.random() * Math.PI * 2;
          this._levelObservers.push(
            this._scene.onBeforeRenderObservable.add(() => {
              if (!pl.isDisposed()) pl.intensity = base + Math.sin(Date.now() / 1000 * freq + off) * fl;
            })!
          );
          pls.push(pl);
        }
      }
    }

    // --- Ambient ---
    const amb = new HemisphericLight("amb", new Vector3(0, 1, 0), this._scene);
    amb.intensity    = cfg.ambientLight ?? 0.14;
    amb.diffuse      = new Color3(1, 0.94, 0.78);
    amb.groundColor  = new Color3(0.12, 0.1, 0.06);

    // --- Fog ---
    this._scene.fogMode    = Scene.FOGMODE_EXP2;
    this._scene.fogDensity = cfg.fogDensity ?? 0.055;
    const fc = Color3.FromHexString(cfg.wallColor || "#d4b050");
    this._scene.fogColor   = new Color3(fc.r * 0.55, fc.g * 0.5, fc.b * 0.3);
    this._origClearColor   = new Color4(fc.r * 0.06, fc.g * 0.05, fc.b * 0.03, 1);
    this._scene.clearColor = this._origClearColor.clone();

    // --- Exit portal ---
    if (this._exitX >= 0) this._buildExitPortal();

    // --- Items ---
    this._spawnItems(map, cols, rows);
  }

  private _buildExitPortal() {
    const x = this._exitX;
    const z = this._exitY;

    const ringMat = new StandardMaterial("rm", this._scene);
    ringMat.emissiveColor = new Color3(0.1, 1, 0.85);
    ringMat.disableLighting = true;

    const outerMat = new StandardMaterial("orm", this._scene);
    outerMat.emissiveColor = new Color3(0.04, 0.55, 0.5);
    outerMat.disableLighting = true;
    outerMat.alpha = 0.5;

    const diskMat = new StandardMaterial("dm", this._scene);
    diskMat.emissiveColor = new Color3(0.08, 0.8, 0.72);
    diskMat.disableLighting = true;
    diskMat.alpha = 0.45;

    const ring = MeshBuilder.CreateTorus("er", { diameter: 1.2, thickness: 0.14, tessellation: 36 }, this._scene);
    ring.position.set(x, 1.3, z);
    ring.rotation.x = Math.PI / 2;
    ring.material = ringMat;

    const outer = MeshBuilder.CreateTorus("eo", { diameter: 1.55, thickness: 0.09, tessellation: 36 }, this._scene);
    outer.position.set(x, 1.3, z);
    outer.rotation.x = Math.PI / 2;
    outer.material = outerMat;

    const disk = MeshBuilder.CreateDisc("ed", { radius: 0.55, tessellation: 36 }, this._scene);
    disk.position.set(x, 1.3, z);
    disk.rotation.x = Math.PI / 2;
    disk.material = diskMat;

    const epl = new PointLight("epl", new Vector3(x, 1.3, z), this._scene);
    epl.diffuse   = new Color3(0.1, 1, 0.9);
    epl.intensity = 1.8;
    epl.range     = 6;

    this._levelObservers.push(
      this._scene.onBeforeRenderObservable.add(() => {
        if (ring.isDisposed()) return;
        const t = Date.now() / 1000;
        ring.rotation.z  =  t * 1.0;
        outer.rotation.z = -t * 0.65;
        disk.rotation.z  =  t * 1.3;
        epl.intensity = 1.8 + Math.sin(t * 2.2) * 0.35;
      })!
    );
  }

  private _spawnItems(map: number[][], cols: number, rows: number) {
    const defs: Array<{ type: string; color: Color3; label: string; count: number }> = [
      { type: "health",  color: new Color3(0.9, 0.1, 0.1), label: "KIT MÉDICAL",    count: 3 },
      { type: "battery", color: new Color3(0.9, 0.8, 0.1), label: "BATTERIE",       count: 2 },
      { type: "speed",   color: new Color3(0.1, 0.45, 0.9), label: "BOOST VITESSE", count: 2 },
    ];

    const occupied = new Set<string>();
    let idx = 0;

    for (const def of defs) {
      let remaining = def.count;
      for (let att = 0; att < 300 && remaining > 0; att++) {
        const rx = Math.floor(Math.random() * cols);
        const rz = Math.floor(Math.random() * rows);
        const key = `${rx},${rz}`;
        if (map[rz]?.[rx] !== 0 || occupied.has(key)) continue;
        occupied.add(key);
        remaining--;

        const imat = new StandardMaterial(`im${idx}`, this._scene);
        imat.diffuseColor  = def.color;
        imat.emissiveColor = new Color3(def.color.r * 0.45, def.color.g * 0.45, def.color.b * 0.45);

        const mesh = MeshBuilder.CreateBox(`item_${def.type}_${idx}`, { width: 0.3, height: 0.3, depth: 0.3 }, this._scene);
        mesh.position.set(rx + 0.5, 0.25, rz + 0.5);
        mesh.material   = imat;
        mesh.isPickable = false;

        const base = 0.25;
        const off  = idx * 1.1;
        this._levelObservers.push(
          this._scene.onBeforeRenderObservable.add(() => {
            if (mesh.isDisposed()) return;
            mesh.position.y  = base + Math.sin(Date.now() / 600 + off) * 0.06;
            mesh.rotation.y += 0.022;
          })!
        );

        this._liveItems.push({ id: `${def.type}_${idx}`, type: def.type, x: rx + 0.5, z: rz + 0.5, mesh, label: def.label });
        idx++;
      }
    }
  }

  // ─── Textures ────────────────────────────────────────────────────────────────

  private _wallMat(hex: string, theme: string): StandardMaterial {
    const m = new StandardMaterial("wm", this._scene);
    const t = new DynamicTexture("wt", { width: 512, height: 512 }, this._scene, false);
    const ctx = t.getContext() as CanvasRenderingContext2D;

    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, 512, 512);

    if (theme === "poolrooms") {
      ctx.fillStyle = "#2255aa";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#1a44bb";
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++)
          if ((x + y) % 2 === 0) ctx.fillRect(x * 64 + 1, y * 64 + 1, 62, 62);
    } else {
      const dark = this._darken(hex, 0.72);
      const mid  = this._darken(hex, 0.85);
      // grid lines
      ctx.strokeStyle = dark;
      ctx.lineWidth = 3;
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath(); ctx.moveTo(i, 0);   ctx.lineTo(i, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i);   ctx.lineTo(512, i); ctx.stroke();
      }
      // diamond pattern
      ctx.strokeStyle = mid;
      ctx.lineWidth = 1;
      for (let gy = 0; gy < 512; gy += 64) {
        for (let gx = 0; gx < 512; gx += 64) {
          ctx.beginPath();
          ctx.moveTo(gx + 32, gy);
          ctx.lineTo(gx + 64, gy + 32);
          ctx.lineTo(gx + 32, gy + 64);
          ctx.lineTo(gx,      gy + 32);
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
    t.update();
    m.diffuseTexture  = t;
    m.specularColor   = new Color3(0.04, 0.03, 0.02);
    return m;
  }

  private _floorMat(hex: string, theme: string): StandardMaterial {
    const m = new StandardMaterial("fm", this._scene);
    const t = new DynamicTexture("ft", { width: 512, height: 512 }, this._scene, false);
    const ctx = t.getContext() as CanvasRenderingContext2D;

    if (theme === "poolrooms") {
      ctx.fillStyle = "#3377cc";
      ctx.fillRect(0, 0, 512, 512);
    } else {
      ctx.fillStyle = hex;
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = this._darken(hex, 0.82);
      for (let i = 0; i < 2400; i++) {
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
      }
    }
    t.update();
    m.diffuseTexture  = t;
    m.specularColor   = Color3.Black();
    return m;
  }

  private _darken(hex: string, f: number): string {
    try {
      const h = hex.replace("#", "");
      const r = Math.round(parseInt(h.slice(0,2),16) * f);
      const g = Math.round(parseInt(h.slice(2,4),16) * f);
      const b = Math.round(parseInt(h.slice(4,6),16) * f);
      return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
    } catch { return hex; }
  }

  // ─── Post-FX ─────────────────────────────────────────────────────────────────

  private _setupPostFX() {
    const pp = new DefaultRenderingPipeline("pp", true, this._scene, [this._camera]);
    pp.bloomEnabled   = true;
    pp.bloomThreshold = 0.55;
    pp.bloomWeight    = 0.22;
    pp.bloomKernel    = 32;

    pp.grainEnabled    = true;
    pp.grain.intensity = 7;
    pp.grain.animated  = true;

    pp.imageProcessingEnabled = true;

    // Vignette + tone mapping via ImageProcessingConfiguration (Babylon.js v9)
    const ipc = this._scene.imageProcessingConfiguration;
    ipc.isEnabled           = true;
    ipc.vignetteEnabled     = true;
    ipc.vignetteWeight      = 2.8;
    ipc.vignetteCameraFov   = 0.95;
    ipc.vignetteColor       = new Color4(0, 0, 0, 0);
    ipc.contrast            = 1.18;
    ipc.exposure            = 0.92;

    const glow = new GlowLayer("glow", this._scene);
    glow.intensity = 0.65;
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  loadLevel(cfg: LevelConfig, seed: string) {
    // Remove level-scoped render observers
    for (const obs of this._levelObservers) {
      this._scene.onBeforeRenderObservable.remove(obs);
    }
    this._levelObservers = [];

    // Dispose all level meshes & transform nodes
    this._scene.meshes.slice().forEach(m => m.dispose());
    this._scene.transformNodes.slice().forEach(t => t.dispose());

    // Dispose level lights (keep the player flashlight)
    this._scene.lights
      .filter(l => l !== this._flashlight)
      .forEach(l => l.dispose());

    this._chars.clear();
    this._liveItems = [];

    // Rebuild geometry only — post-FX pipeline is reused from constructor
    this._buildLevel(cfg, seed);
  }

  syncState(state: GameState, myId: string) {
    this._chars.updateMobs(state.mobs);
    this._chars.updatePlayers(state.players, myId);
    const me = state.players.find(p => p.id === myId);
    if (me) this._flashlight.setEnabled(me.flashlightOn);
  }

  getPlayerState() { return { x: this._px, y: this._py, angle: this._yaw }; }

  getNearestMobInRange(mobs: Mob[], range: number): string | null {
    let best: string | null = null;
    let bestD = range * range;
    for (const mob of mobs) {
      if (!mob.isAlive) continue;
      const dx = mob.x - this._px;
      const dy = mob.y - this._py;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = mob.id; }
    }
    return best;
  }

  isNearExit(): boolean {
    if (this._exitX < 0) return false;
    const dx = this._px - this._exitX;
    const dz = this._py - this._exitY;
    return dx * dx + dz * dz < 1.2;
  }

  getExitPosition(): { x: number; y: number } | null {
    return this._exitX < 0 ? null : { x: this._exitX, y: this._exitY };
  }

  flashDamage() {
    this._scene.clearColor = new Color4(0.6, 0, 0, 1);
    this._damageTimer = 0.35;
  }

  toggleFlashlight() { this._toggleFL(); }
  private _toggleFL() {
    this._flashOn = !this._flashOn;
    this._flashlight.setEnabled(this._flashOn);
  }

  activateSpeedBoost(seconds: number) {
    this._speedActive = true;
    this._speedTimer  = seconds;
  }

  playAttackAnimation() {
    const origFov = this._camera.fov;
    this._camera.fov = origFov * 1.08;
    setTimeout(() => { this._camera.fov = origFov; }, 90);
  }

  requestPointerLock()  { this._canvas.requestPointerLock(); }
  exitPointerLock()     { document.exitPointerLock(); }
  updateKeybindings(_kb: unknown) { /* keybindings handled via KeyCode */ }

  dispose() {
    window.removeEventListener("resize",     this._onResize);
    document.removeEventListener("pointerlockchange", this._ptrChange);
    document.removeEventListener("mousemove",         this._mouseMove);
    document.removeEventListener("keydown",           this._keydown);
    document.removeEventListener("keyup",             this._keyup);
    this._chars.dispose();
    this._scene.dispose();
    this._engine.dispose();
  }
}
