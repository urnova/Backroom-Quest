import { motion, AnimatePresence } from "framer-motion";
import { ItemType } from "../game/ItemManager";

export interface InventoryItem {
  id: string;
  type: ItemType;
}

const ITEM_ICONS: Record<ItemType, { icon: string; color: string; label: string }> = {
  health: { icon: "❤", color: "#ff4444", label: "Soin +40" },
  battery: { icon: "⚡", color: "#ffdd00", label: "Batterie" },
  speed: { icon: "💨", color: "#44aaff", label: "Vitesse" },
};

interface Props {
  items: InventoryItem[];
  activeEffects: { speed?: boolean };
  nearItemLabel?: string | null;
  onUse?: (id: string) => void;
}

export default function Inventory({ items, activeEffects, nearItemLabel }: Props) {
  return (
    <div className="absolute bottom-28 right-4 z-20 pointer-events-none flex flex-col items-end gap-2">
      <AnimatePresence>
        {nearItemLabel && (
          <motion.div
            key="pickup-hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="text-accent border border-accent/40 bg-black/80 px-3 py-1 font-mono text-xs uppercase tracking-widest animate-pulse"
          >
            ▶ {nearItemLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {activeEffects.speed && (
        <div className="text-blue-400 border border-blue-400/30 bg-black/70 px-2 py-1 font-mono text-xs uppercase tracking-widest animate-pulse">
          💨 VITESSE ACTIVE
        </div>
      )}

      {items.length > 0 && (
        <div className="flex gap-1.5">
          {items.map((item) => {
            const cfg = ITEM_ICONS[item.type];
            return (
              <motion.div
                key={item.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="w-9 h-9 border border-white/20 bg-black/70 flex items-center justify-center text-lg"
                style={{ borderColor: cfg.color + "66" }}
                title={cfg.label}
              >
                {cfg.icon}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
