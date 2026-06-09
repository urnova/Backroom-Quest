import * as THREE from "three";
import { generateMap } from "./MapGenerator";
import { getProceduralTexture } from "./MobTextures";
import { CharacterRenderer } from "./CharacterRenderer";
import { WorldItem, spawnItems, updateItems, checkItemPickup, clearItems } from "./ItemManager";
import { LevelConfig, GameState, Mob } from "../types/game";
import { InputHandler } from "./InputHandler";

export class BackroomsEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private characterRenderer: CharacterRenderer;

  private map: number[][] = [];
  private wallsMesh: THREE.InstancedMesh | null = null;
  private levelObjects: THREE.Object3D[] = [];
  private exitMesh: THREE.Mesh | null = null;
  private exitPosition: { x: number; y: number } | null = null;
  private flashlight: THREE.SpotLight;
  private ambientLight: THREE.AmbientLight;
  private pointLights: THREE.PointLight[] = [];

  private playerX = 5;
  private playerY = 5;
  private playerAngle = 0;
  private speedMultiplier = 1;
  private speedBoostTimer = 0;

  public isFlashlightOn = true;
  public webglAvailable = true;

  private bobTime = 0;
  private damageOverlay: THREE.Mesh | null = null;
  private renderQuality: "low" | "medium" | "high" = "medium";
  private items: WorldItem[] = [];

  public onItemPickup?: (item: WorldItem) => void;
  public onNearItem?: (label: string | null) => void;

  private currentLevelConfig: LevelConfig | null = null;
  private currentSeed = "";

  constructor(
    canvas: HTMLCanvasElement,
    levelConfig: LevelConfig,
    seedStr: string,
    quality: "low" | "medium" | "high" = "medium"
  ) {
    this.renderQuality = quality;
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: quality === "high",
        powerPreference: quality === "low" ? "low-power" : "default",
      });
    } catch {
      this.webglAvailable = false;
      this.renderer = {
        setSize: () => {}, setPixelRatio: () => {},
        render: () => {}, dispose: () => {},
      } as unknown as THREE.WebGLRenderer;
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const pixelRatio = quality === "low" ? 0.5 : quality === "medium" ? 0.75 : 1.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio * pixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 60);
    this.characterRenderer = new CharacterRenderer(this.scene);

    this.ambientLight = new THREE.AmbientLight(0xffffff, levelConfig.ambientLight);
    this.scene.add(this.ambientLight);

    this.flashlight = new THREE.SpotLight(0xffffee, 3.5, 25, Math.PI / 5, 0.4, 1.2);
    this.flashlight.position.set(0, 0, 0);
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlight.target);

    this.loadLevel(levelConfig, seedStr);
    window.addEventListener("resize", this.onResize);
  }

  loadLevel(config: LevelConfig, seedStr: string) {
    this.currentLevelConfig = config;
    this.currentSeed = seedStr;

    if (this.wallsMesh) this.scene.remove(this.wallsMesh);
    for (const obj of this.levelObjects) this.scene.remove(obj);
    this.levelObjects = [];
    if (this.exitMesh) this.scene.remove(this.exitMesh);
    for (const pl of this.pointLights) this.scene.remove(pl);
    this.pointLights = [];
    this.exitPosition = null;

    clearItems(this.items, this.scene);
    this.items = [];

    this.scene.fog = new THREE.FogExp2(config.wallColor, config.fogDensity);
    this.ambientLight.intensity = config.ambientLight;

    this.map = generateMap(seedStr, config.width, config.height);

    const wallTex = getProceduralTexture("wall", config.wallColor);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85 });
    const wallGeo = new THREE.BoxGeometry(1, 3, 1);

    let wallCount = 0;
    for (let y = 0; y < config.height; y++)
      for (let x = 0; x < config.width; x++)
        if (this.map[y][x] === 1) wallCount++;

    this.wallsMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);
    const matrix = new THREE.Matrix4();
    let idx = 0;

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        if (this.map[y][x] === 1) {
          matrix.setPosition(x, 1.5, y);
          this.wallsMesh.setMatrixAt(idx++, matrix);
        } else if (this.map[y][x] === 2) {
          this.exitPosition = { x, y };

          const exitGeo = new THREE.PlaneGeometry(0.9, 2.8);
          const exitMat = new THREE.MeshBasicMaterial({
            color: 0x00ff80, side: THREE.DoubleSide, transparent: true, opacity: 0.9,
          });
          this.exitMesh = new THREE.Mesh(exitGeo, exitMat);
          this.exitMesh.position.set(x, 1.4, y);
          this.scene.add(this.exitMesh);

          const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ff80, side: THREE.DoubleSide, transparent: true, opacity: 0.08,
          });
          const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.5), glowMat);
          glow.position.set(x, 1.75, y);
          this.scene.add(glow);
          this.levelObjects.push(glow);

          const exitLight = new THREE.PointLight(0x00ff80, 3, 8);
          exitLight.position.set(x, 1.5, y);
          this.scene.add(exitLight);
          this.pointLights.push(exitLight);
        }
      }
    }
    this.scene.add(this.wallsMesh);

    const floorTex = getProceduralTexture("floor", config.floorColor);
    const ceilTex = getProceduralTexture("ceiling", config.ceilColor);
    const planeGeo = new THREE.PlaneGeometry(config.width, config.height);
    planeGeo.rotateX(-Math.PI / 2);

    const floor = new THREE.Mesh(planeGeo, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }));
    floor.position.set(config.width / 2 - 0.5, 0, config.height / 2 - 0.5);
    this.scene.add(floor);
    this.levelObjects.push(floor);

    const ceil = new THREE.Mesh(planeGeo.clone(), new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.5 }));
    ceil.position.set(config.width / 2 - 0.5, 3, config.height / 2 - 0.5);
    ceil.rotation.x = Math.PI;
    this.scene.add(ceil);
    this.levelObjects.push(ceil);

    this.playerX = Math.floor(config.width / 2);
    this.playerY = Math.floor(config.height / 2);
    let attempts = 0;
    while (this.map[Math.floor(this.playerY)]?.[Math.floor(this.playerX)] !== 0 && attempts < 1000) {
      this.playerX = 2 + Math.floor(Math.random() * (config.width - 4));
      this.playerY = 2 + Math.floor(Math.random() * (config.height - 4));
      attempts++;
    }

    this.items = spawnItems(this.map, config.width, config.height, 0);
  }

  activateSpeedBoost(duration = 30) {
    this.speedMultiplier = 1.5;
    this.speedBoostTimer = duration;
  }

  update(dt: number, input: InputHandler) {
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) {
        this.speedMultiplier = 1;
        this.speedBoostTimer = 0;
      }
    }

    if (input.isPointerLocked) {
      this.playerAngle -= input.movementX * 0.002;
      input.movementX = 0;
    }

    const baseSpeed = input.isSprint() ? 4.0 : 2.5;
    const speed = baseSpeed * this.speedMultiplier * dt;
    let dx = 0, dy = 0;

    if (input.isForward()) { dx += Math.cos(this.playerAngle) * speed; dy += Math.sin(this.playerAngle) * speed; }
    if (input.isBackward()) { dx -= Math.cos(this.playerAngle) * speed; dy -= Math.sin(this.playerAngle) * speed; }
    if (input.isStrafeLeft()) { dx += Math.cos(this.playerAngle - Math.PI / 2) * speed; dy += Math.sin(this.playerAngle - Math.PI / 2) * speed; }
    if (input.isStrafeRight()) { dx += Math.cos(this.playerAngle + Math.PI / 2) * speed; dy += Math.sin(this.playerAngle + Math.PI / 2) * speed; }

    const margin = 0.3;
    const nx = this.playerX + dx;
    const ny = this.playerY + dy;
    const mx = Math.floor(this.playerX);
    const my = Math.floor(this.playerY);

    if (Math.floor(nx + (dx > 0 ? margin : -margin)) >= 0 && this.map[my]?.[Math.floor(nx + (dx > 0 ? margin : -margin))] === 0)
      this.playerX += dx;
    if (Math.floor(ny + (dy > 0 ? margin : -margin)) >= 0 && this.map[Math.floor(ny + (dy > 0 ? margin : -margin))]?.[mx] === 0)
      this.playerY += dy;

    this.bobTime += dt;
    const isMoving = dx !== 0 || dy !== 0;
    const bobAmount = isMoving ? Math.sin(this.bobTime * 9) * 0.045 : 0;

    this.camera.position.set(this.playerX, 1.55 + bobAmount, this.playerY);
    this.camera.rotation.y = -this.playerAngle + Math.PI / 2;
    this.camera.rotation.order = "YXZ";

    if (this.isFlashlightOn) {
      this.flashlight.position.copy(this.camera.position);
      this.flashlight.target.position.set(
        this.playerX + Math.cos(this.playerAngle) * 10, 1.55,
        this.playerY + Math.sin(this.playerAngle) * 10
      );
      this.flashlight.target.updateMatrixWorld();
      if (Math.random() < 0.015) this.flashlight.intensity = 1.5 + Math.random() * 2;
      else if (Math.random() < 0.008) this.flashlight.intensity = 0.4;
      else this.flashlight.intensity = 3.5;
    } else {
      this.flashlight.intensity = 0;
    }

    if (this.exitMesh) {
      this.exitMesh.rotation.y += dt * 0.6;
      (this.exitMesh.material as THREE.MeshBasicMaterial).opacity = 0.7 + Math.sin(Date.now() * 0.004) * 0.2;
    }

    updateItems(this.items, dt, this.scene);
    const picked = checkItemPickup(this.items, this.playerX, this.playerY);
    if (picked) {
      picked.pickedUp = true;
      if (this.onItemPickup) this.onItemPickup(picked);
    }

    const nearItem = this.items.find(it => !it.pickedUp && Math.sqrt((it.x - this.playerX) ** 2 + (it.y - this.playerY) ** 2) < 2.5);
    if (this.onNearItem) this.onNearItem(nearItem ? nearItem.type.toUpperCase() : null);

    this.characterRenderer.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  syncState(state: GameState, myId: string) {
    this.characterRenderer.updateMobs(state.mobs);
    this.characterRenderer.updatePlayers(state.players, myId);
  }

  getPlayerState() {
    return { x: this.playerX, y: this.playerY, angle: this.playerAngle };
  }

  getExitPosition(): { x: number; y: number } | null {
    return this.exitPosition;
  }

  getNearestMobInRange(mobs: Mob[], range: number): string | null {
    let nearest: string | null = null;
    let nearestDist = range;
    for (const mob of mobs) {
      if (!mob.isAlive) continue;
      const dx = mob.x - this.playerX;
      const dy = mob.y - this.playerY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearestDist) {
        const mobAngle = Math.atan2(dy, dx);
        let angleDiff = mobAngle - this.playerAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) < Math.PI * 0.65) { nearestDist = d; nearest = mob.id; }
      }
    }
    return nearest;
  }

  isNearExit(): boolean {
    if (!this.exitPosition) return false;
    const dx = this.exitPosition.x - this.playerX;
    const dy = this.exitPosition.y - this.playerY;
    return Math.sqrt(dx * dx + dy * dy) < 1.5;
  }

  toggleFlashlight() { this.isFlashlightOn = !this.isFlashlightOn; }

  playAttackAnimation() {
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();
    setTimeout(() => { this.camera.fov = 70; this.camera.updateProjectionMatrix(); }, 100);
  }

  flashDamage() {
    if (!this.damageOverlay) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0, depthTest: false });
      this.damageOverlay = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
      this.damageOverlay.position.set(0, 0, -0.5);
      this.camera.add(this.damageOverlay);
      this.scene.add(this.camera);
    }
    const mat = this.damageOverlay.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.4;
    const fade = () => { mat.opacity = Math.max(0, mat.opacity - 0.04); if (mat.opacity > 0) setTimeout(fade, 30); };
    setTimeout(fade, 80);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  dispose() {
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.characterRenderer.dispose();
    clearItems(this.items, this.scene);
  }
}
