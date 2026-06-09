import { randomUUID } from "crypto";
import { logger } from "./logger";

export type Difficulty = "easy" | "normal" | "hard" | "nightmare";
export type GameStatus = "waiting" | "playing" | "finished";

export interface Vec2 { x: number; y: number; }

export interface Player {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  angle: number;
  isAlive: boolean;
  isHost: boolean;
  emote: string | null;
  emoteExpiry: number;
  sanity: number;
  flashlightOn: boolean;
  skin: string;
  lastActivity: number;
}

export interface Mob {
  id: string;
  type: string;
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  speed: number;
  damage: number;
  detectionRange: number;
  attackRange: number;
  targetPlayerId: string | null;
  lastAttack: number;
  state: "idle" | "patrol" | "chase" | "attack";
  patrolAngle: number;
}

export interface Room {
  id: string;
  code: string;
  hostName: string;
  players: Map<string, Player>;
  maxPlayers: number;
  status: GameStatus;
  currentLevel: number;
  difficulty: Difficulty;
  mobs: Map<string, Mob>;
  tick: number;
  createdAt: number;
  lastTick: number;
  mapSeed: number;
}

export interface SaveData {
  playerId: string;
  playerName: string;
  currentLevel: number;
  difficulty: Difficulty;
  savedAt: number;
}

const rooms = new Map<string, Room>();
const saves = new Map<string, SaveData>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateUniqueCode(): string {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }
  return code;
}

