import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGameStore } from "../context/GameContext";
import { BackroomsEngine } from "../game/BackroomsEngine";
import { InputHandler } from "../game/InputHandler";
import { AudioManager } from "../game/AudioManager";
import HUD from "../components/HUD";
import MiniMap from "../components/MiniMap";
import EmoteWheel from "../components/EmoteWheel";
import ChatLog from "../components/ChatLog";
import LevelBanner from "../components/LevelBanner";
import CRTOverlay from "../components/CRTOverlay";

export default function Game() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { socket, playerId, gameState, levelConfig } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const engineRef = useRef<BackroomsEngine | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  
  const [showEmoteWheel, setShowEmoteWheel] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [levelName, setLevelName] = useState("");
  
  // Track previous level to detect changes
  const prevLevel = useRef(-1);

  useEffect(() => {
    if (!socket || !playerId || !gameState || !levelConfig) return;
    if (!canvasRef.current) return;

    // Detect level change
    if (gameState.currentLevel !== prevLevel.current) {
      prevLevel.current = gameState.currentLevel;
      setLevelName(levelConfig.name);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 4000);
      
      // Rebuild engine map if level changes
      if (engineRef.current) {
        engineRef.current.loadLevel(levelConfig, gameState.roomCode); // Using roomCode as mapSeed proxy or actual seed if available
      }
    }

    if (gameState.status === "finished") {
      if (gameState.currentLevel >= 19) {
        setLocation("/victory");
      } else {
        setLocation("/gameover");
      }
      return;
    }
  }, [gameState?.currentLevel, gameState?.status, levelConfig, socket, playerId, setLocation]);

  useEffect(() => {
    if (!canvasRef.current || !socket || !playerId || !levelConfig || !gameState) return;
    
    if (!engineRef.current) {
      // Init Game Components
      const audio = new AudioManager();
      audio.init();
      audioRef.current = audio;
      
      const input = new InputHandler(canvasRef.current);
      inputRef.current = input;
      
      const engine = new BackroomsEngine(canvasRef.current, levelConfig, gameState.roomCode);
      engineRef.current = engine;
      
      // Input bindings
      input.onAttack = () => {
        engine.playAttackAnimation();
        // find mob in range
        const myPlayer = engine.getPlayerState();
        if (myPlayer) {
          socket.emit("player:attack", { 
            code, 
            playerId, 
            mobId: "dummy", // TODO: Raycast to find exact mob
            damage: 25 
          });
        }
      };
      
      input.onFlashlight = () => {
        engine.toggleFlashlight();
        socket.emit("player:flashlight", { code, playerId, on: engine.isFlashlightOn });
      };
      
      input.onEmoteDown = () => {
        input.exitPointerLock();
        setShowEmoteWheel(true);
      };
      
      input.onEmoteUp = () => {
        setShowEmoteWheel(false);
        input.requestPointerLock();
      };

      // Start loop
      let lastTime = performance.now();
      const loop = (time: number) => {
        requestAnimationFrame(loop);
        const dt = (time - lastTime) / 1000;
        lastTime = time;
        
        // Let React context handle state, engine just reads from a ref we pass it
        if (inputRef.current && engineRef.current) {
          engineRef.current.update(dt, inputRef.current);
          
          // Send position to server
          const pos = engineRef.current.getPlayerState();
          if (pos && time % 50 < 16) { // throttle
            socket.emit("player:move", {
              code,
              playerId,
              x: pos.x,
              y: pos.y,
              angle: pos.angle
            });
          }
        }
      };
      requestAnimationFrame(loop);
      
      // Attempt lock
      input.requestPointerLock();
    }

    // Sync remote state to engine
    if (engineRef.current && gameState) {
      engineRef.current.syncState(gameState, playerId);
      
      // Update audio based on sanity
      const me = gameState.players.find(p => p.id === playerId);
      if (me && audioRef.current) {
        audioRef.current.setDangerLevel(1 - (me.sanity / 100));
      }
    }
    
  }, [canvasRef, socket, playerId, code, gameState, levelConfig]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.stop();
      if (inputRef.current) inputRef.current.dispose();
      if (engineRef.current) engineRef.current.dispose();
    };
  }, []);

  const handleEmote = (emote: string) => {
    socket?.emit("player:emote", { code, playerId, emote });
    setShowEmoteWheel(false);
    if (inputRef.current) inputRef.current.requestPointerLock();
  };

  const handleChat = (msg: string) => {
    socket?.emit("chat:message", { code, playerId, message: msg });
  };

  if (!gameState || !levelConfig) return null;

  const me = gameState.players.find(p => p.id === playerId);
  if (!me) return null;

  return (
    <div className="absolute inset-0 bg-black overflow-hidden select-none">
      {/* 3D Canvas */}
      <canvas 
        ref={canvasRef} 
        className={`absolute inset-0 w-full h-full ${me.sanity < 30 ? 'low-sanity' : ''}`}
      />
      
      {/* Atmosphere overlays */}
      <CRTOverlay />
      
      {/* HUD Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <HUD 
          player={me} 
          levelName={levelConfig.name} 
          difficulty={gameState.difficulty ?? "normal"} 
        />
        
        {showEmoteWheel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-sm">
            <EmoteWheel onSelect={handleEmote} />
          </div>
        )}
        
        <ChatLog socket={socket} />
      </div>

      {showBanner && (
        <LevelBanner levelName={levelName} />
      )}
      
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" />
    </div>
  );
}
