import React from 'react';
import { useCombatStore } from '../../stores/combatStore';

/**
 * Displays details for the currently Selected Entity (Target).
 * Theme-aware HUD element.
 */
export const CharacterQuickView: React.FC = () => {
    const selectedEntityId = useCombatStore(s => s.selectedEntityId);
    const entities = useCombatStore(s => s.entities);
    
    // Find the selected entity
    const entity = selectedEntityId ? entities.find(e => e.id === selectedEntityId) : null;
    
    if (!entity) return null;

    const meta = entity.metadata;
    const isEnemy = entity.type === 'monster';
    
    return (
        <div className="bg-terminal-dim/95 border border-terminal-green-dim rounded-sm p-4 w-64 shadow-2xl animate-fade-in-up font-mono">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-terminal-green-dim pb-2">
                <h3 className={`font-bold text-lg truncate ${isEnemy ? 'text-terminal-red' : 'text-terminal-green-bright'}`}>
                    {entity.name}
                </h3>
                <span className={`text-[10px] uppercase px-1.5 py-0.5 border rounded-sm ${
                   isEnemy 
                    ? 'bg-terminal-red/10 text-terminal-red border-terminal-red/30' 
                    : 'bg-terminal-green/10 text-terminal-green border-terminal-green-dim'
                }`}>
                   {entity.type}
                </span>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-terminal-green/10 border border-terminal-green-dim rounded-sm p-2 text-center">
                    <div className="text-[10px] text-terminal-green-dim uppercase tracking-wider mb-1">HP</div>
                    <div className="text-xl text-terminal-green-bright">
                        {meta.hp.current} <span className="text-sm text-terminal-green-dim">/ {meta.hp.max}</span>
                    </div>
                </div>
                <div className="bg-terminal-green/10 border border-terminal-green-dim rounded-sm p-2 text-center">
                    <div className="text-[10px] text-terminal-green-dim uppercase tracking-wider mb-1">AC</div>
                    <div className="text-xl text-terminal-green-bright">
                        {meta.ac}
                    </div>
                </div>
            </div>
            
            {/* Conditions */}
            {meta.conditions && meta.conditions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {meta.conditions.map(c => (
                        <span 
                            key={c} 
                            title={c}
                            className="text-[10px] bg-terminal-amber/10 text-terminal-amber border border-terminal-amber/30 px-2 py-0.5 rounded-sm cursor-help"
                        >
                           {c}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
