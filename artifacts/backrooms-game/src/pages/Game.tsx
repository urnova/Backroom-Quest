import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useGameStore } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";
import { BackroomsEngine } from "../game/BackroomsEngine";
import { InputHandler } from "../game/InputHandler";
import { AudioManager } from "../game/AudioManager";
import { WorldItem } from "../game/ItemManager";
import { getSelectedSkin, addCoins, computeLevelCoins, updateMaxLevel } from "../lib/playerStore";
import HUD from "../components/HUD";
import EmoteWheel from "../components/EmoteWheel";
import ChatLog from "../components/ChatLog";
import LevelBanner from "../components/LevelBanner";
import CRTOverlay from "../components/CRTOverlay";
import Tutorial, { shouldShowTutorial } from "../components/Tutorial";
import Inventory, { InventoryItem } from "../components/Inventory";
import { motion, AnimatePresence } from "framer-motion";

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
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
  const [isPaused, setIsPaused] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Inventory
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [activeEffects, setActiveEffects] = useState<{ speed?: boolean }>({});
  const [nearItemLabel, setNearItemLabel] = useState<string | null>(null);
  const [itemPickupFlash, setItemPickupFlash] = useState<string | null>(null);

  // Track pointer lock via native event
  useEffect(() => {
    const onChange = () => setIsPointerLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  useEffect(() => {
    if (!gameState || !levelConfig) return;
    if (gameState.currentLevel !== prevLevelRef.current) {
      prevLevelRef.current = gameState.currentLevel;
      setLevelName(levelConfig.name);
      setShowBanner(true);
      exitTriggeredRef.current = false;
      setInventoryItems([]);
      setActiveEffects({});
      setTimeout(() => setShowBanner(false), 4000);
      if (engineRef.current) {
        engineRef.current.loadLevel(levelConfig, gameState.roomCode + gameState.currentLevel);
      }
    }
  }, [gameState?.currentLevel, levelConfig]);

  useEffect(() => {
    if (hasWon) { setLocation("/victory"); return; }
    if (gameState?.status === "finished") { setLocation("/gameover"); return; }
  }, [hasWon, gameState?.status, setLocation]);

  useEffect(() => {
    if (!canvasRef.current || !socket || !playerId || !levelConfig || !gameState) return;
    if (engineRef.current) return;

    const audio = new AudioManager();
    audio.init();
    audioRef.current = audio;

    const input = new InputHandler(canvasRef.current, settings.keybindings);
    inputRef.current = input;

    const skin = getSelectedSkin();
    const engine = new BackroomsEngine(
      canvasRef.current, levelConfig,
      gameState.roomCode + gameState.currentLevel,
      settings.graphics.renderQuality
    );
    engineRef.current = engine;

    engine.onItemPickup = (item: WorldItem) => {
      const newItem: InventoryItem = { id: item.id, type: item.type };

      if (item.type === "health") {
        socket.emit("player:heal", { code, playerId, amount: 40 });
        setItemPickupFlash("❤ +40 PV");
      } else if (item.type === "battery") {
        setItemPickupFlash("⚡ BATTERIE RECHARGÉE");
      } else if (item.type === "speed") {
        engine.activateSpeedBoost(30);
        setActiveEffects(prev => ({ ...prev, speed: true }));
        setTimeout(() => setActiveEffects(prev => ({ ...prev, speed: false })), 30000);
        setItemPickupFlash("💨 BOOST DE VITESSE");
      }

      setInventoryItems(prev => [...prev.slice(-4), newItem]);
      setTimeout(() => setItemPickupFlash(null), 2000);
    };

    engine.onNearItem = (label: string | null) => {
      setNearItemLabel(label ? `OBJET À PROXIMITÉ — ${label}` : null);
    };

    input.onAttack = () => {
      engine.playAttackAnimation();
      const mobs = gameState?.mobs ?? [];
      const mobId = engine.getNearestMobInRange(mobs, 2.5);
      if (mobId) socket.emit("player:attack", { code, playerId, mobId, damage: 25 });
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
            if (ack?.error) { exitTriggeredRef.current = false; return; }
            if (ack?.won) { setLocation("/victory"); return; }
            if (ack?.ok) {
              const completedLevel = ack.newLevel !== undefined ? ack.newLevel - 1 : 0;
              const diff = gameState?.difficulty ?? "normal";
              const earned = computeLevelCoins(completedLevel, diff);
              addCoins(earned);
              updateMaxLevel(completedLevel + 1);
              setCoinsEarned(earned);
              setTimeout(() => setCoinsEarned(null), 3000);
            }
          });
        } else if (!exitTriggeredRef.current && engineRef.current.getExitPosition()) {
          const exit = engineRef.current.getExitPosition()!;
          const d = Math.sqrt((exit.x - pos.x) ** 2 + (exit.y - pos.y) ** 2);
          setShowExitHint(d < 5);
        }
      }
    };

    animId = requestAnimationFrame(loop);
    // *** NO requestPointerLock() here — only from user gesture (canvas click) ***

    return () => cancelAnimationFrame(animId);
  }, [canvasRef.current, socket, playerId, levelConfig, gameState?.roomCode]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.updateKeybindings(settings.keybindings);
  }, [settings.keybindings]);

  useEffect(() => {
    if (!engineRef.current || !gameState) return;
    engineRef.current.syncState(gameState, playerId ?? "");
    const me = gameState.players.find(p => p.id === playerId);
    if (me && audioRef.current) {
      audioRef.current.setDangerLevel(1 - me.sanity / 100);
      if (me.hp < prevHpRef.current) engineRef.current.flashDamage();
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
    inputRef.current?.requestPointerLock();
  };

  const handleTutorialDone = () => {
    setShowTutorial(false);
    // pointer lock will be requested on next canvas click
  };

  const handleResume = () => {
    setIsPaused(false);
    inputRef.current?.requestPointerLock();
  };

  if (!gameState || !levelConfig) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-primary font-title text-2xl flicker">CONNEXION AU LIMINAL...</div>
      </div>
    );
  }

  const me = gameState.players.find(p => p.id === playerId);
  if (!me) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-primary font-title text-2xl flicker">SYNCHRONISATION...</div>
      </div>
    );
  }

  const showClickOverlay = !isPointerLocked && !showTutorial && !isPaused && !showEmoteWheel;

  return (
    <div className="absolute inset-0 bg-black overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${me.sanity < 30 ? "low-sanity" : ""}`}
      />

      <CRTOverlay />

      {/* Click-to-play overlay — fixed pointer lock bug */}
      <AnimatePresence>
        {showClickOverlay && (
          <motion.div
            key="click-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => inputRef.current?.requestPointerLock()}
          >
            <div className="text-center pointer-events-none">
              <div className="text-primary font-title text-4xl tracking-widest animate-pulse mb-3">
                CLIQUER POUR JOUER
              </div>
              <div className="text-primary/50 font-mono text-sm tracking-widest uppercase">
                Clic gauche • Bouger la souris pour regarder • ESC pour pause
              </div>
              <div className="text-primary/30 font-mono text-xs mt-4 tracking-widest">
                AZERTY: Z/Q/S/D — Sprint: SHIFT — Lampe: F
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none z-10">
        <HUD player={me} levelName={levelConfig.name} difficulty={gameState.difficulty ?? "normal"} />

        {showEmoteWheel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-sm">
            <EmoteWheel onSelect={handleEmote} />
          </div>
        )}

        <ChatLog socket={socket} />
      </div>

      <Inventory items={inventoryItems} activeEffects={activeEffects} nearItemLabel={nearItemLabel} />

      <AnimatePresence>
        {itemPickupFlash && (
          <motion.div
            key={itemPickupFlash}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none
              text-accent border border-accent/40 bg-black/80 px-5 py-2 font-mono text-sm uppercase tracking-widest"
          >
            {itemPickupFlash}
          </motion.div>
        )}
      </AnimatePresence>

      {showBanner && <LevelBanner levelName={levelName} />}

      <AnimatePresence>
        {coinsEarned !== null && (
          <motion.div
            key="coins-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none
              flex items-center gap-2 border border-yellow-400/40 bg-black/90 px-6 py-3 font-mono text-sm uppercase tracking-widest"
          >
            <span className="text-yellow-400 text-lg font-bold">◈</span>
            <span className="text-yellow-300 font-bold">+{coinsEarned}</span>
            <span className="text-primary/60">pièces gagnées</span>
          </motion.div>
        )}
      </AnimatePresence>

      {showExitHint && !exitTriggeredRef.current && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="text-accent font-mono text-sm tracking-widest uppercase animate-pulse border border-accent/40 bg-black/70 px-4 py-2">
            ▶ PORTAIL DE SORTIE — APPROCHEZ-VOUS
          </div>
        </div>
      )}

      {exitTriggeredRef.current && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-accent font-title text-4xl tracking-widest animate-pulse">PASSAGE EN COURS...</div>
        </div>
      )}

      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" />

      {showTutorial && <Tutorial onDone={handleTutorialDone} />}

      {isPaused && !showTutorial && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="border border-primary/40 bg-black/90 p-10 flex flex-col items-center gap-4 min-w-[280px]">
            <h2 className="text-2xl font-title text-primary tracking-widest">PAUSE</h2>
            <div className="w-full h-px bg-primary/20" />
            <button onClick={handleResume} className="w-full px-6 py-3 border border-primary text-primary hover:bg-primary/20 uppercase tracking-widest font-mono text-sm">
              ▶ REPRENDRE
            </button>
            <button onClick={() => { setShowTutorial(true); setIsPaused(false); }} className="w-full px-6 py-3 border border-primary/30 text-primary/60 hover:text-primary uppercase tracking-widest font-mono text-sm">
              TUTORIEL
            </button>
            <button onClick={() => setLocation("/skin")} className="w-full px-6 py-3 border border-primary/20 text-primary/50 hover:text-primary uppercase tracking-widest font-mono text-sm">
              PERSONNALISATION
            </button>
            <button onClick={() => setLocation("/")} className="w-full px-6 py-3 border border-destructive/40 text-destructive/70 hover:text-destructive uppercase tracking-widest font-mono text-sm">
              QUITTER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
