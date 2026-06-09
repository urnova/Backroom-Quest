import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../context/GameContext";

export default function MainMenu() {
  const { leaveRoom } = useGameStore();
  const [showCredits, setShowCredits] = useState(false);

  useState(() => { leaveRoom(); });

  const menuItems = [
    { href: "/solo", label: "JOUER EN SOLO", delay: 0.3 },
    { href: "/multiplayer", label: "MULTIJOUEUR", delay: 0.5 },
    { href: "/skin", label: "PERSONNALISATION", delay: 0.65 },
    { href: "/options", label: "OPTIONS", delay: 0.8 },
  ];

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#0a0a06]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="corridor-bg" />
        <div className="absolute inset-0 flicker-overlay" />
        <div className="absolute inset-0 grain-overlay opacity-30" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.88) 100%)" }}
        />
      </div>

      <div className="absolute inset-0 scanlines pointer-events-none z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="z-20 flex flex-col items-center gap-2"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1, duration: 2 }}
          className="text-primary/60 tracking-[0.8em] uppercase text-xs mb-4 font-mono"
        >
          ENTREZ SI VOUS L'OSEZ
        </motion.p>

        <h1
          className="text-6xl md:text-8xl font-title text-primary tracking-widest mb-2 relative"
          style={{
            textShadow: "0 0 20px rgba(200,180,96,0.8), 0 0 60px rgba(200,180,96,0.3)",
            filter: "drop-shadow(0 0 30px rgba(200,180,96,0.4))",
          }}
        >
          THE LIMINAL
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5, duration: 1.5 }}
          className="text-primary/40 tracking-[0.4em] uppercase text-xs font-mono"
        >
          ESPACES ENTRE LES MONDES
        </motion.p>

        <div className="w-64 h-px bg-primary/30 my-6" />

        <div className="flex flex-col gap-3 w-72">
          {menuItems.map(({ href, label, delay }) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay, duration: 0.5 }}
            >
              <Link
                href={href}
                className="block px-6 py-3 border border-primary/40 text-primary text-center uppercase tracking-[0.3em] hover:bg-primary/15 hover:border-primary/70 hover:scale-105 transition-all duration-200 font-mono text-sm"
              >
                {label}
              </Link>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <button
              onClick={() => setShowCredits(true)}
              className="w-full px-6 py-3 border border-primary/20 text-primary/50 text-center uppercase tracking-[0.3em] hover:bg-primary/10 hover:border-primary/40 hover:text-primary/70 transition-all duration-200 font-mono text-sm"
            >
              CRÉDITS
            </button>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 2.5, duration: 2 }}
          className="text-primary/30 text-xs tracking-widest mt-8 font-mono"
        >
          20 NIVEAUX • SOLO &amp; MULTIJOUEUR • MODE CAUCHEMAR
        </motion.p>
      </motion.div>

      <div className="absolute bottom-4 right-6 text-primary/30 text-xs tracking-widest z-20 font-mono">
        Created by Astral
      </div>
      <div className="absolute bottom-4 left-6 text-primary/20 text-xs tracking-widest z-20 font-mono">
        v1.1
      </div>

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
              className="border border-primary/40 bg-black/90 p-10 max-w-md w-full text-center"
            >
              <h2 className="text-3xl font-title text-primary tracking-widest mb-6">CRÉDITS</h2>
              <div className="space-y-4 text-primary/70 font-mono text-sm">
                <div>
                  <p className="text-primary text-xl font-bold tracking-widest">ASTRAL</p>
                  <p className="text-primary/50 text-xs mt-1">CRÉATEUR &amp; DÉVELOPPEUR</p>
                </div>
                <div className="w-32 h-px bg-primary/20 mx-auto" />
                <p className="text-xs leading-relaxed text-primary/40">
                  The Liminal — Un voyage dans les espaces oubliés entre les mondes.
                  <br />
                  20 niveaux. Des entités. Pas de pitié.
                </p>
                <div className="w-32 h-px bg-primary/20 mx-auto" />
                <p className="text-xs text-primary/30">
                  Three.js · React · Socket.io
                </p>
              </div>
              <button
                onClick={() => setShowCredits(false)}
                className="mt-8 px-6 py-2 border border-primary/30 text-primary/50 hover:text-primary hover:border-primary/60 transition-colors font-mono text-xs uppercase tracking-widest"
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
