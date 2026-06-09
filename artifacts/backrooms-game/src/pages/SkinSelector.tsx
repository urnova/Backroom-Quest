import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import SkinPreview3D from "../components/SkinPreview3D";
import {
  SKINS,
  RARITY_COLORS,
  RARITY_LABELS,
  getCoins,
  getUnlockedSkins,
  unlockSkin,
  getSelectedSkin,
  setSelectedSkin,
} from "../lib/playerStore";

export { getSelectedSkin };

export default function SkinSelector() {
  const [, setLocation] = useLocation();
  const [coins, setCoins] = useState(() => getCoins());
  const [unlocked, setUnlocked] = useState<string[]>(() => getUnlockedSkins());
  const [selected, setSelected] = useState<string>(() => getSelectedSkin());
  const [saved, setSaved] = useState(false);
  const [buyConfirm, setBuyConfirm] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    if (!unlocked.includes(id)) return;
    setSelected(id);
    setSelectedSkin(id);
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }, [unlocked]);

  const handleBuy = useCallback((skinId: string) => {
    const result = unlockSkin(skinId);
    if (result.success) {
      const newUnlocked = getUnlockedSkins();
      setUnlocked(newUnlocked);
      setCoins(getCoins());
      setSelected(skinId);
      setSelectedSkin(skinId);
      setBuyConfirm(null);
    } else {
      setBuyError(result.reason ?? "Erreur");
      setTimeout(() => setBuyError(null), 2000);
      setBuyConfirm(null);
    }
  }, []);

  const previewSkin = preview ? SKINS.find(s => s.id === preview) : null;

  return (
    <div className="absolute inset-0 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-8 pt-6 pb-4 border-b border-primary/20 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-title text-primary tracking-widest">TENUES</h2>
          <p className="text-primary/30 text-xs font-mono mt-0.5 uppercase tracking-widest">
            Choisissez votre apparence dans le Liminal
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-accent font-mono text-xs uppercase tracking-widest"
            >
              Équipé ✓
            </motion.span>
          )}
          {buyError && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-destructive font-mono text-xs"
            >
              {buyError}
            </motion.span>
          )}
          <div className="flex items-center gap-2 border border-primary/30 bg-black/50 px-4 py-2">
            <span className="text-yellow-400 font-mono text-lg font-bold">◈</span>
            <span className="text-primary font-mono font-bold text-lg">{coins}</span>
            <span className="text-primary/40 font-mono text-xs uppercase ml-1">pièces</span>
          </div>
        </div>
      </div>

      {/* Skin grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {SKINS.map((skin) => {
            const isUnlocked = unlocked.includes(skin.id);
            const isSelected = selected === skin.id;
            const rarityColor = RARITY_COLORS[skin.rarity];

            return (
              <motion.div
                key={skin.id}
                layout
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (isUnlocked) handleSelect(skin.id);
                  else setPreview(skin.id);
                }}
                className={`relative flex flex-col border cursor-pointer transition-all duration-200 overflow-hidden
                  ${isSelected
                    ? "border-primary bg-primary/15 shadow-lg shadow-primary/20"
                    : isUnlocked
                      ? "border-primary/30 hover:border-primary/60 bg-black/40 hover:bg-black/60"
                      : "border-primary/15 bg-black/20 hover:border-primary/30"
                  }`}
              >
                {/* Rarity stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: rarityColor }}
                />

                {/* Selected badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10 text-primary bg-primary/20 border border-primary/40 px-1.5 py-0.5 font-mono text-xs font-bold">
                    ✓
                  </div>
                )}

                {/* Locked overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[1px]">
                    <div className="text-2xl mb-1">🔒</div>
                    <div
                      className="font-mono text-sm font-bold flex items-center gap-1"
                      style={{ color: rarityColor }}
                    >
                      <span className="text-yellow-400">◈</span> {skin.price}
                    </div>
                    <div className="text-primary/40 text-xs font-mono mt-1">Voir l'aperçu</div>
                  </div>
                )}

                {/* 3D Preview */}
                <div className="flex items-center justify-center py-3 bg-black/30">
                  <SkinPreview3D
                    skinColor={skin.color}
                    accentColor={skin.accent}
                    width={90}
                    height={120}
                  />
                </div>

                {/* Info */}
                <div className="px-3 pb-3 pt-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="text-primary font-mono text-xs font-bold uppercase truncate">
                      {skin.name}
                    </div>
                  </div>
                  <div
                    className="text-xs font-mono font-bold tracking-widest mb-1"
                    style={{ color: rarityColor, fontSize: "9px" }}
                  >
                    {RARITY_LABELS[skin.rarity]}
                  </div>
                  <p className="text-primary/40 font-mono text-xs leading-relaxed line-clamp-2">
                    {skin.desc}
                  </p>
                  {isUnlocked && !isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelect(skin.id); }}
                      className="mt-2 w-full text-center text-xs font-mono uppercase tracking-widest border border-primary/30 text-primary/60 hover:border-primary hover:text-primary py-1 transition-colors"
                    >
                      ÉQUIPER
                    </button>
                  )}
                  {!isUnlocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (coins >= skin.price) setBuyConfirm(skin.id);
                        else setBuyError("Pas assez de ◈");
                      }}
                      className={`mt-2 w-full text-center text-xs font-mono uppercase tracking-widest py-1 transition-colors border
                        ${coins >= skin.price
                          ? "border-yellow-500/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10"
                          : "border-primary/15 text-primary/30 cursor-not-allowed"
                        }`}
                    >
                      ◈ {skin.price}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Earn coins hint */}
        <div className="max-w-6xl mx-auto mt-6 border border-primary/10 bg-black/30 px-5 py-3 text-primary/30 font-mono text-xs text-center">
          ◈ Gagnez des pièces en terminant des niveaux — plus le niveau est élevé, plus vous en gagnez.
          La difficulté double les récompenses.
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-primary/20 px-8 py-4 flex justify-between items-center">
        <button
          onClick={() => setLocation("/")}
          className="px-6 py-2 border border-primary/30 text-primary/60 hover:text-primary hover:border-primary uppercase font-mono text-sm transition-colors"
        >
          ← RETOUR
        </button>
        <div className="text-primary/30 font-mono text-xs">
          {unlocked.length}/{SKINS.length} tenues débloquées
        </div>
      </div>

      {/* Buy confirmation modal */}
      <AnimatePresence>
        {buyConfirm && (() => {
          const skin = SKINS.find(s => s.id === buyConfirm);
          if (!skin) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setBuyConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="border border-primary/40 bg-black/95 p-8 text-center max-w-sm w-full mx-4"
              >
                <div className="flex justify-center mb-4">
                  <SkinPreview3D skinColor={skin.color} accentColor={skin.accent} width={100} height={130} />
                </div>
                <div className="text-primary font-title text-2xl tracking-widest mb-1">{skin.name}</div>
                <div
                  className="font-mono text-xs mb-3 tracking-widest"
                  style={{ color: RARITY_COLORS[skin.rarity] }}
                >
                  {RARITY_LABELS[skin.rarity]}
                </div>
                <p className="text-primary/50 font-mono text-xs mb-5">{skin.desc}</p>
                <div className="flex items-center justify-center gap-2 mb-6 text-yellow-400 font-mono text-lg font-bold">
                  <span>◈</span><span>{skin.price}</span>
                  <span className="text-primary/30 text-xs ml-2">({coins} disponibles)</span>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setBuyConfirm(null)}
                    className="px-5 py-2 border border-primary/30 text-primary/60 hover:text-primary font-mono text-sm uppercase"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleBuy(buyConfirm)}
                    className="px-5 py-2 bg-primary text-primary-foreground font-mono text-sm uppercase font-bold hover:bg-primary/90"
                  >
                    Acheter
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Preview modal for locked skins */}
      <AnimatePresence>
        {preview && previewSkin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="border border-primary/30 bg-black/95 p-8 text-center max-w-xs w-full mx-4"
            >
              <div className="flex justify-center mb-4">
                <SkinPreview3D skinColor={previewSkin.color} accentColor={previewSkin.accent} width={110} height={145} />
              </div>
              <div className="text-primary font-title text-2xl tracking-widest mb-1">{previewSkin.name}</div>
              <div
                className="font-mono text-xs mb-3 tracking-widest"
                style={{ color: RARITY_COLORS[previewSkin.rarity] }}
              >
                {RARITY_LABELS[previewSkin.rarity]}
              </div>
              <p className="text-primary/50 font-mono text-xs mb-5">{previewSkin.desc}</p>
              <button
                onClick={() => {
                  setPreview(null);
                  if (coins >= previewSkin.price) setBuyConfirm(previewSkin.id);
                  else setBuyError("Pas assez de ◈");
                }}
                className={`w-full py-2 font-mono text-sm uppercase font-bold transition-colors border
                  ${coins >= previewSkin.price
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                    : "border-primary/20 text-primary/30 cursor-not-allowed"
                  }`}
              >
                ◈ {previewSkin.price} — {coins >= previewSkin.price ? "Acheter" : "Pas assez de pièces"}
              </button>
              <button
                onClick={() => setPreview(null)}
                className="mt-2 w-full py-1.5 border border-primary/20 text-primary/40 hover:text-primary font-mono text-xs uppercase"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
