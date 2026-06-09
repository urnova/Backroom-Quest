import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../context/GameContext";
import { MenuScene } from "../game/MenuScene";

export default function MainMenu() {
  const { leaveRoom } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<MenuScene | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useState(() => { leaveRoom(); });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Small delay so layout has settled and canvas has real dimensions
    const tid = setTimeout(() => {
      const scene = new MenuScene(canvas);
      sceneRef.current = scene;
    }, 60);
    return () => {
      clearTimeout(tid);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const menuItems = [
    { href: "/solo",        label: "JOUER EN SOLO",   delay: 0.30 },
    { href: "/multiplayer", label: "MULTIJOUEUR",     delay: 0.46 },
    { href: "/skin",        label: "PERSONNALISATION", delay: 0.62 },
    { href: "/options",     label: "OPTIONS",          delay: 0.78 },
  ];

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden">

      {/* ── Background: Three.js animated (GPU) or CSS fallback ──────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
      {/* CSS corridor fallback (always present; canvas overlays if WebGL works) */}
      <div className="absolute inset-0 corridor-bg pointer-events-none" />
      <div className="absolute inset-0 flicker-overlay pointer-events-none" />
      <div className="absolute inset-0 grain-overlay opacity-20 pointer-events-none" />

      {/* Dark radial vignette over canvas */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10 scanlines opacity-40" />

      {/* ── Menu UI ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="z-20 flex flex-col items-center gap-2"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 0.8, duration: 2 }}
          className="text-primary/55 tracking-[0.8em] uppercase text-xs mb-4 font-mono"
        >
          ENTREZ SI VOUS L'OSEZ
        </motion.p>

        <h1
          className="text-6xl md:text-8xl font-title text-primary tracking-widest mb-1 relative select-none"
          style={{
            textShadow: "0 0 20px rgba(200,180,96,0.9), 0 0 60px rgba(200,180,96,0.4), 0 0 120px rgba(200,180,96,0.15)",
            filter: "drop-shadow(0 0 30px rgba(200,180,96,0.5))",
          }}
        >
          THE LIMINAL
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.38 }}
          transition={{ delay: 0.5, duration: 1.5 }}
          className="text-primary/38 tracking-[0.35em] uppercase text-xs font-mono"
        >
          ESPACES ENTRE LES MONDES
        </motion.p>

        <div
          className="my-5"
          style={{
            width: "220px", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(200,180,96,0.5), transparent)",
          }}
        />

        <div className="flex flex-col gap-2.5 w-72">
          {menuItems.map(({ href, label, delay }) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay, duration: 0.45 }}
            >
              <Link
                href={href}
                onMouseEnter={() => setHovered(href)}
                onMouseLeave={() => setHovered(null)}
                className={`block px-6 py-3 border text-center uppercase tracking-[0.28em] transition-all duration-200 font-mono text-sm relative overflow-hidden ${
                  hovered === href
                    ? "border-primary/80 text-primary bg-primary/12"
                    : "border-primary/35 text-primary/80 hover:border-primary/70 hover:text-primary"
                }`}
              >
                {hovered === href && (
                  <motion.div
                    layoutId="menuHighlight"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
                    initial={false}
                    transition={{ duration: 0.15 }}
                  />
                )}
                {label}
              </Link>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.94, duration: 0.45 }}
          >
            <button
              onClick={() => setShowCredits(true)}
              className="w-full px-6 py-3 border border-primary/18 text-primary/40 text-center uppercase tracking-[0.28em] hover:border-primary/35 hover:text-primary/60 transition-all duration-200 font-mono text-sm"
            >
              CRÉDITS
            </button>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.28 }}
          transition={{ delay: 2.2, duration: 2 }}
          className="text-primary/28 text-xs tracking-widest mt-6 font-mono text-center"
        >
          20 NIVEAUX · SOLO &amp; MULTIJOUEUR · MODE CAUCHEMAR
        </motion.p>
      </motion.div>

      <div className="absolute bottom-4 right-6 text-primary/25 text-xs tracking-widest z-20 font-mono">
        Created by Astral
      </div>
      <div className="absolute bottom-4 left-6 text-primary/18 text-xs tracking-widest z-20 font-mono">
        v1.2
      </div>

      {/* Credits modal */}
      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCredits(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="border border-primary/40 bg-black/92 p-10 max-w-md w-full text-center mx-4"
            >
              <h2 className="text-3xl font-title text-primary tracking-widest mb-6">CRÉDITS</h2>
              <div className="space-y-4 text-primary/70 font-mono text-sm">
                <div>
                  <p className="text-primary text-xl font-bold tracking-widest">ASTRAL</p>
                  <p className="text-primary/50 text-xs mt-1 tracking-widest uppercase">Créateur &amp; Développeur</p>
                </div>
                <div className="w-24 h-px bg-primary/20 mx-auto" />
                <p className="text-xs leading-relaxed text-primary/40">
                  The Liminal — Un voyage dans les espaces oubliés entre les mondes.<br />
                  20 niveaux. Des entités. Pas de pitié.
                </p>
                <div className="w-24 h-px bg-primary/20 mx-auto" />
                <p className="text-xs text-primary/30 tracking-widest">
                  Babylon.js · Three.js · React · Socket.io
                </p>
              </div>
              <button
                onClick={() => setShowCredits(false)}
                className="mt-8 px-6 py-2 border border-primary/25 text-primary/45 hover:text-primary hover:border-primary/55 transition-colors font-mono text-xs uppercase tracking-widest"
              >
                FERMER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
