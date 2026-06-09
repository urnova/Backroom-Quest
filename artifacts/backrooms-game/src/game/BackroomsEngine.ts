import * as THREE from "three";
import { generateMap } from "./MapGenerator";
import { SpriteManager } from "./SpriteManager";
import { getProceduralTexture } from "./MobTextures";
import { LevelConfig, GameState } from "../types/game";
import { InputHandler } from "./InputHandler";

export class BackroomsEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private spriteManager: SpriteManager;
  
  private map: number[][] = [];
  private wallsMesh: THREE.InstancedMesh | null = null;
  private exitMesh: THREE.Mesh | null = null;
  private flashlight: THREE.SpotLight;
  private ambientLight: THREE.AmbientLight;
  
  private playerX = 5;
  private playerY = 5;
  private playerAngle = 0;
  
  public isFlashlightOn = true;

  public webglAvailable = true;

  constructor(canvas: HTMLCanvasElement, levelConfig: LevelConfig, seedStr: string) {
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
    } catch {
      // WebGL not available — create a dummy renderer to avoid crashes
      this.webglAvailable = false;
      this.renderer = { setSize: () => {}, setPixelRatio: () => {}, render: () => {}, dispose: () => {} } as unknown as THREE.WebGLRenderer;
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Lower res for retro feel
    this.renderer.setPixelRatio(0.5); 

    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 50);
    
    this.spriteManager = new SpriteManager(this.scene);
    
    this.ambientLight = new THREE.AmbientLight(0xffffff, levelConfig.ambientLight);
    this.scene.add(this.ambientLight);
    
    this.flashlight = new THREE.SpotLight(0xffffee, 2, 20, Math.PI / 4, 0.5, 1);
    this.flashlight.position.set(0, 0, 0);
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlight.target);

    this.loadLevel(levelConfig, seedStr);

    window.addEventListener("resize", this.onResize);
  }

  loadLevel(config: LevelConfig, seedStr: string) {
    // Clear old meshes
    if (this.wallsMesh) this.scene.remove(this.wallsMesh);
    if (this.exitMesh) this.scene.remove(this.exitMesh);
    
    this.scene.fog = new THREE.FogExp2(config.wallColor, config.fogDensity);
    this.ambientLight.intensity = config.ambientLight;

    this.map = generateMap(seedStr, config.width, config.height);

    // Build walls
    const wallGeo = new THREE.BoxGeometry(1, 3, 1);
    const wallTex = getProceduralTexture("wall", config.wallColor);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });
    
    let wallCount = 0;
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        if (this.map[y][x] === 1) wallCount++;
      }
    }

    this.wallsMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);
    const matrix = new THREE.Matrix4();
    let idx = 0;

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        if (this.map[y][x] === 1) {
          matrix.setPosition(x, 1.5, y);
          this.wallsMesh.setMatrixAt(idx++, matrix);
        } else if (this.map[y][x] === 2) {
          // Exit portal
          const exitGeo = new THREE.PlaneGeometry(1, 2);
          const exitMat = new THREE.MeshBasicMaterial({ color: 0x00ff80, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
          this.exitMesh = new THREE.Mesh(exitGeo, exitMat);
          this.exitMesh.position.set(x, 1, y);
          this.scene.add(this.exitMesh);
        }
      }
    }
    
    this.scene.add(this.wallsMesh);

    // Floor and Ceiling
    const floorTex = getProceduralTexture("floor", config.floorColor);
    const ceilTex = getProceduralTexture("ceiling", config.ceilColor);
    const planeGeo = new THREE.PlaneGeometry(config.width, config.height);
    planeGeo.rotateX(-Math.PI / 2);
    
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 });
    const floor = new THREE.Mesh(planeGeo, floorMat);
    floor.position.set(config.width/2 - 0.5, 0, config.height/2 - 0.5);
    this.scene.add(floor);

    const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.5 });
    const ceil = new THREE.Mesh(planeGeo, ceilMat);
    ceil.position.set(config.width/2 - 0.5, 3, config.height/2 - 0.5);
    ceil.rotation.x = Math.PI; // face down
    this.scene.add(ceil);

    // Find valid spawn point near center
    this.playerX = Math.floor(config.width / 2);
    this.playerY = Math.floor(config.height / 2);
    while (this.map[Math.floor(this.playerY)][Math.floor(this.playerX)] !== 0) {
      this.playerX++;
    }
  }

  update(dt: number, input: InputHandler) {
    if (input.isPointerLocked) {
      this.playerAngle -= input.movementX * 0.002;
      input.movementX = 0; // reset
    }

    const speed = (input.keys["shift"] ? 4.0 : 2.5) * dt;
    let dx = 0;
    let dy = 0;

    if (input.keys["w"]) { dx += Math.cos(this.playerAngle) * speed; dy += Math.sin(this.playerAngle) * speed; }
    if (input.keys["s"]) { dx -= Math.cos(this.playerAngle) * speed; dy -= Math.sin(this.playerAngle) * speed; }
    if (input.keys["a"]) { dx += Math.cos(this.playerAngle - Math.PI/2) * speed; dy += Math.sin(this.playerAngle - Math.PI/2) * speed; }
    if (input.keys["d"]) { dx += Math.cos(this.playerAngle + Math.PI/2) * speed; dy += Math.sin(this.playerAngle + Math.PI/2) * speed; }

    // Collision
    const margin = 0.2;
    if (this.map[Math.floor(this.playerY)][Math.floor(this.playerX + dx + (dx>0?margin:-margin))] === 0) {
      this.playerX += dx;
    }
    if (this.map[Math.floor(this.playerY + dy + (dy>0?margin:-margin))][Math.floor(this.playerX)] === 0) {
      this.playerY += dy;
    }

    // Update Camera
    this.camera.position.set(this.playerX, 1.5, this.playerY);
    this.camera.rotation.y = -this.playerAngle + Math.PI/2;
    this.camera.rotation.order = "YXZ";

    // Update Flashlight
    if (this.isFlashlightOn) {
      this.flashlight.position.copy(this.camera.position);
      this.flashlight.target.position.set(
        this.playerX + Math.cos(this.playerAngle),
        1.5,
        this.playerY + Math.sin(this.playerAngle)
      );
      // Flicker
      if (Math.random() < 0.05) this.flashlight.intensity = 1.5 + Math.random() * 1;
    } else {
      this.flashlight.intensity = 0;
    }

    // Exit pulse
    if (this.exitMesh) {
      this.exitMesh.rotation.y += dt;
      (this.exitMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
    }

    this.renderer.render(this.scene, this.camera);
  }

  syncState(state: GameState, myId: string) {
    this.spriteManager.updatePlayers(state.players, myId);
    this.spriteManager.updateMobs(state.mobs);
  }

  getPlayerState() {
    return { x: this.playerX, y: this.playerY, angle: this.playerAngle };
  }

  toggleFlashlight() {
    this.isFlashlightOn = !this.isFlashlightOn;
  }

  playAttackAnimation() {
    // Simple screen shake or FOV change
    this.camera.fov = 70;
    this.camera.updateProjectionMatrix();
    setTimeout(() => {
      this.camera.fov = 66;
      this.camera.updateProjectionMatrix();
    }, 100);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  dispose() {
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.spriteManager.dispose();
  }
}
