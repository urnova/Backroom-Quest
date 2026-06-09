import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function GameOver() {
  const [, setLocation] = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 4, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-6xl md:text-8xl font-title text-destructive drop-shadow-[0_0_20px_rgba(255,0,0,0.8)] glitch">
          VOUS ÊTES MORT
        </h1>
        <p className="mt-6 text-destructive/70 tracking-[0.3em] uppercase max-w-lg mx-auto leading-relaxed">
          Les Backrooms réclament une autre âme. Votre présence n'est plus qu'un écho dans ces couloirs infinis.
        </p>
      </motion.div>

      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute bottom-20"
        >
          <button
            onClick={() => setLocation("/")}
            className="px-8 py-3 border border-destructive text-destructive hover:bg-destructive/20 uppercase tracking-widest transition-colors"
          >
            ACCEPTER SON SORT
          </button>
        </motion.div>
      )}
    </div>
  );
}
