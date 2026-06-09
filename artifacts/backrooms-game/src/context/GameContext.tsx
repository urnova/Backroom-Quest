import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, Player, Mob, Room, LevelConfig } from "../types/game";
import { getSavedPseudo, setSavedPseudo, getSelectedSkin } from "../lib/playerStore";

interface GameContextType {
  socket: Socket | null;
  playerId: string | null;
  playerName: string;
  roomCode: string | null;
  difficulty: string | null;
  isConnected: boolean;
  gameState: GameState | null;
  levelConfig: LevelConfig | null;
  hasWon: boolean;
  setPlayerName: (name: string) => void;
  setRoomCode: (code: string | null) => void;
  joinRoom: (code: string, playerId: string) => void;
  joinAndStartSolo: (code: string, playerId: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerNameState] = useState<string>(() => getSavedPseudo());
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [hasWon, setHasWon] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const newSocket = io({ path: "/api/socket.io", autoConnect: true });
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("room:updated", (_roomData: Room) => {
    });

    newSocket.on("game:started", (data: { state: GameState; levelConfig: LevelConfig }) => {
      setGameState(data.state);
      setLevelConfig(data.levelConfig);
      setHasWon(false);
      if (data.state.difficulty) setDifficulty(data.state.difficulty);
    });

    newSocket.on("game:tick", (data: { players: Player[]; mobs: Mob[]; tick: number }) => {
      setGameState(prev => prev ? { ...prev, players: data.players, mobs: data.mobs, tick: data.tick } : null);
    });

    newSocket.on("level:advanced", (data: { newLevel: number; levelConfig: LevelConfig; state: GameState }) => {
      setGameState(data.state);
      setLevelConfig(data.levelConfig);
    });

    newSocket.on("game:won", () => {
      setHasWon(true);
      setGameState(prev => prev ? { ...prev, status: "finished" } : null);
    });

    newSocket.on("mob:damaged", (data: { mobId: string; hp: number; isAlive: boolean }) => {
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          mobs: prev.mobs.map(m =>
            m.id === data.mobId ? { ...m, hp: data.hp, isAlive: data.isAlive } : m
          ),
        };
      });
    });

    newSocket.on("mob:died", (data: { mobId: string }) => {
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          mobs: prev.mobs.map(m =>
            m.id === data.mobId ? { ...m, isAlive: false } : m
          ),
        };
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const setPlayerName = (name: string) => {
    setPlayerNameState(name);
    setSavedPseudo(name);
  };

  const joinRoom = (code: string, id: string) => {
    setRoomCode(code);
    setPlayerId(id);
    if (socketRef.current) {
      socketRef.current.emit("room:join", { code, playerId: id, skin: getSelectedSkin() });
    }
  };

  const joinAndStartSolo = (code: string, id: string) => {
    setRoomCode(code);
    setPlayerId(id);
    if (socketRef.current) {
      socketRef.current.emit("room:join", { code, playerId: id, skin: getSelectedSkin() }, (ack: { ok?: boolean; error?: string }) => {
        if (ack?.ok) {
          socketRef.current?.emit("game:start", { code, playerId: id });
        }
      });
    }
  };

  const leaveRoom = () => {
    setRoomCode(null);
    setGameState(null);
    setLevelConfig(null);
    setHasWon(false);
    setDifficulty(null);
  };

  const startGame = () => {
    if (socketRef.current && roomCode && playerId) {
      socketRef.current.emit("game:start", { code: roomCode, playerId });
    }
  };

  return (
    <GameContext.Provider
      value={{
        socket,
        playerId,
        playerName,
        roomCode,
        difficulty,
        isConnected,
        gameState,
        levelConfig,
        hasWon,
        setPlayerName,
        setRoomCode,
        joinRoom,
        joinAndStartSolo,
        leaveRoom,
        startGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameStore must be used within a GameProvider");
  }
  return context;
}
