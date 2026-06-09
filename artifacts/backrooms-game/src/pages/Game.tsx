import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGameStore } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";
import { BabylonEngine, WorldItem } from "../game/BabylonEngine";
import type { ItemType } from "../game/ItemManager";
import { AudioManager } from "../game/AudioManager";
import { addCoins, computeLevelCoins, updateMaxLevel } from "../lib/playerStore";
import HUD from "../components/HUD";
import EmoteWheel from "../components/EmoteWheel";
import ChatLog from "../components/ChatLog";
import LevelBanner from "../components/LevelBanner";
import CRTOverlay from "../components/CRTOverlay";
import Tutorial from "../components/Tutorial";
import Inventory, { InventoryItem } from "../components/Inventory";
import { motion, AnimatePresence } from "framer-motion";

export default function Game() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { socket, playerId, gameState, levelConfig, hasWon } = useGameStore();
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const engineRef      = useRef<BabylonEngine | null>(null);
  const audioRef       = useRef<AudioManager | null>(null);
  const exitTriggered  = useRef(false);
  const prevLevelRef   = useRef(-1);
  const prevHpRef      = useRef(100);
  const gameStateRef   = useRef(gameState);

  const [showEmoteWheel, setShowEmoteWheel] = useState(false);
  const [showBanner,     setShowBanner]     = useState(false);
  const [levelName,      setLevelName]      = useState("");
  const [showExitHint,   setShowExitHint]   = useState(false);
  const [coinsEarned,    setCoinsEarned]    = useState<number | null>(null);
  const [isPaused,       setIsPaused]       = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [showTutorial,   setShowTutorial]   = useState(false);

  const [inventoryItems,  setInventoryItems]  = useState<InventoryItem[]>([]);
  const [activeEffects,   setActiveEffects]   = useState<{ speed?: boolean }>({});
  const [nearItemLabel,   setNearItemLabel]   = useState<string | null>(null);
  const [itemPickupFlash, setItemPickupFlash] = useState<string | null>(null);

  // Keep gameState ref fresh
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Pointer lock tracking (browser event)
  useEffect(() => {
    const onChange = () => setIsPointerLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  // Navigate on game over / win
  useEffect(() => {
    if (hasWon) { setLocation("/victory"); return; }
    if (gameState?.status === "finished") { setLocation("/gameover"); return; }
  }, [hasWon, gameState?.status, setLocation]);

  // Level change
  useEffect(() => {
    if (!gameState || !levelConfig) return;
    if (gameState.currentLevel !== prevLevelRef.current) {
      prevLevelRef.current = gameState.currentLevel;
      setLevelName(levelConfig.name);
      setShowBanner(true);
      exitTriggered.current = false;
      setInventoryItems([]);
      setActiveEffects({});
      setTimeout(() => setShowBanner(false), 4000);
      engineRef.current?.loadLevel(levelConfig, gameState.roomCode + gameState.currentLevel);
    }
  }, [gameState?.currentLevel, levelConfig]);

  // Sync server state → engine every tick
  useEffect(() => {
    if (!engineRef.current || !gameState) return;
    engineRef.current.syncState(gameState, playerId ?? "");
    const me = gameState.players.find(p => p.id === playerId);
    if (me) {
      audioRef.current?.setDangerLevel(1 - me.sanity / 100);
      if (me.hp < prevHpRef.current) engineRef.current.flashDamage();
      prevHpRef.current = me.hp;
    }
  }, [gameState, playerId]);

  // Keybindings
  useEffect(() => {
    engineRef.current?.updateKeybindings(settings.keybindings);
  }, [settings.keybindings]);

  // ─── Engine init (runs once when canvas + socket + game are ready) ───────────
  useEffect(() => {
    if (!canvasRef.current || !socket || !playerId || !levelConfig || !gameState) return;
    if (engineRef.current) return;

    const audio = new AudioManager();
    audio.init();
    audioRef.current = audio;

    const engine = new BabylonEngine(
      canvasRef.current,
      levelConfig,
      gameState.roomCode + gameState.currentLevel,
      settings.graphics.renderQuality,
    );
    engineRef.current = engine;

    // ── Item callbacks ───────────────────────────────────────────────────────
    engine.onItemPickup = (item: WorldItem) => {
      const newItem: InventoryItem = { id: item.id, type: item.type as ItemType };
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

    // ── Input callbacks ──────────────────────────────────────────────────────
    engine.onAttack = () => {
      engine.playAttackAnimation();
      const mobs = gameStateRef.current?.mobs ?? [];
      const mobId = engine.getNearestMobInRange(mobs, 2.5);
      if (mobId) socket.emit("player:attack", { code, playerId, mobId, damage: 25 });
    };

    engine.onFlashlight = () => {
      socket.emit("player:flashlight", { code, playerId, on: engine.isFlashlightOn });
    };

    engine.onEmoteDown = () => {
      setShowEmoteWheel(true);
    };

    engine.onEmoteUp = () => {
      setShowEmoteWheel(false);
      engine.requestPointerLock();
    };

    engine.onEscape = () => {
      setIsPaused(true);
    };

    // ── Server tick (send position + check exit) ─────────────────────────────
    engine.onTick = ({ x, y, angle }) => {
      socket.emit("player:move", { code, playerId, x, y, angle });

      if (!exitTriggered.current && engine.isNearExit()) {
        exitTriggered.current = true;
        setShowExitHint(false);
        socket.emit("level:complete", { code, playerId }, (ack: any) => {
          if (ack?.error) { exitTriggered.current = false; return; }
          if (ack?.won)   { setLocation("/victory"); return; }
          if (ack?.ok) {
            const completedLevel = ack.newLevel !== undefined ? ack.newLevel - 1 : 0;
            const diff = gameStateRef.current?.difficulty ?? "normal";
            const earned = computeLevelCoins(completedLevel, diff);
            addCoins(earned);
            updateMaxLevel(completedLevel + 1);
            setCoinsEarned(earned);
            setTimeout(() => setCoinsEarned(null), 3000);
          }
        });
      } else if (!exitTriggered.current) {
        const exit = engine.getExitPosition();
        if (exit) {
          const d = Math.sqrt((exit.x - x) ** 2 + (exit.y - y) ** 2);
          setShowExitHint(d < 5);
        }
      }
    };

    return () => { /* engine disposed by cleanup below */ };
  }, [canvasRef.current, socket, playerId, levelConfig, gameState?.roomCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.stop();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleEmote = (emote: string) => {
    socket?.emit("player:emote", { code, playerId, emote });
    setShowEmoteWheel(false);
    engineRef.current?.requestPointerLock();
  };

  const handleResume = () => {
    setIsPaused(false);
    engineRef.current?.requestPointerLock();
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

  const showClickOverlay = !isPointerLocked && !isPaused && !showEmoteWheel && !showTutorial;

  return (
    <div className="absolute inset-0 bg-black overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${me.sanity < 30 ? "low-sanity" : ""}`}
      />

      <CRTOverlay />

      {/* Click-to-play overlay */}
      <AnimatePresence>
        {showClickOverlay && (
          <motion.div
            key="click-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => engineRef.current?.requestPointerLock()}
          >
            <div className="text-center pointer-events-none">
              <div className="text-primary font-title text-4xl tracking-widest animate-pulse mb-3">
                CLIQUER POUR JOUER
              </div>
              <div className="text-primary/50 font-mono text-sm tracking-widest uppercase">
                Clic gauche • Bouger la souris pour regarder • ESC pour pause
              </div>
              <div className="text-primary/30 font-mono text-xs mt-4 tracking-widest">
                AZERTY / QWERTY : Z ou W • Q ou A • S • D — Sprint : SHIFT — Lampe : F
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

      {showExitHint && !exitTriggered.current && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="text-accent font-mono text-sm tracking-widest uppercase animate-pulse border border-accent/40 bg-black/70 px-4 py-2">
            ▶ PORTAIL DE SORTIE — APPROCHEZ-VOUS
          </div>
        </div>
      )}

      {exitTriggered.current && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-accent font-title text-4xl tracking-widest animate-pulse">PASSAGE EN COURS...</div>
        </div>
      )}

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" />

      {showTutorial && <Tutorial onDone={() => { setShowTutorial(false); engineRef.current?.requestPointerLock(); }} />}

      {isPaused && !showTutorial && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="border border-primary/40 bg-black/90 p-10 flex flex-col items-center gap-4 min-w-[280px]">
            <h2 className="text-2xl font-title text-primary tracking-widest">PAUSE</h2>
            <div className="w-full h-px bg-primary/20" />
            <button onClick={handleResume}
              className="w-full px-6 py-3 border border-primary text-primary hover:bg-primary/20 uppercase tracking-widest font-mono text-sm">
              ▶ REPRENDRE
            </button>
            <button onClick={() => { setShowTutorial(true); setIsPaused(false); }}
              className="w-full px-6 py-3 border border-primary/30 text-primary/60 hover:text-primary uppercase tracking-widest font-mono text-sm">
              TUTORIEL
            </button>
            <button onClick={() => setLocation("/skin")}
              className="w-full px-6 py-3 border border-primary/20 text-primary/50 hover:text-primary uppercase tracking-widest font-mono text-sm">
              PERSONNALISATION
            </button>
            <button onClick={() => setLocation("/")}
              className="w-full px-6 py-3 border border-destructive/40 text-destructive/70 hover:text-destructive uppercase tracking-widest font-mono text-sm">
              QUITTER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
