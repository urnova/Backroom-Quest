import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { SkinDef } from "../lib/playerStore";

interface CharData {
  group: THREE.Group;
  torso: THREE.Object3D;
  particles: THREE.Mesh[];
  glowLight?: THREE.PointLight;
}

function buildCharacter(skin: SkinDef, scene: THREE.Scene): CharData {
  const { visual } = skin;
  const group = new THREE.Group();
  const particles: THREE.Mesh[] = [];

  const bodyCol = new THREE.Color(visual.bodyHex);
  const accentCol = new THREE.Color(visual.accentHex);
  const skinCol = new THREE.Color(visual.skinTone);

  const makeBodyMat = () => new THREE.MeshStandardMaterial({
    color: bodyCol.clone(), roughness: 0.82, metalness: 0.05,
    transparent: (visual.opacity ?? 1) < 1, opacity: visual.opacity ?? 1,
  });
  const makeAccentMat = () => new THREE.MeshStandardMaterial({
    color: accentCol.clone(), roughness: 0.65, metalness: 0.1,
    transparent: (visual.opacity ?? 1) < 1, opacity: visual.opacity ?? 1,
  });
  const makeSkinMat = () => new THREE.MeshStandardMaterial({ color: skinCol.clone(), roughness: 0.88 });
  const makeDarkMat = () => new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });

  const bm = makeBodyMat();
  const am = makeAccentMat();
  const sm = makeSkinMat();
  const dm = makeDarkMat();

  const b = (w: number, h: number, d: number, m: THREE.Material): THREE.Mesh =>
    new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

  const isHazmat = visual.style === "hazmat";
  const isRobe = visual.style === "robe";
  const isGhost = visual.style === "ghost";
  const isVoid = visual.style === "void";

  // ── Head ──────────────────────────────────────────────────────────────────
  const headMat = (isHazmat || isVoid) ? bm : sm;
  const head = b(0.27, 0.30, 0.25, headMat);
  head.position.set(0, 1.74, 0);
  group.add(head);

  if (!isHazmat) {
    const face = b(0.22, 0.25, 0.01, sm);
    face.position.set(0, 1.74, 0.127);
    group.add(face);
  }

  // Eyes
  const eyeColor = isGhost ? 0x88aaff : isVoid ? 0xaa44ff : 0x111111;
  const isGlowEye = isGhost || isVoid;
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeColor,
    emissive: isGlowEye ? new THREE.Color(eyeColor) : new THREE.Color(0),
    emissiveIntensity: isGlowEye ? 2 : 0,
  });
  if (!isHazmat) {
    const le = b(0.065, 0.045, 0.01, eyeMat);
    le.position.set(-0.072, 1.762, 0.128);
    group.add(le);
    const re = le.clone(); re.position.x = 0.072; group.add(re);
  }

  // ── Neck ──────────────────────────────────────────────────────────────────
  const neckMat = isHazmat ? bm : sm;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.11, 10), neckMat);
  neck.position.set(0, 1.575, 0);
  group.add(neck);

  // ── Torso ─────────────────────────────────────────────────────────────────
  const tw = isHazmat ? 0.52 : 0.43;
  const th = isRobe ? 0.90 : isHazmat ? 0.60 : 0.54;
  const td = isHazmat ? 0.34 : 0.26;
  const ty = isRobe ? 1.10 : 1.22;
  const torso = b(tw, th, td, bm);
  torso.position.set(0, ty, 0);
  group.add(torso);

  // Accent stripe on torso
  if (!isHazmat && !isRobe) {
    const stripe = b(tw + 0.01, 0.072, td + 0.01, am);
    stripe.position.set(0, ty - 0.16, 0);
    group.add(stripe);
  }

  // ── Hips ──────────────────────────────────────────────────────────────────
  if (!isRobe) {
    const hips = b(0.40, 0.22, isHazmat ? 0.32 : 0.24, bm);
    hips.position.set(0, 0.87, 0);
    group.add(hips);
  }

  // ── Arms ──────────────────────────────────────────────────────────────────
  const aw = isHazmat ? 0.17 : 0.13;
  const ax = isHazmat ? 0.39 : 0.32;
  const lua = b(aw, 0.33, aw, bm); lua.position.set(-ax, 1.28, 0); group.add(lua);
  const rua = lua.clone(); rua.position.x = ax; group.add(rua);
  const lfa = b(aw * 0.85, 0.28, aw * 0.85, bm); lfa.position.set(-ax, 1.01, 0); group.add(lfa);
  const rfa = lfa.clone(); rfa.position.x = ax; group.add(rfa);
  const lh = b(0.10, 0.09, 0.08, isHazmat ? bm : sm); lh.position.set(-ax, 0.84, 0); group.add(lh);
  const rh = lh.clone(); rh.position.x = ax; group.add(rh);

  // ── Legs ──────────────────────────────────────────────────────────────────
  if (!isRobe) {
    const lw2 = isHazmat ? 0.19 : 0.155;
    const lth = b(lw2, 0.38, lw2, bm); lth.position.set(-0.105, 0.57, 0); group.add(lth);
    const rth = lth.clone(); rth.position.x = 0.105; group.add(rth);
    const lsh2 = b(lw2 * 0.88, 0.32, lw2 * 0.88, bm); lsh2.position.set(-0.105, 0.23, 0); group.add(lsh2);
    const rsh2 = lsh2.clone(); rsh2.position.x = 0.105; group.add(rsh2);
    const lft = b(0.16, 0.075, 0.23, dm); lft.position.set(-0.105, 0.02, 0.04); group.add(lft);
    const rft = lft.clone(); rft.position.x = 0.105; group.add(rft);
  } else {
    const robeBody = b(0.46, 0.62, 0.30, bm);
    robeBody.position.set(0, 0.55, 0);
    group.add(robeBody);
    const robeFoot = b(0.40, 0.10, 0.26, bm);
    robeFoot.position.set(0, 0.21, 0);
    group.add(robeFoot);
  }

  // ── Hat / Head Gear ───────────────────────────────────────────────────────
  if (visual.hatType === "helmet") {
    const helm = b(0.32, 0.22, 0.31, am);
    helm.position.set(0, 1.86, 0);
    group.add(helm);
    const visor = b(0.26, 0.08, 0.04, new THREE.MeshStandardMaterial({
      color: 0x88ccff, roughness: 0.05, metalness: 0.7, transparent: true, opacity: 0.85,
    }));
    visor.position.set(0, 1.83, 0.16);
    group.add(visor);
  } else if (visual.hatType === "hood") {
    const hood = b(0.36, 0.33, 0.34, bm);
    hood.position.set(0, 1.82, -0.04);
    group.add(hood);
    const front = b(0.28, 0.27, 0.04, bm);
    front.position.set(0, 1.80, 0.15);
    group.add(front);
  } else if (visual.hatType === "bandana") {
    const band = b(0.29, 0.075, 0.27, am);
    band.position.set(0, 1.73, 0);
    group.add(band);
  } else if (visual.hatType === "goggles_head") {
    const gframe = b(0.28, 0.065, 0.04, new THREE.MeshStandardMaterial({ color: 0xcc8800, roughness: 0.5 }));
    gframe.position.set(0, 1.82, 0.14);
    group.add(gframe);
    const lLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.025, 12),
      new THREE.MeshStandardMaterial({ color: 0x88aadd, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.9 })
    );
    lLens.rotation.x = Math.PI / 2;
    lLens.position.set(-0.065, 1.82, 0.155);
    group.add(lLens);
    const rLens = lLens.clone(); rLens.position.x = 0.065; group.add(rLens);
  } else if (visual.hatType === "gas_mask") {
    const mask = b(0.25, 0.21, 0.15, am);
    mask.position.set(0, 1.68, 0.16);
    group.add(mask);
    const lLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x88bbaa, roughness: 0.05, emissive: 0x224433, emissiveIntensity: 0.4, transparent: true, opacity: 0.9 })
    );
    lLens.position.set(-0.075, 1.71, 0.25);
    group.add(lLens);
    const rLens = lLens.clone(); rLens.position.x = 0.075; group.add(rLens);
    const filter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.034, 0.09, 10),
      new THREE.MeshStandardMaterial({ color: 0x334422, roughness: 0.9 })
    );
    filter.rotation.z = Math.PI / 2;
    filter.position.set(0.16, 1.63, 0.22);
    group.add(filter);
  }

  // ── Extras ────────────────────────────────────────────────────────────────
  if (visual.extras.includes("backpack")) {
    const pack = b(0.29, 0.40, 0.15, am);
    pack.position.set(0, 1.20, -0.23);
    group.add(pack);
    const s1 = b(0.06, 0.42, 0.04, am); s1.position.set(-0.14, 1.18, -0.08); group.add(s1);
    const s2 = s1.clone(); s2.position.x = 0.14; group.add(s2);
    const pocket = b(0.22, 0.16, 0.06, bm); pocket.position.set(0, 1.01, -0.30); group.add(pocket);
  }

  if (visual.extras.includes("lab_coat")) {
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.92 });
    const lp = b(0.045, 0.54, 0.28, coatMat); lp.position.set(-0.24, ty, 0); group.add(lp);
    const rp = lp.clone(); rp.position.x = 0.24; group.add(rp);
    const collar = b(0.30, 0.085, 0.04, coatMat); collar.position.set(0, 1.46, 0.14); group.add(collar);
    if (skin.id === "medic") {
      const cx = new THREE.MeshStandardMaterial({ color: 0xff2222, roughness: 0.8 });
      const ch = b(0.14, 0.04, 0.01, cx); ch.position.set(0.19, 1.30, 0.14); group.add(ch);
      const cv = b(0.04, 0.14, 0.01, cx); cv.position.set(0.19, 1.30, 0.14); group.add(cv);
    }
  }

  if (visual.extras.includes("tie")) {
    const tie = b(0.065, 0.33, 0.022, am); tie.position.set(0, 1.22, 0.135); group.add(tie);
    const knot = b(0.095, 0.065, 0.030, am); knot.position.set(0, 1.40, 0.134); group.add(knot);
  }

  if (visual.extras.includes("tactical_vest")) {
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x1e2a16, roughness: 0.96 });
    const vest = b(0.46, 0.42, 0.065, vestMat); vest.position.set(0, 1.26, 0.145); group.add(vest);
    const p1 = b(0.11, 0.11, 0.065, am); p1.position.set(-0.18, 1.12, 0.175); group.add(p1);
    const p2 = p1.clone(); p2.position.x = 0.06; group.add(p2);
    const p3 = p1.clone(); p3.position.set(0.18, 1.26, 0.175); group.add(p3);
  }

  if (visual.extras.includes("armor_plates")) {
    const spm = new THREE.MeshStandardMaterial({ color: accentCol.clone().multiplyScalar(0.7), roughness: 0.7, metalness: 0.25 });
    const ls = b(0.20, 0.13, 0.19, spm); ls.position.set(-0.37, 1.43, 0); group.add(ls);
    const rs = ls.clone(); rs.position.x = 0.37; group.add(rs);
    const cp = b(0.42, 0.26, 0.065, spm); cp.position.set(0, 1.32, 0.15); group.add(cp);
  }

  if (visual.extras.includes("cloak")) {
    const cm = new THREE.MeshStandardMaterial({
      color: bodyCol.clone().multiplyScalar(0.6), roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.88,
    });
    const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.74, 1.05, 0.04), cm);
    cloak.position.set(0, 0.88, -0.16);
    group.add(cloak);
  }

  // ── Glow light ────────────────────────────────────────────────────────────
  let glowLight: THREE.PointLight | undefined;
  if (visual.glowHex) {
    glowLight = new THREE.PointLight(
      new THREE.Color(visual.glowHex),
      isVoid ? 1.8 : isGhost ? 1.0 : 0.7,
      isVoid ? 5 : 3.5
    );
    glowLight.position.set(0, 1.2, 0);
    group.add(glowLight);
  }

  // ── Particles ─────────────────────────────────────────────────────────────
  if (visual.extras.includes("particles")) {
    const pMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visual.glowHex ?? visual.accentHex),
      emissive: new THREE.Color(visual.glowHex ?? visual.accentHex),
      emissiveIntensity: 1.8,
    });
    for (let i = 0; i < 9; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 7, 7), pMat.clone());
      p.userData.phase = (i / 9) * Math.PI * 2;
      p.userData.orbitY = 0.45 + (i % 5) * 0.30;
      p.userData.orbitR = 0.42 + (i % 3) * 0.09;
      group.add(p);
      particles.push(p);
    }
  }

  scene.add(group);
  return { group, torso, particles, glowLight };
}

