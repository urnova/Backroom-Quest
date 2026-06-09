import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  PointLight,
  Vector3,
} from "@babylonjs/core";
import { Player, Mob } from "../types/game";

interface CharData {
  root: TransformNode;
  leftArm: Mesh | null;
  rightArm: Mesh | null;
  leftLeg: Mesh | null;
  rightLeg: Mesh | null;
  animTime: number;
  targetX: number;
  targetZ: number;
  light?: PointLight;
}

export const SKIN_COLORS: Record<string, { body: Color3; head: Color3 }> = {
  survivor:     { body: new Color3(0.8, 0.27, 0),    head: new Color3(1, 0.67, 0.27) },
  explorer:     { body: new Color3(0.07, 0.33, 0.8), head: new Color3(0.27, 0.53, 1) },
  scientist:    { body: new Color3(0.13, 0.53, 0.27),head: new Color3(0.33, 0.8, 0.53) },
  soldier:      { body: new Color3(0.4, 0.47, 0.33), head: new Color3(0.6, 0.67, 0.53) },
  medic:        { body: new Color3(0.6, 0.73, 0.8),  head: new Color3(0.95, 0.95, 0.95) },
  hazmat:       { body: new Color3(0.8, 0.6, 0),     head: new Color3(1, 0.93, 0) },
  agent:        { body: new Color3(0.07, 0.07, 0.07),head: new Color3(0.33, 0.33, 0.33) },
  ghost:        { body: new Color3(0.47, 0.53, 0.67),head: new Color3(0.8, 0.87, 1) },
  cultist:      { body: new Color3(0.35, 0, 0.06),   head: new Color3(0.8, 0, 0.19) },
  void_walker:  { body: new Color3(0.1, 0, 0.25),    head: new Color3(0.6, 0, 1) },
};

const MOB_COLORS: Record<string, { body: Color3; eye: Color3; glow?: Color3 }> = {
  smiler:       { body: new Color3(0.02, 0.02, 0.02), eye: new Color3(1, 0.93, 0),     glow: new Color3(1, 0.93, 0) },
  crawler:      { body: new Color3(0.42, 0.09, 0.03), eye: new Color3(1, 0.2, 0) },
  hound:        { body: new Color3(0.08, 0.08, 0.08), eye: new Color3(1, 0.07, 0),     glow: new Color3(1, 0.1, 0) },
  partygoer:    { body: new Color3(0.8, 0.13, 0.06),  eye: new Color3(1, 1, 1) },
  skin_stealer: { body: new Color3(0.54, 0.47, 0.4),  eye: new Color3(0.8, 0.73, 0.67) },
  night_stalker:{ body: new Color3(0.16, 0.02, 0.31), eye: new Color3(0.8, 0.27, 1),   glow: new Color3(0.53, 0, 1) },
  depth_dweller:{ body: new Color3(0, 0.12, 0.25),    eye: new Color3(0, 0.67, 1),     glow: new Color3(0, 0.4, 1) },
  cave_dweller: { body: new Color3(0.19, 0.13, 0.06), eye: new Color3(1, 1, 1) },
  duller:       { body: new Color3(0.27, 0.27, 0.27), eye: new Color3(0.53, 0.53, 0.53) },
  pipe_crawler: { body: new Color3(0.35, 0.16, 0.03), eye: new Color3(1, 0.33, 0) },
  sparker:      { body: new Color3(0.03, 0.41, 0.63), eye: new Color3(0.27, 0.87, 1),  glow: new Color3(0.27, 0.67, 1) },
  blood_hound:  { body: new Color3(0.4, 0, 0),        eye: new Color3(1, 0, 0),        glow: new Color3(0.53, 0, 0) },
  faceling:     { body: new Color3(0.63, 0.59, 0.56), eye: new Color3(0.07, 0.07, 0.07) },
  bacteria:     { body: new Color3(0, 0.28, 0.09),    eye: new Color3(0, 1, 0.27),     glow: new Color3(0, 0.8, 0.27) },
};

function mat(scene: Scene, color: Color3, emissive?: Color3): StandardMaterial {
  const m = new StandardMaterial("m", scene);
  m.diffuseColor = color;
  m.specularColor = new Color3(0.04, 0.04, 0.04);
  if (emissive) m.emissiveColor = emissive;
  return m;
}

