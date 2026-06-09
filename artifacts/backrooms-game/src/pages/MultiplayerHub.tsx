import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreateRoom, useJoinRoom } from "@workspace/api-client-react";
import { useGameStore } from "../context/GameContext";

export default function MultiplayerHub() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [joinCode, setJoinCode] = useState("");
  const [difficulty, setDifficulty] = useState("normal");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState("");

  const createRoom = useCreateRoom();
  const joinRoomMut = useJoinRoom();
  const { setPlayerName, joinRoom: connectSocket } = useGameStore();

  const handleCreate = () => {
    if (!name.trim()) return;
    setPlayerName(name);
    createRoom.mutate(
      { data: { hostName: name, maxPlayers, difficulty } as any },
      {
        onSuccess: (room) => {
          connectSocket(room.code, room.players[0].id);
          setLocation(`/lobby/${room.code}`);
        },
        onError: () => setError("Erreur de création")
      }
    );
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    setPlayerName(name);
    joinRoomMut.mutate(
      { code: joinCode.toUpperCase(), data: { playerName: name } },
      {
        onSuccess: (res) => {
          connectSocket(res.room.code, res.playerId);
          setLocation(`/lobby/${res.room.code}`);
        },
        onError: () => setError("Code invalide ou salon plein")
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
        <h2 className="text-3xl font-title text-primary text-center">MULTIJOUEUR</h2>

        {mode === "choose" && (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-primary/70 uppercase text-sm">Votre Pseudo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/50 border border-primary/30 p-3 text-primary outline-none focus:border-primary transition-colors uppercase"
                maxLength={15}
              />
            </div>
            
            <button 
              onClick={() => name.trim() ? setMode("create") : setError("Entrez un pseudo")}
              className="mt-4 px-6 py-4 border border-primary text-primary hover:bg-primary/20 uppercase tracking-widest transition-colors"
            >
              CRÉER UNE PARTIE
            </button>
            <button 
              onClick={() => name.trim() ? setMode("join") : setError("Entrez un pseudo")}
              className="px-6 py-4 border border-primary text-primary hover:bg-primary/20 uppercase tracking-widest transition-colors"
            >
              REJOINDRE UNE PARTIE
            </button>
            {error && <div className="text-destructive text-sm text-center">{error}</div>}
            
            <Link href="/" className="mt-4 text-center text-primary/50 hover:text-primary text-sm uppercase">
              RETOUR
            </Link>
          </div>
        )}

        {mode === "create" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-primary/70 uppercase text-sm">Difficulté</label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                className="bg-black/50 border border-primary/30 p-3 text-primary outline-none uppercase"
              >
                <option value="easy">FACILE</option>
                <option value="normal">NORMAL</option>
                <option value="hard">DIFFICILE</option>
                <option value="nightmare">CAUCHEMAR</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-primary/70 uppercase text-sm">Joueurs Max ({maxPlayers})</label>
              <input 
                type="range" 
                min="2" max="8" 
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="accent-primary"
              />
            </div>
            
            <div className="flex justify-between mt-8">
              <button 
                onClick={() => setMode("choose")}
                className="px-6 py-2 border border-primary/30 text-primary/70 hover:text-primary hover:border-primary uppercase text-sm"
              >
                RETOUR
              </button>
              <button 
                onClick={handleCreate}
                disabled={createRoom.isPending}
                className="px-8 py-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase"
              >
                {createRoom.isPending ? "CRÉATION..." : "CRÉER"}
              </button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-primary/70 uppercase text-sm">Code du Salon (6 lettres)</label>
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-black/50 border border-primary/30 p-3 text-primary text-center text-2xl tracking-[0.5em] outline-none focus:border-primary uppercase"
                maxLength={6}
              />
            </div>
            {error && <div className="text-destructive text-sm text-center">{error}</div>}
            
            <div className="flex justify-between mt-8">
              <button 
                onClick={() => { setMode("choose"); setError(""); }}
                className="px-6 py-2 border border-primary/30 text-primary/70 hover:text-primary hover:border-primary uppercase text-sm"
              >
                RETOUR
              </button>
              <button 
                onClick={handleJoin}
                disabled={joinRoomMut.isPending}
                className="px-8 py-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase"
              >
                {joinRoomMut.isPending ? "CONNEXION..." : "REJOINDRE"}
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
