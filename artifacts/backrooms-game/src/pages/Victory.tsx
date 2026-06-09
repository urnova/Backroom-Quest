import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Victory() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_0%,rgba(200,220,255,1)_100%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 4, ease: "easeOut" }}
        className="absolute inset-0 bg-white"
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 3, ease: "easeOut", delay: 1 }}
        className="z-10 text-center"
      >
        <h1 className="text-5xl md:text-7xl font-sans font-light text-black tracking-[0.5em] mb-4">
          ÉVASION
        </h1>
        <div className="text-gray-400 tracking-[0.5em] uppercase text-xs font-mono mb-8">— THE LIMINAL —</div>
        <p className="text-gray-600 tracking-widest uppercase max-w-lg mx-auto leading-loose text-sm font-mono">
          L'air est frais. Le ciel est réel.<br />
          Le cauchemar est terminé.<br />
          Vous avez traversé les 20 niveaux du Liminal.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 5 }}
        className="absolute bottom-20 z-10"
      >
        <button
          onClick={() => setLocation("/")}
          className="px-8 py-3 border border-black text-black hover:bg-black hover:text-white uppercase tracking-widest transition-colors font-mono"
        >
          RETOURNER À LA RÉALITÉ
        </button>
      </motion.div>
    </div>
  );
}