function buildHumanoid(
  scene: Scene,
  bodyColor: Color3,
  headColor: Color3,
  opts: {
    s?: number;
    iw?: number;
    il?: number;
    eyeColor?: Color3;
    noEyes?: boolean;
    hasHat?: boolean;
    glowColor?: Color3;
    isSmiler?: boolean;
    extraLegs?: boolean;
  } = {}
): CharData {
  const s  = opts.s  ?? 1;
  const iw = opts.iw ?? 1;
  const il = opts.il ?? 1;

  const root = new TransformNode("char", scene);
  const bodyMat = mat(scene, bodyColor);
  const headMat = mat(scene, headColor);

  const head = MeshBuilder.CreateSphere("h", { diameter: 0.42 * s, segments: 8 }, scene);
  head.position.y = 0.95 * s * il;
  head.material = headMat;
  head.parent = root;

  const body = MeshBuilder.CreateBox("b", {
    width: 0.38 * s * iw, height: 0.56 * s * il, depth: 0.22 * s,
  }, scene);
  body.position.y = 0.52 * s * il;
  body.material = bodyMat;
  body.parent = root;

  const leftArm = MeshBuilder.CreateCylinder("la", {
    height: 0.44 * s * il, diameter: 0.11 * s, tessellation: 6,
  }, scene);
  leftArm.position.set(-0.28 * s * iw, 0.52 * s * il, 0);
  leftArm.rotation.z = Math.PI / 9;
  leftArm.material = bodyMat;
  leftArm.parent = root;

  const rightArm = MeshBuilder.CreateCylinder("ra", {
    height: 0.44 * s * il, diameter: 0.11 * s, tessellation: 6,
  }, scene);
  rightArm.position.set(0.28 * s * iw, 0.52 * s * il, 0);
  rightArm.rotation.z = -Math.PI / 9;
  rightArm.material = bodyMat;
  rightArm.parent = root;

  const leftLeg = MeshBuilder.CreateCylinder("ll", {
    height: 0.48 * s * il, diameterTop: 0.13 * s, diameterBottom: 0.11 * s, tessellation: 6,
  }, scene);
  leftLeg.position.set(-0.1 * s * iw, 0.06 * s * il, 0);
  leftLeg.material = bodyMat;
  leftLeg.parent = root;

  const rightLeg = MeshBuilder.CreateCylinder("rl", {
    height: 0.48 * s * il, diameterTop: 0.13 * s, diameterBottom: 0.11 * s, tessellation: 6,
  }, scene);
  rightLeg.position.set(0.1 * s * iw, 0.06 * s * il, 0);
  rightLeg.material = bodyMat;
  rightLeg.parent = root;

  if (!opts.noEyes) {
    const ec = opts.eyeColor ?? new Color3(0.9, 0.9, 0.9);
    const em = mat(scene, ec, ec);
    for (const [sx, sy] of [[-0.1, 0.97], [0.1, 0.97]] as [number, number][]) {
      const eye = MeshBuilder.CreateSphere("e", { diameter: 0.065 * s, segments: 5 }, scene);
      eye.position.set(sx * s * iw, sy * s * il, 0.19 * s);
      eye.material = em;
      eye.parent = root;
    }
  }

  if (opts.isSmiler) {
    const tm = mat(scene, new Color3(1, 0.98, 0.85), new Color3(1, 0.98, 0.7));
    for (let i = 0; i < 5; i++) {
      const t = MeshBuilder.CreateCylinder(`t${i}`, {
        height: 0.07, diameterTop: 0, diameterBottom: 0.045, tessellation: 4,
      }, scene);
      t.position.set(-0.08 + i * 0.04, 0.82 * s, 0.19 * s);
      t.rotation.x = Math.PI;
      t.material = tm;
      t.parent = root;
    }
  }

  if (opts.extraLegs) {
    for (let i = 0; i < 4; i++) {
      const side = i < 2 ? -1 : 1;
      const spread = i % 2 === 0 ? 0.4 : 0.2;
      const sl = MeshBuilder.CreateCylinder(`sl${i}`, { height: 0.5, diameter: 0.05, tessellation: 4 }, scene);
      sl.position.set(side * 0.24 * s, 0.35 * s, spread * (i % 2 === 0 ? 1 : -1));
      sl.rotation.z = side * (Math.PI / 4);
      sl.rotation.x = 0.3;
      sl.material = bodyMat;
      sl.parent = root;
    }
  }

  if (opts.hasHat) {
    const hm = mat(scene, new Color3(0.8, 0, 0.33));
    const h = MeshBuilder.CreateCylinder("hat", {
      height: 0.35 * s, diameterTop: 0, diameterBottom: 0.44 * s, tessellation: 8,
    }, scene);
    h.position.y = 1.25 * s * il;
    h.material = hm;
    h.parent = root;
    const bm = mat(scene, new Color3(1, 1, 0), new Color3(1, 1, 0));
    const band = MeshBuilder.CreateTorus("band", { diameter: 0.44 * s, thickness: 0.04, tessellation: 16 }, scene);
    band.position.y = 1.06 * s * il;
    band.material = bm;
    band.parent = root;
  }

  let light: PointLight | undefined;
  if (opts.glowColor) {
    light = new PointLight("cl", new Vector3(0, 0.9 * s, 0), scene);
    light.diffuse = opts.glowColor;
    light.intensity = 1.0;
    light.range = 4;
    light.parent = root;
  }

  return { root, leftArm, rightArm, leftLeg, rightLeg, animTime: 0, targetX: 0, targetZ: 0, light };
}

