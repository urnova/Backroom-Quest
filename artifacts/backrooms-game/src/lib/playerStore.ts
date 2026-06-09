export interface SkinVisual {
  bodyHex: string;
  accentHex: string;
  skinTone: string;
  style: "standard" | "armored" | "hazmat" | "robe" | "ghost" | "void";
  hatType: "none" | "helmet" | "hood" | "bandana" | "gas_mask" | "goggles_head";
  extras: Array<"backpack" | "armor_plates" | "lab_coat" | "tie" | "glow_aura" | "particles" | "cloak" | "tactical_vest">;
  glowHex?: string;
  opacity?: number;
}

export interface SkinDef {
  id: string;
  name: string;
  color: string;
  accent: string;
  price: number;
  desc: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  visual: SkinVisual;
}

export const SKINS: SkinDef[] = [
  {
    id: "survivor",
    name: "Survivant",
    color: "#c44020",
    accent: "#ff8844",
    price: 0,
    desc: "Le premier à s'être aventuré. Veste déchirée, regard déterminé.",
    rarity: "common",
    visual: {
      bodyHex: "#c44020", accentHex: "#ff8844", skinTone: "#d4956a",
      style: "standard", hatType: "bandana", extras: ["backpack"],
    },
  },
  {
    id: "explorer",
    name: "Explorateur",
    color: "#1144bb",
    accent: "#44aaff",
    price: 0,
    desc: "Équipé pour cartographier l'inconnu. Combinaison de terrain bleu nuit.",
    rarity: "common",
    visual: {
      bodyHex: "#1144bb", accentHex: "#44aaff", skinTone: "#c8a078",
      style: "standard", hatType: "goggles_head", extras: ["backpack"],
    },
  },
  {
    id: "scientist",
    name: "Scientifique",
    color: "#e8e8e8",
    accent: "#55ffaa",
    price: 50,
    desc: "Analyse chaque anomalie. Blouse blanche immaculée, carnet en main.",
    rarity: "common",
    visual: {
      bodyHex: "#e8e8e8", accentHex: "#55ffaa", skinTone: "#f0c090",
      style: "standard", hatType: "none", extras: ["lab_coat"],
    },
  },
  {
    id: "soldier",
    name: "Soldat",
    color: "#556644",
    accent: "#99bb66",
    price: 100,
    desc: "Tenu pour survivre à n'importe quoi. Gilet tactique, rations de combat.",
    rarity: "common",
    visual: {
      bodyHex: "#556644", accentHex: "#99bb66", skinTone: "#8a6040",
      style: "armored", hatType: "helmet", extras: ["tactical_vest"],
    },
  },
  {
    id: "medic",
    name: "Médecin",
    color: "#ddeeff",
    accent: "#ff4444",
    price: 150,
    desc: "Maintient les autres en vie. Combinaison médicale, croix rouge sur le bras.",
    rarity: "rare",
    visual: {
      bodyHex: "#ddeeff", accentHex: "#ff4444", skinTone: "#f5ddc0",
      style: "standard", hatType: "none", extras: ["lab_coat"],
    },
  },
  {
    id: "hazmat",
    name: "Hazmat",
    color: "#ddaa00",
    accent: "#ffee22",
    price: 200,
    desc: "Scellé hermétiquement contre tout danger. Combinaison jaune intégrale.",
    rarity: "rare",
    visual: {
      bodyHex: "#ddaa00", accentHex: "#ffee22", skinTone: "#ddaa00",
      style: "hazmat", hatType: "gas_mask", extras: [],
    },
  },
  {
    id: "agent",
    name: "Agent",
    color: "#0d0d0d",
    accent: "#555555",
    price: 250,
    desc: "Identité inconnue. Costume noir, cravate argentée. Mémoire effacée.",
    rarity: "rare",
    visual: {
      bodyHex: "#0d0d0d", accentHex: "#aaaaaa", skinTone: "#c0a080",
      style: "standard", hatType: "none", extras: ["tie"],
    },
  },
  {
    id: "ghost",
    name: "Fantôme",
    color: "#8899bb",
    accent: "#cce8ff",
    price: 300,
    desc: "Entre deux états. Son corps projette une lumière froide bleutée.",
    rarity: "epic",
    visual: {
      bodyHex: "#8899bb", accentHex: "#cce8ff", skinTone: "#aabbdd",
      style: "ghost", hatType: "none", extras: ["glow_aura"],
      glowHex: "#88aaff", opacity: 0.75,
    },
  },
  {
    id: "cultist",
    name: "Cultiste",
    color: "#420008",
    accent: "#cc0022",
    price: 400,
    desc: "Il a trouvé les rituels du Liminal. Robes sombres, symboles gravés.",
    rarity: "epic",
    visual: {
      bodyHex: "#420008", accentHex: "#cc0022", skinTone: "#6a3030",
      style: "robe", hatType: "hood", extras: ["cloak", "glow_aura"],
      glowHex: "#880022",
    },
  },
  {
    id: "void_walker",
    name: "Marcheur du Vide",
    color: "#080018",
    accent: "#9900ff",
    price: 600,
    desc: "N'appartient à aucun monde. Énergie du néant, particules pourpres.",
    rarity: "legendary",
    visual: {
      bodyHex: "#080018", accentHex: "#9900ff", skinTone: "#220044",
      style: "void", hatType: "hood", extras: ["cloak", "particles", "glow_aura"],
      glowHex: "#7700ee", opacity: 0.85,
    },
  },
];

