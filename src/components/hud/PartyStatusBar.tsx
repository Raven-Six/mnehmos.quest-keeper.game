import React from 'react';
import { useGameStateStore, CharacterStats } from '../../stores/gameStateStore';

/**
 * Displays status of party members.
 * Connects to `gameStateStore.party`.
 */
export const PartyStatusBar: React.FC = () => {
  const party = useGameStateStore(s => s.party);
  const activeCharacterId = useGameStateStore(s => s.activeCharacterId);

  if (!party || party.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-4">
       {/* Header */}
       <div className="text-xs text-white/50 font-bold uppercase mb-2">Party</div>
       
       {party.map((char: CharacterStats) => {
         const isActive = char.id === activeCharacterId;
         const hpPercent = char.hp.max > 0 ? (char.hp.current / char.hp.max) * 100 : 0;
         
         return (
           <div 
             key={char.id}
             className={`
               p-3 rounded-lg border backdrop-blur-md transition-colors w-56
               ${isActive 
                 ? 'bg-indigo-900/40 border-indigo-500/50' 
                 : 'bg-black/60 border-white/10 hover:bg-white/5'}
             `}
           >
             <div className="flex justify-between items-center mb-1">
               <span className="font-bold text-sm text-white truncate">{char.name}</span>
               <span className="text-xs text-white/60">Lvl {char.level}</span>
             </div>
             
             {/* HP Bar */}
             <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-1">
               <div 
                 className={`h-full transition-all duration-500 ${hpPercent < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                 style={{ width: `${hpPercent}%` }}
               />
             </div>
             <div className="flex justify-between text-[10px] text-white/70">
                <span>HP {char.hp.current}/{char.hp.max}</span>
                <span>AC {char.armorClass || 10}</span>
             </div>
           </div>
         );
       })}
    </div>
  );
};
