import { motion } from "framer-motion";

export default function LevelBanner({ levelName }: { levelName: string }) {
  const parts = levelName.split("—");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center px-8"
      >
        <div className="text-primary/40 text-xs tracking-[0.5em] uppercase font-mono mb-4">— THE LIMINAL —</div>
        <h2 className="text-4xl md:text-6xl font-title text-primary tracking-[0.2em] glitch mb-4">
          {parts[0]?.trim()}
        </h2>
        {parts[1] && (
          <div className="text-primary/60 uppercase tracking-widest text-base font-mono">
            {parts[1]?.trim()}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
