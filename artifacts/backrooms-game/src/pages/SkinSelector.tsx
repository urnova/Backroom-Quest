import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

const SKINS = [
  { id: "survivor", name: "Survivant", color: "#cc4400", desc: "Le classique. Rouge comme le danger." },
  { id: "explorer", name: "Explorateur", color: "#1155cc", desc: "Curieux et courageux. Bleu nuit." },
  { id: "scientist", name: "Scientifique", color: "#228844", desc: "Cherche des réponses. Vert laboratoire." },
  { id: "soldier", name: "Soldat", color: "#667755", desc: "Entraîné pour survivre. Kaki." },
  { id: "agent", name: "Agent", color: "#222222", desc: "Mystérieux et discret. Noir absolu." },
  { id: "medic", name: "Médecin", color: "#ccdde8", desc: "Garde les autres en vie. Blanc clinique." },
];

export default function SkinSelector() {
  const [, setLocation] = useLocation();
  const { settings, updateGraphics } = useSettings();
  const [selected, setSelected] = useState<string>(() => localStorage.getItem("liminal_skin") || "survivor");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("liminal_skin", selected);
    setSaved(true);
    setTimeout(() => { setSaved(false); }, 1200);
  };

  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl border border-primary/30 bg-black/70 backdrop-blur shadow-2xl shadow-primary/10"
      >
        <div className="px-8 pt-6 pb-4 border-b border-primary/20">
          <h2 className="text-3xl font-title text-primary text-center tracking-widest">PERSONNALISATION</h2>
          <p className="text-primary/30 text-xs text-center font-mono mt-1 uppercase tracking-widest">
            Choisissez votre tenue de survie
          </p>
        </div>

        <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-4">
          {SKINS.map((skin) => (
            <motion.button
              key={skin.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(skin.id)}
              className={`relative p-4 border text-left transition-all ${
                selected === skin.id
                  ? "border-primary bg-primary/15 shadow-lg"
                  : "border-primary/20 hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              {selected === skin.id && (
                <div className="absolute top-2 right-2 text-primary text-sm">✓</div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-14 rounded-sm border border-white/10 flex flex-col items-center justify-start overflow-hidden"
                  style={{ background: `linear-gradient(to bottom, ${skin.color}cc, ${skin.color})` }}
                >
                  <div className="w-5 h-5 rounded-full mt-1" style={{ background: skin.color, filter: "brightness(1.3)" }} />
                  <div className="w-7 h-6 mt-0.5" style={{ background: skin.color }} />
                </div>
                <div>
                  <div className="text-primary font-mono text-sm font-bold uppercase">{skin.name}</div>
                  <div
                    className="w-12 h-1 mt-1 rounded"
                    style={{ background: skin.color }}
                  />
                </div>
              </div>
              <p className="text-primary/40 font-mono text-xs leading-relaxed">{skin.desc}</p>
            </motion.button>
          ))}
        </div>

        <div className="border-t border-primary/20 px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => setLocation("/")}
            className="px-6 py-2 border border-primary/30 text-primary/60 hover:text-primary hover:border-primary uppercase font-mono text-sm transition-colors"
          >
            ← RETOUR
          </button>
          <div className="flex items-center gap-4">
            {saved && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-accent font-mono text-xs uppercase tracking-widest"
              >
                Sauvegardé ✓
              </motion.span>
            )}
            <button
              onClick={handleSave}
              className="px-8 py-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase font-mono"
            >
              CHOISIR CE SKIN
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function getSelectedSkin(): string {
  return localStorage.getItem("liminal_skin") || "survivor";
}
