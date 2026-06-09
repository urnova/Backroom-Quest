import { motion } from "framer-motion";

const EMOTES = [
  { id: "hello", icon: "👋", label: "SALUT" },
  { id: "fear", icon: "😱", label: "PEUR" },
  { id: "quiet", icon: "🤫", label: "SILENCE" },
  { id: "lost", icon: "❓", label: "PERDU" },
  { id: "ok", icon: "👍", label: "OK" },
  { id: "help", icon: "🆘", label: "AIDE" },
  { id: "danger", icon: "⚠️", label: "DANGER" },
  { id: "run", icon: "🏃", label: "COUREZ" },
];

export default function EmoteWheel({ onSelect }: { onSelect: (emote: string) => void }) {
  return (
    <motion.div 
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      className="relative w-80 h-80 rounded-full border border-primary/30 bg-black/60 flex items-center justify-center"
    >
      <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary/20 animate-[spin_20s_linear_infinite]" />
      
      {EMOTES.map((emote, i) => {
        const angle = (i * Math.PI * 2) / EMOTES.length - Math.PI / 2;
        const x = Math.cos(angle) * 120;
        const y = Math.sin(angle) * 120;
        
        return (
          <button
            key={emote.id}
            onClick={() => onSelect(emote.icon)}
            className="absolute flex flex-col items-center justify-center w-16 h-16 rounded-full hover:bg-primary hover:text-black transition-all hover:scale-125 text-primary"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <span className="text-2xl">{emote.icon}</span>
            <span className="text-[10px] font-bold uppercase mt-1 hidden group-hover:block">{emote.label}</span>
          </button>
        );
      })}
      
      <div className="text-primary/50 text-xs font-bold uppercase text-center w-24">
        SÉLECTIONNER UNE ACTION
      </div>
    </motion.div>
  );
}
