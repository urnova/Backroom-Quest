import * as THREE from "three";
import { Player, Mob } from "../types/game";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

const MOB_COLORS: Record<string, string> = {
  smiler: "#ffee00",
  crawler: "#c84018",
  hound: "#303030",
  partygoer: "#ff5030",
  skin_stealer: "#b0a898",
  night_stalker: "#6010b0",
  depth_dweller: "#0040a0",
  cave_dweller: "#705030",
  duller: "#707070",
  pipe_crawler: "#904020",
  sparker: "#30b0ff",
  blood_hound: "#bb0000",
  faceling: "#ddd0c8",
  bacteria: "#00ee30",
};

function makeMobCanvas(type: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 128, 256);

  const color = MOB_COLORS[type] ?? "#ff0000";
  const [r, g, b] = hexToRgb(color);

  switch (type) {
    case "smiler": {
      ctx.save();
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.beginPath();
      ctx.ellipse(64, 100, 42, 55, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const grd = ctx.createRadialGradient(64 + Math.cos(a) * 30, 80 + Math.sin(a) * 30, 0, 64, 80, 60);
        grd.addColorStop(0, "rgba(80,60,0,0.4)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(64 + Math.cos(a) * 30, 80 + Math.sin(a) * 30, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ffee00";
      ctx.beginPath();
      ctx.ellipse(42, 90, 9, 13, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffee00";
      ctx.beginPath();
      ctx.ellipse(86, 90, 9, 13, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(42, 90, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(86, 90, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffee00";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(64, 118, 26, 0.15, Math.PI - 0.15);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = 0.15 + (i / 5) * (Math.PI - 0.3);
        ctx.beginPath();
        ctx.moveTo(64 + Math.cos(a) * 26, 118 + Math.sin(a) * 26);
        ctx.lineTo(64 + Math.cos(a) * 22, 118 + Math.sin(a) * 22);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(36, 150, 14, 80);
      ctx.fillRect(78, 150, 14, 80);
      ctx.restore();
      break;
    }

    case "hound": {
      ctx.save();
      ctx.shadowColor = "#ff0000";
      ctx.shadowBlur = 15;
      ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
      ctx.beginPath();
      ctx.ellipse(64, 145, 30, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(64, 80, 25, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(45, 65); ctx.lineTo(35, 40); ctx.lineTo(55, 60); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(83, 65); ctx.lineTo(93, 40); ctx.lineTo(73, 60); ctx.closePath();
      ctx.fill();
      ctx.shadowColor = "#ff4400";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ff3300";
      ctx.beginPath();
      ctx.ellipse(52, 78, 5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(76, 78, 5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(52, 78, 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(76, 78, 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${r},${g},${b},0.8)`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(34, 150); ctx.lineTo(20, 220);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(56, 150); ctx.lineTo(48, 230);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(72, 150); ctx.lineTo(80, 230);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(94, 150); ctx.lineTo(108, 220);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case "partygoer": {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#f0d0a0";
      ctx.beginPath();
      ctx.ellipse(64, 75, 22, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(64, 45); ctx.lineTo(40, 75); ctx.lineTo(88, 75); ctx.closePath();
      ctx.fill();
      const ballColors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = ballColors[i];
        ctx.beginPath();
        ctx.arc(40 + i * 12, 45 - (i % 2) * 5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(56, 72, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(72, 72, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(64, 85, 10, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.fillRect(42, 98, 44, 70);
      ctx.fillStyle = `rgba(${r - 20},${g - 20},${b - 20},0.9)`;
      ctx.fillRect(38, 168, 14, 60);
      ctx.fillRect(76, 168, 14, 60);
      ctx.fillRect(30, 110, 12, 50);
      ctx.fillRect(86, 110, 12, 50);
      ctx.restore();
      break;
    }

    case "skin_stealer": {
      ctx.save();
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
      ctx.beginPath();
      ctx.ellipse(64, 72, 20, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(44, 92, 40, 80);
      ctx.fillRect(36, 98, 12, 60);
      ctx.fillRect(80, 98, 12, 60);
      ctx.fillRect(48, 172, 14, 68);
      ctx.fillRect(66, 172, 14, 68);
      ctx.fillStyle = "#c0b0a8";
      ctx.beginPath();
      ctx.arc(56, 68, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(72, 68, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(56, 68, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(72, 68, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#c0b0a8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(50, 80); ctx.lineTo(78, 80);
      ctx.stroke();
      ctx.strokeStyle = "rgba(80,60,50,0.6)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(44 + i * 8, 92);
        ctx.lineTo(44 + i * 8, 172);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case "night_stalker": {
      ctx.save();
      ctx.shadowColor = "#aa00ff";
      ctx.shadowBlur = 30;
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
      ctx.beginPath();
      ctx.ellipse(64, 70, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(46, 88, 36, 90);
      ctx.fillRect(38, 95, 12, 55);
      ctx.fillRect(78, 95, 12, 55);
      ctx.fillRect(50, 178, 12, 65);
      ctx.fillRect(66, 178, 12, 65);
      ctx.shadowColor = "#cc88ff";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#cc88ff";
      ctx.beginPath();
      ctx.ellipse(56, 66, 5, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(72, 66, 5, 7, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(180,120,255,0.3)";
      const tendrils = [[-20, -30], [20, -25], [-30, 0], [30, 0], [-15, 50], [15, 55]];
      for (const [tx, ty] of tendrils) {
        ctx.beginPath();
        ctx.moveTo(64, 120);
        ctx.quadraticCurveTo(64 + tx / 2, 120 + ty / 2, 64 + tx, 120 + ty);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(180,120,255,0.4)";
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case "bacteria": {
      ctx.save();
      const cells = [
        [64, 80, 28], [38, 100, 20], [90, 100, 20], [50, 135, 18], [78, 135, 18], [64, 165, 22],
      ];
      for (const [cx, cy, cr] of cells) {
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        grd.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
        grd.addColorStop(0.7, `rgba(${r},${g},${b},0.5)`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0.1)`);
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < cells.length - 1; i++) {
        ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cells[i][0], cells[i][1]);
        ctx.lineTo(cells[i + 1][0], cells[i + 1][1]);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      for (const [cx, cy, cr] of cells) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * (cr + 4), cy + Math.sin(a) * (cr + 4), 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      break;
    }

    case "sparker": {
      ctx.save();
      ctx.shadowColor = "#30b0ff";
      ctx.shadowBlur = 22;
      ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
      ctx.beginPath();
      ctx.ellipse(64, 70, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(46, 88, 36, 85);
      ctx.fillRect(38, 95, 12, 50);
      ctx.fillRect(78, 95, 12, 50);
      ctx.fillRect(50, 173, 12, 65);
      ctx.fillRect(66, 173, 12, 65);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 10;
      const bolts = [
        [64, 60, -15, 35], [64, 60, 15, 35], [40, 100, -20, 20], [88, 100, 20, 20],
      ];
      for (const [sx, sy, ex, ey] of bolts) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + ex / 2 + (Math.random() - 0.5) * 10, sy + ey / 2);
        ctx.lineTo(sx + ex, sy + ey);
        ctx.stroke();
      }
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(56, 66, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(72, 66, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case "faceling": {
      ctx.save();
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.beginPath();
      ctx.ellipse(64, 72, 22, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(42, 94, 44, 82);
      ctx.fillRect(34, 100, 12, 55);
      ctx.fillRect(82, 100, 12, 55);
      ctx.fillRect(46, 176, 14, 68);
      ctx.fillRect(68, 176, 14, 68);
      ctx.fillStyle = `rgba(${r - 30},${g - 30},${b - 30},0.6)`;
      ctx.beginPath();
      ctx.ellipse(64, 72, 22, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(80,70,60,0.5)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(44, 58 + i * 8);
        ctx.quadraticCurveTo(64, 60 + i * 8 + (i % 2 === 0 ? 2 : -2), 84, 58 + i * 8);
        ctx.stroke();
      }
      ctx.shadowColor = "rgba(200,180,160,0.6)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "rgba(220,210,200,0.15)";
      ctx.beginPath();
      ctx.ellipse(64, 72, 20, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case "depth_dweller": {
      ctx.save();
      ctx.shadowColor = "#0080ff";
      ctx.shadowBlur = 20;
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.beginPath();
      ctx.ellipse(64, 78, 28, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(36, 108, 56, 90);
      ctx.strokeStyle = `rgba(${r},${g + 30},${b + 50},0.7)`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(64, 108, 30 + i * 6, Math.PI * 0.7, Math.PI * 0.3, true);
        ctx.stroke();
      }
      const tentacles = [[-28, 80], [-20, 100], [20, 100], [28, 80], [0, 120]];
      for (const [tx, ty] of tentacles) {
        ctx.strokeStyle = `rgba(${r},${g},${b + 30},0.7)`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(64 + tx / 2, 108 + ty / 3);
        ctx.quadraticCurveTo(64 + tx * 0.75, 108 + ty * 0.7, 64 + tx, 108 + ty);
        ctx.stroke();
      }
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(54, 74, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(74, 74, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(54, 76, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(74, 76, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    default: {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.beginPath();
      ctx.ellipse(64, 68, 20, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(44, 88, 40, 80);
      ctx.fillRect(36, 95, 12, 55);
      ctx.fillRect(80, 95, 12, 55);
      ctx.fillRect(48, 168, 14, 68);
      ctx.fillRect(66, 168, 14, 68);
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.ellipse(56, 64, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(72, 64, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(56, 64, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(72, 64, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
  }

  return canvas;
}

function makePlayerCanvas(name: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.shadowColor = "#ff6666";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#cc3333";
  ctx.beginPath();
  ctx.ellipse(64, 55, 20, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#cc3333";
  ctx.fillRect(44, 74, 40, 80);
  ctx.fillRect(36, 80, 12, 55);
  ctx.fillRect(80, 80, 12, 55);
  ctx.fillRect(48, 154, 14, 65);
  ctx.fillRect(66, 154, 14, 65);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(57, 52, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(71, 52, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(57, 53, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(71, 53, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(name.substring(0, 5).toUpperCase(), 64, 230);

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
    const currentIds = new Set(players.map((p) => p.id));

    for (const id of this.playerSprites.keys()) {
      if (!currentIds.has(id)) {
        const sprite = this.playerSprites.get(id);
        if (sprite) {
          this.scene.remove(sprite);
          sprite.material.dispose();
        }
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
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
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
    const currentIds = new Set(mobs.filter((m) => m.isAlive).map((m) => m.id));

    for (const id of this.mobSprites.keys()) {
      if (!currentIds.has(id)) {
        const sprite = this.mobSprites.get(id);
        if (sprite) {
          this.scene.remove(sprite);
          sprite.material.dispose();
        }
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
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        sprite = new THREE.Sprite(mat);

        const scaleMap: Record<string, number> = {
          bacteria: 2.2,
          depth_dweller: 2.0,
          duller: 1.9,
          skin_stealer: 1.7,
          partygoer: 1.6,
          faceling: 1.5,
          hound: 1.4,
        };
        const scale = scaleMap[mob.type] ?? 1.4;
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
    this.playerSprites.forEach((s) => {
      this.scene.remove(s);
      s.material.dispose();
    });
    this.mobSprites.forEach((s) => {
      this.scene.remove(s);
      s.material.dispose();
    });
    this.playerSprites.clear();
    this.mobSprites.clear();
    this.playerTargets.clear();
    this.mobTargets.clear();
  }
}
