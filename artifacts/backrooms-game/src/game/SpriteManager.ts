import * as THREE from "three";
import { Player, Mob } from "../types/game";

export class SpriteManager {
  private scene: THREE.Scene;
  private playerSprites: Map<string, THREE.Sprite> = new Map();
  private mobSprites: Map<string, THREE.Sprite> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  updatePlayers(players: Player[], myId: string) {
    const currentIds = new Set(players.map(p => p.id));
    
    // Remove disconnected
    for (const id of this.playerSprites.keys()) {
      if (!currentIds.has(id)) {
        const sprite = this.playerSprites.get(id);
        if (sprite) {
          this.scene.remove(sprite);
          sprite.material.dispose();
        }
        this.playerSprites.delete(id);
      }
    }

    // Update or add
    for (const player of players) {
      if (player.id === myId || !player.isAlive) continue; // Don't draw self or dead

      let sprite = this.playerSprites.get(player.id);
      if (!sprite) {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        
        // Draw humanoid silhouette
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(48, 100, 32, 80); // body
        ctx.beginPath();
        ctx.arc(64, 70, 24, 0, Math.PI * 2); // head
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        sprite = new THREE.Sprite(mat);
        sprite.scale.set(1.5, 3, 1);
        this.scene.add(sprite);
        this.playerSprites.set(player.id, sprite);
      }

      // Smooth interpolation in a real game, here just snap
      sprite.position.set(player.x, 1.5, player.y);
    }
  }

  updateMobs(mobs: Mob[]) {
    const currentIds = new Set(mobs.map(m => m.id));
    
    for (const id of this.mobSprites.keys()) {
      if (!currentIds.has(id)) {
        const sprite = this.mobSprites.get(id);
        if (sprite) {
          this.scene.remove(sprite);
          sprite.material.dispose();
        }
        this.mobSprites.delete(id);
      }
    }

    for (const mob of mobs) {
      if (!mob.isAlive) continue;

      let sprite = this.mobSprites.get(mob.id);
      if (!sprite) {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d")!;
        
        // Draw generic spooky mob shape
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(64, 64, 40, 0, Math.PI * 2);
        ctx.fill();
        // Glowing eyes
        ctx.fillStyle = "#ffff00";
        ctx.fillRect(45, 50, 10, 10);
        ctx.fillRect(75, 50, 10, 10);

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        sprite = new THREE.Sprite(mat);
        sprite.scale.set(1.5, 1.5, 1);
        this.scene.add(sprite);
        this.mobSprites.set(mob.id, sprite);
      }

      sprite.position.set(mob.x, 1.5, mob.y);
    }
  }

  dispose() {
    this.playerSprites.forEach(s => { this.scene.remove(s); s.material.dispose(); });
    this.mobSprites.forEach(s => { this.scene.remove(s); s.material.dispose(); });
    this.playerSprites.clear();
    this.mobSprites.clear();
  }
}
