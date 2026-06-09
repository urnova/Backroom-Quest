import * as THREE from "three";
import { Player, Mob } from "../types/game";

const MOB_BODY_COLORS: Record<string, number> = {
  smiler: 0x0a0a0a, crawler: 0x6a1808, hound: 0x141414,
  partygoer: 0xcc2210, skin_stealer: 0x8a7868, night_stalker: 0x280550,
  depth_dweller: 0x001e40, cave_dweller: 0x302010, duller: 0x444444,
  pipe_crawler: 0x5a2808, sparker: 0x0868a0, blood_hound: 0x660000,
  faceling: 0xa09890, bacteria: 0x004818,
};
const MOB_EYE_COLORS: Record<string, number> = {
  smiler: 0xffee00, crawler: 0xff3300, hound: 0xff1100,
  partygoer: 0xffffff, skin_stealer: 0xccbbaa, night_stalker: 0xcc44ff,
  depth_dweller: 0x00aaff, cave_dweller: 0xffffff, duller: 0x888888,
  pipe_crawler: 0xff5500, sparker: 0x44ddff, blood_hound: 0xff0000,
  faceling: 0x111111, bacteria: 0x00ff44,
};
export const SKIN_COLORS: Record<string, number> = {
  survivor: 0xcc4400, explorer: 0x1155cc, scientist: 0x228844,
  soldier: 0x667755, agent: 0x111111, medic: 0xccddee,
};

interface CharData {
  group: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  animTime: number;
  targetX: number;
  targetY: number;
  light?: THREE.PointLight;
  nameLabel?: THREE.Sprite;
}

function hex(n: number): string {
  return "#" + n.toString(16).padStart(6, "0");
}

function buildLabel(text: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#ffdd88";
  ctx.textAlign = "center";
  ctx.fillText(text.substring(0, 12).toUpperCase(), 128, 40);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.2, 0.3, 1);
  sprite.position.y = 1.6;
  return sprite;
}

function buildHumanoid(
  bodyColor: number, eyeColor: number,
  opts: { scale?: number; hasHat?: boolean; glowColor?: number; noEyes?: boolean;
          isLong?: boolean; extraLegs?: boolean; isWide?: boolean }
): CharData {
  const g = new THREE.Group();
  const s = opts.scale ?? 1;
  const iw = opts.isWide ? 1.4 : 1;
  const il = opts.isLong ? 1.3 : 1;

  const mat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.85 });
  const emMat = new THREE.MeshStandardMaterial({
    color: eyeColor, emissive: eyeColor, emissiveIntensity: 1.2, roughness: 0.1
  });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 10, 8), mat);
  head.position.y = 0.94 * s * il;
  g.add(head);

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38 * s * iw, 0.56 * s * il, 0.20 * s), mat);
  body.position.y = 0.52 * s * il;
  g.add(body);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.055 * s, 0.055 * s, 0.44 * s * il, 6);
  const la = new THREE.Mesh(armGeo, mat);
  la.position.set(-0.27 * s * iw, 0.52 * s * il, 0);
  la.rotation.z = Math.PI / 9;
  g.add(la);
  const ra = new THREE.Mesh(armGeo.clone(), mat);
  ra.position.set(0.27 * s * iw, 0.52 * s * il, 0);
  ra.rotation.z = -Math.PI / 9;
  g.add(ra);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.065 * s, 0.058 * s, 0.48 * s * il, 6);
  const ll = new THREE.Mesh(legGeo, mat);
  ll.position.set(-0.1 * s * iw, 0.06 * s * il, 0);
  g.add(ll);
  const rl = new THREE.Mesh(legGeo.clone(), mat);
  rl.position.set(0.1 * s * iw, 0.06 * s * il, 0);
  g.add(rl);

  // Extra spider legs
  if (opts.extraLegs) {
    for (let i = 0; i < 4; i++) {
      const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.55, 4), mat);
      const side = i < 2 ? -1 : 1;
      const spread = i % 2 === 0 ? 0.45 : 0.25;
      sl.position.set(side * 0.26 * s, 0.35 * s, spread * (i % 2 === 0 ? 1 : -1));
      sl.rotation.z = side * (Math.PI / 4);
      sl.rotation.x = 0.3;
      g.add(sl);
    }
  }

  // Eyes
  if (!opts.noEyes) {
    const eyeGeo = new THREE.SphereGeometry(0.044, 6, 6);
    const le = new THREE.Mesh(eyeGeo, emMat);
    le.position.set(-0.08 * s * iw, 0.96 * s * il, 0.18 * s);
    g.add(le);
    const re = new THREE.Mesh(eyeGeo.clone(), emMat);
    re.position.set(0.08 * s * iw, 0.96 * s * il, 0.18 * s);
    g.add(re);
  }

  // Party hat
  if (opts.hasHat) {
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xcc0055, roughness: 0.7 });
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 0.36 * s, 8), hatMat);
    hat.position.y = 1.2 * s * il;
    g.add(hat);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.5 });
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.22 * s, 0.022 * s, 6, 16), stripeMat);
    stripe.position.y = 1.04 * s * il;
    g.add(stripe);
  }

  let light: THREE.PointLight | undefined;
  if (opts.glowColor !== undefined) {
    light = new THREE.PointLight(opts.glowColor, 1.2, 5);
    light.position.y = 0.9 * s * il;
    g.add(light);
  }

  return { group: g, leftArm: la, rightArm: ra, leftLeg: ll, rightLeg: rl, animTime: 0, targetX: 0, targetY: 0, light };
}