export const LEVEL_CONFIGS: Record<number, {
  name: string;
  description: string;
  theme: string;
  mobTypes: string[];
  width: number;
  height: number;
  ambientLight: number;
  fogDensity: number;
  wallColor: string;
  floorColor: string;
  ceilColor: string;
}> = {
  0: { name: "Level 0 — Les Pièces Jaunes", description: "Interminables couloirs jaunis aux lumières fluorescentes bourdonnantes", theme: "yellow_rooms", mobTypes: ["smiler", "crawler"], width: 40, height: 40, ambientLight: 0.4, fogDensity: 0.05, wallColor: "#c8b560", floorColor: "#8c7a3a", ceilColor: "#b8a550" },
  1: { name: "Level 1 — Le Parking Souterrain", description: "Un parking à plusieurs niveaux, plongé dans une obscurité écrasante", theme: "parking", mobTypes: ["hound", "crawler"], width: 50, height: 50, ambientLight: 0.15, fogDensity: 0.08, wallColor: "#555555", floorColor: "#333333", ceilColor: "#444444" },
  2: { name: "Level 2 — La Salle des Tuyaux", description: "Un labyrinthe de tuyaux rouillés et de vapeur suffocante", theme: "pipes", mobTypes: ["hound", "smiler", "pipe_crawler"], width: 35, height: 35, ambientLight: 0.25, fogDensity: 0.07, wallColor: "#7a4f2f", floorColor: "#3d2a1a", ceilColor: "#5a3825" },
  3: { name: "Level 3 — Les Stations Électriques", description: "Des salles bourdonnantes de machinerie défaillante et d'arcs électriques", theme: "electrical", mobTypes: ["hound", "sparker"], width: 45, height: 45, ambientLight: 0.2, fogDensity: 0.06, wallColor: "#2a2a3a", floorColor: "#1a1a2a", ceilColor: "#252535" },
  4: { name: "Level 4 — Les Bureaux Abandonnés", description: "D'interminables rangées de cubicules abandonnés, une agonie bureaucratique", theme: "office", mobTypes: ["partygoer", "smiler"], width: 55, height: 55, ambientLight: 0.35, fogDensity: 0.04, wallColor: "#d4c9b0", floorColor: "#8a7f6a", ceilColor: "#c4b9a0" },
  5: { name: "Level 5 — L'Hôtel", description: "Un hôtel de luxe en ruine, ses couloirs s'étirent à l'infini", theme: "hotel", mobTypes: ["partygoer", "skin_stealer"], width: 60, height: 60, ambientLight: 0.3, fogDensity: 0.04, wallColor: "#8b6a5a", floorColor: "#5a3a2a", ceilColor: "#7a5a4a" },
  6: { name: "Level 6 — La Nuit Perpétuelle", description: "Obscurité totale. Seule ta lampe torche te sépare du néant", theme: "darkness", mobTypes: ["skin_stealer", "night_stalker"], width: 40, height: 40, ambientLight: 0.0, fogDensity: 0.15, wallColor: "#111111", floorColor: "#080808", ceilColor: "#0d0d0d" },
  7: { name: "Level 7 — La Thalassophobie", description: "Des eaux noires insondables, le plancher cède parfois sous tes pieds", theme: "water", mobTypes: ["depth_dweller", "night_stalker"], width: 45, height: 45, ambientLight: 0.15, fogDensity: 0.1, wallColor: "#1a3a4a", floorColor: "#0a1a2a", ceilColor: "#153040" },
  8: { name: "Level 8 — Les Grottes", description: "Un réseau de cavernes naturelles peuplé de créatures aveugles", theme: "caves", mobTypes: ["cave_dweller", "depth_dweller"], width: 50, height: 50, ambientLight: 0.1, fogDensity: 0.12, wallColor: "#3a2a1a", floorColor: "#1a1008", ceilColor: "#2a1a0a" },
  9: { name: "Level 9 — Les Faubourgs", description: "Une banlieue résidentielle sans fin, désertée et troublante", theme: "suburbs", mobTypes: ["duller", "partygoer"], width: 60, height: 60, ambientLight: 0.5, fogDensity: 0.03, wallColor: "#e8e0d0", floorColor: "#606060", ceilColor: "#a8c8e8" },
  10: { name: "Level 10 — Le Champ de Blé", description: "Un champ infini au blé doré, le ciel bascule entre jour et nuit", theme: "wheat_field", mobTypes: ["duller", "smiler"], width: 70, height: 70, ambientLight: 0.6, fogDensity: 0.02, wallColor: "#d4a820", floorColor: "#8a6a10", ceilColor: "#a8d0f0" },
  11: { name: "Level 11 — Les Chambres Rouges", description: "Des murs suintants de rouge, le danger est maximal", theme: "red_rooms", mobTypes: ["skin_stealer", "blood_hound", "duller"], width: 40, height: 40, ambientLight: 0.2, fogDensity: 0.08, wallColor: "#8a1a1a", floorColor: "#4a0a0a", ceilColor: "#6a1010" },
  12: { name: "Level 12 — Le Centre Commercial", description: "Un mall abandonné dont les néons clignotent sur des vitrines vides", theme: "mall", mobTypes: ["partygoer", "blood_hound"], width: 65, height: 65, ambientLight: 0.35, fogDensity: 0.04, wallColor: "#c0b8b0", floorColor: "#808880", ceilColor: "#b0a8a0" },
  13: { name: "Level 13 — La Salle des Chaudières", description: "Une chaleur insoutenable, vapeur et tuyaux brûlants à perte de vue", theme: "boiler", mobTypes: ["sparker", "blood_hound", "pipe_crawler"], width: 35, height: 35, ambientLight: 0.25, fogDensity: 0.09, wallColor: "#5a3010", floorColor: "#2a1a08", ceilColor: "#452808" },
  14: { name: "Level 14 — Les Archives Infinies", description: "Une bibliothèque aux rayonnages sans fin, le silence est assourdissant", theme: "archives", mobTypes: ["night_stalker", "skin_stealer"], width: 60, height: 60, ambientLight: 0.3, fogDensity: 0.05, wallColor: "#9a8060", floorColor: "#5a4030", ceilColor: "#8a7050" },
  15: { name: "Level 15 — Le Labyrinthe de Miroirs", description: "Des reflets à l'infini, impossible de distinguer le vrai du faux", theme: "mirrors", mobTypes: ["faceling", "smiler"], width: 45, height: 45, ambientLight: 0.45, fogDensity: 0.03, wallColor: "#c8d8e8", floorColor: "#788898", ceilColor: "#b8c8d8" },
  16: { name: "Level 16 — Les Salles Gelées", description: "Un froid mortel, les murs sont recouverts de givre et de glace", theme: "frozen", mobTypes: ["faceling", "cave_dweller"], width: 50, height: 50, ambientLight: 0.4, fogDensity: 0.06, wallColor: "#c0e0f0", floorColor: "#7090a0", ceilColor: "#b0d0e8" },
  17: { name: "Level 17 — Le Théâtre en Ruine", description: "Un vieux théâtre délabré, des silhouettes se meuvent dans les coulisses", theme: "theater", mobTypes: ["faceling", "night_stalker"], width: 55, height: 55, ambientLight: 0.2, fogDensity: 0.07, wallColor: "#4a3020", floorColor: "#2a1810", ceilColor: "#3a2018" },
  18: { name: "Level 18 — La Salle des Serveurs", description: "Des serveurs bourdonnants à perte de vue, la réalité se corrompt", theme: "server_room", mobTypes: ["sparker", "bacteria"], width: 45, height: 45, ambientLight: 0.25, fogDensity: 0.06, wallColor: "#1a2a3a", floorColor: "#0a1a2a", ceilColor: "#152030" },
  19: { name: "Level 19 — Le Vide", description: "La dernière épreuve. Presque rien n'existe ici, seulement la terreur", theme: "void", mobTypes: ["bacteria", "night_stalker", "skin_stealer", "faceling"], width: 40, height: 40, ambientLight: 0.05, fogDensity: 0.2, wallColor: "#050505", floorColor: "#020202", ceilColor: "#030303" },
};

