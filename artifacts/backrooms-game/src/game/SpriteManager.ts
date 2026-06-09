import * as THREE from "three";
import { Player, Mob } from "../types/game";

const MOB_COLORS: Record<string, string> = {
  smiler: "#ffff00",
  crawler: "#c85020",
  hound: "#404040",
  partygoer: "#ff6040",
  skin_stealer: "#c8c0b8",
  night_stalker: "#6020a0",
  depth_dweller: "#0050a0",
  cave_dweller: "#806040",
  duller: "#888888",
  pipe_crawler: "#a06030",
  sparker: "#40c0ff",
  blood_hound: "#cc0000",
  faceling: "#e0d8d0",
  bacteria: "#00ff40",
};

function makeMobCanvas(type: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 128);

  const color = MOB_COLORS[type] ?? "#ff0000";

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  switch (type) {
    case "smiler": {
      ctx.fillStyle = "#000000aa";
      ctx.beginPath();
      ctx.arc(32, 50, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffff00";
      ctx.fillRect(14, 38, 8, 10);
      ctx.fillRect(42, 38, 8, 10);
      ctx.beginPath();
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 3;
      ctx.arc(32, 60, 14, 0.2, Math.PI - 0.2);
      ctx.stroke();
      break;
    }
    case "night_stalker":
    case "skin_stealer": {
      ctx.fillStyle = color + "cc";
      ctx.fillRect(20, 20, 24, 70);
      ctx.beginPath();
      ctx.arc(32, 20, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.fillRect(24, 14, 6, 8);
      ctx.fillRect(34, 14, 6, 8);
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(26, 15, 2, 6);
      ctx.fillRect(36, 15, 2, 6);
      break;
    }
    case "bacteria": {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = color + "88";
        ctx.beginPath();
        ctx.arc(16 + i * 8, 40 + Math.sin(i * 1.2) * 20, 12 - i, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = color;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(20 + i * 12, 45, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "sparker": {
      ctx.fillStyle = color + "aa";
      ctx.fillRect(22, 30, 20, 60);
      ctx.beginPath();
      ctx.arc(32, 30, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const a = (i / 4) * Math.PI * 2;
        ctx.moveTo(32 + Math.cos(a) * 12, 30 + Math.sin(a) * 12);
        ctx.lineTo(32 + Math.cos(a) * 28, 30 + Math.sin(a) * 28);
        ctx.stroke();
      }
      break;
    }
    default: {
      ctx.fillStyle = color + "cc";
      ctx.beginPath();
      ctx.arc(32, 28, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(18, 40, 28, 60);
      ctx.fillStyle = "black";
      ctx.fillRect(24, 22, 8, 10);
      ctx.fillRect(36, 22, 8, 10);
      ctx.fillStyle = color;
      ctx.fillRect(26, 23, 4, 8);
      ctx.fillRect(38, 23, 4, 8);
      break;
    }
  }

  ctx.restore();
  return canvas;
}

function makePlayerCanvas(name: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#cc3333";
  ctx.beginPath();
  ctx.arc(32, 22, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#cc3333";
  ctx.fillRect(18, 34, 28, 50);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(26, 17, 5, 7);
  ctx.fillRect(33, 17, 5, 7);

  ctx.font = "bold 9px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(name.substring(0, 4).toUpperCase(), 32, 100);

  return canvas;
}

export class SpriteManager {
  private scene: THREE.Scene;
  private playerSprites: Map<string, THREE.Sprite> = new Map();
  private mobSprites: Map<string, THREE.Sprite> = new Map();
  private playerTargets: Map<string, { x: number; y: number }> = new Map();
  private mobTargets: Map<string, { x: number; y: number }> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  updatePlayers(players: Player[], myId: string) {
    const currentIds = new Set(players.map(p => p.id));

    for (const id of this.playerSprites.keys()) {
      if (!currentIds.has(id)) {
        const sprite = this.playerSprites.get(id);
        if (sprite) { this.scene.remove(sprite); sprite.material.dispose(); }
        this.playerSprites.delete(id);
        this.playerTargets.delete(id);
      }
    }

    for (const player of players) {
      if (player.id === myId || !player.isAlive) continue;

      let sprite = this.playerSprites.get(player.id);
      if (!sprite) {
        const canvas = makePlayerCanvas(player.name);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        sprite = new THREE.Sprite(mat);
        sprite.scale.set(1.2, 2.4, 1);
        this.scene.add(sprite);
        this.playerSprites.set(player.id, sprite);
        this.playerTargets.set(player.id, { x: player.x, y: player.y });
      }

      const target = this.playerTargets.get(player.id) ?? { x: player.x, y: player.y };
      target.x += (player.x - target.x) * 0.25;
      target.y += (player.y - target.y) * 0.25;
      this.playerTargets.set(player.id, target);
      sprite.position.set(target.x, 1.5, target.y);
    }
  }

  updateMobs(mobs: Mob[]) {
    const currentIds = new Set(mobs.filter(m => m.isAlive).map(m => m.id));

    for (const id of this.mobSprites.keys()) {
      if (!currentIds.has(id)) {
        const sprite = this.mobSprites.get(id);
        if (sprite) { this.scene.remove(sprite); sprite.material.dispose(); }
        this.mobSprites.delete(id);
        this.mobTargets.delete(id);
      }
    }

    for (const mob of mobs) {
      if (!mob.isAlive) continue;

      let sprite = this.mobSprites.get(mob.id);
      if (!sprite) {
        const canvas = makeMobCanvas(mob.type);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        sprite = new THREE.Sprite(mat);

        const scale = mob.type === "bacteria" ? 2.0 : mob.type === "depth_dweller" || mob.type === "duller" ? 1.8 : 1.4;
        sprite.scale.set(scale, scale * 2, 1);
        this.scene.add(sprite);
        this.mobSprites.set(mob.id, sprite);
        this.mobTargets.set(mob.id, { x: mob.x, y: mob.y });
      }

      const target = this.mobTargets.get(mob.id) ?? { x: mob.x, y: mob.y };
      target.x += (mob.x - target.x) * 0.3;
      target.y += (mob.y - target.y) * 0.3;
      this.mobTargets.set(mob.id, target);
      sprite.position.set(target.x, 1.5, target.y);
    }
  }

  dispose() {
    this.playerSprites.forEach(s => { this.scene.remove(s); s.material.dispose(); });
    this.mobSprites.forEach(s => { this.scene.remove(s); s.material.dispose(); });
    this.playerSprites.clear();
    this.mobSprites.clear();
    this.playerTargets.clear();
    this.mobTargets.clear();
  }
}
