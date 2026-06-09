import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TUTORIAL_KEY = "liminal_tutorial_done";

const steps = [
  {
    title: "BIENVENUE DANS LE LIMINAL",
    icon: "👁",
    lines: [
      "Vous êtes piégé dans des espaces entre les mondes.",
      "Survivez. Trouvez la sortie. Passez au niveau suivant.",
      "Chaque niveau devient plus dangereux. Bonne chance.",
    ],
  },
  {
    title: "DÉPLACEMENT",
    icon: "🎮",
    lines: [
      "Avancer / Reculer : Z / S  (ou W / S en QWERTY)",
      "Gauche / Droite : Q / D  (ou A / D en QWERTY)",
      "Sprint : Maintenir SHIFT",
      "Regarder : Déplacer la souris  (cliquez pour verrouiller)",
      "Flèches directionnelles : alternative universelle",
    ],
  },
  {
    title: "ACTIONS EN JEU",
    icon: "⚡",
    lines: [
      "Attaquer : Clic gauche  (quand une entité est proche)",
      "Lampe torche : Touche F",
      "Émotes / Interagir : Touche E",
      "Inventaire : Touche TAB",
      "Chat : Touche T",
      "Pause / Menu : Touche ÉCHAP",
    ],
  },
  {
    title: "OBJETS AU SOL",
    icon: "💊",
    lines: [
      "Croix rouge  → Trousse de soins  (+40 PV)",
      "Capsule jaune → Batterie  (recharge la lampe torche)",
      "Diamant bleu  → Boost de vitesse  (×1.5 pendant 30s)",
      "Marchez sur un objet pour le ramasser automatiquement.",
    ],
  },
  {
    title: "SURVIE",
    icon: "💀",
    lines: [
      "Votre SANITÉ MENTALE diminue près des entités.",
      "À sanité faible, des hallucinations apparaissent.",
      "Trouvez le portail lumineux vert pour avancer.",
      "Completez des niveaux pour gagner des ◈ pièces.",
    ],
  },
];

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

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
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-12 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto border border-primary/40 bg-black/90 backdrop-blur-sm p-6 max-w-lg w-full mx-4"
          style={{ boxShadow: "0 0 40px rgba(200,180,96,0.12)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{current.icon}</span>
            <h3 className="text-primary font-title text-lg tracking-widest">{current.title}</h3>
            <span className="ml-auto text-primary/30 font-mono text-xs">{step + 1}/{steps.length}</span>
          </div>

          <div className="space-y-1.5 mb-5">
            {current.lines.map((line, i) => (
              <p key={i} className="text-primary/80 font-mono text-xs leading-relaxed flex items-start gap-2">
                <span className="text-primary/30 mt-0.5">▸</span>
                <span>{line}</span>
              </p>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    i === step ? "w-4 h-2 bg-primary" : i < step ? "w-2 h-2 bg-primary/60" : "w-2 h-2 bg-primary/20"
                  }`}
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
