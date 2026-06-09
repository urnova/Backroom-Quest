import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const MESSAGES = [
  "CHARGEMENT DES ENTITÉS...",
  "CALIBRAGE DU LIMINAL...",
  "PRÉPARATION DES COULOIRS...",
  "SYNCHRONISATION DES DONNÉES...",
  "CONNEXION AU SERVEUR...",
  "INITIALISATION DU SYSTÈME...",
];

interface Props {
  onDone: () => void;
}

export default function LoadingScreen({ onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const DURATION = 2400;
    const start = Date.now();
    let rafId: number;

    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(p);
      setMsgIndex(Math.min(MESSAGES.length - 1, Math.floor((p / 100) * MESSAGES.length)));

      if (p < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        Promise.all([
          document.fonts.ready,
          new Promise<void>((r) => setTimeout(r, 350)),
        ]).then(() => {
          setDone(true);
          setTimeout(() => onDoneRef.current(), 550);
        });
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const segments = 24;
  const filled = Math.round((progress / 100) * segments);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeIn" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a06] select-none overflow-hidden"
    >
      {/* Background grain */}
      <div className="absolute inset-0 grain-overlay opacity-20 pointer-events-none" />
      {/* Scanlines */}
      <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.85) 100%)" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-80">
        {/* Glitch subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="text-primary/50 tracking-[0.8em] uppercase text-xs font-mono"
        >
          ENTREZ SI VOUS L'OSEZ
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl font-title text-primary tracking-widest text-center"
          style={{
            textShadow: "0 0 20px rgba(200,180,96,0.9), 0 0 50px rgba(200,180,96,0.4)",
            filter: "drop-shadow(0 0 20px rgba(200,180,96,0.5))",
          }}
        >
          THE LIMINAL
        </motion.h1>

        {/* Separator */}
        <div
          className="w-full h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,96,0.4), transparent)" }}
        />

        {/* Segmented progress bar */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: segments }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 h-3"
                style={{
                  background: i < filled
                    ? i === filled - 1
                      ? "rgba(255,248,200,0.95)"
                      : "rgba(200,180,96,0.85)"
                    : "rgba(200,180,96,0.10)",
                  boxShadow: i === filled - 1 ? "0 0 8px rgba(255,248,200,0.8)" : "none",
                  transition: "background 0.08s ease, box-shadow 0.08s ease",
                }}
              />
            ))}
          </div>

          {/* Progress text */}
          <div className="flex justify-between items-center">
            <span
              className="font-mono text-[10px] tracking-widest"
              style={{ color: "rgba(200,180,96,0.6)" }}
            >
              {MESSAGES[msgIndex]}
            </span>
            <span
              className="font-mono text-[10px] font-bold tabular-nums"
              style={{ color: "rgba(200,180,96,0.7)" }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Decorative corner dots */}
        <div className="absolute -top-2 -left-4 w-1.5 h-1.5 rounded-full bg-primary/30" />
        <div className="absolute -top-2 -right-4 w-1.5 h-1.5 rounded-full bg-primary/30" />
        <div className="absolute -bottom-2 -left-4 w-1.5 h-1.5 rounded-full bg-primary/20" />
        <div className="absolute -bottom-2 -right-4 w-1.5 h-1.5 rounded-full bg-primary/20" />
      </div>

      {/* Version */}
      <div
        className="absolute bottom-6 right-8 font-mono text-xs"
        style={{ color: "rgba(200,180,96,0.18)" }}
      >
        v1.2
      </div>
      <div
        className="absolute bottom-6 left-8 font-mono text-xs"
        style={{ color: "rgba(200,180,96,0.18)" }}
      >
        Created by Astral
      </div>
    </motion.div>
  );
}