export const RARITY_COLORS: Record<string, string> = {
  common:    "#888888",
  rare:      "#3388dd",
  epic:      "#aa33cc",
  legendary: "#ffaa00",
};

export const RARITY_LABELS: Record<string, string> = {
  common:    "COMMUN",
  rare:      "RARE",
  epic:      "ÉPIQUE",
  legendary: "LÉGENDAIRE",
};

export function getCoins(): number {
  return parseInt(localStorage.getItem("liminal_coins") || "0", 10);
}

export function addCoins(amount: number): number {
  const current = getCoins();
  const newAmount = current + amount;
  localStorage.setItem("liminal_coins", String(newAmount));
  return newAmount;
}

export function getUnlockedSkins(): string[] {
  const free = SKINS.filter(s => s.price === 0).map(s => s.id);
  try {
    const saved: string[] = JSON.parse(localStorage.getItem("liminal_unlocked_skins") || "[]");
    return [...new Set([...free, ...saved])];
  } catch {
    return free;
  }
}

export function unlockSkin(skinId: string): { success: boolean; reason?: string } {
  const skin = SKINS.find(s => s.id === skinId);
  if (!skin) return { success: false, reason: "Skin introuvable" };
  const unlocked = getUnlockedSkins();
  if (unlocked.includes(skinId)) return { success: false, reason: "Déjà débloqué" };
  const coins = getCoins();
  if (coins < skin.price) return { success: false, reason: "Pas assez de ◈" };
  const newUnlocked = [...unlocked, skinId];
  localStorage.setItem("liminal_unlocked_skins", JSON.stringify(newUnlocked));
  localStorage.setItem("liminal_coins", String(coins - skin.price));
  return { success: true };
}

export function getSelectedSkin(): string {
  const saved = localStorage.getItem("liminal_skin") || "survivor";
  const unlocked = getUnlockedSkins();
  return unlocked.includes(saved) ? saved : "survivor";
}

export function setSelectedSkin(id: string): void {
  localStorage.setItem("liminal_skin", id);
}

export function getSavedPseudo(): string {
  return localStorage.getItem("liminal_pseudo") || "";
}

export function setSavedPseudo(name: string): void {
  if (name.trim()) localStorage.setItem("liminal_pseudo", name.trim());
}

export function getMaxLevelReached(): number {
  return parseInt(localStorage.getItem("liminal_max_level") || "0", 10);
}

export function updateMaxLevel(level: number): void {
  const current = getMaxLevelReached();
  if (level > current) localStorage.setItem("liminal_max_level", String(level));
}

export function computeLevelCoins(levelNum: number, difficulty: string): number {
  const base = (levelNum + 1) * 10;
  const mult = difficulty === "easy" ? 0.5 : difficulty === "normal" ? 1 : difficulty === "hard" ? 1.5 : 2;
  return Math.floor(base * mult);
}