function buildBacteria(scene: Scene): CharData {
  const root = new TransformNode("bacteria", scene);
  const bm = mat(scene, new Color3(0, 0.28, 0.09), new Color3(0, 0.5, 0.13));
  const cells: [number, number, number, number][] = [
    [0, 0.6, 0, 0.35], [-0.35, 0.5, 0, 0.25], [0.35, 0.5, 0, 0.25],
    [0, 1.05, 0, 0.25], [-0.2, 0.18, 0, 0.2],  [0.2, 0.18, 0, 0.2],
  ];
  for (let i = 0; i < cells.length; i++) {
    const [cx, cy, cz, cr] = cells[i];
    const c = MeshBuilder.CreateSphere(`bc${i}`, { diameter: cr * 2, segments: 6 }, scene);
    c.position.set(cx, cy, cz);
    c.material = bm;
    c.parent = root;
  }
  const pl = new PointLight("bpl", new Vector3(0, 0.6, 0), scene);
  pl.diffuse = new Color3(0, 1, 0.3);
  pl.intensity = 1.5;
  pl.range = 5;
  pl.parent = root;
  const dummy = MeshBuilder.CreateBox("d", { size: 0.01 }, scene);
  dummy.isVisible = false;
  dummy.parent = root;
  let t = 0;
  scene.registerBeforeRender(() => { t += 0.05; root.scaling.setAll(1 + Math.sin(t) * 0.06); });
  return { root, leftArm: dummy, rightArm: dummy, leftLeg: dummy, rightLeg: dummy, animTime: 0, targetX: 0, targetZ: 0, light: pl };
}

function buildSparker(scene: Scene): CharData {
  const c = MOB_COLORS.sparker;
  const d = buildHumanoid(scene, c.body, c.body, { eyeColor: c.eye, glowColor: c.glow, s: 1.05 });
  const boltMat = mat(scene, new Color3(1, 1, 1), new Color3(1, 1, 1));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const bolt = MeshBuilder.CreateCylinder(`bolt${i}`, { height: 0.25, diameter: 0.03, tessellation: 4 }, scene);
    bolt.position.set(Math.cos(a) * 0.28, 0.82, Math.sin(a) * 0.28);
    bolt.rotation.z = a;
    bolt.material = boltMat;
    bolt.parent = d.root;
  }
  return d;
}

function buildDepthDweller(scene: Scene): CharData {
  const c = MOB_COLORS.depth_dweller;
  const d = buildHumanoid(scene, c.body, c.body, { s: 1.2, iw: 1.35, eyeColor: c.eye, glowColor: c.glow });
  const tm = mat(scene, new Color3(0, 0.09, 0.2));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const tent = MeshBuilder.CreateCylinder(`t${i}`, { height: 0.6, diameterTop: 0.02, diameterBottom: 0.06, tessellation: 4 }, scene);
    tent.position.set(Math.cos(a) * 0.25, -0.1, Math.sin(a) * 0.25);
    tent.rotation.x = Math.cos(a) * 0.5;
    tent.rotation.z = Math.sin(a) * 0.5;
    tent.material = tm;
    tent.parent = d.root;
  }
  return d;
}

function createCharData(scene: Scene, role: "mob" | "player", skin?: string, mobType?: string): CharData {
  if (role === "player") {
    const cols = SKIN_COLORS[skin ?? "survivor"] ?? SKIN_COLORS.survivor;
    return buildHumanoid(scene, cols.body, cols.head, { eyeColor: new Color3(0.9, 0.9, 0.9) });
  }

  const mt = mobType ?? "smiler";

  if (mt === "bacteria") return buildBacteria(scene);
  if (mt === "sparker") return buildSparker(scene);
  if (mt === "depth_dweller") return buildDepthDweller(scene);
  if (mt === "faceling") {
    const fc = MOB_COLORS.faceling;
    const d = buildHumanoid(scene, fc.body, new Color3(0.78, 0.74, 0.7), { noEyes: true });
    const lm = mat(scene, new Color3(0.5, 0.47, 0.43));
    for (let i = 0; i < 3; i++) {
      const line = MeshBuilder.CreateBox(`fl${i}`, { width: 0.26, height: 0.012, depth: 0.01 }, scene);
      line.position.set(0, 0.86 + i * 0.06, 0.2);
      line.material = lm;
      line.parent = d.root;
    }
    return d;
  }

  const c = MOB_COLORS[mt] ?? { body: new Color3(0.27, 0.27, 0.27), eye: new Color3(1, 1, 1) };
  return buildHumanoid(scene, c.body, c.body, {
    eyeColor: c.eye,
    glowColor: c.glow,
    isSmiler: mt === "smiler",
    il: ["crawler", "skin_stealer"].includes(mt) ? 1.25 : 1,
    iw: ["duller", "depth_dweller"].includes(mt) ? 1.35 : 1,
    hasHat: mt === "partygoer",
    noEyes: mt === "faceling",
    extraLegs: mt === "pipe_crawler",
    s: mt === "duller" ? 1.3 : 1,
  });
}

