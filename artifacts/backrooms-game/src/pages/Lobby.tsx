import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetRoom } from "@workspace/api-client-react";
import { useGameStore } from "../context/GameContext";
import { Room } from "../types/game";

interface ChatMsg { id: string; text: string; type: "chat" | "system" | "join" | "leave"; player?: string; }

export default function Lobby() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { socket, playerId, startGame } = useGameStore();
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: initialRoom } = useGetRoom(code || "", {
    query: { enabled: !!code, queryKey: ["room", code] },
  });

  useEffect(() => {
    if (initialRoom && !roomData) setRoomData(initialRoom as unknown as Room);
  }, [initialRoom, roomData]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdated = (room: Room) => setRoomData(room);
    const handleStarted = () => setLocation(`/game/${code}`);

    const handlePlayerLeft = (data: { playerId: string; playerName?: string }) => {
      const name = data.playerName || "Un joueur";
      setMessages(prev => [...prev, {
        id: Date.now().toString(), text: `${name} a quitté la partie.`, type: "leave",
      }]);
    };

    const handlePlayerJoined = (data: { playerName?: string }) => {
      const name = data.playerName || "Un joueur";
      setMessages(prev => [...prev, {
        id: Date.now().toString(), text: `${name} a rejoint la partie.`, type: "join",
      }]);
    };

    const handleChat = (data: { playerId: string; playerName: string; message: string }) => {
      setMessages(prev => [...prev.slice(-49), {
        id: Date.now().toString(), text: data.message, type: "chat", player: data.playerName,
      }]);
    };

    const handleKicked = (data: { targetId: string }) => {
      if (data.targetId === playerId) {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "Vous avez été expulsé par l'hôte.", type: "system" }]);
        setTimeout(() => setLocation("/"), 1500);
      }
    };

    socket.on("room:updated", handleUpdated);
    socket.on("game:started", handleStarted);
    socket.on("player:left", handlePlayerLeft);
    socket.on("player:joined", handlePlayerJoined);
    socket.on("chat:message", handleChat);
    socket.on("player:kicked", handleKicked);

    return () => {
      socket.off("room:updated", handleUpdated);
      socket.off("game:started", handleStarted);
      socket.off("player:left", handlePlayerLeft);
      socket.off("player:joined", handlePlayerJoined);
      socket.off("chat:message", handleChat);
      socket.off("player:kicked", handleKicked);
    };
  }, [socket, code, setLocation, playerId]);

  if (!roomData) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-primary font-title text-2xl flicker">
        CONNEXION AU NÉANT...
      </div>
    );
  }

  const isHost = roomData.players.find(p => p.id === playerId)?.isHost;
  const copyCode = () => {
    navigator.clipboard.writeText(roomData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sendChat = () => {
    if (!chatInput.trim() || !socket) return;
    socket.emit("chat:message", { code, playerId, message: chatInput.trim() });
    setChatInput("");
  };

  const handleKick = (targetId: string) => {
    if (!socket || !isHost) return;
    socket.emit("player:kick", { code, playerId, targetId });
    setKickTarget(null);
  };

  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center p-3 overflow-auto">
      <div className="w-full max-w-3xl border border-primary/30 bg-black/70 shadow-2xl shadow-primary/10 flex flex-col" style={{ maxHeight: "95vh" }}>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-primary/20 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-title text-primary tracking-widest">SALON D'ATTENTE</h2>
            <div className="text-primary/50 uppercase text-xs mt-1 font-mono">{roomData.difficulty} · 20 NIVEAUX · {roomData.players.length}/{roomData.maxPlayers} JOUEURS</div>
          </div>
          <button onClick={copyCode} title="Copier le code"
            className={`text-center border px-4 py-2 transition-colors ${copied ? "border-accent text-accent" : "border-primary/30 text-primary hover:border-primary"}`}
          >
            <div className="text-xs text-primary/40 uppercase mb-0.5 font-mono">Code</div>
            <div className="text-xl font-bold tracking-[0.2em]">{roomData.code}</div>
            {copied && <div className="text-xs text-accent font-mono mt-0.5">Copié ✓</div>}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Players list */}
          <div className="flex-1 p-5 overflow-auto">
            <h3 className="text-primary/50 uppercase text-xs font-mono mb-3 tracking-widest">SURVIVANTS</h3>
            <div className="space-y-2">
              {roomData.players.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center justify-between px-4 py-3 border ${
                    p.id === playerId ? "border-primary/60 bg-primary/10" : "border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-mono font-bold uppercase text-sm text-primary">
                      {p.name}{p.id === playerId ? " (VOUS)" : ""}
                    </span>
                    {p.isHost && (
                      <span className="text-xs font-mono bg-primary/20 text-primary px-1.5 py-0.5">HÔTE</span>
                    )}
                  </div>
                  {isHost && !p.isHost && p.id !== playerId && (
                    <button
                      onClick={() => setKickTarget(p.id)}
                      className="text-xs text-destructive/60 hover:text-destructive border border-destructive/20 hover:border-destructive/50 px-2 py-1 font-mono transition-colors"
                    >
                      EXPULSER
                    </button>
                  )}
                </motion.div>
              ))}
              {Array.from({ length: roomData.maxPlayers - roomData.players.length }).map((_, i) => (
                <div key={`e-${i}`} className="px-4 py-3 border border-dashed border-primary/10 text-primary/20 text-xs font-mono text-center">
                  EN ATTENTE...
                </div>
              ))}
            </div>
          </div>

          {/* Chat panel */}
          <div className="w-64 border-l border-primary/20 flex flex-col shrink-0">
            <div className="px-3 pt-3 pb-2 border-b border-primary/10 text-xs font-mono text-primary/40 uppercase tracking-widest">Chat</div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs font-mono px-2 py-1 rounded-sm ${
                      msg.type === "join" ? "text-green-400/80 bg-green-900/20" :
                      msg.type === "leave" ? "text-red-400/80 bg-red-900/20" :
                      msg.type === "system" ? "text-yellow-400/80 bg-yellow-900/20" :
                      "text-primary/80"
                    }`}
                  >
                    {msg.type === "chat" && msg.player && (
                      <span className="text-primary font-bold mr-1">{msg.player}:</span>
                    )}
                    {msg.type === "join" && "▶ "}
                    {msg.type === "leave" && "◀ "}
                    {msg.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              {messages.length === 0 && (
                <div className="text-primary/20 text-xs font-mono text-center py-4">Aucun message...</div>
              )}
            </div>
            <div className="p-2 border-t border-primary/10 flex gap-1">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Message..."
                maxLength={120}
                className="flex-1 bg-black/50 border border-primary/20 text-primary text-xs font-mono px-2 py-1.5 placeholder-primary/20 focus:outline-none focus:border-primary/40"
              />
              <button onClick={sendChat} className="px-2 text-primary border border-primary/20 hover:border-primary/50 text-xs font-mono">↵</button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-primary/20 shrink-0">
          <button onClick={() => setLocation("/")} className="px-5 py-2 text-primary/50 hover:text-primary uppercase text-xs font-mono transition-colors">
            ← QUITTER
          </button>
          {isHost ? (
            <button
              onClick={() => startGame()}
              disabled={roomData.players.length < 1}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase tracking-widest font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            >
              LANCER LA PARTIE
            </button>
          ) : (
            <div className="text-primary/50 uppercase text-xs font-mono animate-pulse">
              ▸ EN ATTENTE DE L'HÔTE...
            </div>
          )}
        </div>
      </div>

      {/* Kick confirmation modal */}
      <AnimatePresence>
        {kickTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="border border-destructive/50 bg-black/95 p-8 text-center max-w-xs"
            >
              <div className="text-destructive font-title text-xl mb-2">EXPULSER CE JOUEUR?</div>
              <div className="text-primary/50 font-mono text-xs mb-6">
                {roomData.players.find(p => p.id === kickTarget)?.name}
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setKickTarget(null)} className="px-5 py-2 border border-primary/30 text-primary/60 hover:text-primary font-mono text-sm uppercase">
                  Annuler
                </button>
                <button onClick={() => handleKick(kickTarget)} className="px-5 py-2 bg-destructive text-white font-mono text-sm uppercase hover:bg-destructive/80">
                  Expulser
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
