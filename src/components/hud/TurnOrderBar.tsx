import React from 'react';
import { useCombatStore } from '../../stores/combatStore';

/**
 * Displays the initiative order for the active combat.
 * Connects to `combatStore.turnOrder` and `combatStore.entities`.
 */
export const TurnOrderBar: React.FC = () => {
  const turnOrder = useCombatStore(s => s.turnOrder);
  const entities = useCombatStore(s => s.entities);
  const currentTurnName = useCombatStore(s => s.currentTurnName);

  if (!turnOrder || turnOrder.length === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 border border-white/20 rounded-full px-6 py-2 flex items-center gap-4 pointer-events-auto shadow-lg backdrop-blur-sm">
      <div className="text-xs text-white/50 font-bold tracking-wider uppercase">Turn Order</div>
      <div className="h-6 w-px bg-white/20"></div>
      
      <div className="flex items-center gap-2">
        {turnOrder.map((name, idx) => {
          // Find entity to get details (HP, etc)
          const entity = entities.find(e => e.name === name);
          const isCurrent = name === currentTurnName;
          
          return (
             <div 
               key={`${name}-${idx}`}
               className={`
                 relative px-3 py-1 rounded transition-all duration-300
                 ${isCurrent ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110 z-10' : 'bg-white/10 text-white/70'}
               `}
             >
               <span className="text-sm font-medium">{name}</span>
               
               {/* HP Bar (Mini) */}
               {entity && entity.metadata?.hp && (
                 <div className="absolute -bottom-1 left-1 right-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${(entity.metadata.hp.current / entity.metadata.hp.max) * 100}%` }}
                    />
                 </div>
               )}
             </div>
          );
        })}
      </div>
    </div>
  );
};
