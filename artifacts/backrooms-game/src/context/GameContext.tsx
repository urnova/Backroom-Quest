import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, Player, Mob, Room, LevelConfig } from "../types/game";

interface GameContextType {
  socket: Socket | null;
  playerId: string | null;
  playerName: string;
  roomCode: string | null;
  difficulty: string | null;
  isConnected: boolean;
  gameState: GameState | null;
  levelConfig: LevelConfig | null;
  setPlayerName: (name: string) => void;
  setRoomCode: (code: string | null) => void;
  joinRoom: (code: string, playerId: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);

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

    newSocket.on("room:updated", (roomData: Room) => {
      // Room state updates for lobby
    });

    newSocket.on("game:started", (data: { state: GameState, levelConfig: LevelConfig }) => {
      setGameState(data.state);
      setLevelConfig(data.levelConfig);
    });

    newSocket.on("game:tick", (data: { players: Player[], mobs: Mob[], tick: number }) => {
      setGameState(prev => prev ? { ...prev, players: data.players, mobs: data.mobs, tick: data.tick } : null);
    });

    newSocket.on("level:advanced", (data: { newLevel: number, levelConfig: LevelConfig, state: GameState }) => {
      setGameState(data.state);
      setLevelConfig(data.levelConfig);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = (code: string, id: string) => {
    setRoomCode(code);
    setPlayerId(id);
    if (socketRef.current) {
      socketRef.current.emit("room:join", { code, playerId: id });
    }
  };

  const leaveRoom = () => {
    setRoomCode(null);
    setGameState(null);
    setLevelConfig(null);
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
        setPlayerName,
        setRoomCode,
        joinRoom,
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