export const MOB_DEFINITIONS: Record<string, {
  displayName: string;
  speed: number;
  hp: number;
  damage: number;
  detectionRange: number;
  attackRange: number;
  color: string;
  description: string;
}> = {
  smiler: { displayName: "Smiler", speed: 0.03, hp: 30, damage: 8, detectionRange: 8, attackRange: 1.2, color: "#ffff00", description: "Des sourires dans l'obscurité..." },
  crawler: { displayName: "Crawler", speed: 0.05, hp: 20, damage: 12, detectionRange: 5, attackRange: 1.0, color: "#c85020", description: "Il rampe sur les murs" },
  hound: { displayName: "Hound", speed: 0.08, hp: 50, damage: 15, detectionRange: 12, attackRange: 1.5, color: "#303030", description: "Un chasseur sonique" },
  partygoer: { displayName: "Partygoer", speed: 0.04, hp: 80, damage: 20, detectionRange: 7, attackRange: 1.5, color: "#ff6040", description: "Une joie corrompue" },
  skin_stealer: { displayName: "Skin Stealer", speed: 0.035, hp: 100, damage: 25, detectionRange: 10, attackRange: 2.0, color: "#a0a0a0", description: "Il porte une peau qui n'est pas la sienne" },
  night_stalker: { displayName: "Night Stalker", speed: 0.07, hp: 60, damage: 18, detectionRange: 14, attackRange: 1.3, color: "#200030", description: "Il chasse dans l'obscurité totale" },
  depth_dweller: { displayName: "Depth Dweller", speed: 0.025, hp: 120, damage: 30, detectionRange: 9, attackRange: 2.5, color: "#003060", description: "Venu des profondeurs aquatiques" },
  cave_dweller: { displayName: "Cave Dweller", speed: 0.04, hp: 70, damage: 20, detectionRange: 6, attackRange: 1.8, color: "#403020", description: "Aveugle mais extrêmement sensible au son" },
  duller: { displayName: "Duller", speed: 0.02, hp: 150, damage: 35, detectionRange: 8, attackRange: 1.5, color: "#808080", description: "Lent mais presque indestructible" },
  pipe_crawler: { displayName: "Pipe Crawler", speed: 0.06, hp: 40, damage: 14, detectionRange: 7, attackRange: 1.2, color: "#804020", description: "Sort des tuyaux" },
  sparker: { displayName: "Sparker", speed: 0.045, hp: 55, damage: 22, detectionRange: 9, attackRange: 3.0, color: "#60c0ff", description: "Attaques électriques à distance" },
  blood_hound: { displayName: "Blood Hound", speed: 0.09, hp: 65, damage: 28, detectionRange: 15, attackRange: 1.5, color: "#800000", description: "Attirée par le sang" },
  faceling: { displayName: "Faceling", speed: 0.035, hp: 90, damage: 22, detectionRange: 8, attackRange: 1.5, color: "#d0c8c0", description: "Un visage lisse et vide" },
  bacteria: { displayName: "The Bacteria", speed: 0.06, hp: 200, damage: 40, detectionRange: 20, attackRange: 2.0, color: "#20ff20", description: "Un organisme colonial qui envahit tout" },
};

export function createRoom(hostName: string, maxPlayers: number, difficulty: Difficulty, hostSkin?: string): Room {
  const id = randomUUID();
  const code = generateUniqueCode();
  const room: Room = {
    id,
    code,
    hostName,
    players: new Map(),
    maxPlayers: Math.min(Math.max(maxPlayers, 1), 8),
    status: "waiting",
    currentLevel: 0,
    difficulty,
    mobs: new Map(),
    tick: 0,
    createdAt: Date.now(),
    lastTick: Date.now(),
    mapSeed: Math.floor(Math.random() * 100000),
  };

  const hostPlayer = createPlayer(randomUUID(), hostName, true, hostSkin);
  room.players.set(hostPlayer.id, hostPlayer);
  rooms.set(code, room);
  logger.info({ code, hostName, difficulty }, "Room created");
  return room;
}

