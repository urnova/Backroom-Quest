import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreateRoom } from "@workspace/api-client-react";
import { useGameStore } from "../context/GameContext";

export default function SoloSetup() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("Survivant");
  const [difficulty, setDifficulty] = useState("normal");
  const createRoom = useCreateRoom();
  const { setPlayerName, joinRoom } = useGameStore();

  const handleStart = () => {
    if (!name.trim()) return;
    
    setPlayerName(name);
    createRoom.mutate(
      { data: { hostName: name, maxPlayers: 1, difficulty } as any },
      {
        onSuccess: (room) => {
          // Immediately join the room
          // Need to know player ID, let's just navigate to game
          joinRoom(room.code, room.players[0].id);
          setLocation(`/game/${room.code}`);
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

        <div className="flex flex-col gap-2">
          <label className="text-primary/70 uppercase text-sm">Nom du Survivant</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-black/50 border border-primary/30 p-3 text-primary outline-none focus:border-primary transition-colors uppercase"
            maxLength={15}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-primary/70 uppercase text-sm">Difficulté</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              onClick={() => setDifficulty("easy")}
              className={`p-4 border text-left transition-colors ${difficulty === 'easy' ? 'border-accent text-accent bg-accent/10' : 'border-primary/30 text-primary/70 hover:border-primary/50'}`}
            >
              <div className="font-bold mb-1">🟢 FACILE</div>
              <div className="text-xs opacity-70">Plus de santé, sauvegarde activée, mobs ralentis.</div>
            </button>
            <button 
              onClick={() => setDifficulty("normal")}
              className={`p-4 border text-left transition-colors ${difficulty === 'normal' ? 'border-primary text-primary bg-primary/10' : 'border-primary/30 text-primary/70 hover:border-primary/50'}`}
            >
              <div className="font-bold mb-1">🟡 NORMAL</div>
              <div className="text-xs opacity-70">Expérience standard, sauvegarde activée.</div>
            </button>
            <button 
              onClick={() => setDifficulty("hard")}
              className={`p-4 border text-left transition-colors ${difficulty === 'hard' ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 'border-primary/30 text-primary/70 hover:border-primary/50'}`}
            >
              <div className="font-bold mb-1">🔴 DIFFICILE</div>
              <div className="text-xs opacity-70">Moins de santé, ennemis agressifs.</div>
            </button>
            <button 
              onClick={() => setDifficulty("nightmare")}
              className={`p-4 border text-left transition-colors ${difficulty === 'nightmare' ? 'border-destructive text-destructive bg-destructive/10' : 'border-primary/30 text-primary/70 hover:border-primary/50'}`}
            >
              <div className="font-bold mb-1">☠️ CAUCHEMAR</div>
              <div className="text-xs opacity-70">Aucune sauvegarde. Mort = Niveau 0.</div>
            </button>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button 
            onClick={() => setLocation("/")}
            className="px-6 py-2 border border-primary/30 text-primary/70 hover:text-primary hover:border-primary uppercase text-sm"
          >
            RETOUR
          </button>
          <button 
            onClick={handleStart}
            disabled={createRoom.isPending}
            className="px-8 py-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase"
          >
            {createRoom.isPending ? "CRÉATION..." : "PLONGER"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
