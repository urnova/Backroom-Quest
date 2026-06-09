import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

const TUTORIAL_KEY = "liminal_tutorial_done";

const steps = [
  {
    title: "BIENVENUE DANS LE LIMINAL",
    icon: "👁",
    lines: [
      "Vous êtes piégé dans des espaces entre les mondes.",
      "Survivez. Trouvez la sortie. Passez au niveau suivant.",
    ],
  },
  {
    title: "DÉPLACEMENT",
    icon: "🎮",
    lines: [
      "Déplacer : Z Q S D (ou flèches directionnelles)",
      "Sprint : Maintenir Shift",
      "Regarder : Déplacer la souris (cliquez pour verrouiller)",
    ],
  },
  {
    title: "ACTIONS",
    icon: "⚡",
    lines: [
      "Attaquer : Clic gauche (à portée d'une entité)",
      "Lampe torche : F",
      "Émotes : Maintenir E",
      "Chat : T",
    ],
  },
  {
    title: "SURVIE",
    icon: "💀",
    lines: [
      "Votre SANITÉ diminue près des entités.",
      "À sanité faible, des hallucinations apparaissent.",
      "Trouvez le portail vert brillant pour avancer.",
      "Bonne chance. Vous en aurez besoin.",
    ],
  },
];

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const { settings } = useSettings();

  const next = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      localStorage.setItem(TUTORIAL_KEY, "1");
      onDone();
    }
  };

  const skip = () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    onDone();
  };

  const current = steps[step];

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-16 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto border border-primary/40 bg-black/85 backdrop-blur-sm p-6 max-w-md w-full mx-4"
          style={{ boxShadow: "0 0 30px rgba(200,180,96,0.15)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{current.icon}</span>
            <h3 className="text-primary font-title text-lg tracking-widest">{current.title}</h3>
          </div>

          <div className="space-y-1.5 mb-4">
            {current.lines.map((line, i) => (
              <p key={i} className="text-primary/70 font-mono text-xs leading-relaxed">
                {line}
              </p>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i <= step ? "bg-primary" : "bg-primary/20"}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={skip}
                className="text-primary/30 hover:text-primary/60 text-xs uppercase font-mono tracking-widest transition-colors"
              >
                Passer
              </button>
              <button
                onClick={next}
                className="px-5 py-1.5 bg-primary text-primary-foreground text-xs uppercase font-mono font-bold hover:bg-primary/90 transition-colors tracking-widest"
              >
                {step < steps.length - 1 ? "Suivant →" : "C'est parti !"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function shouldShowTutorial(): boolean {
  return !localStorage.getItem(TUTORIAL_KEY);
}