export function createPlayer(id: string, name: string, isHost: boolean, skin?: string): Player {
  return {
    id,
    name,
    level: 0,
    hp: 100,
    maxHp: 100,
    x: 5 + Math.random() * 3,
    y: 5 + Math.random() * 3,
    angle: 0,
    isAlive: true,
    isHost,
    emote: null,
    emoteExpiry: 0,
    sanity: 100,
    flashlightOn: true,
    skin: skin || "survivor",
    lastActivity: Date.now(),
  };
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function getRoomById(id: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.id === id) return room;
  }
  return undefined;
}

export function joinRoom(code: string, playerName: string): { room: Room; player: Player } | null {
  const room = getRoom(code);
  if (!room) return null;
  if (room.status !== "waiting") return null;
  if (room.players.size >= room.maxPlayers) return null;

  const player = createPlayer(randomUUID(), playerName, false);
  room.players.set(player.id, player);
  logger.info({ code, playerName }, "Player joined room");
  return { room, player };
}

export function leaveRoom(code: string, playerId: string): void {
  const room = getRoom(code);
  if (!room) return;
  room.players.delete(playerId);
  if (room.players.size === 0) {
    rooms.delete(code);
    logger.info({ code }, "Room deleted (empty)");
  }
}

export function startGame(code: string): boolean {
  const room = getRoom(code);
  if (!room) return false;
  room.status = "playing";
  spawnMobsForLevel(room);
  logger.info({ code, level: room.currentLevel }, "Game started");
  return true;
}

function spawnMobsForLevel(room: Room): void {
  room.mobs.clear();
  const config = LEVEL_CONFIGS[room.currentLevel];
  if (!config) return;

  const baseMobCount = 3 + room.currentLevel * 2;
  const diffMult = room.difficulty === "easy" ? 0.5 : room.difficulty === "normal" ? 1 : room.difficulty === "hard" ? 1.5 : 2.5;
  const count = Math.floor(baseMobCount * diffMult);

  for (let i = 0; i < count; i++) {
    const mobType = config.mobTypes[Math.floor(Math.random() * config.mobTypes.length)];
    const def = MOB_DEFINITIONS[mobType];
    if (!def) continue;

    const mob: Mob = {
      id: randomUUID(),
      type: mobType,
      x: 8 + Math.random() * (config.width - 16),
      y: 8 + Math.random() * (config.height - 16),
      angle: Math.random() * Math.PI * 2,
      hp: def.hp,
      maxHp: def.hp,
      isAlive: true,
      speed: def.speed,
      damage: def.damage,
      detectionRange: def.detectionRange,
      attackRange: def.attackRange,
      targetPlayerId: null,
      lastAttack: 0,
      state: "patrol",
      patrolAngle: Math.random() * Math.PI * 2,
    };
    room.mobs.set(mob.id, mob);
  }
}

export function tickRoom(room: Room): void {
  if (room.status !== "playing") return;
  const now = Date.now();
  room.tick++;
  room.lastTick = now;

  const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);

  for (const mob of room.mobs.values()) {
    if (!mob.isAlive) continue;
    tickMob(mob, alivePlayers, room, now);
  }

  for (const player of room.players.values()) {
    if (!player.isAlive) continue;
    if (player.sanity > 0) {
      const nearbyMobs = Array.from(room.mobs.values()).filter(m =>
        m.isAlive && dist(m.x, m.y, player.x, player.y) < 5
      );
      if (nearbyMobs.length > 0) {
        player.sanity = Math.max(0, player.sanity - 0.1 * nearbyMobs.length);
      }
    }
    if (player.emote && now > player.emoteExpiry) {
      player.emote = null;
    }
  }

  if (alivePlayers.length === 0 && room.players.size > 0) {
    room.status = "finished";
  }
}

