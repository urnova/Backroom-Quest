import { Player } from "../types/game";
import { Battery, Heart, Brain, Compass } from "lucide-react";

interface HUDProps {
  player: Player;
  levelName: string;
  difficulty: string;
}

export default function HUD({ player, levelName, difficulty }: HUDProps) {
  const hpPercent = (player.hp / player.maxHp) * 100;
  
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full">
        <div className="bg-black/80 border border-primary/30 p-2 px-4 shadow-[0_0_15px_rgba(200,180,96,0.1)]">
          <div className="text-primary font-bold text-lg uppercase">{levelName}</div>
          <div className="text-primary/70 text-xs flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold
              ${difficulty === 'easy' ? 'bg-accent/20 text-accent' : 
                difficulty === 'normal' ? 'bg-primary/20 text-primary' : 
                difficulty === 'hard' ? 'bg-orange-500/20 text-orange-500' : 
                'bg-destructive/20 text-destructive'}`}
            >
              {difficulty}
            </span>
          </div>
        </div>
        
        {/* Compass */}
        <div className="bg-black/80 border border-primary/30 p-2 flex flex-col items-center">
          <Compass className="text-primary w-6 h-6 mb-1" />
          <div className="text-primary/70 text-xs uppercase font-bold tracking-widest">{Math.round((player.angle * 180 / Math.PI + 360) % 360)}°</div>
        </div>
      </div>

      {/* Crosshair handled in Game.tsx */}

      {/* Bottom Bar */}
      <div className="flex justify-between items-end w-full">
        {/* Stats */}
        <div className="flex flex-col gap-3 w-64 bg-black/60 p-4 border border-primary/20">
          <div>
            <div className="flex justify-between text-xs mb-1 uppercase font-bold text-destructive">
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> Santé</span>
              <span>{Math.round(player.hp)} / {player.maxHp}</span>
            </div>
            <div className="h-3 bg-black border border-destructive/50 w-full relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-destructive transition-all duration-200" 
                style={{ width: `${hpPercent}%` }} 
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1 uppercase font-bold text-blue-400">
              <span className="flex items-center gap-1"><Brain className="w-4 h-4" /> Santé Mentale</span>
              <span>{Math.round(player.sanity)}%</span>
            </div>
            <div className="h-2 bg-black border border-blue-400/50 w-full relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-200" 
                style={{ width: `${player.sanity}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Flashlight & Weapon */}
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center bg-black/60 p-3 border border-primary/20">
            <Battery className={`w-8 h-8 ${player.flashlightOn ? 'text-primary' : 'text-primary/30'} ${player.flashlightOn ? 'flicker' : ''}`} />
            <div className="text-primary/70 text-[10px] mt-1 uppercase">[F] Torche</div>
          </div>
          <div className="text-primary/50 text-[10px] uppercase text-right">
            [CLIC GAUCHE] Attaquer<br/>
            [E] Emotes<br/>
            [T] Chat
          </div>
        </div>
      </div>
    </div>
  );
}
