import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreateRoom, useJoinRoom } from "@workspace/api-client-react";
import { useGameStore } from "../context/GameContext";
import { getSavedPseudo, getSelectedSkin } from "../lib/playerStore";

const DIFFICULTY_INFO = {
  easy: { label: "🟢 FACILE", desc: "Plus de santé, entités lentes, sauvegarde activée." },
  normal: { label: "🟡 NORMAL", desc: "Expérience équilibrée, sauvegarde activée." },
  hard: { label: "🔴 DIFFICILE", desc: "Entités agressives, moins de soin entre niveaux." },
  nightmare: { label: "☠️ CAUCHEMAR", desc: "Aucune sauvegarde. Mort permanente." },
};

export default function MultiplayerHub() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState(() => getSavedPseudo() || "");
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [joinCode, setJoinCode] = useState("");
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTY_INFO>("normal");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState("");

  const createRoom = useCreateRoom();
  const joinRoomMut = useJoinRoom();
  const { setPlayerName, joinRoom: connectSocket } = useGameStore();

  const handleCreate = () => {
    if (!name.trim()) { setError("Entrez un pseudo"); return; }
    setError("");
    setPlayerName(name);
    createRoom.reset();
    createRoom.mutate(
      { data: { hostName: name, maxPlayers, difficulty, skin: getSelectedSkin() } as any },
      {
        onSuccess: (room: any) => {
          connectSocket(room.code, room.players[0].id);
          setLocation(`/lobby/${room.code}`);
        },
        onError: (err: any) => setError(err?.message || "Erreur de création de salon"),
      }
    );
  };

  const handleJoin = () => {
    if (!name.trim()) { setError("Entrez un pseudo"); return; }
    if (!joinCode.trim()) { setError("Entrez un code de salon"); return; }
    setError("");
    setPlayerName(name);
    joinRoomMut.reset();
    joinRoomMut.mutate(
      { code: joinCode.toUpperCase(), data: { playerName: name } },
      {
        onSuccess: (res: any) => {
          connectSocket(res.room.code, res.playerId);
          setLocation(`/lobby/${res.room.code}`);
        },
        onError: (err: any) => setError(err?.message || "Code invalide, salon introuvable ou complet"),
      }
    );
  };

  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl border border-primary/30 bg-black/60 shadow-2xl shadow-primary/10 flex flex-col"
      >
        <div className="px-8 pt-6 pb-4 border-b border-primary/20">
          <h2 className="text-3xl font-title text-primary text-center tracking-widest">MULTIJOUEUR</h2>
          <p className="text-primary/30 text-xs text-center font-mono mt-1 uppercase tracking-widest">
            Jusqu'à 8 joueurs
          </p>
        </div>

        <div className="p-8 flex flex-col gap-5">
          {mode === "choose" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-primary/70 uppercase text-xs font-mono tracking-widest">Votre Pseudo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && setMode("create")}
                  placeholder="SURVIVANT"
                  className="bg-black/50 border border-primary/30 p-3 text-primary outline-none focus:border-primary transition-colors uppercase font-mono"
                  maxLength={15}
                />
              </div>

              {error && <div className="text-destructive text-sm text-center font-mono">{error}</div>}

              <div className="flex flex-col gap-3 mt-2">
                <button
                  onClick={() => name.trim() ? setMode("create") : setError("Entrez un pseudo")}
                  className="px-6 py-4 border border-primary text-primary hover:bg-primary/20 uppercase tracking-widest transition-colors font-mono text-sm"
                >
                  ⚔ CRÉER UNE PARTIE
                </button>
                <button
                  onClick={() => name.trim() ? setMode("join") : setError("Entrez un pseudo")}
                  className="px-6 py-4 border border-primary/40 text-primary/70 hover:bg-primary/10 hover:border-primary/60 uppercase tracking-widest transition-colors font-mono text-sm"
                >
                  🔑 REJOINDRE UNE PARTIE
                </button>
              </div>

              <Link href="/" className="mt-2 text-center text-primary/40 hover:text-primary/70 text-xs uppercase font-mono tracking-widest transition-colors">
                ← RETOUR AU MENU
              </Link>
            </>
          )}

          {mode === "create" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-primary/70 uppercase text-xs font-mono tracking-widest">Difficulté</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DIFFICULTY_INFO).map(([key, { label, desc }]) => (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key as keyof typeof DIFFICULTY_INFO)}
                      className={`p-3 border text-left transition-colors ${
                        difficulty === key
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-primary/20 text-primary/60 hover:border-primary/40 hover:text-primary/80"
                      }`}
                    >
                      <div className="font-bold font-mono text-xs mb-0.5">{label}</div>
                      <div className="text-xs opacity-60 font-mono leading-tight">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-primary/70 uppercase text-xs font-mono tracking-widest">
                  Joueurs max — <span className="text-primary">{maxPlayers}</span>
                </label>
                <input
                  type="range" min="2" max="8"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="accent-primary"
                />
                <div className="flex justify-between text-primary/30 text-xs font-mono">
                  <span>2</span><span>8</span>
                </div>
              </div>

              {error && <div className="text-destructive text-sm text-center font-mono">{error}</div>}

              <div className="flex justify-between mt-2">
                <button
                  onClick={() => { setMode("choose"); setError(""); }}
                  className="px-6 py-2 border border-primary/30 text-primary/60 hover:text-primary hover:border-primary uppercase text-sm font-mono transition-colors"
                >
                  ← RETOUR
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createRoom.isPending}
                  className="px-8 py-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase font-mono disabled:opacity-50"
                >
                  {createRoom.isPending ? "CRÉATION..." : "CRÉER LE SALON"}
                </button>
              </div>
            </>
          )}

          {mode === "join" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-primary/70 uppercase text-xs font-mono tracking-widest">
                  Code du salon (6 caractères)
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="XXXXXX"
                  className="bg-black/50 border border-primary/30 p-4 text-primary text-center text-3xl tracking-[0.5em] outline-none focus:border-primary uppercase font-mono"
                  maxLength={6}
                />
              </div>

              <div className="text-primary/30 text-xs font-mono text-center">
                Demandez le code au créateur de la partie
              </div>

              {error && <div className="text-destructive text-sm text-center font-mono">{error}</div>}

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => { setMode("choose"); setError(""); setJoinCode(""); }}
                  className="px-6 py-2 border border-primary/30 text-primary/60 hover:text-primary hover:border-primary uppercase text-sm font-mono transition-colors"
                >
                  ← RETOUR
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joinRoomMut.isPending || joinCode.length !== 6}
                  className="px-8 py-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase font-mono disabled:opacity-50"
                >
                  {joinRoomMut.isPending ? "CONNEXION..." : "REJOINDRE"}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