function tickMob(mob: Mob, players: Player[], room: Room, now: number): void {
  let closestPlayer: Player | null = null;
  let closestDist = Infinity;

  for (const player of players) {
    const d = dist(mob.x, mob.y, player.x, player.y);
    if (d < mob.detectionRange && d < closestDist) {
      closestDist = d;
      closestPlayer = player;
    }
  }

  if (closestPlayer) {
    mob.targetPlayerId = closestPlayer.id;
    mob.state = closestDist < mob.attackRange ? "attack" : "chase";
  } else {
    mob.targetPlayerId = null;
    mob.state = "patrol";
  }

  if (mob.state === "patrol") {
    if (Math.random() < 0.01) {
      mob.patrolAngle += (Math.random() - 0.5) * Math.PI;
    }
    mob.x += Math.cos(mob.patrolAngle) * mob.speed;
    mob.y += Math.sin(mob.patrolAngle) * mob.speed;
    const config = LEVEL_CONFIGS[room.currentLevel];
    if (config) {
      mob.x = Math.max(1, Math.min(config.width - 1, mob.x));
      mob.y = Math.max(1, Math.min(config.height - 1, mob.y));
    }
  } else if (mob.state === "chase" && closestPlayer) {
    const dx = closestPlayer.x - mob.x;
    const dy = closestPlayer.y - mob.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 0) {
      mob.x += (dx / d) * mob.speed;
      mob.y += (dy / d) * mob.speed;
      mob.angle = Math.atan2(dy, dx);
    }
  } else if (mob.state === "attack" && closestPlayer) {
    if (now - mob.lastAttack > 1000) {
      closestPlayer.hp -= mob.damage;
      mob.lastAttack = now;
      if (closestPlayer.hp <= 0) {
        closestPlayer.hp = 0;
        closestPlayer.isAlive = false;
      }
    }
  }
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function updatePlayerPosition(code: string, playerId: string, x: number, y: number, angle: number): boolean {
  const room = getRoom(code);
  if (!room) return false;
  const player = room.players.get(playerId);
  if (!player || !player.isAlive) return false;
  player.x = x;
  player.y = y;
  player.angle = angle;
  player.lastActivity = Date.now();
  return true;
}

export function damagePlayer(code: string, playerId: string, amount: number): Player | null {
  const room = getRoom(code);
  if (!room) return null;
  const player = room.players.get(playerId);
  if (!player || !player.isAlive) return null;
  player.hp = Math.max(0, player.hp - amount);
  if (player.hp <= 0) {
    player.isAlive = false;
  }
  return player;
}

export function damageMob(code: string, mobId: string, amount: number): Mob | null {
  const room = getRoom(code);
  if (!room) return null;
  const mob = room.mobs.get(mobId);
  if (!mob || !mob.isAlive) return null;
  mob.hp = Math.max(0, mob.hp - amount);
  if (mob.hp <= 0) {
    mob.isAlive = false;
  }
  return mob;
}

export function setEmote(code: string, playerId: string, emote: string): void {
  const room = getRoom(code);
  if (!room) return;
  const player = room.players.get(playerId);
  if (!player) return;
  player.emote = emote;
  player.emoteExpiry = Date.now() + 3000;
}

export function advanceLevel(code: string): boolean {
  const room = getRoom(code);
  if (!room) return false;
  if (room.currentLevel >= 19) {
    room.status = "finished";
    return false;
  }
  room.currentLevel++;
  for (const player of room.players.values()) {
    if (player.isAlive) {
      player.level = room.currentLevel;
      if (room.difficulty !== "nightmare") {
        const healAmt = room.difficulty === "easy" ? 50 : room.difficulty === "normal" ? 30 : 20;
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
      }
    }
  }
  spawnMobsForLevel(room);
  return true;
}

export function saveProgress(playerId: string, playerName: string, level: number, difficulty: Difficulty): void {
  if (difficulty === "nightmare") return;
  saves.set(playerId, { playerId, playerName, currentLevel: level, difficulty, savedAt: Date.now() });
}

export function loadSave(playerId: string): SaveData | null {
  return saves.get(playerId) ?? null;
}

export function getRoomState(room: Room) {
  return {
    roomCode: room.code,
    currentLevel: room.currentLevel,
    difficulty: room.difficulty,
    players: Array.from(room.players.values()),
    mobs: Array.from(room.mobs.values()),
    status: room.status,
    tick: room.tick,
    levelConfig: LEVEL_CONFIGS[room.currentLevel],
  };
}

export function roomToJSON(room: Room) {
  return {
    id: room.id,
    code: room.code,
    hostName: room.hostName,
    players: Array.from(room.players.values()),
    maxPlayers: room.maxPlayers,
    status: room.status,
    currentLevel: room.currentLevel,
    difficulty: room.difficulty,
    createdAt: new Date(room.createdAt).toISOString(),
  };
}

setInterval(() => {
  for (const room of rooms.values()) {
    if (room.status === "playing") {
      tickRoom(room);
    }
    const age = Date.now() - room.createdAt;
    if (age > 1000 * 60 * 60 * 6) {
      rooms.delete(room.code);
    }
  }
}, 100);
