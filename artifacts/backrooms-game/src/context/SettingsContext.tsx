import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Keybindings {
  forward: string;
  backward: string;
  strafeLeft: string;
  strafeRight: string;
  sprint: string;
  flashlight: string;
  emote: string;
  chat: string;
}

export interface GraphicsSettings {
  renderQuality: "low" | "medium" | "high";
  crtEffect: boolean;
  filmGrain: boolean;
  vignette: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
}

export interface Settings {
  keybindings: Keybindings;
  graphics: GraphicsSettings;
  audio: AudioSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  keybindings: {
    forward: "z",
    backward: "s",
    strafeLeft: "q",
    strafeRight: "d",
    sprint: "shift",
    flashlight: "f",
    emote: "e",
    chat: "t",
  },
  graphics: {
    renderQuality: "medium",
    crtEffect: true,
    filmGrain: false,
    vignette: true,
  },
  audio: {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
  },
};

export const QWERTY_BINDINGS: Keybindings = {
  forward: "w",
  backward: "s",
  strafeLeft: "a",
  strafeRight: "d",
  sprint: "shift",
  flashlight: "f",
  emote: "e",
  chat: "t",
};

export const AZERTY_BINDINGS: Keybindings = {
  forward: "z",
  backward: "s",
  strafeLeft: "q",
  strafeRight: "d",
  sprint: "shift",
  flashlight: "f",
  emote: "e",
  chat: "t",
};

interface SettingsContextType {
  settings: Settings;
  updateKeybindings: (kb: Partial<Keybindings>) => void;
  updateGraphics: (g: Partial<GraphicsSettings>) => void;
  updateAudio: (a: Partial<AudioSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("liminal_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          keybindings: { ...DEFAULT_SETTINGS.keybindings, ...parsed.keybindings },
          graphics: { ...DEFAULT_SETTINGS.graphics, ...parsed.graphics },
          audio: { ...DEFAULT_SETTINGS.audio, ...parsed.audio },
        };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("liminal_settings", JSON.stringify(settings));
  }, [settings]);

  const updateKeybindings = (kb: Partial<Keybindings>) =>
    setSettings((prev) => ({ ...prev, keybindings: { ...prev.keybindings, ...kb } }));

  const updateGraphics = (g: Partial<GraphicsSettings>) =>
    setSettings((prev) => ({ ...prev, graphics: { ...prev.graphics, ...g } }));

  const updateAudio = (a: Partial<AudioSettings>) =>
    setSettings((prev) => ({ ...prev, audio: { ...prev.audio, ...a } }));

  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  return (
    <SettingsContext.Provider value={{ settings, updateKeybindings, updateGraphics, updateAudio, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