function buildSmiler(): CharData {
  const d = buildHumanoid(0x050505, 0xffee00, { glowColor: 0xffee00 });
  const g = d.group;
  const mat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
  const teethMat = new THREE.MeshStandardMaterial({ color: 0xfffff0, emissive: 0xffff88, emissiveIntensity: 0.4 });
  for (let i = 0; i < 5; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.07, 4), teethMat);
    tooth.position.set(-0.08 + i * 0.04, 0.82, 0.19);
    tooth.rotation.x = Math.PI;
    g.add(tooth);
  }
  return d;
}

function buildBacteria(): CharData {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x004818, emissive: 0x00aa30, emissiveIntensity: 0.5, roughness: 0.6 });
  const cells = [[0, 0.6, 0, 0.38], [-0.38, 0.5, 0, 0.28], [0.38, 0.5, 0, 0.28], [0, 1.1, 0, 0.28], [-0.22, 0.2, 0, 0.22], [0.22, 0.2, 0, 0.22]];
  for (const [cx, cy, cz, cr] of cells) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(cr, 8, 6), mat);
    m.position.set(cx, cy, cz);
    g.add(m);
  }
  const connMat = new THREE.MeshStandardMaterial({ color: 0x006624, emissive: 0x00cc44, emissiveIntensity: 0.6 });
  for (let i = 0; i < cells.length - 1; i++) {
    const conn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3), connMat);
    conn.position.set((cells[i][0] + cells[i + 1][0]) / 2, (cells[i][1] + cells[i + 1][1]) / 2, 0);
    g.add(conn);
  }
  const light = new THREE.PointLight(0x00ff44, 1.5, 6);
  light.position.y = 0.6;
  g.add(light);
  const dummy = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01));
  return { group: g, leftArm: dummy, rightArm: dummy, leftLeg: dummy, rightLeg: dummy, animTime: 0, targetX: 0, targetY: 0, light };
}

function buildSparker(): CharData {
  const d = buildHumanoid(0x0868a0, 0x44ddff, { glowColor: 0x44aaff, scale: 1.05 });
  const boltMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4), boltMat);
    bolt.position.set(Math.cos(a) * 0.28, 0.82, Math.sin(a) * 0.28);
    bolt.rotation.z = a;
    d.group.add(bolt);
  }
  return d;
}

function buildDepthDweller(): CharData {
  const d = buildHumanoid(0x001e40, 0x00aaff, { scale: 1.2, isWide: true, glowColor: 0x0066ff });
  const tentMat = new THREE.MeshStandardMaterial({ color: 0x001428, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 0.6), tentMat);
    tent.position.set(Math.cos(a) * 0.25, -0.1, Math.sin(a) * 0.25);
    tent.rotation.x = Math.cos(a) * 0.5;
    tent.rotation.z = Math.sin(a) * 0.5;
    d.group.add(tent);
  }
  return d;
}