export default function SkinViewer3D({
  skin,
  height = 420,
  className = "",
}: {
  skin: SkinDef;
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const charRef = useRef<CharData | null>(null);
  const rafRef = useRef<number>(0);
  const [webGLFailed, setWebGLFailed] = useState(false);

  // Setup renderer + scene once
  useEffect(() => {
    const canvas = canvasRef.current!;
    const w = canvas.offsetWidth || 280;
    const h = canvas.offsetHeight || height;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      if (!renderer.getContext()) throw new Error("no ctx");
    } catch {
      setWebGLFailed(true);
      return;
    }
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x080808);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080808, 0.18);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 30);
    camera.position.set(0, 1.15, 2.85);
    camera.lookAt(0, 1.05, 0);
    cameraRef.current = camera;

    // 3-point lighting
    const key = new THREE.PointLight(0xfff8e0, 3.2, 12);
    key.position.set(2.2, 3.2, 2.5);
    scene.add(key);

    const fill = new THREE.PointLight(0xc8d8ff, 0.8, 10);
    fill.position.set(-2.0, 1.8, 1.5);
    scene.add(fill);

    const rim = new THREE.PointLight(0xffedd0, 1.4, 8);
    rim.position.set(0.2, 2.4, -3.0);
    scene.add(rim);

    const amb = new THREE.AmbientLight(0x302820, 0.55);
    scene.add(amb);

    // Floor pedestal
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x111110, roughness: 0.9, metalness: 0.1 });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.08, 24), pedestalMat);
    pedestal.position.set(0, -0.04, 0);
    scene.add(pedestal);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshStandardMaterial({ color: 0x0a0a08, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.08;
    scene.add(floor);

    // Floor ring glow
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x222218, emissive: new THREE.Color(0x221100), emissiveIntensity: 0.6,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 8, 36), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.04;
    scene.add(ring);

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
    };
  }, []);

  // Build/rebuild character when skin changes
  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!scene || !renderer || !camera) return;

    // Remove old character
    if (charRef.current) {
      scene.remove(charRef.current.group);
    }

    const charData = buildCharacter(skin, scene);
    charRef.current = charData;

    cancelAnimationFrame(rafRef.current);

    const tick = (ms: number) => {
      rafRef.current = requestAnimationFrame(tick);
      const t = ms / 1000;

      // Slow rotation
      charData.group.rotation.y = t * 0.38;

      // Breathing
      const breath = 1 + Math.sin(t * 1.4) * 0.018;
      charData.torso.scale.set(breath, 1 + Math.sin(t * 1.4) * 0.012, breath);

      // Glow pulse
      if (charData.glowLight) {
        charData.glowLight.intensity = (skin.visual.style === "void" ? 1.8 : 1.0) +
          Math.sin(t * 2.2) * 0.35;
      }

      // Orbit particles
      for (const p of charData.particles) {
        const ph = p.userData.phase + t * 1.4;
        const r = p.userData.orbitR as number;
        const y = p.userData.orbitY as number;
        p.position.set(Math.cos(ph) * r, y, Math.sin(ph) * r);
        (p.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(t * 3 + ph) * 0.5;
      }

      renderer.render(scene, camera);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [skin]);

  if (webGLFailed) {
    return (
      <div
        className={className}
        style={{
          width: "100%", height: `${height}px`, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: `radial-gradient(ellipse at 50% 40%, ${skin.color}33 0%, #080808 70%)`,
          flexDirection: "column", gap: 8,
        }}
      >
        <div
          style={{
            width: 80, height: 140,
            background: `linear-gradient(180deg, ${skin.color} 0%, ${skin.accent} 100%)`,
            borderRadius: 4, opacity: 0.85,
          }}
        />
        <div style={{ color: "rgba(200,180,96,0.5)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em" }}>
          {skin.name.toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: `${height}px` }}
    />
  );
}
