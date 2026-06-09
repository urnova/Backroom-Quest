import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useGameStore } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";
import { BackroomsEngine } from "../game/BackroomsEngine";
import { InputHandler } from "../game/InputHandler";
import { AudioManager } from "../game/AudioManager";
import HUD from "../components/HUD";
import EmoteWheel from "../components/EmoteWheel";
import ChatLog from "../components/ChatLog";
import LevelBanner from "../components/LevelBanner";
import CRTOverlay from "../components/CRTOverlay";
import Tutorial, { shouldShowTutorial } from "../components/Tutorial";

export default function Game() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { socket, playerId, gameState, levelConfig, hasWon } = useGameStore();
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const engineRef = useRef<BackroomsEngine | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  const exitTriggeredRef = useRef(false);
  const prevLevelRef = useRef(-1);
  const prevHpRef = useRef(100);

  const [showEmoteWheel, setShowEmoteWheel] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [levelName, setLevelName] = useState("");
  const [showExitHint, setShowExitHint] = useState(false);
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!gameState || !levelConfig) return;

    if (gameState.currentLevel !== prevLevelRef.current) {
      prevLevelRef.current = gameState.currentLevel;
      setLevelName(levelConfig.name);
      setShowBanner(true);
      exitTriggeredRef.current = false;
      setTimeout(() => setShowBanner(false), 4000);

      if (engineRef.current) {
        engineRef.current.loadLevel(
          levelConfig,
          gameState.roomCode + gameState.currentLevel
        );
      }
    }
  }, [gameState?.currentLevel, levelConfig]);

  useEffect(() => {
    if (hasWon) {
      setLocation("/victory");
      return;
    }
    if (gameState?.status === "finished") {
      setLocation("/gameover");
      return;
    }
  }, [hasWon, gameState?.status, setLocation]);

  useEffect(() => {
    if (!canvasRef.current || !socket || !playerId || !levelConfig || !gameState) return;
    if (engineRef.current) return;

    const audio = new AudioManager();
    audio.init();
    audioRef.current = audio;

    const input = new InputHandler(canvasRef.current, settings.keybindings);
    inputRef.current = input;

    const engine = new BackroomsEngine(
      canvasRef.current,
      levelConfig,
      gameState.roomCode + gameState.currentLevel,
      settings.graphics.renderQuality
    );
    engineRef.current = engine;

    input.onAttack = () => {
      engine.playAttackAnimation();
      const mobs = gameState?.mobs ?? [];
      const mobId = engine.getNearestMobInRange(mobs, 2.5);
      if (mobId) {
        socket.emit("player:attack", { code, playerId, mobId, damage: 25 });
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

    input.onEscape = () => {
      if (input.isPointerLocked) {
        input.exitPointerLock();
        setIsPaused(true);
      }
    };

    let lastTime = performance.now();
    let moveTimer = 0;
    let animId = 0;

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (!inputRef.current || !engineRef.current) return;
      engineRef.current.update(dt, inputRef.current);

      moveTimer += dt;
      if (moveTimer > 0.05) {
        moveTimer = 0;
        const pos = engineRef.current.getPlayerState();
        socket.emit("player:move", { code, playerId, x: pos.x, y: pos.y, angle: pos.angle });

        if (!exitTriggeredRef.current && engineRef.current.isNearExit()) {
          exitTriggeredRef.current = true;
          setShowExitHint(false);
          socket.emit("level:complete", { code, playerId }, (ack: any) => {
            if (ack?.error) exitTriggeredRef.current = false;
            if (ack?.won) setLocation("/victory");
          });
        } else if (!exitTriggeredRef.current && engineRef.current.getExitPosition()) {
          const exit = engineRef.current.getExitPosition()!;
          const pos2 = engineRef.current.getPlayerState();
          const d = Math.sqrt((exit.x - pos2.x) ** 2 + (exit.y - pos2.y) ** 2);
          setShowExitHint(d < 5);
        }
      }
    };

    animId = requestAnimationFrame(loop);
    if (!showTutorial) input.requestPointerLock();

    return () => cancelAnimationFrame(animId);
  }, [canvasRef.current, socket, playerId, levelConfig, gameState?.roomCode]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.updateKeybindings(settings.keybindings);
    }
  }, [settings.keybindings]);

  useEffect(() => {
    if (!engineRef.current || !gameState) return;
    engineRef.current.syncState(gameState, playerId ?? "");

    const me = gameState.players.find((p) => p.id === playerId);
    if (me && audioRef.current) {
      audioRef.current.setDangerLevel(1 - me.sanity / 100);
      if (me.hp < prevHpRef.current) {
        engineRef.current.flashDamage();
      }
      prevHpRef.current = me.hp;
    }
  }, [gameState, playerId]);

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

  const handleTutorialDone = () => {
    setShowTutorial(false);
    if (inputRef.current) inputRef.current.requestPointerLock();
  };

  const handleResume = () => {
    setIsPaused(false);
    if (inputRef.current) inputRef.current.requestPointerLock();
  };

  if (!gameState || !levelConfig) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-primary font-title text-2xl flicker">CONNEXION AU LIMINAL...</div>
      </div>
    );
  }

  const me = gameState.players.find((p) => p.id === playerId);
  if (!me) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-primary font-title text-2xl flicker">SYNCHRONISATION...</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${me.sanity < 30 ? "low-sanity" : ""}`}
      />

      <CRTOverlay />

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

      {showBanner && <LevelBanner levelName={levelName} />}

      {showExitHint && !exitTriggeredRef.current && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="text-accent font-mono text-sm tracking-widest uppercase animate-pulse border border-accent/40 bg-black/70 px-4 py-2">
            ▶ PORTAIL DE SORTIE — APPROCHEZ-VOUS
          </div>
        </div>
      )}

      {exitTriggeredRef.current && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-accent font-title text-4xl tracking-widest animate-pulse">
            PASSAGE EN COURS...
          </div>
        </div>
      )}

      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" />

      {showTutorial && <Tutorial onDone={handleTutorialDone} />}

      {isPaused && !showTutorial && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="border border-primary/40 bg-black/90 p-10 flex flex-col items-center gap-4 min-w-[280px]">
            <h2 className="text-2xl font-title text-primary tracking-widest">PAUSE</h2>
            <div className="w-full h-px bg-primary/20" />
            <button
              onClick={handleResume}
              className="w-full px-6 py-3 border border-primary text-primary hover:bg-primary/20 uppercase tracking-widest font-mono text-sm transition-colors"
            >
              REPRENDRE
            </button>
            <button
              onClick={() => { setShowTutorial(true); setIsPaused(false); }}
              className="w-full px-6 py-3 border border-primary/30 text-primary/60 hover:text-primary hover:border-primary/60 uppercase tracking-widest font-mono text-sm transition-colors"
            >
              TUTORIEL
            </button>
            <button
              onClick={() => setLocation("/")}
              className="w-full px-6 py-3 border border-destructive/40 text-destructive/70 hover:text-destructive hover:border-destructive uppercase tracking-widest font-mono text-sm transition-colors"
            >
              QUITTER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