function buildFaceling(): CharData {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xa09890, roughness: 0.95 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc8beb4, roughness: 0.98 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), skinMat);
  head.position.y = 0.94;
  g.add(head);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.56, 0.20), mat);
  body.position.y = 0.52;
  g.add(body);
  const armGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.44, 6);
  const la = new THREE.Mesh(armGeo, mat);
  la.position.set(-0.27, 0.52, 0);
  g.add(la);
  const ra = new THREE.Mesh(armGeo.clone(), mat);
  ra.position.set(0.27, 0.52, 0);
  g.add(ra);
  const legGeo = new THREE.CylinderGeometry(0.065, 0.058, 0.48, 6);
  const ll = new THREE.Mesh(legGeo, mat);
  ll.position.set(-0.1, 0.06, 0);
  g.add(ll);
  const rl = new THREE.Mesh(legGeo.clone(), mat);
  rl.position.set(0.1, 0.06, 0);
  g.add(rl);
  // Smooth featureless face with subtle lines
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x888078, roughness: 1 });
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.012, 0.01), lineMat);
    line.position.set(0, 0.86 + i * 0.06, 0.2);
    g.add(line);
  }
  return { group: g, leftArm: la, rightArm: ra, leftLeg: ll, rightLeg: rl, animTime: 0, targetX: 0, targetY: 0 };
}

function createMobGroup(type: string): CharData {
  switch (type) {
    case "smiler": return buildSmiler();
    case "bacteria": return buildBacteria();
    case "sparker": return buildSparker();
    case "depth_dweller": return buildDepthDweller();
    case "faceling": return buildFaceling();
    case "hound": return buildHumanoid(MOB_BODY_COLORS.hound, MOB_EYE_COLORS.hound, { scale: 0.9, extraLegs: false, glowColor: 0xff2200 });
    case "crawler": return buildHumanoid(MOB_BODY_COLORS.crawler, MOB_EYE_COLORS.crawler, { isLong: true, scale: 0.85 });
    case "partygoer": return buildHumanoid(MOB_BODY_COLORS.partygoer, MOB_EYE_COLORS.partygoer, { hasHat: true });
    case "skin_stealer": return buildHumanoid(MOB_BODY_COLORS.skin_stealer, MOB_EYE_COLORS.skin_stealer, { scale: 1.1, isLong: true });
    case "night_stalker": return buildHumanoid(MOB_BODY_COLORS.night_stalker, MOB_EYE_COLORS.night_stalker, { scale: 1.05, glowColor: 0x8800ff });
    case "cave_dweller": return buildHumanoid(MOB_BODY_COLORS.cave_dweller, MOB_EYE_COLORS.cave_dweller, { scale: 0.95 });
    case "duller": return buildHumanoid(MOB_BODY_COLORS.duller, MOB_EYE_COLORS.duller, { scale: 1.3, isWide: true });
    case "pipe_crawler": return buildHumanoid(MOB_BODY_COLORS.pipe_crawler, MOB_EYE_COLORS.pipe_crawler, { scale: 0.8, isLong: true, extraLegs: true });
    case "blood_hound": return buildHumanoid(MOB_BODY_COLORS.blood_hound, MOB_EYE_COLORS.blood_hound, { scale: 0.95, glowColor: 0x880000 });
    default: return buildHumanoid(MOB_BODY_COLORS[type] ?? 0x444444, MOB_EYE_COLORS[type] ?? 0xffffff, {});
  }
}

function createPlayerGroup(name: string, skin: string): CharData {
  const color = SKIN_COLORS[skin] ?? SKIN_COLORS.survivor;
  const d = buildHumanoid(color, 0xffffff, { scale: 1.0 });
  const label = buildLabel(name);
  d.group.add(label);
  d.nameLabel = label;
  return d;
}

