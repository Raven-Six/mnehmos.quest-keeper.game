import React from 'react';
import { useHudStore } from '../../stores/hudStore';
import { useCombatStore } from '../../stores/combatStore';

/**
 * Bottom action bar for map visualization tools.
 * Theme-aware styling.
 */
export const QuickActionBar: React.FC = () => {
    const toggleInventory = useHudStore(s => s.toggleInventory);
    const toggleSpellbook = useHudStore(s => s.toggleSpellbook);
    
    // Visualization tools from combat store
    const showLineOfSight = useCombatStore(s => s.showLineOfSight);
    const measureMode = useCombatStore(s => s.measureMode);
    const setShowLineOfSight = useCombatStore(s => s.setShowLineOfSight);
    const setMeasureMode = useCombatStore(s => s.setMeasureMode);

    return (
        <div className="flex gap-2 p-2 bg-terminal-dim/95 rounded-sm border border-terminal-green-dim shadow-2xl animate-fade-in-up">
            <ActionButton 
                label="Inventory" 
                icon="🎒" 
                onClick={toggleInventory} 
            />
            <ActionButton 
                label="Spellbook" 
                icon="📖" 
                onClick={toggleSpellbook}
            />
            <ActionButton 
                label="Line of Sight" 
                icon="👁️" 
                onClick={() => setShowLineOfSight(!showLineOfSight)}
                active={showLineOfSight}
            />
            <ActionButton 
                label="Distance" 
                icon="📏" 
                onClick={() => setMeasureMode(!measureMode)}
                active={measureMode}
            />
        </div>
    );
};

interface ActionButtonProps {
    label: string;
    icon: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, onClick, active, disabled }) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center
        w-20 h-14 rounded-sm transition-all border font-mono
        ${disabled 
            ? 'opacity-30 cursor-not-allowed bg-terminal-dim border-terminal-green-dim text-terminal-green-dim' 
            : active
                ? 'bg-terminal-green/20 border-terminal-green text-terminal-green-bright shadow-[0_0_10px_rgba(0,255,65,0.2)]'
                : 'bg-terminal-green/10 hover:bg-terminal-green/20 border-terminal-green-dim text-terminal-green hover:text-terminal-green-bright'
        }
        active:scale-95
      `}
    >
        <span className="text-xl mb-1 filter drop-shadow-md">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
);
