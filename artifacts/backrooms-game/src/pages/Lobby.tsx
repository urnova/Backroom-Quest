import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { useGetRoom } from "@workspace/api-client-react";
import { useGameStore } from "../context/GameContext";
import { Room } from "../types/game";

export default function Lobby() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { socket, playerId, gameState, startGame } = useGameStore();
  const [roomData, setRoomData] = useState<Room | null>(null);
  
  // Initial fetch
  const { data: initialRoom } = useGetRoom(code || "", { 
    query: { enabled: !!code, queryKey: ['room', code] } 
  });

  useEffect(() => {
    if (initialRoom && !roomData) setRoomData(initialRoom as unknown as Room);
  }, [initialRoom, roomData]);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdated = (room: Room) => {
      setRoomData(room);
    };

    const handleStarted = () => {
      setLocation(`/game/${code}`);
    };

    socket.on("room:updated", handleUpdated);
    socket.on("game:started", handleStarted);

    return () => {
      socket.off("room:updated", handleUpdated);
      socket.off("game:started", handleStarted);
    };
  }, [socket, code, setLocation]);

  if (!roomData) {
    return <div className="absolute inset-0 flex items-center justify-center text-primary font-title text-2xl flicker">CONNEXION AU NÉANT...</div>;
  }

  const isHost = roomData.players.find(p => p.id === playerId)?.isHost;
  const copyCode = () => navigator.clipboard.writeText(roomData.code);

  return (
    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl border border-primary/30 bg-black/60 p-8 shadow-[0_0_30px_rgba(200,180,96,0.1)]">
        <div className="flex justify-between items-start mb-8 border-b border-primary/20 pb-4">
          <div>
            <h2 className="text-3xl font-title text-primary tracking-widest">SALON D'ATTENTE</h2>
            <div className="text-primary/70 uppercase text-sm mt-1">
              {roomData.difficulty} • NIVEAUX: 20
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-primary/50 uppercase mb-1">CODE D'INVITATION</div>
            <button 
              onClick={copyCode}
              className="text-2xl font-bold tracking-[0.2em] text-primary hover:text-white transition-colors bg-primary/10 px-4 py-2 border border-primary/30 rounded"
              title="Copier"
            >
              {roomData.code}
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h3 className="text-primary/70 uppercase text-sm">SURVIVANTS ({roomData.players.length}/{roomData.maxPlayers})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roomData.players.map((p, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={p.id} 
                className={`p-3 border ${p.id === playerId ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-primary/80'} flex justify-between items-center`}
              >
                <span className="uppercase font-bold">{p.name} {p.id === playerId && "(VOUS)"}</span>
                {p.isHost && <span className="text-xs bg-primary/20 px-2 py-1">HÔTE</span>}
              </motion.div>
            ))}
            {Array.from({ length: roomData.maxPlayers - roomData.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="p-3 border border-primary/10 text-primary/30 border-dashed flex justify-center items-center italic text-sm">
                EN ATTENTE...
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-primary/20">
          <button 
            onClick={() => setLocation("/")}
            className="px-6 py-2 text-primary/50 hover:text-primary uppercase text-sm"
          >
            QUITTER
          </button>
          
          {isHost ? (
            <button 
              onClick={() => startGame()}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold hover:bg-primary/90 uppercase tracking-widest"
            >
              LANCER LA PARTIE
            </button>
          ) : (
            <div className="text-primary/70 uppercase text-sm animate-pulse">
              EN ATTENTE DE L'HÔTE...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
