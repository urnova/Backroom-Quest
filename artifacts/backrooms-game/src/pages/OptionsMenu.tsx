import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useSettings, AZERTY_BINDINGS, QWERTY_BINDINGS, DEFAULT_SETTINGS } from "../context/SettingsContext";

type Tab = "graphics" | "controls" | "audio";

const KEY_LABELS: Record<string, string> = {
  forward: "Avancer",
  backward: "Reculer",
  strafeLeft: "Gauche",
  strafeRight: "Droite",
  sprint: "Sprint",
  flashlight: "Lampe torche",
  emote: "Émotes",
  chat: "Chat",
};

export default function OptionsMenu() {
  const [, setLocation] = useLocation();
  const { settings, updateKeybindings, updateGraphics, updateAudio, resetSettings } = useSettings();
  const [tab, setTab] = useState<Tab>("graphics");
  const [rebinding, setRebinding] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleRebind = (action: string) => {
    setRebinding(action);
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key === " " ? "space" : e.key.toLowerCase();
      updateKeybindings({ [action]: key });
      setRebinding(null);
      window.removeEventListener("keydown", onKey, true);
    };
    window.addEventListener("keydown", onKey, true);
  };

  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl border border-primary/30 bg-black/70 backdrop-blur shadow-2xl shadow-primary/10 flex flex-col"
        style={{ minHeight: "560px" }}
      >
        <div className="border-b border-primary/20 px-8 pt-6 pb-0 flex flex-col gap-1">
          <h2 className="text-3xl font-title text-primary text-center tracking-widest mb-4">OPTIONS</h2>
          <div className="flex gap-0 -mb-px">
            {(["graphics", "controls", "audio"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 uppercase text-xs font-mono tracking-widest border-t border-x transition-colors ${
                  tab === t
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-primary/20 text-primary/40 hover:text-primary/70 hover:bg-primary/5"
                }`}
              >
                {t === "graphics" ? "🖥 Graphismes" : t === "controls" ? "⌨ Contrôles" : "🔊 Audio"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-8 overflow-auto">
          {tab === "graphics" && (
            <div className="flex flex-col gap-6">
              <SettingRow label="Qualité de rendu">
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => updateGraphics({ renderQuality: q })}
                      className={`px-4 py-1.5 text-xs uppercase font-mono border transition-colors ${
                        settings.graphics.renderQuality === q
                          ? "border-primary text-primary bg-primary/15"
                          : "border-primary/30 text-primary/50 hover:border-primary/50"
                      }`}
                    >
                      {q === "low" ? "Basse" : q === "medium" ? "Moyenne" : "Haute"}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Effet CRT (scanlines)" hint="Désactiver pour une meilleure lisibilité">
                <Toggle
                  value={settings.graphics.crtEffect}
                  onChange={(v) => updateGraphics({ crtEffect: v })}
                />
              </SettingRow>

              <SettingRow label="Grain de film" hint="Texture granuleuse sur l'écran">
                <Toggle
                  value={settings.graphics.filmGrain}
                  onChange={(v) => updateGraphics({ filmGrain: v })}
                />
              </SettingRow>

              <SettingRow label="Vignette" hint="Assombrissement des bords de l'écran">
                <Toggle
                  value={settings.graphics.vignette}
                  onChange={(v) => updateGraphics({ vignette: v })}
                />
              </SettingRow>
            </div>
          )}

          {tab === "controls" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 mb-2">
                <button
                  onClick={() => updateKeybindings(AZERTY_BINDINGS)}
                  className="px-4 py-1.5 text-xs uppercase font-mono border border-primary/40 text-primary/70 hover:text-primary hover:border-primary transition-colors"
                >
                  Preset AZERTY
                </button>
                <button
                  onClick={() => updateKeybindings(QWERTY_BINDINGS)}
                  className="px-4 py-1.5 text-xs uppercase font-mono border border-primary/40 text-primary/70 hover:text-primary hover:border-primary transition-colors"
                >
                  Preset QWERTY
                </button>
              </div>

              <div className="text-primary/30 text-xs font-mono mb-1 uppercase">Cliquez sur une touche pour la reconfigurer</div>

              {Object.entries(settings.keybindings).map(([action, key]) => (
                <div key={action} className="flex items-center justify-between border-b border-primary/10 pb-3">
                  <span className="text-primary/70 font-mono text-sm uppercase">{KEY_LABELS[action] ?? action}</span>
                  <button
                    onClick={() => handleRebind(action)}
                    className={`px-5 py-1.5 min-w-[80px] text-center border font-mono uppercase text-sm transition-all ${
                      rebinding === action
                        ? "border-accent text-accent bg-accent/10 animate-pulse"
                        : "border-primary/40 text-primary hover:border-primary hover:bg-primary/10"
                    }`}
                  >
                    {rebinding === action ? "..." : key === " " ? "ESPACE" : key.toUpperCase()}
                  </button>
                </div>
              ))}

              <div className="mt-2 text-primary/30 text-xs font-mono">
                <div>• Clic gauche : Attaquer</div>
                <div>• Clic gauche (non verrouillé) : Verrouiller la souris</div>
                <div>• ESC : Déverrouiller la souris</div>
              </div>
            </div>
          )}

          {tab === "audio" && (
            <div className="flex flex-col gap-6">
              <SettingRow label={`Volume général — ${Math.round(settings.audio.masterVolume * 100)}%`}>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={settings.audio.masterVolume}
                  onChange={(e) => updateAudio({ masterVolume: parseFloat(e.target.value) })}
                  className="w-48 accent-primary"
                />
              </SettingRow>

              <SettingRow label={`Effets sonores — ${Math.round(settings.audio.sfxVolume * 100)}%`}>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={settings.audio.sfxVolume}
                  onChange={(e) => updateAudio({ sfxVolume: parseFloat(e.target.value) })}
                  className="w-48 accent-primary"
                />
              </SettingRow>

              <SettingRow label={`Musique — ${Math.round(settings.audio.musicVolume * 100)}%`}>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={settings.audio.musicVolume}
                  onChange={(e) => updateAudio({ musicVolume: parseFloat(e.target.value) })}
                  className="w-48 accent-primary"
                />
              </SettingRow>
            </div>
          )}
        </div>

        <div className="border-t border-primary/20 px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => { resetSettings(); setSaved(false); }}
            className="text-primary/40 hover:text-primary/70 text-xs uppercase font-mono tracking-widest transition-colors"
          >
            Réinitialiser
          </button>
          <div className="flex gap-3">
            {saved && <span className="text-accent text-xs font-mono uppercase tracking-widest self-center">Sauvegardé ✓</span>}
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase font-mono text-sm"
            >
              Sauvegarder
            </button>
            <button
              onClick={() => setLocation("/")}
              className="px-6 py-2 border border-primary/30 text-primary/70 hover:text-primary hover:border-primary uppercase font-mono text-sm transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-primary/80 font-mono text-sm uppercase">{label}</div>
        {hint && <div className="text-primary/30 font-mono text-xs mt-0.5">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative ${value ? "bg-primary" : "bg-primary/20 border border-primary/30"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${value ? "left-6" : "left-0.5"}`}
      />
    </button>
  );
}
