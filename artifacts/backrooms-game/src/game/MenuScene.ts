import * as THREE from "three";

const CW = 7;
const CH = 2.8;
const CL = 32;

interface Limbs { la: THREE.Mesh; ra: THREE.Mesh; ll: THREE.Mesh; rl: THREE.Mesh }

export class MenuScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private raf = 0;
  private time = 0;
  private playerGroup!: THREE.Group;
  private monsterGroup!: THREE.Group;
  private playerLimbs!: Limbs;
  private monsterLimbs!: Limbs;
  private ceilLights: THREE.PointLight[] = [];

  private _failed = false;

  constructor(canvas: HTMLCanvasElement) {
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch {
      this._failed = true;
      return;
    }
    if (!this.renderer.getContext()) {
      this._failed = true;
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = false;
    this._syncSize();

    if (this._failed) return;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a06);
    this.scene.fog = new THREE.FogExp2(0x0d0b07, 0.05);

    this.camera = new THREE.PerspectiveCamera(72, this._aspect(), 0.1, 60);
    this.camera.position.set(CW / 2 - 1.2, 1.55, 2.5);
    this.camera.lookAt(CW / 2, 1.35, 16);

    this._buildRoom();
    this._buildCharacters();
    this._setupLights();
    this._loop();

    window.addEventListener("resize", this._onResize);
  }

  private _aspect() {
    const c = this.renderer.domElement;
    return (c.offsetWidth || 1) / (c.offsetHeight || 1);
  }

  private _syncSize() {
    const c = this.renderer.domElement;
    const w = c.offsetWidth || window.innerWidth;
    const h = c.offsetHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
  }

  private _onResize = () => {
    this._syncSize();
    this.camera.aspect = this._aspect();
    this.camera.updateProjectionMatrix();
  };

  private _buildRoom() {
    const wallTex = this._wallTex();
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88 });
    const floorTex = this._floorTex();
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xd8d0b0, roughness: 0.85 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0a06, roughness: 1 });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(CW, CL), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(CW / 2, 0, CL / 2);
    this.scene.add(floor);

    // Ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(CW, CL), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(CW / 2, CH, CL / 2);
    this.scene.add(ceil);

    // Left wall
    const lw = new THREE.Mesh(new THREE.PlaneGeometry(CL, CH), wallMat);
    lw.rotation.y = Math.PI / 2;
    lw.position.set(0, CH / 2, CL / 2);
    this.scene.add(lw);

    // Right wall
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(CL, CH), wallMat.clone());
    rw.rotation.y = -Math.PI / 2;
    rw.position.set(CW, CH / 2, CL / 2);
    this.scene.add(rw);

    // Back wall
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), darkMat);
    bw.position.set(CW / 2, CH / 2, CL);
    this.scene.add(bw);

    // Fluorescent light panels
    const panelMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    for (let z = 5; z < CL - 2; z += 7) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 1.6), panelMat);
      panel.position.set(CW / 2, CH - 0.01, z);
      this.scene.add(panel);
    }

    // Baseboard trim
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x8a7038, roughness: 0.9 });
    const ltrim = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, CL), trimMat);
    ltrim.position.set(0.03, 0.06, CL / 2);
    this.scene.add(ltrim);
    const rtrim = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, CL), trimMat.clone());
    rtrim.position.set(CW - 0.03, 0.06, CL / 2);
    this.scene.add(rtrim);
  }

  private _wallTex(): THREE.CanvasTexture {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#c49e2e";
    ctx.fillRect(0, 0, 512, 512);
    // Soft noise
    for (let i = 0; i < 2000; i++) {
      const a = Math.random() * 0.04;
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
    // Diamond wallpaper
    ctx.strokeStyle = "rgba(100,70,0,0.35)";
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 512; y += 42) {
      for (let x = 0; x < 512; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x + 21, y);
        ctx.lineTo(x + 42, y + 21);
        ctx.lineTo(x + 21, y + 42);
        ctx.lineTo(x, y + 21);
        ctx.closePath();
        ctx.stroke();
      }
    }
    // Horizontal seam lines
    ctx.strokeStyle = "rgba(80,55,0,0.25)";
    ctx.lineWidth = 1;
    for (let y = 0; y < 512; y += 84) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 2);
    return t;
  }

  private _floorTex(): THREE.CanvasTexture {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#6e5230";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
      const a = 0.05 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 8);
    return t;
  }

  private _buildCharacters() {
    this.playerGroup = this._makeHumanoid(0xc44020, 0xff8844, 0xd4956a, 1.0);
    this.playerGroup.position.set(CW / 2 - 0.6, 0, 20);
    this.playerGroup.rotation.y = Math.PI;
    this.scene.add(this.playerGroup);
    this.playerLimbs = this._getLimbs(this.playerGroup);

    this.monsterGroup = this._makeMonster();
    this.monsterGroup.position.set(CW / 2 + 0.5, 0, 26);
    this.monsterGroup.rotation.y = Math.PI;
    this.scene.add(this.monsterGroup);
    this.monsterLimbs = this._getLimbs(this.monsterGroup);
  }

  private _makeHumanoid(
    bodyColor: number, accentColor: number, skinTone: number, scale: number
  ): THREE.Group {
    const g = new THREE.Group();
    const s = scale;
    const bm = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.85 });
    const am = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7 });
    const sm = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.9 });
    const dm = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.95 });

    const b = (w: number, h: number, d: number, mat: THREE.Material) =>
      new THREE.Mesh(new THREE.BoxGeometry(w * s, h * s, d * s), mat);

    const head = b(0.27, 0.29, 0.24, sm); head.position.set(0, 1.73 * s, 0); g.add(head);
    const body = b(0.40, 0.52, 0.24, bm); body.position.set(0, 1.22 * s, 0); g.add(body);
    const stripe = b(0.41, 0.07, 0.25, am); stripe.position.set(0, 1.37 * s, 0); g.add(stripe);
    const hips = b(0.38, 0.20, 0.22, bm); hips.position.set(0, 0.88 * s, 0); g.add(hips);

    const la = b(0.12, 0.34, 0.12, bm); la.position.set(-0.30 * s, 1.26 * s, 0); g.add(la);
    const ra = b(0.12, 0.34, 0.12, bm); ra.position.set(0.30 * s, 1.26 * s, 0); g.add(ra);
    const lfa = b(0.10, 0.28, 0.10, bm); lfa.position.set(-0.30 * s, 1.00 * s, 0); g.add(lfa);
    const rfa = b(0.10, 0.28, 0.10, bm); rfa.position.set(0.30 * s, 1.00 * s, 0); g.add(rfa);

    const ll = b(0.15, 0.36, 0.15, bm); ll.position.set(-0.10 * s, 0.58 * s, 0); g.add(ll);
    const rl = b(0.15, 0.36, 0.15, bm); rl.position.set(0.10 * s, 0.58 * s, 0); g.add(rl);
    const lsh = b(0.13, 0.30, 0.13, bm); lsh.position.set(-0.10 * s, 0.25 * s, 0); g.add(lsh);
    const rsh = b(0.13, 0.30, 0.13, bm); rsh.position.set(0.10 * s, 0.25 * s, 0); g.add(rsh);
    const lf = b(0.15, 0.07, 0.22, dm); lf.position.set(-0.10 * s, 0.03 * s, 0.04 * s); g.add(lf);
    const rf = b(0.15, 0.07, 0.22, dm); rf.position.set(0.10 * s, 0.03 * s, 0.04 * s); g.add(rf);

    // Eyes
    const em = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    const le = b(0.06, 0.04, 0.01, em); le.position.set(-0.07 * s, 1.76 * s, 0.125 * s); g.add(le);
    const re = le.clone(); re.position.x = 0.07 * s; g.add(re);

    g.userData.la = la; g.userData.ra = ra; g.userData.ll = ll; g.userData.rl = rl;
    return g;
  }

  private _makeMonster(): THREE.Group {
    const g = new THREE.Group();
    const bm = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 });
    const em = new THREE.MeshStandardMaterial({
      color: 0xffee00, emissive: new THREE.Color(0xffee00), emissiveIntensity: 2.5, roughness: 0.1
    });

    const b = (w: number, h: number, d: number, mat: THREE.Material) =>
      new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

    const s = 1.12;
    const head = b(0.32 * s, 0.36 * s, 0.30 * s, bm); head.position.set(0, 1.94 * s, 0); g.add(head);
    const body = b(0.48 * s, 0.65 * s, 0.30 * s, bm); body.position.set(0, 1.35 * s, 0); g.add(body);
    const hips = b(0.44 * s, 0.22 * s, 0.26 * s, bm); hips.position.set(0, 0.90 * s, 0); g.add(hips);

    const la = b(0.13 * s, 0.50 * s, 0.13 * s, bm);
    la.position.set(-0.36 * s, 1.32 * s, 0); la.rotation.z = 0.18; g.add(la);
    const ra = la.clone(); ra.position.x = 0.36 * s; ra.rotation.z = -0.18; g.add(ra);

    const ll = b(0.17 * s, 0.40 * s, 0.17 * s, bm); ll.position.set(-0.12 * s, 0.60 * s, 0); g.add(ll);
    const rl = ll.clone(); rl.position.x = 0.12 * s; g.add(rl);
    const lsh = b(0.14 * s, 0.35 * s, 0.14 * s, bm); lsh.position.set(-0.12 * s, 0.24 * s, 0); g.add(lsh);
    const rsh = lsh.clone(); rsh.position.x = 0.12 * s; g.add(rsh);

    // Glowing eyes
    const le = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 8, 8), em);
    le.position.set(-0.09 * s, 2.00 * s, 0.15 * s); g.add(le);
    const re = le.clone(); re.position.x = 0.09 * s; g.add(re);

    const glow = new THREE.PointLight(0xffee00, 0.9, 4);
    glow.position.set(0, 1.9 * s, 0);
    g.add(glow);
    g.userData.glow = glow;

    g.userData.la = la; g.userData.ra = ra; g.userData.ll = ll; g.userData.rl = rl;
    return g;
  }

  private _getLimbs(g: THREE.Group): Limbs {
    return { la: g.userData.la, ra: g.userData.ra, ll: g.userData.ll, rl: g.userData.rl };
  }

  private _setupLights() {
    const amb = new THREE.AmbientLight(0xfff4d0, 0.30);
    this.scene.add(amb);
    for (let z = 5; z < CL - 2; z += 7) {
      const pl = new THREE.PointLight(0xfffae0, 1.6, 12);
      pl.position.set(CW / 2, CH - 0.22, z);
      this.scene.add(pl);
      this.ceilLights.push(pl);
    }
  }

  private _loop = () => {
    if (this._failed) return;
    this.raf = requestAnimationFrame(this._loop);
    this.time += 1 / 60;
    const t = this.time;

    // Running animation
    const runAmp = 0.45;
    const runT = t * 7;
    this.playerLimbs.ll.rotation.x = Math.sin(runT) * runAmp;
    this.playerLimbs.rl.rotation.x = -Math.sin(runT) * runAmp;
    this.playerLimbs.la.rotation.x = -Math.sin(runT) * runAmp * 0.65;
    this.playerLimbs.ra.rotation.x = Math.sin(runT) * runAmp * 0.65;

    const monT = t * 5.5;
    this.monsterLimbs.ll.rotation.x = Math.sin(monT) * runAmp * 0.9;
    this.monsterLimbs.rl.rotation.x = -Math.sin(monT) * runAmp * 0.9;
    this.monsterLimbs.la.rotation.x = -Math.sin(monT) * runAmp * 0.5;
    this.monsterLimbs.ra.rotation.x = Math.sin(monT) * runAmp * 0.5;

    // Move characters (loop: run from far end toward camera)
    const cycle = 22;
    const playerZ = CL - 2 - ((t * 2.0) % cycle);
    this.playerGroup.position.z = playerZ;
    this.monsterGroup.position.z = playerZ + 6.5 + Math.sin(t * 0.4) * 0.8;

    // Monster glow
    if (this.monsterGroup.userData.glow) {
      (this.monsterGroup.userData.glow as THREE.PointLight).intensity =
        0.8 + Math.sin(t * 9) * 0.25;
    }

    // Camera gentle drift
    const drift = Math.sin(t * 0.12) * 0.55;
    const bob = Math.sin(t * 0.28) * 0.025;
    this.camera.position.set(CW / 2 - 1.0 + drift, 1.55 + bob, 2.5);
    this.camera.lookAt(CW / 2 + drift * 0.25, 1.32, 18);

    // Light flicker (very subtle)
    for (let i = 0; i < this.ceilLights.length; i++) {
      this.ceilLights[i].intensity = 1.6 + Math.sin(t * (0.8 + i * 0.2) + i) * 0.04;
    }

    this.renderer.render(this.scene, this.camera);
  };

  get ok() { return !this._failed; }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this._onResize);
    if (!this._failed) this.renderer?.dispose();
  }
}
