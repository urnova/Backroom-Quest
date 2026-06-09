import { useEffect, useRef } from "react";
import { Player, Mob } from "../types/game";

interface MiniMapProps {
  player: Player;
  players: Player[];
  mobs: Mob[];
  map: number[][]; // 2D grid
}

export default function MiniMap({ player, players, mobs, map }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !map || map.length === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const size = 100; // px
    const scale = 3; // px per map unit
    const center = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Draw map relative to player
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);

    // Grid rendering
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const screenX = center + (x - player.x) * scale;
        const screenY = center + (y - player.y) * scale;

        if (screenX > -scale && screenX < size && screenY > -scale && screenY < size) {
          if (map[y][x] === 1) {
            ctx.fillStyle = "#4a4a4a";
            ctx.fillRect(screenX, screenY, scale, scale);
          } else if (map[y][x] === 2) {
            ctx.fillStyle = "#00ff80";
            ctx.fillRect(screenX, screenY, scale, scale);
          }
        }
      }
    }

    // Draw other players
    ctx.fillStyle = "#3b82f6"; // Blue
    for (const p of players) {
      if (p.id === player.id || !p.isAlive) continue;
      const screenX = center + (p.x - player.x) * scale;
      const screenY = center + (p.y - player.y) * scale;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw mobs
    ctx.fillStyle = "#ef4444"; // Red
    for (const m of mobs) {
      if (!m.isAlive) continue;
      const screenX = center + (m.x - player.x) * scale;
      const screenY = center + (m.y - player.y) * scale;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(center, center, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Player direction line
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + Math.cos(player.angle) * 6, center + Math.sin(player.angle) * 6);
    ctx.stroke();

  }, [player.x, player.y, player.angle, players, mobs, map]);

  if (!map || map.length === 0) return null;

  return (
    <div className="absolute top-6 right-6 border border-primary/30 bg-black/80 p-1 shadow-[0_0_15px_rgba(200,180,96,0.1)]">
      <canvas 
        ref={canvasRef} 
        width={100} 
        height={100} 
        className="w-24 h-24 rounded-sm opacity-80"
      />
    </div>
  );
}