function animateCharacter(d: CharData, dt: number, isMoving: boolean) {
  d.animTime += dt;
  const speed = isMoving ? 8 : 1;
  const amp = isMoving ? 0.35 : 0.05;
  const t = d.animTime * speed;

  if ("rotation" in d.leftLeg) {
    (d.leftLeg as THREE.Mesh).rotation.x = Math.sin(t) * amp;
    (d.rightLeg as THREE.Mesh).rotation.x = -Math.sin(t) * amp;
    (d.leftArm as THREE.Mesh).rotation.x = -Math.sin(t) * amp * 0.6;
    (d.rightArm as THREE.Mesh).rotation.x = Math.sin(t) * amp * 0.6;
  }

  if (d.light) {
    d.light.intensity = 0.8 + Math.sin(d.animTime * 3) * 0.2;
  }
}

export class CharacterRenderer {
  private scene: THREE.Scene;
  private mobChars: Map<string, CharData> = new Map();
  private playerChars: Map<string, CharData> = new Map();
  private mobPrevPos: Map<string, { x: number; y: number }> = new Map();
  private playerPrevPos: Map<string, { x: number; y: number }> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(dt: number) {
    for (const [id, d] of this.mobChars) {
      const prev = this.mobPrevPos.get(id);
      const isMoving = prev ? Math.abs(d.targetX - prev.x) + Math.abs(d.targetY - prev.y) > 0.005 : false;
      if (prev) { prev.x = d.targetX; prev.y = d.targetY; }
      animateCharacter(d, dt, isMoving);
      d.group.position.x += (d.targetX - d.group.position.x) * 0.3;
      d.group.position.z += (d.targetY - d.group.position.z) * 0.3;
    }
    for (const [id, d] of this.playerChars) {
      const prev = this.playerPrevPos.get(id);
      const isMoving = prev ? Math.abs(d.targetX - prev.x) + Math.abs(d.targetY - prev.y) > 0.005 : false;
      if (prev) { prev.x = d.targetX; prev.y = d.targetY; }
      animateCharacter(d, dt, isMoving);
      d.group.position.x += (d.targetX - d.group.position.x) * 0.25;
      d.group.position.z += (d.targetY - d.group.position.z) * 0.25;
    }
  }

  updateMobs(mobs: Mob[]) {
    const alive = new Set(mobs.filter(m => m.isAlive).map(m => m.id));
    for (const id of this.mobChars.keys()) {
      if (!alive.has(id)) {
        this.scene.remove(this.mobChars.get(id)!.group);
        this.mobChars.delete(id);
        this.mobPrevPos.delete(id);
      }
    }
    for (const mob of mobs) {
      if (!mob.isAlive) continue;
      let d = this.mobChars.get(mob.id);
      if (!d) {
        d = createMobGroup(mob.type);
        d.group.position.set(mob.x, 0, mob.y);
        this.scene.add(d.group);
        this.mobChars.set(mob.id, d);
        this.mobPrevPos.set(mob.id, { x: mob.x, y: mob.y });
      }
      d.targetX = mob.x;
      d.targetY = mob.y;
      d.group.rotation.y = -mob.angle - Math.PI / 2;
    }
  }

  updatePlayers(players: Player[], myId: string) {
    const current = new Set(players.filter(p => p.id !== myId && p.isAlive).map(p => p.id));
    for (const id of this.playerChars.keys()) {
      if (!current.has(id)) {
        this.scene.remove(this.playerChars.get(id)!.group);
        this.playerChars.delete(id);
        this.playerPrevPos.delete(id);
      }
    }
    for (const player of players) {
      if (player.id === myId || !player.isAlive) continue;
      let d = this.playerChars.get(player.id);
      if (!d) {
        d = createPlayerGroup(player.name, player.skin);
        d.group.position.set(player.x, 0, player.y);
        this.scene.add(d.group);
        this.playerChars.set(player.id, d);
        this.playerPrevPos.set(player.id, { x: player.x, y: player.y });
      }
      d.targetX = player.x;
      d.targetY = player.y;
      d.group.rotation.y = -player.angle - Math.PI / 2;
    }
  }

  dispose() {
    for (const d of this.mobChars.values()) this.scene.remove(d.group);
    for (const d of this.playerChars.values()) this.scene.remove(d.group);
    this.mobChars.clear();
    this.playerChars.clear();
  }
}
