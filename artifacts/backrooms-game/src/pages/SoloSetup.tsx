import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreateRoom } from "@workspace/api-client-react";
import { useGameStore } from "../context/GameContext";

export default function SoloSetup() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("Survivant");
  const [difficulty, setDifficulty] = useState("normal");
  const [waiting, setWaiting] = useState(false);
  const createRoom = useCreateRoom();
  const { setPlayerName, joinAndStartSolo, gameState, roomCode } = useGameStore();

  useEffect(() => {
    if (waiting && gameState && roomCode) {
      setLocation(`/game/${roomCode}`);
    }
  }, [waiting, gameState, roomCode, setLocation]);

  const handleStart = () => {
    if (!name.trim()) return;
    setPlayerName(name);
    createRoom.mutate(
      { data: { hostName: name, maxPlayers: 1, difficulty } as any },
      {
        onSuccess: (room: any) => {
          joinAndStartSolo(room.code, room.players[0].id);
          setWaiting(true);
        },
        onError: () => {
          setWaiting(false);
        }
      }
    );
  };

  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl border border-primary/30 bg-black/50 p-8 flex flex-col gap-6 shadow-2xl shadow-primary/10"
      >
        <h2 className="text-3xl font-title text-primary text-center">MODE SOLO</h2>

        {waiting ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="text-primary font-mono text-lg flicker">INITIALISATION DU LIMINAL...</div>
            <div className="text-primary/40 font-mono text-xs tracking-widest">GÉNÉRATION DES ESPACES EN COURS</div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-primary/70 uppercase text-sm font-mono">Nom du Survivant</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/50 border border-primary/30 p-3 text-primary outline-none focus:border-primary transition-colors uppercase font-mono"
                maxLength={15}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-primary/70 uppercase text-sm font-mono">Difficulté</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setDifficulty("easy")}
                  className={`p-4 border text-left transition-colors ${difficulty === 'easy' ? 'border-accent text-accent bg-accent/10' : 'border-primary/30 text-primary/70 hover:border-primary/50'}`}
                >
                  <div className="font-bold mb-1 font-mono">🟢 FACILE</div>
                  <div className="text-xs opacity-70 font-mono">Plus de santé, sauvegarde activée, entités ralenties.</div>
                </button>
                <button
                  onClick={() => setDifficulty("normal")}
                  className={`p-4 border text-left transition-colors ${difficulty === 'normal' ? 'border-primary text-primary bg-primary/10' : 'border-primary/30 text-primary/70 hover:border-primary/50'}`}
                >
                  <div className="font-bold mb-1 font-mono">🟡 NORMAL</div>
                  <div className="text-xs opacity-70 font-mono">Expérience standard, sauvegarde activée.</div>
                </button>
                <button
                  onClick={() => setDifficulty("hard")}
                  className={`p-4 border text-left transition-colors ${difficulty === 'hard' ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 'border-primary/30 text-primary/70 hover:border-primary/50'}`}
                >
                  <div className="font-bold mb-1 font-mono">🔴 DIFFICILE</div>
                  <div className="text-xs opacity-70 font-mono">Moins de santé, entités agressives.</div>
                </button>
                <button
                  onClick={() => setDifficulty("nightmare")}
                  className={`p-4 border text-left transition-colors ${difficulty === 'nightmare' ? 'border-destructive text-destructive bg-destructive/10' : 'border-primary/30 text-primary/70 hover:border-primary/50'}`}
                >
                  <div className="font-bold mb-1 font-mono">☠️ CAUCHEMAR</div>
                  <div className="text-xs opacity-70 font-mono">Aucune sauvegarde. Mort = Niveau 0.</div>
                </button>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setLocation("/")}
                className="px-6 py-2 border border-primary/30 text-primary/70 hover:text-primary hover:border-primary uppercase text-sm font-mono"
              >
                RETOUR
              </button>
              <button
                onClick={handleStart}
                disabled={createRoom.isPending}
                className="px-8 py-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase font-mono"
              >
                {createRoom.isPending ? "CRÉATION..." : "PLONGER"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
