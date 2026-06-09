import { motion } from "framer-motion";

export default function LevelBanner({ levelName }: { levelName: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-none"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-center"
      >
        <h2 className="text-4xl md:text-6xl font-title text-primary tracking-[0.2em] glitch mb-4">
          {levelName.split("—")[0]}
        </h2>
        <div className="text-primary/70 uppercase tracking-widest text-lg">
          {levelName.split("—")[1]}
        </div>
      </motion.div>
    </motion.div>
  );
}
