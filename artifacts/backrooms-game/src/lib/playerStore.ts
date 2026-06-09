export interface SkinDef {
  id: string;
  name: string;
  color: string;
  accent: string;
  price: number;
  desc: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const SKINS: SkinDef[] = [
  { id: "survivor", name: "Survivant", color: "#cc4400", accent: "#ffaa44", price: 0, desc: "Le classique. Rouge comme le danger.", rarity: "common" },
  { id: "explorer", name: "Explorateur", color: "#1155cc", accent: "#44aaff", price: 0, desc: "Curieux et courageux. Bleu nuit.", rarity: "common" },
  { id: "scientist", name: "Scientifique", color: "#228844", accent: "#55ff88", price: 50, desc: "Cherche des réponses. Vert laboratoire.", rarity: "common" },
  { id: "soldier", name: "Soldat", color: "#667755", accent: "#aabb88", price: 100, desc: "Entraîné pour survivre. Tenue kaki.", rarity: "common" },
  { id: "medic", name: "Médecin", color: "#99bbcc", accent: "#ffffff", price: 150, desc: "Garde les autres en vie. Blanc clinique.", rarity: "rare" },
  { id: "hazmat", name: "Hazmat", color: "#cc9900", accent: "#ffee00", price: 200, desc: "Protégé contre tout. Jaune vif.", rarity: "rare" },
  { id: "agent", name: "Agent", color: "#111111", accent: "#666666", price: 250, desc: "Mystérieux et discret. Noir absolu.", rarity: "rare" },
  { id: "ghost", name: "Fantôme", color: "#7788aa", accent: "#ccddff", price: 300, desc: "Entre deux mondes. Translucide.", rarity: "epic" },
  { id: "cultist", name: "Cultiste", color: "#5a0010", accent: "#cc0030", price: 400, desc: "Il connaît les secrets du Liminal.", rarity: "epic" },
  { id: "void_walker", name: "Marcheur du Vide", color: "#1a0040", accent: "#9900ff", price: 600, desc: "Venu de nulle part. Maître du néant.", rarity: "legendary" },
];

export const RARITY_COLORS: Record<string, string> = {
  common: "#888888",
  rare: "#4488cc",
  epic: "#aa44cc",
  legendary: "#ffaa00",
};

export const RARITY_LABELS: Record<string, string> = {
  common: "COMMUN",
  rare: "RARE",
  epic: "ÉPIQUE",
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
