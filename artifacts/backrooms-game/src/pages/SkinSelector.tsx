import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import SkinViewer3D from "../components/SkinViewer3D";
import {
  SKINS, SkinDef,
  RARITY_COLORS, RARITY_LABELS,
  getCoins, getUnlockedSkins, unlockSkin,
  getSelectedSkin, setSelectedSkin,
} from "../lib/playerStore";

export { getSelectedSkin };

export default function SkinSelector() {
  const [, setLocation] = useLocation();
  const [coins, setCoins] = useState(() => getCoins());
  const [unlocked, setUnlocked] = useState<string[]>(() => getUnlockedSkins());
  const [selected, setSelected] = useState<string>(() => getSelectedSkin());
  const [active, setActive] = useState<SkinDef>(() => SKINS.find(s => s.id === getSelectedSkin()) ?? SKINS[0]);
  const [buyConfirm, setBuyConfirm] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [saveFlash, setSaveFlash] = useState(false);

  const handleCardClick = useCallback((skin: SkinDef) => {
    setActive(skin);
  }, []);

  const handleEquip = useCallback(() => {
    if (!unlocked.includes(active.id)) return;
    setSelected(active.id);
    setSelectedSkin(active.id);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1600);
  }, [active, unlocked]);

  const handleBuy = useCallback(() => {
    const result = unlockSkin(active.id);
    if (result.success) {
      const newUnlocked = getUnlockedSkins();
      setUnlocked(newUnlocked);
      setCoins(getCoins());
      setSelected(active.id);
      setSelectedSkin(active.id);
      setBuyConfirm(false);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1600);
    } else {
      setBuyError(result.reason ?? "Erreur");
      setTimeout(() => setBuyError(null), 2200);
      setBuyConfirm(false);
    }
  }, [active]);

  const isUnlocked = unlocked.includes(active.id);
  const isEquipped = selected === active.id;
  const canAfford = coins >= active.price;
  const rarityColor = RARITY_COLORS[active.rarity];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#0a0a06]"
      style={{ fontFamily: "'Share Tech Mono', monospace" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-primary/20 bg-black/60 z-10">
        <button
          onClick={() => setLocation("/")}
          className="text-primary/50 hover:text-primary text-xs uppercase tracking-widest font-mono transition-colors flex items-center gap-2"
        >
          ← MENU
        </button>
        <div className="flex items-center gap-2">
          <span className="font-title text-primary text-xl tracking-widest">TENUES</span>
          <span className="text-primary/20 text-xs">/</span>
          <span className="text-primary/40 text-xs uppercase tracking-widest">{SKINS.length} skins</span>
        </div>
        <div className="flex items-center gap-2 border border-yellow-500/30 bg-black/50 px-3 py-1.5">
          <span className="text-yellow-400 font-bold text-sm">◈</span>
          <span className="text-primary font-bold text-sm">{coins}</span>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left panel — skin list */}
        <div className="w-[280px] shrink-0 border-r border-primary/15 overflow-y-auto bg-black/40"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,180,96,0.2) transparent" }}
        >
          <div className="p-3 space-y-1">
            {SKINS.map((skin) => {
              const skinUnlocked = unlocked.includes(skin.id);
              const skinEquipped = selected === skin.id;
              const skinActive = active.id === skin.id;
              const rc = RARITY_COLORS[skin.rarity];

              return (
                <motion.button
                  key={skin.id}
                  onClick={() => handleCardClick(skin)}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.12 }}
                  className={`w-full flex items-center gap-3 p-2.5 text-left transition-colors relative overflow-hidden ${
                    skinActive
                      ? "bg-primary/15 border border-primary/50"
                      : "border border-primary/0 hover:border-primary/20 hover:bg-white/5"
                  }`}
                >
                  {/* Active left bar */}
                  {skinActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  )}

                  {/* Color swatch */}
                  <div
                    className="w-10 h-10 shrink-0 flex items-center justify-center relative"
                    style={{ background: skin.color, border: `1px solid ${rc}55` }}
                  >
                    {skinEquipped && (
                      <span className="text-white text-xs font-bold drop-shadow-lg">✓</span>
                    )}
                    {!skinUnlocked && (
                      <span className="text-white/80 text-xs">🔒</span>
                    )}
                    {/* Rarity dot */}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2"
                      style={{ background: rc }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-primary text-xs font-bold uppercase truncate">
                      {skin.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: rc }}
                      >
                        {RARITY_LABELS[skin.rarity]}
                      </span>
                      {!skinUnlocked && (
                        <span className="text-yellow-400/70 text-[9px]">◈ {skin.price}</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right panel — preview + info */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex gap-0 overflow-hidden">

            {/* 3D Viewer */}
            <div className="flex-1 flex items-center justify-center bg-[#080808] relative overflow-hidden">
              {/* Background glow behind character */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 50% 60% at 50% 60%, ${active.color}18 0%, transparent 70%)`,
                }}
              />
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <SkinViewer3D skin={active} height={500} className="w-full h-full" />
              </motion.div>

              {/* Rarity glow stripe at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, transparent, ${rarityColor}88, transparent)` }}
              />
            </div>

            {/* Info panel */}
            <div className="w-72 shrink-0 flex flex-col border-l border-primary/15 bg-black/50 overflow-y-auto">
              <div className="p-6 flex flex-col gap-5 flex-1">
                {/* Name + Rarity */}
                <div>
                  <motion.h2
                    key={active.id + "name"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-title text-2xl tracking-widest text-primary leading-tight"
                  >
                    {active.name.toUpperCase()}
                  </motion.h2>
                  <div
                    className="text-[10px] font-bold uppercase tracking-[0.3em] mt-1"
                    style={{ color: rarityColor }}
                  >
                    {RARITY_LABELS[active.rarity]}
                  </div>
                </div>

                {/* Rarity stripe */}
                <div
                  className="h-px w-full"
                  style={{ background: `linear-gradient(90deg, ${rarityColor}88, transparent)` }}
                />

                {/* Description */}
                <p className="text-primary/60 font-mono text-xs leading-relaxed">
                  {active.desc}
                </p>

                {/* Visual style tags */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    active.visual.style !== "standard" && active.visual.style.toUpperCase(),
                    active.visual.hatType !== "none" && active.visual.hatType.replace("_", " ").toUpperCase(),
                    ...active.visual.extras.map(e => e.replace("_", " ").toUpperCase()),
                  ].filter(Boolean).map((tag, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider border"
                      style={{ borderColor: `${rarityColor}44`, color: `${rarityColor}cc` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Status messages */}
                <AnimatePresence>
                  {saveFlash && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-accent text-xs font-mono uppercase tracking-widest"
                    >
                      ✓ Tenue équipée
                    </motion.div>
                  )}
                  {buyError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-destructive text-xs font-mono"
                    >
                      {buyError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1" />

                {/* Action button */}
                <div className="space-y-2">
                  {isEquipped ? (
                    <div className="w-full py-3 text-center text-xs font-mono uppercase tracking-widest border border-accent/40 text-accent">
                      ✓ ÉQUIPÉE
                    </div>
                  ) : isUnlocked ? (
                    <button
                      onClick={handleEquip}
                      className="w-full py-3 bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors"
                    >
                      ÉQUIPER
                    </button>
                  ) : canAfford ? (
                    <button
                      onClick={() => setBuyConfirm(true)}
                      className="w-full py-3 bg-yellow-500/20 border border-yellow-500/60 text-yellow-300 text-xs font-mono uppercase tracking-widest font-bold hover:bg-yellow-500/30 transition-colors"
                    >
                      ◈ {active.price} — ACHETER
                    </button>
                  ) : (
                    <div className="w-full py-3 text-center text-xs font-mono uppercase tracking-widest border border-primary/15 text-primary/25">
                      ◈ {active.price} — INSUFFISANT
                    </div>
                  )}

                  <div className="text-primary/20 font-mono text-[10px] text-center">
                    {unlocked.length}/{SKINS.length} débloqués
                  </div>
                </div>
              </div>

              {/* Earn hint */}
              <div className="border-t border-primary/10 px-5 py-3 text-primary/20 font-mono text-[10px] leading-relaxed">
                ◈ Terminez des niveaux pour gagner des pièces.
                Niveau élevé + difficulté = plus de récompenses.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy confirmation */}
      <AnimatePresence>
        {buyConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setBuyConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="border border-primary/40 bg-[#0d0d08] p-8 max-w-xs w-full mx-4 text-center"
            >
              <div
                className="font-title text-xl tracking-widest mb-1 text-primary"
              >
                {active.name.toUpperCase()}
              </div>
              <div
                className="font-mono text-[10px] mb-4 tracking-widest uppercase"
                style={{ color: rarityColor }}
              >
                {RARITY_LABELS[active.rarity]}
              </div>
              <p className="text-primary/40 font-mono text-xs mb-5 leading-relaxed">{active.desc}</p>
              <div className="text-yellow-400 font-mono font-bold text-lg mb-1">◈ {active.price}</div>
              <div className="text-primary/30 font-mono text-xs mb-6">({coins} pièces disponibles)</div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setBuyConfirm(false)}
                  className="px-5 py-2 border border-primary/30 text-primary/60 hover:text-primary font-mono text-xs uppercase transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBuy}
                  className="px-5 py-2 bg-primary text-primary-foreground font-mono text-xs uppercase font-bold hover:bg-primary/90 transition-colors"
                >
                  Acheter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
