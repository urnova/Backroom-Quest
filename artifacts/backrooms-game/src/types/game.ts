export type Difficulty = "easy" | "normal" | "hard" | "nightmare";
export type GameStatus = "waiting" | "playing" | "finished";
export type MobState = "idle" | "patrol" | "chase" | "attack";

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
  emoteExpiry?: number;
  sanity: number;
  flashlightOn: boolean;
  skin: string;
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
  state: MobState;
}

export interface GameState {
  roomCode: string;
  currentLevel: number;
  players: Player[];
  mobs: Mob[];
  status: GameStatus;
  tick: number;
  difficulty?: Difficulty;
}

export interface Room {
  id: string;
  code: string;
  hostName: string;
  players: Player[];
  maxPlayers: number;
  status: GameStatus;
  currentLevel: number;
  difficulty: Difficulty;
  createdAt: string;
}

export interface LevelConfig {
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
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}