function animateChar(data: CharData, dt: number, isMoving: boolean) {
  data.animTime += dt;
  const spd = isMoving ? 8 : 0.8;
  const amp = isMoving ? 0.4 : 0.05;
  const t = data.animTime * spd;
  if (data.leftLeg)  data.leftLeg.rotation.x  =  Math.sin(t) * amp;
  if (data.rightLeg) data.rightLeg.rotation.x  = -Math.sin(t) * amp;
  if (data.leftArm)  data.leftArm.rotation.x   = -Math.sin(t) * amp * 0.6;
  if (data.rightArm) data.rightArm.rotation.x  =  Math.sin(t) * amp * 0.6;
  if (data.light)    data.light.intensity = 0.8 + Math.sin(data.animTime * 3) * 0.2;
}

export class BabylonCharacterRenderer {
  private _mobs   = new Map<string, CharData>();
  private _players = new Map<string, CharData>();
  private _prevMob = new Map<string, { x: number; z: number }>();
  private _prevPly = new Map<string, { x: number; z: number }>();

  constructor(private _scene: Scene) {}

  update(dt: number) {
    const lerp = 0.28;
    for (const [id, d] of this._mobs) {
      const p = this._prevMob.get(id);
      const moving = p ? Math.abs(d.targetX - p.x) + Math.abs(d.targetZ - p.z) > 0.005 : false;
      if (p) { p.x = d.targetX; p.z = d.targetZ; }
      animateChar(d, dt, moving);
      d.root.position.x += (d.targetX - d.root.position.x) * lerp;
      d.root.position.z += (d.targetZ - d.root.position.z) * lerp;
    }
    for (const [id, d] of this._players) {
      const p = this._prevPly.get(id);
      const moving = p ? Math.abs(d.targetX - p.x) + Math.abs(d.targetZ - p.z) > 0.005 : false;
      if (p) { p.x = d.targetX; p.z = d.targetZ; }
      animateChar(d, dt, moving);
      d.root.position.x += (d.targetX - d.root.position.x) * lerp;
      d.root.position.z += (d.targetZ - d.root.position.z) * lerp;
    }
  }

  updateMobs(mobs: Mob[]) {
    const alive = new Set(mobs.filter(m => m.isAlive).map(m => m.id));
    for (const id of [...this._mobs.keys()]) {
      if (!alive.has(id)) {
        const d = this._mobs.get(id)!;
        d.root.getChildMeshes().forEach(m => m.dispose());
        d.root.dispose();
        this._mobs.delete(id);
        this._prevMob.delete(id);
      }
    }
    for (const mob of mobs) {
      if (!mob.isAlive) continue;
      let d = this._mobs.get(mob.id);
      if (!d) {
        d = createCharData(this._scene, "mob", undefined, mob.type);
        d.root.position.set(mob.x, 0, mob.y);
        this._mobs.set(mob.id, d);
        this._prevMob.set(mob.id, { x: mob.x, z: mob.y });
      }
      d.targetX = mob.x;
      d.targetZ = mob.y;
      d.root.rotation.y = mob.angle + Math.PI / 2;
    }
  }

  updatePlayers(players: Player[], myId: string) {
    const current = new Set(players.filter(p => p.id !== myId && p.isAlive).map(p => p.id));
    for (const id of [...this._players.keys()]) {
      if (!current.has(id)) {
        const d = this._players.get(id)!;
        d.root.getChildMeshes().forEach(m => m.dispose());
        d.root.dispose();
        this._players.delete(id);
        this._prevPly.delete(id);
      }
    }
    for (const player of players) {
      if (player.id === myId || !player.isAlive) continue;
      let d = this._players.get(player.id);
      if (!d) {
        d = createCharData(this._scene, "player", player.skin);
        d.root.position.set(player.x, 0, player.y);
        this._players.set(player.id, d);
        this._prevPly.set(player.id, { x: player.x, z: player.y });
      }
      d.targetX = player.x;
      d.targetZ = player.y;
      d.root.rotation.y = player.angle + Math.PI / 2;
    }
  }

  clear() {
    for (const d of [...this._mobs.values(), ...this._players.values()]) {
      d.root.getChildMeshes().forEach(m => m.dispose());
      d.root.dispose();
    }
    this._mobs.clear();
    this._players.clear();
    this._prevMob.clear();
    this._prevPly.clear();
  }

  dispose() { this.clear(); }
}
