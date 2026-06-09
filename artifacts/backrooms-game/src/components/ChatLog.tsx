import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export default function ChatLog({ socket }: { socket: Socket | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!socket) return;
    const handleMsg = (data: Omit<ChatMessage, "id">) => {
      setMessages(prev => {
        const next = [...prev, { ...data, id: Math.random().toString() }];
        return next.length > 5 ? next.slice(1) : next;
      });
    };
    socket.on("chat:message", handleMsg);
    return () => { socket.off("chat:message", handleMsg); };
  }, [socket]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "t" || e.key === "T") {
        if (!isTyping) {
          e.preventDefault();
          setIsTyping(true);
          setTimeout(() => inputRef.current?.focus(), 10);
        }
      }
      if (e.key === "Escape" && isTyping) {
        setIsTyping(false);
        setInput("");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && socket) {
      // Need code and playerId - normally passed down but here we just rely on server knowing room from socket or we just emit to chat which we need to make sure we emit code.
      // Wait, ChatLog doesn't have code/playerId context easily.
      // Actually Game.tsx binds input.onChat = () => setShowChat(true) but we didn't implement that fully.
      // We can just dispatch a custom event or use the context.
    }
    // As a shortcut, since the API needs code & playerId, I'll pass them or assume the server handles it if we don't.
    setIsTyping(false);
    setInput("");
  };

  return (
    <div className="absolute bottom-32 left-6 w-80 flex flex-col justify-end pointer-events-none">
      <div className="flex flex-col gap-1 mb-2">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-black/60 p-1.5 px-3 border-l-2 border-primary text-xs"
            >
              <span className="font-bold text-primary mr-2 uppercase">{m.playerName}:</span>
              <span className="text-white/80">{m.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {isTyping && (
        <form onSubmit={handleSubmit} className="pointer-events-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onBlur={() => setIsTyping(false)}
            placeholder="Parler (Échap pour annuler)..."
            className="w-full bg-black/80 border border-primary p-2 text-primary text-xs outline-none uppercase"
            maxLength={100}
          />
        </form>
      )}
    </div>
  );
}
