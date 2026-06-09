import * as THREE from "three";

export type ItemType = "health" | "battery" | "speed";

export interface WorldItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  pickedUp: boolean;
  mesh: THREE.Group;
  animTime: number;
}

const ITEM_CONFIG: Record<ItemType, { color: number; emissive: number; label: string; desc: string }> = {
  health: { color: 0xff2222, emissive: 0xff0000, label: "TROUSSE DE SOINS", desc: "+40 PV" },
  battery: { color: 0xffdd00, emissive: 0xffaa00, label: "BATTERIE", desc: "Lampe +100%" },
  speed: { color: 0x2288ff, emissive: 0x0055ff, label: "BOOST VITESSE", desc: "Sprint ×1.5 (30s)" },
};

function createItemMesh(type: ItemType): THREE.Group {
  const g = new THREE.Group();
  const cfg = ITEM_CONFIG[type];
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.emissive, emissiveIntensity: 0.8, roughness: 0.3 });

  if (type === "health") {
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), mat);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.08), mat);
    bar1.position.y = 0.3;
    bar2.position.y = 0.3;
    g.add(bar1); g.add(bar2);
  } else if (type === "battery") {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.08), mat);
    body.position.y = 0.3;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.06), mat);
    cap.position.y = 0.44;
    g.add(body); g.add(cap);
  } else if (type === "speed") {
    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), mat);
    diamond.position.y = 0.3;
    g.add(diamond);
  }

  const light = new THREE.PointLight(cfg.emissive, 1.2, 3.5);
  light.position.y = 0.3;
  g.add(light);

  const ringMat = new THREE.MeshBasicMaterial({ color: cfg.emissive, transparent: true, opacity: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 6, 24), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);

  return g;
}

export function spawnItems(map: number[][], width: number, height: number, level: number): WorldItem[] {
  const items: WorldItem[] = [];
  const itemCount = 3 + Math.floor(level / 3);
  const types: ItemType[] = ["health", "battery", "speed"];
  let attempts = 0;
  const spawned = new Set<string>();

  while (items.length < itemCount && attempts < 2000) {
    attempts++;
    const x = 3 + Math.floor(Math.random() * (width - 6));
    const y = 3 + Math.floor(Math.random() * (height - 6));
    if (map[y]?.[x] !== 0) continue;
    const key = `${x},${y}`;
    if (spawned.has(key)) continue;
    spawned.add(key);

    const type = types[Math.floor(Math.random() * types.length)];
    const mesh = createItemMesh(type);
    mesh.position.set(x, 0, y);

    items.push({ id: `item_${items.length}_${Date.now()}`, type, x, y, pickedUp: false, mesh, animTime: 0 });
  }
  return items;
}

export function updateItems(items: WorldItem[], dt: number, scene: THREE.Scene) {
  for (const item of items) {
    if (item.pickedUp) {
      if (item.mesh.parent) scene.remove(item.mesh);
      continue;
    }
    if (!item.mesh.parent) scene.add(item.mesh);
    item.animTime += dt;
    item.mesh.position.y = Math.sin(item.animTime * 2) * 0.08;
    item.mesh.rotation.y = item.animTime * 1.2;
  }
}

export function checkItemPickup(items: WorldItem[], px: number, py: number): WorldItem | null {
  for (const item of items) {
    if (item.pickedUp) continue;
    const dx = item.x - px;
    const dy = item.y - py;
    if (Math.sqrt(dx * dx + dy * dy) < 0.9) {
      return item;
    }
  }
  return null;
}

export function getItemLabel(type: ItemType): { label: string; desc: string } {
  return ITEM_CONFIG[type];
}

export function clearItems(items: WorldItem[], scene: THREE.Scene) {
  for (const item of items) {
    if (item.mesh.parent) scene.remove(item.mesh);
  }
}
